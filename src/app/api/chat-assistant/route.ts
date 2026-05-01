import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI, Part } from '@google/genai';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { buildFileParts } from '@/lib/conversation/file-utils';
import { inferConversationIntent } from '@/lib/conversation/intent';
import { handleGuidedCreationRequest } from '@/lib/conversation/guided-creation-logic';
import {
  ConversationIntent,
  ConversationMessage,
  ConversationMetadata,
  ConversationState,
  DEFAULT_CONVERSATION_METADATA,
  ConversationRole,
  ConversationTimestamp,
  ConversationAction,
} from '@/types/conversation';
import {
  ConversationResponse,
  mergeConversationMetadata,
  runConversationPhase,
} from '@/lib/conversation/conversationMachine';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { withErrorLogging } from '@/lib/errorLogger';
import { logAIUsage } from '@/lib/api/ai-usage-logger';

// 🚀 STANDARD NODE.JS RUNTIME - Compatible with firebase-admin
// Streaming achieved through ReadableStream in Node.js runtime

// Message schema for guided creation
const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  actions: z.array(z.object({
    label: z.string(),
    value: z.string().optional(),
    intent: z.string().optional()
  })).nullable().optional(),
  intent: z.string().optional(),
  timestamp: z.any().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    mimeType: z.string().optional(),
    size: z.number().optional(),
  })).optional(),
});

const editorChatRequestSchema = z.object({
  idToken: z.string(),
  documentId: z.string(),
  lastUserMessage: z.string(),
  documentContent: z.string(),
  fileUrl: z.string().url().optional(),
  mode: z.literal('solo'),
  selectedText: z.string().optional(),
  targetBlockId: z.string().optional(),
});

const guidedCreationChatRequestSchema = z.object({
  mode: z.literal('guided-creation'),
  idToken: z.string(),
  lastUserMessage: z.string(),
  messages: z.array(messageSchema),
  chatPhase: z.string().optional(), // <-- PADAROME NEPRIVALOMĄs
  blueprint: z.any().optional().optional(),   // <-- PADAROME NEPRIVALOMĄ
  fileUrl: z.string().url().optional(),
});

const godModeChatRequestSchema = z.object({
  idToken: z.string(),
  lastUserMessage: z.string(),
  messages: z.array(messageSchema),
  metadata: z.object({
    chatPhase: z.string(),
    blueprint: z.any().optional(),
  }),
  documentContent: z.string(),
  fileUrl: z.string().url().optional(),
  selectedText: z.string().optional(),
  mode: z.literal('god-mode'),
});

const chatRequestSchema = z.discriminatedUnion('mode', [
  guidedCreationChatRequestSchema,
  editorChatRequestSchema,
  godModeChatRequestSchema,
]);

// Helper function for streaming text generation with Gemini API
async function streamText(
  controller: ReadableStreamDefaultController,
  ai: GoogleGenAI,
  prompt: string | (string | Part)[],
  systemInstruction?: string,
) {
  const encoder = new TextEncoder();
  try {
    // 🔥 PROPER GEMINI STREAMING: Use generateContentStream for real-time chunking
    const response = await ai.models.generateContentStream({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
      contents: Array.isArray(prompt) ? prompt as Part[] : (systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt)
    });
    let fullText = '';
    // Stream each chunk as it arrives (actual word-by-word streaming)
    for await (const chunk of response) {
      const chunkText = chunk.text;
      if (chunkText) {
        // Send each chunk as NDJSON for real-time updates
        controller.enqueue(encoder.encode(JSON.stringify({
          type: "text",
          data: chunkText
        }) + '\n'));
        fullText += chunkText;
      }


      // Small delay to prevent overwhelming the client
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return fullText;
  } catch (error) {
    console.error("Streaming error:", error);
    controller.enqueue(encoder.encode(JSON.stringify({
      type: "text",
      data: "Atsiprašau, įvyko klaida generuojant atsakymą."
    }) + '\n'));
  }
}

// Helper function to save streaming completion data
async function saveStreamingCompletion(
  documentId: string,
  mergedMetadata: ConversationMetadata,
  assistantResponse: string,
  streamType: 'contentUpdate' | 'message',
  actions?: ConversationAction[] | null,
  htmlContent?: string
) {
  try {
    const conversationMetaRef = adminDb.doc(`documents/${documentId}/conversation/metadata`);
    const messagesRef = conversationMetaRef.collection('messages');

    // Save completed assistant message
    const assistantMessagePayload: ConversationMessage = {
      role: 'assistant',
      content: assistantResponse,
      actions: actions || null,
      timestamp: FieldValue.serverTimestamp() as unknown as ConversationTimestamp,
    };

    await adminDb.runTransaction(async (transaction) => {
      const assistantMessageRef = messagesRef.doc();
      transaction.set(assistantMessageRef, assistantMessagePayload);

      // Update metadata with completion info
      transaction.set(conversationMetaRef, {
        ...mergedMetadata,
        lastUpdatedAt: FieldValue.serverTimestamp(),
        // Add stream completion metadata
        lastStreamType: streamType,
        lastStreamCompletedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // If this was a content update, also update document content
      if (streamType === 'contentUpdate' && htmlContent) {
        const docRef = adminDb.doc(`documents/${documentId}`);
        transaction.set(docRef, {
          content: htmlContent,
          lastEdited: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    });

    console.log(`Streaming completion saved for document ${documentId}, streamType: ${streamType}`);
  } catch (error) {
    console.error('Error saving streaming completion:', error);
  }
}

export const POST = withErrorLogging(async (req: NextRequest): Promise<NextResponse | Response> => {
  // Rate limiting check
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('chatAssistant', clientIp);

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse();
  }

  const body = await req.json();
  const validationResult = chatRequestSchema.safeParse(body);

  if (!validationResult.success) {
    console.error('Chat API validation error:', validationResult.error.format());
    return NextResponse.json(
      {
        error: 'Invalid request body',
        details: validationResult.error.format(),
      },
      { status: 400 },
    );
  }

  const { idToken, mode } = validationResult.data;

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

  if (mode === 'guided-creation') {
    // Šis blokas dabar apdoros TIEK Journalist Co-pilot, TIEK God Mode Creator
    return handleGuidedCreation(validationResult.data as z.infer<typeof guidedCreationChatRequestSchema>, ai, modelName, decodedToken.uid);
  } else if (mode === 'god-mode') {
    // Šis blokas liks TIK God Mode Editor režimui
    return handleGodModeChat(validationResult.data as z.infer<typeof godModeChatRequestSchema>);
  } else if (mode === 'solo') {
    // Šis blokas liks TIK /docs/[id] redaktoriui
    return handleEditorChat(validationResult.data as z.infer<typeof editorChatRequestSchema>, ai, modelName);
  }

  // Fallback, jei atsirastų naujas, neapdorotas režimas
  return NextResponse.json({ error: 'Unsupported chat mode' }, { status: 400 });
}, { endpoint: 'chat-assistant', operation: 'POST' });

async function handleEditorChat(
  data: z.infer<typeof editorChatRequestSchema>,
  ai: GoogleGenAI,
  modelName: string
): Promise<NextResponse | Response> {
  const { documentId, lastUserMessage, documentContent, fileUrl, selectedText, targetBlockId } = data;

  const conversationMetaRef = adminDb.doc(`documents/${documentId}/conversation/metadata`);
  const messagesRef = conversationMetaRef.collection('messages');

  const metadataSnapshot = await conversationMetaRef.get();
  const rawMetadata = metadataSnapshot.exists
    ? (metadataSnapshot.data() as Partial<ConversationMetadata>)
    : {};

  let metadata: ConversationMetadata = {
    ...DEFAULT_CONVERSATION_METADATA,
    ...rawMetadata,
    blueprint: {
      ...DEFAULT_CONVERSATION_METADATA.blueprint,
      ...(rawMetadata?.blueprint as ConversationMetadata['blueprint']),
    },
  };

  if (!metadataSnapshot.exists) {
    metadata = {
      ...metadata,
      chatPhase:
        documentContent && documentContent.length > 50
          ? 'INTERACTIVE_REFINEMENT'
          : 'GREETING',
    };
  }

  const messagesSnapshot = await messagesRef.orderBy('timestamp', 'asc').get();
  const existingMessages: ConversationMessage[] = messagesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as ConversationMessage),
  }));

  const fileParts = fileUrl ? await buildFileParts(fileUrl) : [];

  const userMessage: ConversationMessage = {
    role: 'user',
    content: lastUserMessage,
    attachments: buildUserAttachments(fileUrl),
  };

  const state: ConversationState = {
    metadata: {
      ...metadata,
      blueprint: { ...metadata.blueprint },
    },
    messages: [...existingMessages, userMessage],
  };

  const isFirstEditInteraction =
    state.metadata.chatPhase === 'INTERACTIVE_REFINEMENT' && existingMessages.length === 0;

  let responsePayload: {
    nextPhase: ConversationMetadata['chatPhase'];
    metadataUpdates?: Partial<ConversationMetadata>;
    response: ConversationResponse;
    intent?: ConversationIntent;
  };

  if (isFirstEditInteraction) {
    const initialEditPrompt =
      'Vartotojas atidarė redaguoti jau egzistuojantį dokumentą. Pasisveikink ir paklausk, ką jis norėtų pakeisti ar patobulinti. Būk paslaugus ir konkretus.';
    const initialEditResult = await ai.models.generateContent({
      model: modelName,
      contents: initialEditPrompt,
    });
    await logAIUsage({ userId: data.idToken, endpoint: 'chat-assistant/initial-edit', model: modelName });

    responsePayload = {
      nextPhase: 'INTERACTIVE_REFINEMENT',
      response: {
        type: 'message',
        response: initialEditResult.text ?? '',
      },
    };
  } else {
    let inferredIntent: ConversationIntent | undefined;

    if (state.metadata.chatPhase === 'INFORMATION_GATHERING') {
      inferredIntent = await inferConversationIntent({
        lastUserMessage,
        history: state.messages,
        fileParts,
      });
    }

    const phaseResult = await runConversationPhase({
      state,
      lastUserMessage,
      documentContent,
      fileUrl,
      fileParts,
      intent: inferredIntent,
      selectedText,
      targetBlockId,
    });

    // Handle streaming responses - UNIVERSAL STREAMING LOGIC
    if (phaseResult.streaming) {
      const { prompt, systemInstruction, nextPhase, metadataUpdates, streamType, confirmationMessage, actions } = phaseResult;

      const mergedMetadataForStream = mergeConversationMetadata(
        state.metadata,
        metadataUpdates,
        nextPhase,
      );

      // Save user message and metadata using transaction for atomicity
      await adminDb.runTransaction(async (transaction) => {
        const userMessageRef = messagesRef.doc();
        transaction.set(userMessageRef, {
          role: 'user',
          content: lastUserMessage,
          actions: null,
          intent: inferredIntent ?? null,
          attachments: userMessage.attachments ?? null,
          timestamp: FieldValue.serverTimestamp() as unknown as ConversationTimestamp,
        });

        transaction.set(
          conversationMetaRef,
          {
            ...mergedMetadataForStream,
            lastUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      });

      // Return universal streaming response
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          // 1. Išsiunčiame pradinį paketą, nurodantį tipą
          if (streamType === 'contentUpdate') {
            const startChunk = {
              type: "contentUpdateStart",
              data: { confirmationMessage: confirmationMessage || "Atnaujinu turinį..." }
            };
            controller.enqueue(encoder.encode(JSON.stringify(startChunk) + '\n'));
          } else { // streamType === 'message'
            const startChunk = { type: "messageStart" };
            controller.enqueue(encoder.encode(JSON.stringify(startChunk) + '\n'));
          }

          // 2. Pradedame teksto streamingą
          const fullResponse = await streamText(controller, ai, prompt || '', systemInstruction);

          // 3. Srauto pabaigoje siunčiame metaduomenis ir išsaugome užbaigtą atsakymą
          const endChunk = {
            type: "metadata",
            data: {
              newChatPhase: mergedMetadataForStream.chatPhase,
              updatedBlueprint: mergedMetadataForStream.blueprint,
              actions: actions || null, // Pridedame veiksmų mygtukus
            }
          };

          // Save completed streaming response to Firestore with stream completion guarantee
          await saveStreamingCompletion(
            documentId,
            mergedMetadataForStream,
            fullResponse || 'failed to generate content',
            streamType || 'message',
            actions,
            streamType === 'contentUpdate' ? (phaseResult as Record<string, unknown>).html as string : undefined
          );

          controller.enqueue(encoder.encode('\n' + JSON.stringify(endChunk)));
          controller.close();
        },
      });

      // Add stream completion guarantee
      // TODO: Patikrink ar reikia šito kodo
      // if (stream.) {
      //   stream.body.closed.then(async () => {
      //     console.log(`Stream closed for document ${documentId}, ensuring data is saved`);
      //     // Double-check that data was saved, retry if needed
      //     try {
      //       await saveStreamingCompletion(
      //         documentId,
      //         mergedMetadataForStream,
      //         fullResponse,
      //         streamType || 'message',
      //         actions,
      //         streamType === 'contentUpdate' ? (phaseResult as any).html : undefined
      //       );
      //     } catch (error) {
      //       console.error('Error in stream completion guarantee:', error);
      //     }
      //   }).catch(error => {
      //     console.error('Stream closed with error:', error);
      //   });
      // }

      return new Response(stream, {
        headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' },
      });
    }

    // Handle non-streaming responses
    responsePayload = {
      nextPhase: phaseResult.nextPhase,
      metadataUpdates: phaseResult.metadataUpdates,
      response: phaseResult.response || {
        type: 'message',
        response: 'Operacija baigta.'
      },
      intent: inferredIntent,
    };
  }

  // Save user message and assistant message for non-streaming cases using transaction for atomicity
  const mergedMetadata = mergeConversationMetadata(
    state.metadata,
    responsePayload.metadataUpdates,
    responsePayload.nextPhase,
  );

  const assistantMessagePayload = buildAssistantMessagePayload(responsePayload.response);

  await adminDb.runTransaction(async (transaction) => {
    const assistantMessageRef = messagesRef.doc();
    transaction.set(assistantMessageRef, {
      role: 'assistant',
      content: assistantMessagePayload.content,
      actions: assistantMessagePayload.actions,
      timestamp: FieldValue.serverTimestamp() as unknown as ConversationTimestamp,
    });

    transaction.set(
      conversationMetaRef,
      {
        ...mergedMetadata,
        lastUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  return NextResponse.json({
    ...responsePayload.response,
    newChatPhase: mergedMetadata.chatPhase,
    updatedBlueprint: mergedMetadata.blueprint,
  });
}

async function handleGuidedCreation(
  data: z.infer<typeof guidedCreationChatRequestSchema>,
  ai: GoogleGenAI,
  modelName: string,
  userId: string
): Promise<Response> {
  const { ...payload } = data;

  // Sukuriame `user` objektą, kurio tikisi bendra funkcija
  const user = { uid: userId };

  // Iškviečiame tą pačią bendrą logiką, kurią naudoja ir /api/guided-creation
  return await handleGuidedCreationRequest(payload, user, ai, modelName);
}

async function handleGodModeChat(
  data: z.infer<typeof godModeChatRequestSchema>,
): Promise<NextResponse> {
  const { lastUserMessage, documentContent, fileUrl, selectedText } = data;

  // God Mode veikia kaip "solo" režimas, bet be dokumento ID ir su
  // informacija, perduodama tiesiogiai per body.
  // Mes tiesiog iškviečiame tą pačią fazę kaip ir `handleEditorChat`.

  // Properly type messages from frontend data
  const typedMessages: ConversationMessage[] = data.messages.map(msg => ({
    role: msg.role as ConversationRole,
    content: msg.content,
    actions: msg.actions as ConversationAction[] | null,
    timestamp: msg.timestamp as ConversationTimestamp,
  }));

  const state: ConversationState = {
    metadata: {
      ...DEFAULT_CONVERSATION_METADATA,
      chatPhase: 'INTERACTIVE_REFINEMENT', // God Mode visada yra redagavimo fazėje
    },
    messages: typedMessages, // Naudojame iš frontend'o gautą istoriją
  };

  const fileParts = fileUrl ? await buildFileParts(fileUrl) : [];

  let inferredIntent: ConversationIntent | undefined;

  if (state.metadata.chatPhase === 'INFORMATION_GATHERING') {
    inferredIntent = await inferConversationIntent({
      lastUserMessage,
      history: state.messages,
      fileParts,
    });
  }

  const phaseResult = await runConversationPhase({
    state,
    lastUserMessage,
    documentContent,
    fileUrl,
    fileParts,
    intent: inferredIntent,
    selectedText,
  });

  // Handle non-streaming responses (God Mode works locally)
  const responsePayload = {
    nextPhase: phaseResult.nextPhase,
    metadataUpdates: phaseResult.metadataUpdates,
    response: phaseResult.response || {
      type: 'message' as const,
      response: 'Operacija baigta.'
    },
    intent: inferredIntent,
  };

  const mergedMetadata = mergeConversationMetadata(
    state.metadata,
    responsePayload.metadataUpdates,
    responsePayload.nextPhase,
  );

  return NextResponse.json({
    ...responsePayload.response,
    newChatPhase: mergedMetadata.chatPhase,
    updatedBlueprint: mergedMetadata.blueprint,
  });
}

function buildAssistantMessagePayload(response: ConversationResponse): {
  content: string;
  actions: { label: string }[] | null;
} {
  if (response.type === 'message') {
    return {
      content: response.response,
      actions: response.actions ?? null,
    };
  }

  if (response.type === 'contentUpdate') {
    return {
      content: response.confirmationMessage ?? 'Turinys atnaujintas pagal prašymą.',
      actions: null,
    };
  }

  return {
    content: response.reason ?? 'Pakeitimai buvo atšaukti.',
    actions: null,
  };
}

function buildUserAttachments(fileUrl?: string): ConversationMessage['attachments'] {
  if (!fileUrl) {
    return undefined;
  }

  try {
    const parsed = new URL(fileUrl);
    const name = decodeURIComponent(parsed.pathname.split('/').pop() ?? 'upload');
    return [
      {
        name,
        url: fileUrl,
      },
    ];
  } catch (error) {
    console.warn('Failed to parse file URL for attachment metadata:', error);
    return [
      {
        name: 'įkelta byla',
        url: fileUrl,
      },
    ];
  }
}

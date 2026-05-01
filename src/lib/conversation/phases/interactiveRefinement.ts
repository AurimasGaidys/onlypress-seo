// src/lib/conversation/phases/interactiveRefinement.ts
import { PhaseHandler, PhaseHandlerContext } from '../conversationMachine'; // ConversationResponse
import { getEditorPrompt } from '../prompts/editor';
import { createDocumentMap, sanitizeJsonOutput, safeJsonParse, buildConversationHistory } from '../utils';
import { AiCommandResponse } from '../../../types/ai-commands';
import { GoogleGenAI } from '@google/genai';
// import { replaceBlockInHtml, insertBlockAfterInHtml, deleteBlocksInHtml } from '../../../lib/html-manipulator';

// interface AIEditorResponse {
//   tool_to_use: 'apply_edits' | 'add_section' | 'answer_question';
//   edits?: Array<{ block_id: string; new_html: string }>;
//   new_section_html?: string;
//   position_after_id?: string | null;
//   response_text?: string;
//   confirmation_message?: string | null;
// }

export const handleInteractiveRefinementPhase: PhaseHandler = async (context: PhaseHandlerContext) => {
  const { lastUserMessage, documentContent, selectedText, state } = context;

  const documentMap = createDocumentMap(documentContent);
  const documentMapJson = JSON.stringify(documentMap, null, 2);
  const fullConversationHistory = buildConversationHistory(state.messages);

  const prompt = getEditorPrompt(lastUserMessage, documentMapJson, documentContent, selectedText, fullConversationHistory);

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_API_KEY environment variable is not set.');
  }

  const genAI = new GoogleGenAI({ apiKey });

  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
  });
  const rawJsonResponse = sanitizeJsonOutput(result.text || '');

  const aiResponse = safeJsonParse<AiCommandResponse>(rawJsonResponse, {
    operation: {
      command: 'ANSWER_QUESTION',
      markdownText: 'Atsiprašau, įvyko klaida apdorojant atsakymą. Bandykite performuluoti užklausą.',
      reasoning: 'Fallback due to parse error.'
    },
    confirmationMessage: 'Įvyko klaida.'
  });

  const { operation, confirmationMessage } = aiResponse;

  // Jei AI atsakė į klausimą, o ne davė komandą redaguoti
  if (!Array.isArray(operation) && operation.command === 'ANSWER_QUESTION') {
    return {
      streaming: false,
      nextPhase: 'INTERACTIVE_REFINEMENT',
      response: {
        type: 'message',
        response: operation.markdownText,
      },
    };
  }

  // Grąžiname atsakymą su pilna AI komanda 'payload' lauke.
  // Frontend'as pats atliks pakeitimus redaktoriuje.
  return {
    streaming: false,
    nextPhase: 'INTERACTIVE_REFINEMENT',
    response: {
      type: 'contentUpdate',
      payload: operation, // <-- SVARBUS PAKEITIMAS
      confirmationMessage: confirmationMessage,
    },
  };
};

// src/app/api/god-mode/save-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { welcomeMessageContent } from '@/lib/constants/messages';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
// --- PRADĖKITE PAKEITIMĄ ČIA ---
import { getFolderIdForDocument } from '@/lib/folder-helpers';
// --- PAKEITIMO PABAIGA ---

// Zod schema for validation
const saveSchema = z.object({
  idToken: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(10, "Content is too short"),
  // ======================= PAKEITIMAS: Pridedame laukus schemoje =======================
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  agencyId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(), // <-- PRIDĖTI
  // =================================================================================
});

// Helper functions (galima nukopijuoti iš regenerate-article/route.ts)
function generateSnippet(htmlContent: string): string {
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
}

function countWords(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('godMode', clientIp);
  
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse();
  }

  try {
    const body = await req.json();
    const validationResult = saveSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.format() }, { status: 400 });
    }

    const { idToken, title, content, metaTitle, metaDescription, agencyId, clientId, projectId } = validationResult.data;

    // 1. Verify user token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    const uid = decodedToken.uid;

    // --- PRADĖKITE PAKEITIMĄ ČIA ---
    // 1.5. Get folderId if agency exists
    const folderId = agencyId ? await getFolderIdForDocument(agencyId, clientId || null, projectId || null) : null;
    // --- PAKEITIMO PABAIGA ---

    // 2. Prepare document data
    const docData = {
      title,
      content: content, // <-- PAŠALINAME <h1> PRIDĖJIMĄ
      // ======================= PAKEITIMAS: Pridedame naujus laukus =======================
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || generateSnippet(content),
      // =================================================================================
      snippet: generateSnippet(content),
      wordCount: countWords(content),
      userId: uid,
      // --- PRADĖKITE PAKEITIMĄ ČIA ---
      folderId: folderId, // Pakeičiame iš null
      // --- PAKEITIMO PABAIGA ---
      agencyId: agencyId === undefined ? null : agencyId, // <-- agencyId iš payload
      clientId: clientId === undefined ? null : clientId, // <-- PRIDĖTI clientId iš payload
      projectId: projectId === undefined ? null : projectId, // <-- PRIDĖTI projectId iš payload
      createdAt: FieldValue.serverTimestamp(),
      lastEdited: FieldValue.serverTimestamp(),
      status: 'draft',
    };

    // 3. Create document and conversation structure using writeBatch for atomic operations
    const batch = adminDb.batch();
    const newDocRef = adminDb.collection('documents').doc(); // Generate ID in advance

    // 3.1. Create document
    batch.set(newDocRef, docData);

    // 3.2. Create conversation metadata
    const conversationMetaRef = newDocRef.collection('conversation').doc('metadata');
    batch.set(conversationMetaRef, {
      chatPhase: 'INTERACTIVE_REFINEMENT',
      blueprint: {},
      lastUpdatedAt: FieldValue.serverTimestamp(),
    });

    // 3.3. Create initial welcome message from AI assistant
    const messagesRef = conversationMetaRef.collection('messages');
    const initialMessageRef = messagesRef.doc();
    batch.set(initialMessageRef, {
      role: 'assistant',
      content: welcomeMessageContent,
      timestamp: FieldValue.serverTimestamp(),
      withTypingEffect: true,
    });

    // 4. Execute batch transaction
    await batch.commit();

    const newDocumentId = newDocRef.id;

    // 5. Return new document ID
    return NextResponse.json({ success: true, newDocumentId });

  } catch (error) {
    console.error("God Mode save error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: `Failed to save document. ${message}` }, { status: 500 });
  }
}

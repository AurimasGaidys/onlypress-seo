// src/app/api/import-release/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { welcomeMessageContent } from '@/lib/constants/messages';
import * as cheerio from 'cheerio'; // Jau yra jūsų projekte, naudojamas html-manipulator.ts
import { findOrCreateFolderByName } from '@/lib/folder-utils';
import { getFolderIdForDocument } from '@/lib/folder-helpers'; // <-- PRIDĖKITE

// Pagalbinės funkcijos (galite importuoti, jei turite centralizuotai)
function generateSnippet(htmlContent: string): string {
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
}

function countWords(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

// Zod schema validacijai
const importSchema = z.object({
  idToken: z.string(),
  release: z.object({
    id: z.string(),
    textInfo: z.object({
      title: z.string(),
      content: z.string(),
    }),
    seo: z.object({
        featuredImage: z.string().optional(),
    }).optional(),
    sourceUrl: z.string().url(),
  }),
  agencyId: z.string().nullable().optional(),   // <-- PRIDĖKITE
  clientId: z.string().nullable().optional(),   // <-- PRIDĖKITE
  projectId: z.string().nullable().optional(),  // <-- PRIDĖKITE
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = importSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.format() }, { status: 400 });
    }

    const { idToken, release, agencyId, clientId, projectId } = validationResult.data;

    // 1. Vartotojo autentifikacija
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Turinio paruošimas ir išvalymas
    const $ = cheerio.load(release.textInfo.content);
    // Pašaliname elementus, kurie gali trukdyti redaktoriui
    $('script, style, .clearfix').remove();
    // Pridedame <h1> antraštę, kad atitiktų jūsų redaktoriaus struktūrą
    const finalHtmlContent = `<h1>${release.textInfo.title}</h1>\n` + $.html();

    // --- PRADĖKITE PAKEITIMĄ ČIA ---
    // 3. Nustatome teisingą aplanką
    let folderId: string | null = null;
    if (agencyId) {
        folderId = await getFolderIdForDocument(agencyId, clientId, projectId);
    } else {
        folderId = await findOrCreateFolderByName(adminDb, uid, 'Public Releases');
    }
    // --- PAKEITIMO PABAIGA ---

    const docData = {
      title: release.textInfo.title,
      content: finalHtmlContent,
      snippet: generateSnippet(finalHtmlContent),
      wordCount: countWords(finalHtmlContent),
      userId: uid,
      folderId: folderId, // Naudojame nustatytą folderId
      agencyId: agencyId || null,
      clientId: clientId || null,
      projectId: projectId || null,
      createdAt: FieldValue.serverTimestamp(),
      lastEdited: FieldValue.serverTimestamp(),
      status: 'draft',
      sourceUrl: release.sourceUrl, // Išsaugome originalų šaltinį
      thumbnailUrl: release.seo?.featuredImage || '', // Išsaugome paveikslėlio nuorodą
    };

    // 4. Įrašymas į Firestore
    const newDocRef = await adminDb.collection('documents').add(docData);

    // ŠABLONAS: Naudok šį kodą po to, kai gauni 'newDocRef'
    const conversationMetaRef = newDocRef.collection('conversation').doc('metadata');
    const messagesRef = conversationMetaRef.collection('messages');

    const initialMessage = {
        role: 'assistant',
        content: welcomeMessageContent, // Naudojame tekstą iš 1 žingsnio
        timestamp: FieldValue.serverTimestamp(),
        withTypingEffect: true
    };

    // Įrašome pradinę pokalbio būseną ir pačią žinutę
    await adminDb.batch()
        .set(conversationMetaRef, { chatPhase: 'INTERACTIVE_REFINEMENT', lastUpdatedAt: FieldValue.serverTimestamp() })
        .set(messagesRef.doc(), initialMessage)
        .commit();

    // 5. Sėkmingas atsakymas
    return NextResponse.json({ success: true, newDocumentId: newDocRef.id });

  } catch (error) {
    console.error("Import release error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: `Failed to import release. ${message}` }, { status: 500 });
  }
}

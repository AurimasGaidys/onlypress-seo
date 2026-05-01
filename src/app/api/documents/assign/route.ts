// src/app/api/documents/assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAudit } from '@/lib/auditLogger';
// --- PRADĖKITE PAKEITIMĄ ČIA ---
import { getFolderIdForDocument } from '@/lib/folder-helpers';
// --- PAKEITIMO PABAIGA ---

const assignSchema = z.object({
  idToken: z.string(),
  documentId: z.string(),
  agencyId: z.string().nullable(),
  clientId: z.string().nullable(),
  projectId: z.string().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, documentId, agencyId, clientId, projectId } = assignSchema.parse(body);

    const user = await adminAuth.verifyIdToken(idToken);
    const docRef = adminDb.doc(`documents/${documentId}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error("Document not found.");
    }
    const docData = docSnap.data();

    // Saugumo patikra: ar vartotojas gali priskirti šiai agentūrai
    if (agencyId) {
      const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);
      const agencySnap = await agencyRef.get();
      if (!agencySnap.exists || !agencySnap.data()?.members[user.uid]) {
        throw new Error("You are not a member of the target agency.");
      }
    } else {
      // Jei bandoma atskirti, patikrinti ar vartotojas yra savininkas
      if (docData?.userId !== user.uid) {
        throw new Error("You don't have permission to modify this document.");
      }
    }
    
    // --- PRADĖKITE PAKEITIMĄ ČIA ---
    let targetFolderId: string | null = null;
    if (agencyId) {
      // Jei priskiriame agentūrai, nustatome teisingą aplanką pagal hierarchiją
      targetFolderId = await getFolderIdForDocument(agencyId, clientId, projectId);
    }
    // Jei agencyId yra null, targetFolderId automatiškai lieka null,
    // kas reiškia, kad dokumentas bus asmeninės erdvės šakniniame aplanke.
    
    await docRef.update({
      agencyId: agencyId || null,
      clientId: clientId || null,
      projectId: projectId || null,
      folderId: targetFolderId, // <-- PRIDEDAME APLANKO ATNAUJINIMĄ
      lastEdited: FieldValue.serverTimestamp(),
    });
    // --- PAKEITIMO PABAIGA ---

    if (agencyId) {
      await logAudit({
        agencyId,
        userId: user.uid,
        userEmail: user.email || 'Unknown',
        action: 'document_assigned',
        details: {
          documentTitle: docData?.title,
          documentId,
          clientId: clientId || 'N/A',
          projectId: projectId || 'N/A',
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Document assignment updated.' });
  } catch (error) {
    console.error("Assign document error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

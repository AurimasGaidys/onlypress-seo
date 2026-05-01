// src/app/api/agency/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const deleteAgencySchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId } = deleteAgencySchema.parse(body);

    const requestingUser = await adminAuth.verifyIdToken(idToken);
    const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);

    // --- PRADĖKITE PAKEITIMĄ ČIA ---

    // 1. Gaukite agentūros duomenis, kad patikrintumėte teises ir gautumėte narių sąrašą
    const agencyDoc = await agencyRef.get();
    if (!agencyDoc.exists) {
      throw new Error("Agency not found.t342");
    }

    const agencyData = agencyDoc.data();
    if (agencyData?.ownerId !== requestingUser.uid) {
      throw new Error("Only the agency owner can delete the agency.");
    }

    // 2. Sukurkite batch operaciją
    const batch = adminDb.batch();

    // 3. Surinkite visus susijusius dokumentus ištrynimui
    const collectionsToDelete = ['clients', 'projects', 'documents', 'schedules', 'auditLogs'];
    
    for (const collectionName of collectionsToDelete) {
      const query = adminDb.collection(collectionName).where('agencyId', '==', agencyId);
      const snapshot = await query.get();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }

    // 4. Pašalinkite pačią agentūrą
    batch.delete(agencyRef);

    // 5. Atnaujinkite visų narių 'users' dokumentus, pašalindami nuorodą į agentūrą
    const memberIds = Object.keys(agencyData?.members || {});
    for (const memberId of memberIds) {
      const memberRef = adminDb.doc(`users/${memberId}`);
      batch.update(memberRef, {
        [`agencies.${agencyId}`]: FieldValue.delete()
      });
    }

    // 6. Įvykdykite visus ištrynimus ir atnaujinimus vienu metu
    await batch.commit();
    
    // --- PAKEITIMO PABAIGA ---

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete agency error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// src/app/api/agency/update-member-name/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const updateMemberNameSchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
  memberUid: z.string(),
  newDisplayName: z.string().min(1, "Display name is required").max(50, "Display name is too long"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId, memberUid, newDisplayName } = updateMemberNameSchema.parse(body);

    const requestingUser = await adminAuth.verifyIdToken(idToken);
    const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);

    await adminDb.runTransaction(async (transaction) => {
      const agencyDoc = await transaction.get(agencyRef);
      if (!agencyDoc.exists) {
        throw new Error("Agency not found.41");
      }

      const agencyData = agencyDoc.data();
      const members = agencyData?.members || {};
      
      // Tikriname ar vartotojas turi teises peržiūrėti šį narį
      if (!members[requestingUser.uid]) {
        throw new Error("You don't have permission to edit members in this agency.");
      }

      // Tikriname ar narys, kurį keičiame, priklauso šiai agentūrai
      if (!members[memberUid]) {
        throw new Error("Member not found in this agency.");
      }

      // Atnaujiname vartotojo displayName users kolekcijoje
      const userRef = adminDb.doc(`users/${memberUid}`);
      transaction.update(userRef, {
        displayName: newDisplayName,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

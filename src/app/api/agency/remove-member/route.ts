// src/app/api/agency/remove-member/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { removeUserRole } from '@/lib/roleSync';

const removeMemberSchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
  memberUid: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId, memberUid } = removeMemberSchema.parse(body);

    const requestingUser = await adminAuth.verifyIdToken(idToken);
    const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);

    await adminDb.runTransaction(async (transaction) => {
      const agencyDoc = await transaction.get(agencyRef);
      if (!agencyDoc.exists) throw new Error("Agency not found.3");

      // Saugumo patikra: ar šalinantis vartotojas yra adminas?
      const members = agencyDoc.data()?.members || {};
      if (members[requestingUser.uid] !== 'admin') {
        throw new Error("You don't have permission to remove members.");
      }

      // Patikriname, ar narys, kurį šaliname, egzistuoja
console.log("Members:", members, memberUid);

      if (!members[memberUid]) {
        throw new Error("Member not found in this agency.");
      }

      // Neleidžiama pašalinti savęs
      if (memberUid === requestingUser.uid) {
        throw new Error("You cannot remove yourself from the agency.");
      }

      // Patikriname, ar narys, kurį šaliname, nėra paskutinis adminas
      if (members[memberUid] === 'admin') {
        const adminCount = Object.values(members).filter(role => role === 'admin').length;
        if (adminCount <= 1) {
          throw new Error("Cannot remove the last admin from the agency.");
        }
      }

      // Pašaliname vartotoją iš abiejų vietų
      await removeUserRole(agencyId, memberUid, transaction);
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Remove member error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

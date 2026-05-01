// src/app/api/agency/update-role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { syncUserRole } from '@/lib/roleSync';

const updateRoleSchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
  memberUid: z.string(),
  newRole: z.enum(['admin', 'member']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId, memberUid, newRole } = updateRoleSchema.parse(body);

    const requestingUser = await adminAuth.verifyIdToken(idToken);
    const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);

    await adminDb.runTransaction(async (transaction) => {
      const agencyDoc = await transaction.get(agencyRef);
      if (!agencyDoc.exists) throw new Error("Agency not found.42");

      // Saugumo patikra: ar keičiantis vartotojas yra adminas?
      const members = agencyDoc.data()?.members || {};
      if (members[requestingUser.uid] !== 'admin') {
        throw new Error("You don't have permission to change member roles.");
      }

      // Patikriname, ar narys, kuriam keičiama rolė, egzistuoja
      if (!members[memberUid]) {
        throw new Error("Member not found in this agency.");
      }

      // Neleidžiama pakeisti savo rolės (išskyrus atvejus, kai yra kiti adminai)
      if (memberUid === requestingUser.uid) {
        const adminCount = Object.values(members).filter(role => role === 'admin').length;
        if (adminCount <= 1) {
          throw new Error("You cannot change your own role when you are the only admin.");
        }
      }

      // Atnaujiname abu dokumentus: agentūros ir vartotojo
      await syncUserRole(agencyId, memberUid, newRole, transaction);
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update role error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

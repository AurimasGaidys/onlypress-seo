// src/app/api/agency/cancel-invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAudit } from '@/lib/auditLogger';
import { generateInviteKey } from '@/utils/generateInviteKey';

const cancelInviteSchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId, email } = cancelInviteSchema.parse(body);

    const cancellingUser = await adminAuth.verifyIdToken(idToken);
    const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);

    await adminDb.runTransaction(async (transaction) => {
      const agencyDoc = await transaction.get(agencyRef);
      if (!agencyDoc.exists) throw new Error("Agency not found.");

      const agencyData = agencyDoc.data();

      // Security check: only admins can cancel invitations
      const members = agencyData?.members || {};
      if (members[cancellingUser.uid] !== 'admin') {
        throw new Error("You don't have permission to cancel invitations.");
      }

      // Check if the invitation exists
      const pendingInvites = agencyData?.pendingInvites || {};
      const inviteKey = generateInviteKey(email);

      console.log("Pending invites keys:", Object.keys(pendingInvites), inviteKey);

      if (!pendingInvites[inviteKey]) {
        throw new Error("Invitation not found.");
      }

      const inviteData = pendingInvites[inviteKey];

      // Remove the pending invitation from agency


      // If it's an existing user, remove from their pendingInvites array
      if (inviteData.existingUser) {
        try {
          // Get the invited user's UID
          const invitedUser = await adminAuth.getUserByEmail(email);
          const userPrivateRef = adminDb.doc(`users-private/${invitedUser.uid}`);
          const userPrivateDoc = await transaction.get(userPrivateRef);

          if (!userPrivateDoc.exists) {
            throw new Error("Invited user's private data not found.");
          }

          const userPrivateData = userPrivateDoc.data();
          const removableInvite = userPrivateData?.pendingInvites?.find((invite: any) =>
            invite.agencyId === agencyId
          );

          // Remove the entire invite object from the array
          transaction.update(userPrivateRef, {
            pendingInvites: FieldValue.arrayRemove(removableInvite)
          });
        } catch (error) {
          console.error("Error removing invite from user's pendingInvites:", error);
          // Continue even if this fails - the main invite is removed from agency
        }
      }

      transaction.update(agencyRef, {
        [`pendingInvites.${inviteKey}`]: FieldValue.delete()
      });
    });



    // Log audit entry
    await logAudit({
      agencyId,
      userId: cancellingUser.uid,
      userEmail: cancellingUser.email || 'Unknown',
      action: 'invite_cancelled',
      details: { cancelledEmail: email },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel invite error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

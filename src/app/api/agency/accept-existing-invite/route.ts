// src/app/api/agency/accept-existing-invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAudit } from '@/lib/auditLogger';
import { generateInviteKey } from '@/utils/generateInviteKey';

const acceptExistingInviteSchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId, email } = acceptExistingInviteSchema.parse(body);

    // Verifikuojame vartotoją
    const user = await adminAuth.verifyIdToken(idToken);

    // Patikriname ar email sutampa su tokeno email
    if (user.email !== email) {
      throw new Error("Email does not match the invitation.");
    }

    const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);

    await adminDb.runTransaction(async (transaction) => {
      const agencyDoc = await transaction.get(agencyRef);
      if (!agencyDoc.exists) throw new Error("Agency not found.2");

      const agencyData = agencyDoc.data();
      const pendingInvites = agencyData?.pendingInvites || {};
      console.log("Pending Invites:", pendingInvites);


      // Patikriname, ar yra laikinas kvietimas šiam el. paštui
      const inviteData = pendingInvites[generateInviteKey(email)];
      if (!inviteData) {
        throw new Error("No pending invitation found for this email.");
      }

      // Patikriname ar vartotojas jau narys
      const members = agencyData?.members || {};
      if (members[user.uid]) {
        throw new Error("You are already a member of this agency.");
      }

      // Pridedame vartotoją prie agentūros
      const userRef = adminDb.doc(`users/${user.uid}`);

      try {
        // Get the invited user's UID
        const userPrivateRef = adminDb.doc(`users-private/${user.uid}`);
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

      transaction.update(agencyRef, {
        [`members.${user.uid}`]: inviteData.role,
        [`pendingInvites.${generateInviteKey(email)}`]: FieldValue.delete()
      });

      transaction.set(userRef, {
        agencies: {
          [agencyId]: inviteData.role
        }
      }, { merge: true });

      // Pridedame notification vartotojui
      const notificationData = {
        type: 'agency_invite_accepted',
        title: '🎉 Welcome to the Team!',
        message: `You have successfully joined "${agencyData?.name || 'Agency'}"!`,
        actionUrl: `/agency/${agencyId}`,
        actionText: 'Go to Agency',
        read: false,
        timestamp: new Date(),
        id: Date.now().toString()
      };

      const userNotificationsRef = adminDb.doc(`users/${user.uid}/notifications/${notificationData.id}`);
      transaction.set(userNotificationsRef, notificationData);
    });

    // Log audit entry
    await logAudit({
      agencyId,
      userId: user.uid,
      userEmail: user.email || 'Unknown',
      action: 'existing_user_joined_via_invite',
      details: { email },
    });

    return NextResponse.json({
      success: true,
      message: "You have successfully joined the agency!"
    });

  } catch (error) {
    console.error("Accept existing invite error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

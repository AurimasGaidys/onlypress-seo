// src/app/api/agency/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail, generateInviteEmailTemplate } from '@/lib/email';
import { logAudit } from '@/lib/auditLogger';
import { generateInviteKey } from '@/utils/generateInviteKey';
import moment from 'moment';

const inviteSchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
  emailToInvite: z.string().email(),
  role: z.enum(['admin', 'member']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId, emailToInvite, role } = inviteSchema.parse(body);

    const invitingUser = await adminAuth.verifyIdToken(idToken);
    const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);

    let agencyData: { name?: string; members?: Record<string, string> } = { members: {} };
    let userToInvite: { uid: string; email: string } | null = null;
    let isExistingUser = false;

    // Patikriname, ar vartotojas egzistuoja
    try {
      const foundUser = await adminAuth.getUserByEmail(emailToInvite);
      userToInvite = {
        uid: foundUser.uid,
        email: foundUser.email || emailToInvite
      };
      isExistingUser = true;
    } catch {
      // Vartotojas nerastas - tai naujas vartotojas
      isExistingUser = false;
    }

    // Sukuriame laikiną kvietimą, net jei vartotojas nerastas
    await adminDb.runTransaction(async (transaction) => {
      const agencyDoc = await transaction.get(agencyRef);
      if (!agencyDoc.exists) throw new Error("Agency not found.124");

      // Išsaugome agency data vėlesniam naudojimui
      agencyData = agencyDoc.data() as { name?: string; members?: Record<string, string> };

      // 1. Saugumo patikra: ar kviečiantis vartotojas yra adminas?
      const members = agencyData?.members || {};
      if (members[invitingUser.uid] !== 'admin') {
        throw new Error("You don't have permission to invite members.");
      }

      // 2. Jei vartotojas egzistuoja, sukuriam pending invite
      if (isExistingUser && userToInvite) {
        if (members[userToInvite.uid]) {
          throw new Error("This user is already a member of the agency.");
        }

        const userPrivateRef = adminDb.doc(`users-private/${userToInvite.uid}`);

        // Add invite to pendingInvites array
        transaction.update(userPrivateRef, {
          pendingInvites: FieldValue.arrayUnion({ 
            name: agencyData?.name || 'Agency',
            agencyId: agencyDoc.id,
            role: role,
            invitedBy: invitingUser.uid,
            invitedAt: +moment(),
            existingUser: true
          })
        });

        // Sukuriame pending kvietimą egzistuojančiam vartotojui
        transaction.update(agencyRef, {
          [`pendingInvites.${generateInviteKey(emailToInvite)}`]: {
            email: emailToInvite,
            role: role,
            invitedBy: invitingUser.uid,
            invitedAt: new Date().toISOString(),
            existingUser: true
          }
        });
      } else {
        // Sukuriame laikiną kvietimą naujam vartotojui
       
        transaction.update(agencyRef, {
          [`pendingInvites.${generateInviteKey(emailToInvite)}`]: {
            email: emailToInvite,
            role: role,
            invitedBy: invitingUser.uid,
            invitedAt: new Date().toISOString(),
            tempUserId: emailToInvite.replace(/[@.]/g, '_'),
          }
        });
      }
    });

    // 3. Siunčiame el. pašto kvietimą
    const inviteToken = Math.random().toString(36).substring(7);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://seo.publikuota.lt');
    const inviteLink = `${baseUrl}/agency/${agencyId}/invite?token=${inviteToken}&email=${encodeURIComponent(emailToInvite)}`;

    // Saugome tokeną jei tai naujas vartotojas
    if (!isExistingUser) {
      await adminDb.doc(`seo-agency-invites/${inviteToken}`).set({
        email: emailToInvite,
        agencyId,
        role,
        invitedBy: invitingUser.uid,
        invitedAt: new Date().toISOString(),
        name: agencyData?.name || 'Agency'
      });
    }

    const emailHtml = generateInviteEmailTemplate(
      agencyData?.name || 'Agency',
      invitingUser.email || 'Someone',
      inviteLink,
      isExistingUser
    );

    const emailResult = await sendEmail({
      to: emailToInvite,
      subject: `You're invited to join ${agencyData?.name || 'Agency'}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      throw new Error(`Failed to send invitation email: ${emailResult.error}`);
    }

    // Log audit entry
    await logAudit({
      agencyId,
      userId: invitingUser.uid,
      userEmail: invitingUser.email || 'Unknown',
      action: 'member_invited',
      details: { invitedEmail: emailToInvite, role, isExistingUser },
    });

    return NextResponse.json({
      success: true,
      isExistingUser,
      message: isExistingUser
        ? "Invitation sent! Existing user can accept by clicking the link in the email."
        : "Invitation sent! User will be added after registration."
    });

  } catch (error) {
    console.error("Invite error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

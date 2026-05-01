// src/lib/inviteCleanup.ts
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DatabaseTables } from './constants/databaseTables';

const INVITE_EXPIRY_DAYS = 7; // invitations expire after 7 days

export async function cleanupExpiredInvitations() {
  try {
    const now = new Date();
    const expiryDate = new Date(now.getTime() - (INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
    
    // Clean up expired invite tokens
    const invitesSnapshot = await adminDb.collection('invites')
      .where('invitedAt', '<', expiryDate.toISOString())
      .get();
    
    const batch = adminDb.batch();
    invitesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (!invitesSnapshot.empty) {
      await batch.commit();
      console.log(`Cleaned up ${invitesSnapshot.size} expired invite tokens`);
    }
    
    // Clean up expired pending invites in agencies
    const agenciesSnapshot = await adminDb.collection(DatabaseTables.agency).get();
    
    const agenciesBatch = adminDb.batch();
    let totalExpiredPending = 0;
    
    agenciesSnapshot.docs.forEach(agencyDoc => {
      const agencyData = agencyDoc.data();
      const pendingInvites = agencyData?.pendingInvites || {};
      
      Object.entries(pendingInvites).forEach(([email, inviteData]: [string, any]) => {
        const invitedAt = new Date(inviteData.invitedAt);
        if (invitedAt < expiryDate) {
          agenciesBatch.update(agencyDoc.ref, {
            [`pendingInvites.${email}`]: FieldValue.delete()
          });
          totalExpiredPending++;
        }
      });
    });
    
    if (totalExpiredPending > 0) {
      await agenciesBatch.commit();
      console.log(`Cleaned up ${totalExpiredPending} expired pending invites`);
    }
    
    return {
      success: true,
      cleanedTokens: invitesSnapshot.size,
      cleanedPendingInvites: totalExpiredPending
    };
  } catch (error) {
    console.error('Error cleaning up expired invitations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function isInviteExpired(invitedAt: string): boolean {
  const inviteDate = new Date(invitedAt);
  const now = new Date();
  const expiryDate = new Date(now.getTime() - (INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
  
  return inviteDate < expiryDate;
}

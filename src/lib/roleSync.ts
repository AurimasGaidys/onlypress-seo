// src/lib/roleSync.ts
import { adminDb } from './firebase-admin';
import { Transaction, FieldValue } from 'firebase-admin/firestore';

export async function syncUserRole(agencyId: string, userId: string, role: string, transaction: Transaction) {
  const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);
  const userRef = adminDb.doc(`users/${userId}`);
  
  // Atnaujiname agency document
  transaction.update(agencyRef, { 
    [`members.${userId}`]: role 
  });
  
  // Atnaujiname user document
  transaction.update(userRef, { 
    [`agencies.${agencyId}`]: role 
  });
}

export async function removeUserRole(agencyId: string, userId: string, transaction: Transaction) {
  const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);
  const userRef = adminDb.doc(`users/${userId}`);
  
  // Šaliname iš agency document
  transaction.update(agencyRef, { 
    [`members.${userId}`]: FieldValue.delete() 
  });
  
  // Šaliname iš user document
  transaction.update(userRef, { 
    [`agencies.${agencyId}`]: FieldValue.delete() 
  });
}

// src/lib/auditLogger.ts
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface LogData {
  agencyId: string;
  userId: string;
  userEmail: string;
  action: string;
  details: Record<string, any>;
}

export async function logAudit(data: LogData) {
  try {
    await adminDb.collection('auditLogs').add({
      ...data,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
    // Nesustabdome pagrindinio veiksmo, jei auditas nepavyksta
  }
}

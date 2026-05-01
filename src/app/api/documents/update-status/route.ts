import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAudit } from '@/lib/auditLogger';

const updateStatusSchema = z.object({
  idToken: z.string(),
  documentId: z.string(),
  newStatus: z.enum(['draft', 'in-review', 'approved', 'published']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, documentId, newStatus } = updateStatusSchema.parse(body);

    const requestingUser = await adminAuth.verifyIdToken(idToken);
    const docRef = adminDb.doc(`documents/${documentId}`);

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    
    const documentData = docSnap.data() as any;
    let userRole = null;

    // Patikriname teises
    if (documentData.agencyId) {
      const agencyRef = adminDb.doc(`seo-agencies-private/${documentData.agencyId}`);
      const agencySnap = await agencyRef.get();
      if (agencySnap.exists) {
        const members = agencySnap.data()?.members || {};
        if (!members[requestingUser.uid]) {
          return NextResponse.json({ error: "You are not a member of this agency." }, { status: 403 });
        }
        userRole = members[requestingUser.uid];
      }
    } else if (documentData.userId !== requestingUser.uid) {
      return NextResponse.json({ error: "You don't have permission to edit this document." }, { status: 403 });
    }

    // Statusų keitimo logika
    const currentStatus = documentData.status || 'draft';
    if (newStatus === 'approved' && userRole !== 'admin') {
      return NextResponse.json({ error: "Only admins can approve documents." }, { status: 403 });
    }
    if (newStatus === 'draft' && currentStatus === 'in-review' && userRole !== 'admin') {
      return NextResponse.json({ error: "Only admins can request changes." }, { status: 403 });
    }
    
    // Atnaujiname dokumentą
    await docRef.update({
      status: newStatus,
      lastEdited: FieldValue.serverTimestamp(),
    });

    // Registruojame veiksmą (jei tai agentūros dokumentas)
    if (documentData.agencyId) {
      await logAudit({
        agencyId: documentData.agencyId,
        userId: requestingUser.uid,
        userEmail: requestingUser.email || 'Unknown',
        action: 'status_changed',
        details: { 
          documentTitle: documentData.title,
          documentId: documentId,
          from: currentStatus,
          to: newStatus 
        },
      });
    }

    return NextResponse.json({ success: true, message: `Status updated to ${newStatus}` });

  } catch (error) {
    console.error("Update status error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DatabaseTables } from '@/lib/constants/databaseTables';

export async function POST(req: NextRequest) {
  try {
    const { idToken, documentData } = await req.json();
    
    // Authenticate user
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;
    const userEmail = user.email || 'Unknown';

    // Get personal agency info
    const personalAgencyId = `personal_${userId}`;
    const personalClientId = `${personalAgencyId}_default_client`;
    const personalProjectId = `${personalAgencyId}_default_project`;

    // Ensure personal agency exists
    const agencyRef = adminDb.collection(DatabaseTables.agency).doc(personalAgencyId);
    const agencyDoc = await agencyRef.get();

    if (!agencyDoc.exists) {
      return NextResponse.json({ error: 'Personal agency not found' }, { status: 404 });
    }

    // Create document with personal agency structure
    const documentRef = await adminDb.collection('documents').add({
      ...documentData,
      userId: userId,
      agencyId: personalAgencyId,
      clientId: personalClientId,
      projectId: personalProjectId,
      status: documentData.status || 'draft',
      lastEdited: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      versions: [{
        content: documentData.content || '',
        createdAt: FieldValue.serverTimestamp(),
        createdBy: userId
      }]
    });

    return NextResponse.json({ 
      success: true, 
      documentId: documentRef.id,
      message: 'Personal document created successfully'
    });

  } catch (error) {
    console.error('Personal document creation error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

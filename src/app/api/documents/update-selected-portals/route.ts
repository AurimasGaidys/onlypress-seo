import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, documentId, selectedPortals } = body;

    // Auth
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing auth token' },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Validation
    if (!documentId || !Array.isArray(selectedPortals)) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Update Firestore
    await adminDb.collection('documents').doc(documentId).update({
      selectedPortals,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating selected portals:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

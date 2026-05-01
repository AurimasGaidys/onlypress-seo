import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { idToken, sessionId } = await req.json();
    
    // Verify user token
    const user = await adminAuth.verifyIdToken(idToken);

    // Get agentic session data
    const sessionRef = adminDb.doc('agentic_sessions', sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionSnap.data();

    if (!sessionData) {
      return NextResponse.json({ error: 'Session data is empty' }, { status: 400 });
    }

    // Verify user owns this session
    if (sessionData.userId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify session is complete
    if (sessionData.status !== 'done') {
      return NextResponse.json({ error: 'Session not completed' }, { status: 400 });
    }

    // Use the existing documents/create API to create the document
    const createDocResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/documents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        creationData: {
          source: 'god-mode', // Use god-mode source for agentic content
          title: sessionData.selectedTitle || sessionData.topic,
          htmlContent: sessionData.fullArticleHtml || '',
          context: {
            agencyId: sessionData.agencyId || null,
            clientId: null,
            projectId: null,
          },
        },
      }),
    });

    if (!createDocResponse.ok) {
      const errorData = await createDocResponse.json();
      throw new Error(`Failed to create document: ${errorData.error}`);
    }

    const { newDocumentId } = await createDocResponse.json();

    // Mark the agentic session as saved to prevent duplicates
    await sessionRef.update({
      savedDocumentId: newDocumentId,
      savedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      newDocumentId 
    });

  } catch (error) {
    console.error("Agentic save error:", error);
    
    if (error instanceof Error && error.message.includes('auth')) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { idToken, agencyId, projectId, day, content } = await request.json();

    if (!idToken || !agencyId || !projectId || !day) {
      return NextResponse.json(
        { error: 'Missing required fields: idToken, agencyId, projectId, day' },
        { status: 400 }
      );
    }

    // Verify user token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Create query to find existing note
    const notesRef = adminDb.collection('schedulerNotes');
    const existingNoteQuery = await notesRef
      .where('agencyId', '==', agencyId)
      .where('projectId', '==', projectId)
      .where('day', '==', day)
      .limit(1)
      .get();

    const now = Timestamp.now();

    if (existingNoteQuery.empty) {
      // Only create if content is not empty
      if (content && content.trim() !== '') {
        const newNoteRef = notesRef.doc();
        await newNoteRef.set({
          agencyId,
          projectId,
          day,
          content: content.trim(),
          createdBy: userId,
          lastEditedBy: userId,
          createdAt: now,
          lastEditedAt: now,
        });

        return NextResponse.json({ 
          success: true, 
          action: 'created',
          noteId: newNoteRef.id
        });
      } else {
        return NextResponse.json({ 
          success: true, 
          action: 'no_action',
          message: 'Content is empty, no note created'
        });
      }
    } else {
      // Update existing note
      const existingDoc = existingNoteQuery.docs[0];
      const noteRef = existingDoc.ref;

      if (content && content.trim() !== '') {
        // Update with new content
        await noteRef.update({
          content: content.trim(),
          lastEditedBy: userId,
          lastEditedAt: now,
        });

        return NextResponse.json({ 
          success: true, 
          action: 'updated',
          noteId: noteRef.id
        });
      } else {
        // Delete if content is empty
        await noteRef.delete();

        return NextResponse.json({ 
          success: true, 
          action: 'deleted',
          noteId: noteRef.id
        });
      }
    }
  } catch (error) {
    console.error('Error managing scheduler note:', error);
    return NextResponse.json(
      { error: 'Failed to manage scheduler note' },
      { status: 500 }
    );
  }
}

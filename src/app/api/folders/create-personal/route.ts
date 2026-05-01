import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DatabaseTables } from '@/lib/constants/databaseTables';

export async function POST(req: NextRequest) {
  try {
    const { idToken, folderData } = await req.json();
    
    // Authenticate user
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;

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

    // Create folder with personal agency structure
    const folderRef = await adminDb.collection('folders').add({
      ...folderData,
      userId: userId,
      agencyId: personalAgencyId,
      clientId: personalClientId,
      projectId: personalProjectId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true, 
      folderId: folderRef.id,
      message: 'Personal folder created successfully'
    });

  } catch (error) {
    console.error('Personal folder creation error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split(' ')[1];
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;

    // Get personal agency info
    const personalAgencyId = `personal_${userId}`;
    const personalClientId = `${personalAgencyId}_default_client`;
    const personalProjectId = `${personalAgencyId}_default_project`;

    // Get personal folders
    const foldersQuery = adminDb.collection('folders')
      .where('userId', '==', userId)
      .where('agencyId', '==', personalAgencyId)
      .where('clientId', '==', personalClientId)
      .where('projectId', '==', personalProjectId)
      .orderBy('createdAt', 'desc');

    const foldersSnapshot = await foldersQuery.get();
    const folders = foldersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      success: true, 
      folders
    });

  } catch (error) {
    console.error('Personal folders fetch error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { idToken, folderId, updateData } = await req.json();
    
    // Authenticate user
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;

    // Get personal agency info
    const personalAgencyId = `personal_${userId}`;
    const personalClientId = `${personalAgencyId}_default_client`;
    const personalProjectId = `${personalAgencyId}_default_project`;

    // Update folder
    const folderRef = adminDb.collection('folders').doc(folderId);
    const folderDoc = await folderRef.get();

    if (!folderDoc.exists) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const folderData = folderDoc.data();
    
    if (!folderData) {
      return NextResponse.json({ error: 'Folder data not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (folderData.userId !== userId || 
        folderData.agencyId !== personalAgencyId || 
        folderData.clientId !== personalClientId || 
        folderData.projectId !== personalProjectId) {
      return NextResponse.json({ error: 'Unauthorized to update this folder' }, { status: 403 });
    }

    await folderRef.update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Personal folder updated successfully'
    });

  } catch (error) {
    console.error('Personal folder update error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { idToken, folderId } = await req.json();
    
    // Authenticate user
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;

    // Get personal agency info
    const personalAgencyId = `personal_${userId}`;
    const personalClientId = `${personalAgencyId}_default_client`;
    const personalProjectId = `${personalAgencyId}_default_project`;

    // Delete folder
    const folderRef = adminDb.collection('folders').doc(folderId);
    const folderDoc = await folderRef.get();

    if (!folderDoc.exists) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const folderData = folderDoc.data();
    
    if (!folderData) {
      return NextResponse.json({ error: 'Folder data not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (folderData.userId !== userId || 
        folderData.agencyId !== personalAgencyId || 
        folderData.clientId !== personalClientId || 
        folderData.projectId !== personalProjectId) {
      return NextResponse.json({ error: 'Unauthorized to delete this folder' }, { status: 403 });
    }

    await folderRef.delete();

    return NextResponse.json({ 
      success: true, 
      message: 'Personal folder deleted successfully'
    });

  } catch (error) {
    console.error('Personal folder deletion error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

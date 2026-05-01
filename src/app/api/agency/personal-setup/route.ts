import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DatabaseTables } from '@/lib/constants/databaseTables';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    
    // Authenticate user
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;
    const userEmail = user.email || 'Unknown';

    const personalAgencyId = `personal_${userId}`;
    const personalClientId = `${personalAgencyId}_default_client`;
    const personalProjectId = `${personalAgencyId}_default_project`;

    // Check if personal agency already exists
    const agencyRef = adminDb.collection(DatabaseTables.agency).doc(personalAgencyId);
    const agencyDoc = await agencyRef.get();

    if (!agencyDoc.exists) {
      // Create personal agency
      const agencyData = {
        name: `${userEmail.split('@')[0]}'s Personal Space`,
        description: 'Personal workspace for individual projects',
        theme: 'default',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        members: {
          [userId]: {
            email: userEmail,
            role: 'owner',
            joinedAt: FieldValue.serverTimestamp(),
          }
        },
        isPersonal: true, // Flag to identify personal agencies
      };

      await agencyRef.set(agencyData);
      console.log(`Created personal agency for user ${userId}`);
    }

    // Check if personal client exists
    const clientRef = adminDb.collection('clients').doc(personalClientId);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      // Create default client
      const clientData = {
        name: 'Personal Projects',
        description: 'Default client for personal projects',
        agencyId: personalAgencyId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        isPersonal: true,
      };

      await clientRef.set(clientData);
      console.log(`Created personal client for user ${userId}`);
    }

    // Check if personal project exists
    const projectRef = adminDb.collection('projects').doc(personalProjectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      // Create default project
      const projectData = {
        name: 'Default Project',
        description: 'Default project for personal documents',
        clientId: personalClientId,
        agencyId: personalAgencyId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        isPersonal: true,
      };

      await projectRef.set(projectData);
      console.log(`Created personal project for user ${userId}`);
    }

    return NextResponse.json({
      success: true,
      personalAgencyId,
      personalClientId,
      personalProjectId,
      message: 'Personal workspace setup completed'
    });

  } catch (error) {
    console.error('Personal agency setup error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint to check if personal agency exists
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split(' ')[1];
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;
    const personalAgencyId = `personal_${userId}`;

    // Check if personal agency exists
    const agencyRef = adminDb.collection(DatabaseTables.agency).doc(personalAgencyId);
    const agencyDoc = await agencyRef.get();

    const personalClientId = `${personalAgencyId}_default_client`;
    const personalProjectId = `${personalAgencyId}_default_project`;

    // Check client and project
    const clientRef = adminDb.collection('clients').doc(personalClientId);
    const projectRef = adminDb.collection('projects').doc(personalProjectId);

    const [clientDoc, projectDoc] = await Promise.all([
      clientRef.get(),
      projectRef.get()
    ]);

    return NextResponse.json({
      personalAgencyId,
      personalClientId,
      personalProjectId,
      agencyExists: agencyDoc.exists,
      clientExists: clientDoc.exists,
      projectExists: projectDoc.exists,
      isSetupComplete: agencyDoc.exists && clientDoc.exists && projectDoc.exists
    });

  } catch (error) {
    console.error('Personal agency check error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod'; // Būtina naudoti Zod validacijai
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Schema atitinka tą, kurią siunčiame iš UI (be scheduleData wrapperio)
const personalScheduleSchema = z.object({
  idToken: z.string(),
  documentId: z.string(),
  portalId: z.string().min(1, "Portal is required"),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
});

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 POST /api/scheduler/personal - Starting request');
    
    const body = await req.json();
    console.log('📥 Request body:', JSON.stringify(body, null, 2));
    
    // 1. Validacija su Zod - tai apsaugo nuo "undefined" klaidų giliau kode
    console.log('🔍 Starting Zod validation...');
    const validation = personalScheduleSchema.safeParse(body);
    
    if (!validation.success) {
      console.log('❌ Zod validation failed:', validation.error.format());
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    console.log('✅ Zod validation passed');
    const { idToken, documentId, portalId, scheduledDate } = validation.data;
    console.log('📋 Extracted data:', { idToken: idToken ? '***' : 'MISSING', documentId, portalId, scheduledDate });
    
    // 2. Autentifikacija
    console.log('🔐 Starting Firebase authentication...');
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;
    console.log('✅ Authentication successful, userId:', userId);

    // Asmeninės erdvės identifikatoriai
    const personalAgencyId = `personal_${userId}`;
    const personalClientId = `${personalAgencyId}_default_client`;
    const personalProjectId = `${personalAgencyId}_default_project`;

    // 3. Dokumento nuosavybės patikra
    console.log('📄 Checking document ownership...');
    const docRef = adminDb.doc(`documents/${documentId}`);
    const docSnap = await docRef.get();
    
    console.log('📄 Document exists:', docSnap.exists);
    if (!docSnap.exists) {
      console.log('❌ Document does not exist');
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    
    const docData = docSnap.data();
    console.log('📄 Document data keys:', docData ? Object.keys(docData) : 'NO_DATA');
    console.log('📄 Document userId:', docData?.userId);
    console.log('📄 Request userId:', userId);
    
    if (docData?.userId !== userId) {
      console.log('❌ Permission denied - user does not own document');
      return NextResponse.json({ error: "Permission denied or document not found." }, { status: 403 });
    }
    
    console.log('✅ Document ownership verified');

    // 4. "Smart Time-Slotting" logika (suvienodinta su Agency)
    const dateParts = scheduledDate.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    // JS mėnesiai nuo 0 iki 11
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // Ieškome kitų įrašų tą dieną ASMENINIAME projekte
    const query = adminDb.collection('schedules')
      .where('agencyId', '==', personalAgencyId) 
      .where('scheduledAt', '>=', Timestamp.fromDate(startOfDay))
      .where('scheduledAt', '<=', Timestamp.fromDate(endOfDay))
      .orderBy('scheduledAt', 'desc'); // Paskutinis įrašas bus pirmas

    const snapshot = await query.get();

    let newScheduledTime: Date;
    if (snapshot.empty) {
      // Jei tą dieną nieko nėra, pradedame 8:00 ryto
      newScheduledTime = new Date(startOfDay);
      newScheduledTime.setUTCHours(8, 0, 0, 0);
    } else {
      // Jei yra, pridedame 4 valandas prie vėliausio įrašo
      const latestTime = snapshot.docs[0].data().scheduledAt.toDate();
      newScheduledTime = new Date(latestTime.getTime() + 4 * 60 * 60 * 1000);
    }

    // 5. Patikriname, ar jau egzistuoja schedule šiam dokumentui (Upsert logika)
    const existingScheduleQuery = adminDb.collection('schedules')
      .where('documentId', '==', documentId)
      .limit(1);
    
    const existingScheduleSnapshot = await existingScheduleQuery.get();
    
    let scheduleRef;
    let isNewSchedule = false;
    
    if (existingScheduleSnapshot.empty) {
      scheduleRef = adminDb.collection('schedules').doc();
      isNewSchedule = true;
    } else {
      scheduleRef = existingScheduleSnapshot.docs[0].ref;
    }

    // 6. Įrašymas į DB
    const scheduleData: {
      documentId: string;
      portalId: string;
      agencyId: string;
      clientId: string;
      projectId: string;
      userId: string;
      scheduledAt: Timestamp;
      status: string;
      updatedAt: FieldValue;
      updatedBy: string;
      createdAt?: FieldValue;
      createdBy?: string;
    } = {
      documentId,
      portalId,
      // Svarbu: naudojame asmeninės erdvės ID, kad rodytų teisingai kalendoriuje
      agencyId: personalAgencyId,
      clientId: personalClientId,
      projectId: personalProjectId,
      userId: userId, // Pridedame ir tiesioginį userId dėl patogumo
      scheduledAt: Timestamp.fromDate(newScheduledTime),
      status: 'scheduled',
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
    };

    if (isNewSchedule) {
      scheduleData.createdAt = FieldValue.serverTimestamp();
      scheduleData.createdBy = userId;
    }

    const batch = adminDb.batch();
    batch.set(scheduleRef, scheduleData, { merge: true });
    
    // Atnaujiname dokumentą su teisingais asmeninės erdvės ryšiais
    batch.update(docRef, { 
      status: 'scheduled',
      updatedAt: FieldValue.serverTimestamp(),
      // Užtikriname, kad dokumentas priskirtas asmeninei erdvei
      agencyId: personalAgencyId,
      clientId: personalClientId,
      projectId: personalProjectId
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      scheduleId: scheduleRef.id,
      scheduledAt: newScheduledTime.toISOString(),
      message: 'Personal schedule created successfully'
    });

  } catch (error) {
    console.error('Personal schedule creation error:', error);
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

    // Get personal schedules
    const schedulesQuery = adminDb.collection('schedules')
      .where('agencyId', '==', personalAgencyId)
      .where('clientId', '==', personalClientId)
      .where('projectId', '==', personalProjectId)
      .orderBy('createdAt', 'desc');

    const schedulesSnapshot = await schedulesQuery.get();
    const schedules = schedulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      success: true, 
      schedules
    });

  } catch (error) {
    console.error('Personal schedules fetch error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { idToken, scheduleId, updateData } = await req.json();
    
    // Authenticate user
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;

    // Get personal agency info
    const personalAgencyId = `personal_${userId}`;
    const personalClientId = `${personalAgencyId}_default_client`;
    const personalProjectId = `${personalAgencyId}_default_project`;

    // Update schedule
    const scheduleRef = adminDb.collection('schedules').doc(scheduleId);
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const scheduleData = scheduleDoc.data();
    
    if (!scheduleData) {
      return NextResponse.json({ error: 'Schedule data not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (scheduleData.agencyId !== personalAgencyId || 
        scheduleData.clientId !== personalClientId || 
        scheduleData.projectId !== personalProjectId) {
      return NextResponse.json({ error: 'Unauthorized to update this schedule' }, { status: 403 });
    }

    await scheduleRef.update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Personal schedule updated successfully'
    });

  } catch (error) {
    console.error('Personal schedule update error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { idToken, scheduleId } = await req.json();
    
    // Authenticate user
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;

    // Get personal agency info
    const personalAgencyId = `personal_${userId}`;
    const personalClientId = `${personalAgencyId}_default_client`;
    const personalProjectId = `${personalAgencyId}_default_project`;

    // Delete schedule
    const scheduleRef = adminDb.collection('schedules').doc(scheduleId);
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const scheduleData = scheduleDoc.data();
    
    if (!scheduleData) {
      return NextResponse.json({ error: 'Schedule data not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (scheduleData.agencyId !== personalAgencyId || 
        scheduleData.clientId !== personalClientId || 
        scheduleData.projectId !== personalProjectId) {
      return NextResponse.json({ error: 'Unauthorized to delete this schedule' }, { status: 403 });
    }

    await scheduleRef.delete();

    return NextResponse.json({ 
      success: true, 
      message: 'Personal schedule deleted successfully'
    });

  } catch (error) {
    console.error('Personal schedule deletion error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

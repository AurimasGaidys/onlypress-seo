// src/app/api/agency/schedule-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const schema = z.object({
  idToken: z.string(),
  documentId: z.string(),
  agencyId: z.string(),
  clientId: z.string(),
  projectId: z.string(),
  portalId: z.string().optional().default(''),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeInterval: z.number().optional().default(4), // Laiko intervalas valandomis, pagal nutylėjimą 4
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.format() }, { status: 400 });
    }

    const { idToken, documentId, agencyId, clientId, projectId, portalId, scheduledDate, timeInterval } = validation.data;
    
    const user = await adminAuth.verifyIdToken(idToken);
    const docRef = adminDb.doc(`documents/${documentId}`);

    // --- NAUJAS ŽINGSNIS: Dokumento atnaujinimas su kontekstu ---
    // Prieš planuojant, priskiriame dokumentui teisingą klientą ir projektą.
    // Tai užtikrins duomenų vientisumą.
    await docRef.update({
      agencyId: agencyId,
      clientId: clientId,
      projectId: projectId,
      lastEdited: FieldValue.serverTimestamp(),
    });
    // --- PABAIGA ---

    // --- PRADĖTI PATAISYMĄ ČIA ---
    
    // Išskaidome datą į dalis, kad išvengtume laiko juostų interpretacijos klaidų
    const [year, month, day] = scheduledDate.split('-').map(Number);
    // Svarbu: JavaScript mėnesiai yra nuo 0 (sausis) iki 11 (gruodis), todėl atimame 1
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // --- PATAISYMO PABAIGA ---

    const query = adminDb.collection('schedules')
      .where('agencyId', '==', agencyId)
      .where('scheduledAt', '>=', Timestamp.fromDate(startOfDay))
      .where('scheduledAt', '<=', Timestamp.fromDate(endOfDay));

    const snapshot = await query.orderBy('scheduledAt', 'desc').get();

    const projectSchedules = snapshot.docs.filter(doc => {
      const data = doc.data();
      return data.projectId === projectId;
    });

    let newScheduledTime: Date;
    if (projectSchedules.length === 0) {
      // Pradedame nuo UTC dienos pradžios
      newScheduledTime = new Date(startOfDay);
      // Nustatome valandas UTC laiku
      newScheduledTime.setUTCHours(8, 0, 0, 0);
    } else {
      const latestScheduleData = projectSchedules[0].data();
      const latestTime = latestScheduleData.scheduledAt.toDate();
      // Pridedame pasirinktą laiko intervalą prie paskutinio laiko
      newScheduledTime = new Date(latestTime.getTime() + timeInterval * 60 * 60 * 1000);
    }

    // --- PATAISYTA LOGIKA: Patikrinkite, ar dokumentas jau turi schedule įrašą ---
    const existingScheduleQuery = adminDb.collection('schedules')
      .where('documentId', '==', documentId)
      .where('agencyId', '==', agencyId)
      .limit(1);
    
    const existingScheduleSnapshot = await existingScheduleQuery.get();
    
    let scheduleRef;
    let isNewSchedule = false;
    
    if (existingScheduleSnapshot.empty) {
      // Sukuriamas naujas schedule įrašas
      scheduleRef = adminDb.collection('schedules').doc();
      isNewSchedule = true;
    } else {
      // Atnaujinamas esamas schedule įrašas
      scheduleRef = existingScheduleSnapshot.docs[0].ref;
      isNewSchedule = false;
    }
    
    const scheduleData: Record<string, unknown> = {
      documentId,
      agencyId,
      clientId,
      projectId,
      portalId,
      scheduledAt: Timestamp.fromDate(newScheduledTime),
      status: 'scheduled',
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: user.uid,
    };
    
    // Jei tai naujas įrašas, pridedame sukūrimo laukus
    if (isNewSchedule) {
      scheduleData.createdAt = FieldValue.serverTimestamp();
      scheduleData.createdBy = user.uid;
    }
    
    await scheduleRef.set(scheduleData, { merge: true });
    await adminDb.doc(`documents/${documentId}`).update({ status: 'scheduled' });

    const responseMessage = isNewSchedule 
      ? { success: true, newScheduleId: scheduleRef.id, scheduledAt: newScheduledTime.toISOString(), action: 'created' }
      : { success: true, updatedScheduleId: scheduleRef.id, scheduledAt: newScheduledTime.toISOString(), action: 'updated' };

    return NextResponse.json(responseMessage, { status: 200 });

  } catch (error) {
    console.error('[API/schedule-document POST] Error:', error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

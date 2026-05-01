// src/app/api/schedules/personal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Paprastesnė Zod schema asmeniniam planavimui
const personalScheduleSchema = z.object({
  idToken: z.string(),
  documentId: z.string(),
  portalId: z.string(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, documentId, portalId, scheduledDate } = personalScheduleSchema.parse(body);

    const user = await adminAuth.verifyIdToken(idToken);

    // Saugumo patikra: ar vartotojas yra dokumento savininkas?
    const docRef = adminDb.doc(`documents/${documentId}`);
    const docSnap = await docRef.get();
    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error("Permission denied or document not found.");
    }
    
    // "Smart Time-Slotting" logika asmeniniams įrašams
    // Ieškome kitų to paties vartotojo asmeninių įrašų tą pačią dieną
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    
    const query = adminDb.collection('schedules')
      .where('userId', '==', user.uid) // Filtruojame pagal vartotoją
      .where('agencyId', '==', null) // Tik asmeniniai įrašai
      .where('scheduledAt', '>=', Timestamp.fromDate(startOfDay))
      .where('scheduledAt', '<=', Timestamp.fromDate(endOfDay));
      
    const snapshot = await query.get();

    let newScheduledTime: Date;
    if (snapshot.empty) {
      newScheduledTime = new Date(startOfDay);
      newScheduledTime.setUTCHours(8, 0, 0, 0);
    } else {
      const latestTime = snapshot.docs[0].data().scheduledAt.toDate();
      newScheduledTime = new Date(latestTime.getTime() + 4 * 60 * 60 * 1000); // Numatytasis 4 val. intervalas
    }

    // --- PATAISYTA LOGIKA: Patikrinkite, ar dokumentas jau turi schedule įrašą ---
    const existingScheduleQuery = adminDb.collection('schedules')
      .where('documentId', '==', documentId)
      .where('userId', '==', user.uid)
      .where('agencyId', '==', null)
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
      userId: user.uid,
      portalId,
      agencyId: null,
      clientId: null,
      projectId: null,
      scheduledAt: Timestamp.fromDate(newScheduledTime),
      status: 'scheduled',
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    // Jei tai naujas įrašas, pridedame sukūrimo laukus
    if (isNewSchedule) {
      scheduleData.createdAt = FieldValue.serverTimestamp();
    }
    
    await scheduleRef.set(scheduleData, { merge: true });
    await docRef.update({ status: 'scheduled' });

    const responseMessage = isNewSchedule 
      ? { success: true, newScheduleId: scheduleRef.id, action: 'created' }
      : { success: true, updatedScheduleId: scheduleRef.id, action: 'updated' };

    return NextResponse.json(responseMessage, { status: 200 });

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

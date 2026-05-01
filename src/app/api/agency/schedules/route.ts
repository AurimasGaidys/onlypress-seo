import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Zod schema užklausos parametrų validacijai
const schema = z.object({
  agencyId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  clientId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // 1. Ištraukiame ir validuojame parametrus iš URL
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const validation = schema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.format() }, { status: 400 });
    }

    const { agencyId, startDate, endDate, clientId } = validation.data;

    // 2. Dinaminės Firestore užklausos sudarymas
    let schedulesQuery = adminDb.collection('schedules')
      .where('agencyId', '==', agencyId)
      .where('scheduledAt', '>=', Timestamp.fromDate(new Date(startDate)))
      .where('scheduledAt', '<=', Timestamp.fromDate(new Date(endDate)));

    // Pridedame kliento filtrą, jei jis nurodytas ir nėra "all"
    if (clientId && clientId !== 'all') {
      schedulesQuery = schedulesQuery.where('clientId', '==', clientId);
    }

    // 3. Vygdome užklausą ir apdorojame rezultatus
    const snapshot = await schedulesQuery.get();
    
    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const schedules = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Svarbu: konvertuojame Firestore Timestamp į ISO string, kad būtų lengva naudoti fronte
        scheduledAt: data.scheduledAt.toDate().toISOString(),
        createdAt: data.createdAt.toDate().toISOString(),
      };
    });

    return NextResponse.json(schedules, { status: 200 });

  } catch (error) {
    console.error('[API/schedules GET] Error:', error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

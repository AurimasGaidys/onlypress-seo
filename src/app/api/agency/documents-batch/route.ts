import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldPath } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { documentIds } = await req.json();
    
    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json({ error: 'Invalid document IDs' }, { status: 400 });
    }

    const batchSize = 30;
    const batches: string[][] = [];
    
    // Suskirstome ID į batch'us po 30 elementų
    for (let i = 0; i < documentIds.length; i += batchSize) {
      batches.push(documentIds.slice(i, i + batchSize));
    }

    // Lygiagrečiai vykdome visas užklausas
    const batchPromises = batches.map(async (batchOfIds) => {
      try {
        const docSnap = await adminDb.collection('documents')
          .where(new FieldPath('__name__'), 'in', batchOfIds)
          .get();
        
        return docSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching document batch:', error);
        return [];
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const documents = batchResults.flat().filter(doc => doc !== null);

    return NextResponse.json({ documents }, { status: 200 });

  } catch (error) {
    console.error('[API/documents-batch POST] Error:', error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

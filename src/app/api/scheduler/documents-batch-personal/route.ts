import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldPath } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { documentIds } = await req.json();
    
    console.log('[PERSONAL DOCS BATCH] Request received with documentIds:', documentIds);
    
    if (!documentIds || !Array.isArray(documentIds)) {
      console.error('[PERSONAL DOCS BATCH] Invalid document IDs');
      return NextResponse.json({ error: 'Invalid document IDs' }, { status: 400 });
    }

    // Gauname autentifikavimo token iš headerio (būtinas saugumui)
    const authHeader = req.headers.get('authorization');
    console.log('[PERSONAL DOCS BATCH] Auth header:', authHeader?.substring(0, 20) + '...');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[PERSONAL DOCS BATCH] Missing or invalid authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split(' ')[1];
    const user = await adminAuth.verifyIdToken(idToken);
    const userId = user.uid;
    
    console.log('[PERSONAL DOCS BATCH] User authenticated:', userId);

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
          .where('userId', '==', userId) // Tik paties vartotojo dokumentai
          .where(new FieldPath('__name__'), 'in', batchOfIds)
          .get();
        
        return docSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching personal document batch:', error);
        return [];
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const documents = batchResults.flat().filter(doc => doc !== null);

    console.log(`[PERSONAL DOCS BATCH] Found ${documents.length} documents:`, documents.map((d: any) => ({ id: d.id, title: d.title, userId: d.userId })));
    return NextResponse.json({ documents }, { status: 200 });

  } catch (error) {
    console.error('[API/documents-batch-personal POST] Error:', error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

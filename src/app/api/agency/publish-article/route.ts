// src/app/api/agency/publish-article/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DatabaseTables } from '@/lib/constants/databaseTables';

const publishArticleSchema = z.object({
  idToken: z.string(),
  documentId: z.string(),
  portalIds: z.array(z.string()).min(1, "At least one portal must be selected"),
  agencyId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, documentId, portalIds, agencyId } = publishArticleSchema.parse(body);

    // Patvirtinti idToken ir gauti requestingUser.uid
    let requestingUser;
    try {
      requestingUser = await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      console.error('Token verification failed:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Saugumo Patikra: Patikrinti, ar requestingUser yra nurodytos agencyId narys
    let isMember = false;
    try {
      const agencyDoc = await adminDb.collection(DatabaseTables.agency).doc(agencyId).get();
      if (!agencyDoc.exists) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
      }
      
      const agencyData = agencyDoc.data();
      const members = agencyData?.members || {};
      isMember = members[requestingUser.uid] !== undefined;
    } catch (error) {
      console.error('Error checking agency membership:', error);
      return NextResponse.json({ error: 'Failed to verify agency membership' }, { status: 500 });
    }

    if (!isMember) {
      return NextResponse.json({ error: 'Access denied - not a member of this agency' }, { status: 403 });
    }

    // Kainos Apskaičiavimas (Server-side)
    let calculatedPrice = 0;
    try {
      const portalPromises = portalIds.map(async (portalId) => {
        const portalDoc = await adminDb.collection('portals').doc(portalId).get();
        if (!portalDoc.exists) {
          throw new Error(`Portal ${portalId} not found`);
        }
        const portalData = portalDoc.data();
        return portalData?.price || 0;
      });

      const prices = await Promise.all(portalPromises);
      calculatedPrice = prices.reduce((sum, price) => sum + price, 0);
    } catch (error) {
      console.error('Error calculating price:', error);
      return NextResponse.json({ error: 'Failed to calculate publishing price' }, { status: 500 });
    }

    // Vykdyti atominę transakciją
    try {
      await adminDb.runTransaction(async (transaction) => {
        // a. Nuskaityti balansą: Transakcijos viduje gauti vartotojo users-private dokumentą
        const userPrivateRef = adminDb.collection('users-private').doc(requestingUser.uid);
        const userPrivateDoc = await transaction.get(userPrivateRef);

        if (!userPrivateDoc.exists) {
          throw new Error('User private document not found');
        }

        const userData = userPrivateDoc.data();
        const currentCredit = userData?.credit || 0;

        // b. Patikrinti kreditus: Jei userCredit < calculatedPrice, nutraukti transakciją
        if (currentCredit < calculatedPrice) {
          throw new Error('Insufficient credit');
        }

        // c. Atnaujinti balansą: Apskaičiuoti naują balansą ir atnaujinti vartotojo users-private dokumentą
        const newCredit = currentCredit - calculatedPrice;
        transaction.update(userPrivateRef, {
          credit: newCredit,
          updatedAt: FieldValue.serverTimestamp()
        });

        // d. Sukurti užsakymą: Sukurti naują dokumentą publish-orders kolekcijoje
        const orderRef = adminDb.collection('publish-orders').doc();
        const orderData = {
          userId: requestingUser.uid,
          agencyId: agencyId,
          documentId: documentId,
          totalPrice: calculatedPrice,
          portalIds: portalIds,
          status: 'paid',
          createdAt: FieldValue.serverTimestamp()
        };
        transaction.set(orderRef, orderData);

        // e. Sukurti užduotis: Cikle per portalIds, sukurti po vieną dokumentą publish-tasks kolekcijoje
        for (const portalId of portalIds) {
          const taskRef = adminDb.collection('publish-tasks').doc();
          const taskData = {
            orderId: orderRef.id,
            portalId: portalId,
            documentId: documentId,
            userId: requestingUser.uid,
            agencyId: agencyId,
            status: 'pending',
            createdAt: FieldValue.serverTimestamp()
          };
          transaction.set(taskRef, taskData);
        }
      });

      return NextResponse.json({ success: true });

    } catch (transactionError) {
      console.error('Transaction failed:', transactionError);
      
      if (transactionError instanceof Error && transactionError.message === 'Insufficient credit') {
        return NextResponse.json({ 
          error: 'Insufficient credit',
          requiredCredits: calculatedPrice 
        }, { status: 402 });
      }

      return NextResponse.json({ 
        error: 'Transaction failed',
        details: transactionError instanceof Error ? transactionError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in publish article API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request body', 
        details: error.format() 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

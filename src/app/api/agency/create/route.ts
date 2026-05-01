// src/app/api/agency/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Agency } from '@/types/agency';
import { AgencyPrivate } from '@/types/agencyPrivate';
import { DatabaseTables } from '@/lib/constants/databaseTables';

const createAgencySchema = z.object({
  idToken: z.string(),
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, name } = createAgencySchema.parse(body);

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userRecord = await adminAuth.getUser(uid);

    const batch = adminDb.batch();
    const newAgencyRef = adminDb.collection(DatabaseTables.agency).doc(); // Sukuriame ID iš anksto
    const newAgencyPrivateRef = adminDb.collection(DatabaseTables.agencyPrivate).doc(newAgencyRef.id); // Sukuriame ID iš anksto

    const newAgencyData: Agency = {
      id: newAgencyRef.id,
      name: name,
      isPersonal: false,
      created: 0,
      updated: 0,
      lastLogin: 0
    }

    const newAgencyPrivateData: AgencyPrivate = {
      name: name,
      ownerId: uid,
      members: {
        [uid]: 'admin' // Savininkas automatiškai tampa adminu
      },
      id: '',
      credit: 10,
      creditDeductions: [],
      email: '',
      phone: '',
      permission: {
        canCustomPrice: false,
        manageUsers: true,
        manageBilling: true,
        manageSettings: true,
      },
      blocked: false,
      created: 0,
      updated: 0,
      lastLogin: 0
    }

    // 1. Sukuriame naują agentūrą
    batch.set(newAgencyRef, newAgencyData);
    batch.set(newAgencyPrivateRef, newAgencyPrivateData);

    // 2. Sukuriame/Atnaujiname vartotojo dokumentą su visais reikiamais laukais
    const userRef = adminDb.doc(`users/${uid}`);
    // Naudojame "dot notation" su FieldValue.update, kad pridėtume naują lauką į `agencies` map'ą
    batch.set(userRef, {
      email: userRecord.email || '',        // ← PRIDĖTA: išsaugome email su fallback
      displayName: userRecord.displayName || 'Unknown User', // ← PRIDĖTA: išsaugome displayName su fallback
      agencies: {
        [newAgencyRef.id]: 'admin'
      }
    }, { merge: true }); // `merge: true` užtikrina, kad neperrašysime kitų vartotojo laukų

    await batch.commit();

    return NextResponse.json({ success: true, agencyId: newAgencyRef.id });

  } catch (error) {
    console.error("Agency creation error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: `Failed to create agency. ${message}` }, { status: 500 });
  }
}

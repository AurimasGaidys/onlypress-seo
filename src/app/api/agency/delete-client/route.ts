// src/app/api/agency/delete-client/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const deleteClientSchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
  clientId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId, clientId } = deleteClientSchema.parse(body);

    const requestingUser = await adminAuth.verifyIdToken(idToken);
    
    // --- PRADĖK PAKEITIMĄ ČIA: Išimame iš transakcijos, kad galėtume atlikti kelias užklausas ---
    const agencyDoc = await adminDb.doc(`seo-agencies-private/${agencyId}`).get();
    if (!agencyDoc.exists) throw new Error("Agency not found.534");
    const members = agencyDoc.data()?.members || {};
    if (!members[requestingUser.uid]) {
      throw new Error("You don't have permission.");
    }
    
    const clientRef = adminDb.doc(`clients/${clientId}`);
    const clientDoc = await clientRef.get();
    if (!clientDoc.exists || clientDoc.data()?.agencyId !== agencyId) {
        throw new Error("Client not found or doesn't belong to this agency.");
    }
    
    const batch = adminDb.batch();

    // 1. Randame ir pridedame visus kliento projektus ištrynimui
    const projectsQuery = adminDb.collection('projects').where('clientId', '==', clientId);
    const projectsSnap = await projectsQuery.get();
    projectsSnap.forEach(doc => batch.delete(doc.ref));

    // 2. Randame ir pridedame visus kliento dokumentus ištrynimui
    const documentsQuery = adminDb.collection('documents').where('clientId', '==', clientId);
    const documentsSnap = await documentsQuery.get();
    documentsSnap.forEach(doc => batch.delete(doc.ref));
    
    // 3. Randame ir pridedame visus kliento 'schedules' ištrynimui
    const schedulesQuery = adminDb.collection('schedules').where('clientId', '==', clientId);
    const schedulesSnap = await schedulesQuery.get();
    schedulesSnap.forEach(doc => batch.delete(doc.ref));

    // 4. Pridedame patį klientą ištrynimui
    batch.delete(clientRef);

    // 5. Vykdome visus ištrynimus vienu ypu
    await batch.commit();
    // --- PAKEITIMO PABAIGA ---

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete client error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// src/app/api/agency/update-client/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const updateClientSchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
  clientId: z.string(),
  clientData: z.object({
    name: z.string().min(1, "Client name is required"),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    status: z.enum(['active', 'inactive', 'pending']),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId, clientId, clientData } = updateClientSchema.parse(body);

    const requestingUser = await adminAuth.verifyIdToken(idToken);
    const clientRef = adminDb.doc(`clients/${clientId}`);
    const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);

    await adminDb.runTransaction(async (transaction) => {
      const agencyDoc = await transaction.get(agencyRef);
      if (!agencyDoc.exists) throw new Error("Agency not found.40");

      // Saugumo patikra: ar vartotojas priklauso šiai agentūrai?
      const members = agencyDoc.data()?.members || {};
      if (!members[requestingUser.uid]) {
        throw new Error("You don't have permission to update clients in this agency.");
      }

      const clientDoc = await transaction.get(clientRef);
      if (!clientDoc.exists) throw new Error("Client not found.");

      const existingClient = clientDoc.data() as { agencyId?: string };
      
      // Patikriname, ar klientas priklauso šiai agentūrai
      if (existingClient.agencyId !== agencyId) {
        throw new Error("This client does not belong to this agency.");
      }

      // Atnaujiname kliento duomenis
      const updatedData = {
        ...existingClient,
        ...clientData,
        updatedAt: new Date().toISOString(),
        updatedBy: requestingUser.uid
      };

      transaction.update(clientRef, updatedData);
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update client error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

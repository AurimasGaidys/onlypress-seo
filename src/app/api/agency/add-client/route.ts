// src/app/api/agency/add-client/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { logAudit } from '@/lib/auditLogger';
// --- PRIDĖK ŠĮ IMPORTĄ ---
import { findOrCreateFolder } from '@/lib/folder-helpers';

const addClientSchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
  clientData: z.object({
    name: z.string().min(1, "Client name is required"),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    status: z.enum(['active', 'inactive', 'pending']).default('active'),
    createdAt: z.string()
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId, clientData } = addClientSchema.parse(body);

    const requestingUser = await adminAuth.verifyIdToken(idToken);
    
    // --- PRADĖK PAKEITIMĄ ČIA: Pašaliname transakciją, kad būtų paprasčiau ---
    // Saugumo patikra: ar vartotojas yra agentūros narys?
    const agencyDoc = await adminDb.doc(`seo-agencies-private/${agencyId}`).get();
    if (!agencyDoc.exists) throw new Error("Agency not found.3452");
    const members = agencyDoc.data()?.members || {};
    if (!members[requestingUser.uid]) {
      throw new Error("You don't have permission to add clients to this agency.");
    }
    
    // Sukuriame naują kliento dokumentą
    const newClientRef = adminDb.collection('clients').doc();
    await newClientRef.set({
      ...clientData,
      agencyId,
      id: newClientRef.id // Išsaugome ID pačiame dokumente
    });

    // Iškart po kliento sukūrimo, sukuriame jam aplanką
    await findOrCreateFolder(
      adminDb,
      agencyId,
      clientData.name,
      null, // parentId yra null, nes tai pagrindinis kliento aplankas
      requestingUser.uid
    );
    // --- PAKEITIMO PABAIGA ---

    // Log audit entry
    await logAudit({
      agencyId,
      userId: requestingUser.uid,
      userEmail: requestingUser.email || 'Unknown',
      action: 'client_created',
      details: { clientName: clientData.name },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Add client error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// src/app/api/agency/projects/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { logAudit } from '@/lib/auditLogger';
import { FieldValue } from 'firebase-admin/firestore';
// --- PRADĖKITE PAKEITIMĄ ČIA ---
import { findOrCreateFolder } from '@/lib/folder-helpers';
// --- PAKEITIMO PABAIGA ---

const createProjectSchema = z.object({
  idToken: z.string(),
  agencyId: z.string(),
  clientId: z.string(),
  name: z.string().min(3, "Project name must be at least 3 characters long"),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, agencyId, clientId, name, websiteUrl } = createProjectSchema.parse(body);

    // Verify user token
    const requestingUser = await adminAuth.verifyIdToken(idToken);
    if (!requestingUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);
    const clientRef = adminDb.doc(`clients/${clientId}`);

    await adminDb.runTransaction(async (transaction) => {
      // Verify agency exists and user is a member
      const agencyDoc = await transaction.get(agencyRef);
      if (!agencyDoc.exists) {
        throw new Error("Agency not found.53453");
      }

      const agencyData = agencyDoc.data();
      if (!agencyData?.members || !agencyData.members[requestingUser.uid]) {
        throw new Error("You don't have permission to create projects for this agency.");
      }

      // Verify client exists and belongs to this agency
      const clientDoc = await transaction.get(clientRef);
      if (!clientDoc.exists) {
        throw new Error("Client not found.");
      }

      const clientData = clientDoc.data();
      if (clientData?.agencyId !== agencyId) {
        throw new Error("Client does not belong to this agency.");
      }

      // --- PRADĖKITE PAKEITIMĄ ČIA ---
      // 1. Randame (arba sukuriame) tėvinį kliento aplanką
      const clientFolderId = await findOrCreateFolder(
        adminDb,
        agencyId,
        clientData.name,
        null,
        requestingUser.uid
      );

      // 2. Sukuriame projektą
      const newProjectRef = adminDb.collection('projects').doc();
      transaction.set(newProjectRef, {
        name,
        websiteUrl: websiteUrl || '',
        clientId,
        agencyId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 3. Sukuriame projekto sub-aplanką kliento aplanko viduje
      await findOrCreateFolder(
        adminDb,
        agencyId,
        name, // Projekto pavadinimas
        clientFolderId, // Nurodome tėvinį aplanką
        requestingUser.uid
      );
      // --- PAKEITIMO PABAIGA ---
    });

    // Log audit entry
    await logAudit({
      agencyId,
      userId: requestingUser.uid,
      userEmail: requestingUser.email || 'Unknown',
      action: 'project_created',
      details: { projectName: name, clientId },
    });

    return NextResponse.json({ 
      success: true,
      message: "Project created successfully"
    });

  } catch (error) {
    console.error('Error creating project:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid input data", 
        details: error.issues 
      }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

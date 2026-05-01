import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const updateProjectSchema = z.object({
  idToken: z.string().min(1, "Authentication token is required"),
  projectId: z.string().min(1, "Project ID is required"),
  agencyId: z.string().min(1, "Agency ID is required"),
  name: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters"),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, projectId, agencyId, name, websiteUrl } = updateProjectSchema.parse(body);

    // Verify user token
    const requestingUser = await adminAuth.verifyIdToken(idToken);
    const agencyRef = adminDb.doc(`agencseo-agencies-privateies/${agencyId}`);

    await adminDb.runTransaction(async (transaction) => {
      // Check if agency exists and user is a member
      const agencyDoc = await transaction.get(agencyRef);
      if (!agencyDoc.exists) {
        throw new Error("Agency not found.4");
      }

      const members = agencyDoc.data()?.members || {};
      if (!members[requestingUser.uid]) {
        throw new Error("You don't have permission to update projects for this agency.");
      }

      // Check if project exists and belongs to this agency
      const projectRef = adminDb.doc(`projects/${projectId}`);
      const projectDoc = await transaction.get(projectRef);
      
      if (!projectDoc.exists) {
        throw new Error("Project not found.");
      }

      const projectData = projectDoc.data();
      if (projectData?.agencyId !== agencyId) {
        throw new Error("Project does not belong to this agency.");
      }

      // Update the project
      transaction.update(projectRef, {
        name,
        websiteUrl: websiteUrl || '',
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Project update error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.issues }, { status: 400 });
    }
    
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

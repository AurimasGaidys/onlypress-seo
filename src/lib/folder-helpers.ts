// src/lib/folder-helpers.ts
import { adminDb } from './firebase-admin';
import { FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * Randa aplanką pagal nurodytus parametrus.
 * @returns Aplanko ID arba null, jei nerastas.
 */
async function findFolder(db: Firestore, agencyId: string, name: string, parentId: string | null): Promise<string | null> {
    const foldersRef = db.collection('folders');
    const q = foldersRef
        .where('agencyId', '==', agencyId)
        .where('name', '==', name)
        .where('parentId', '==', parentId)
        .limit(1);

    const snapshot = await q.get();
    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }
    return null;
}

/**
 * Sukuria naują aplanką.
 * @returns Naujo aplanko ID.
 */
async function createFolder(db: Firestore, agencyId: string, name: string, parentId: string | null, userId: string): Promise<string> {
    const newFolderRef = db.collection('folders').doc();
    await newFolderRef.set({
        name,
        agencyId,
        parentId,
        userId, // Išsaugome, kas sukūrė
        createdAt: FieldValue.serverTimestamp(),
    });
    return newFolderRef.id;
}

/**
 * Randa aplanką arba sukuria, jei neranda. Pagrindinė funkcija, kurią naudosime.
 * @returns Aplanko ID.
 */
export async function findOrCreateFolder(db: Firestore, agencyId: string, name: string, parentId: string | null, userId: string): Promise<string> {
    const existingFolderId = await findFolder(db, agencyId, name, parentId);
    if (existingFolderId) {
        return existingFolderId;
    }
    return await createFolder(db, agencyId, name, parentId, userId);
}

/**
 * Nustato teisingą folderId naujai kuriamam dokumentui.
 * @returns Aplanko ID arba null.
 */
export async function getFolderIdForDocument(agencyId: string, clientId: string | null, projectId: string | null): Promise<string | null> {
    if (!projectId && !clientId) {
        return null; // Asmeninis dokumentas be priskyrimo
    }

    try {
        // 1. Randame kliento aplanką
        const clientSnap = await adminDb.doc(`clients/${clientId}`).get();
        if (!clientSnap.exists) return null;
        const clientName = clientSnap.data()?.name;
        const clientFolderId = await findFolder(adminDb, agencyId, clientName, null);
        if (!clientFolderId) return null; // Jei kažkodėl kliento aplankas neegzistuoja

        // 2. Jei yra projectId, ieškome projekto aplanko viduje kliento aplanko
        if (projectId) {
            const projectSnap = await adminDb.doc(`projects/${projectId}`).get();
            if (!projectSnap.exists) return clientFolderId; // Fallback į kliento aplanką
            const projectName = projectSnap.data()?.name;
            const projectFolderId = await findFolder(adminDb, agencyId, projectName, clientFolderId);
            return projectFolderId || clientFolderId; // Grąžiname projekto aplanką arba kliento, jei projekto neradom
        }

        // 3. Jei nėra projectId, grąžiname kliento aplanko ID
        return clientFolderId;
    } catch (error) {
        console.error("Error finding folder ID for document:", error);
        return null;
    }
}

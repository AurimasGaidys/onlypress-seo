// src/lib/folder-utils.ts
import { FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * Finds a folder by name for a specific user, or creates it if it doesn't exist.
 * Searches only in the root directory (parentId is null).
 * @param db - The Firestore admin instance.
 * @param userId - The ID of the user who owns the folder.
 * @param folderName - The name of the folder to find or create.
 * @returns The ID of the found or newly created folder.
 */
export async function findOrCreateFolderByName(
  db: Firestore,
  userId: string,
  folderName: string
): Promise<string> {
  const foldersRef = db.collection('folders');

  // 1. Ieškome aplanko pagal pavadinimą ir vartotojo ID pagrindiniame kataloge (NAUDOJANT ADMIN SDK SINTAKSĘ)
  const q = foldersRef
    .where('userId', '==', userId)
    .where('name', '==', folderName)
    .where('parentId', '==', null)
    .limit(1);

  const snapshot = await q.get();

  // 2. Jei aplankas rastas, grąžiname jo ID
  if (!snapshot.empty) {
    const folderId = snapshot.docs[0].id;
    console.log(`Found existing folder "${folderName}" with ID: ${folderId}`);
    return folderId;
  }

  // 3. Jei aplankas nerastas, sukuriame naują (NAUDOJANT ADMIN SDK SINTAKSĘ)
  console.log(`Folder "${folderName}" not found. Creating a new one...`);
  const newFolderData = {
    name: folderName,
    userId: userId,
    parentId: null,
    createdAt: FieldValue.serverTimestamp(),
  };

  const newFolderRef = await foldersRef.add(newFolderData);
  console.log(`Created new folder "${folderName}" with ID: ${newFolderRef.id}`);
  return newFolderRef.id;
}

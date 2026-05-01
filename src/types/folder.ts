// src/types/folder.ts
import { Timestamp } from "firebase/firestore";

export interface Folder {
  id: string;
  name: string;
  userId: string;
  parentId: string | null; // Null means the root folder
  createdAt: Timestamp;
}

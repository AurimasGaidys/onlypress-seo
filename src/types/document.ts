// src/types/document.ts
import { Timestamp } from "firebase/firestore";

export interface ArticleDocument {
  id: string; // The Firestore document ID
  userId: string; // ID of the user who owns this document
  title: string;
  content: string; // The full content of the document (HTML or JSON)
  snippet: string; // A short text-only snippet for the card view
  lastEdited: Timestamp; // Firestore timestamp for sorting and display
  promptData?: {
    topic?: string;
    tone?: string;
    audience?: string;
    keywords?: string[]; // canonical keywords used by the wizard and saved as an array
  };
}

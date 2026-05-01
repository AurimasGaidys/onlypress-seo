import { Timestamp } from 'firebase/firestore';

export interface ScheduledItem {
  id: string;
  documentId: string;
  agencyId: string;
  clientId: string | null;
  projectId: string | null; // Add projectId for project-based scheduling
  portalId: string | null; // Add portalId for portal-based scheduling
  scheduledAt: string | Timestamp; // Support both string and Timestamp
  status: string;
  targetPlatforms: string[];
  createdAt: string;
  createdBy: string;
}

export interface SchedulerNote {
  id: string;          // Firestore dokumento ID
  agencyId: string;      // Agentūros ID
  projectId: string;     // Projekto ID, kuriam priklauso priminimas
  day: string;           // Dienos data formatu 'YYYY-MM-DD'
  content: string;       // Priminimo tekstas
  createdBy: string;     // Vartotojo ID, kuris sukūrė
  lastEditedBy: string;  // Vartotojo ID, kuris paskutinis redagavo
  createdAt: Timestamp;
  lastEditedAt: Timestamp;
}

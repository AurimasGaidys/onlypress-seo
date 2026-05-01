// src/types/agentic-generation.ts
export type AgentName = 'Strategos' | 'Scriptor' | 'System' | 'User';

export interface AgentMessage {
  agent: AgentName;
  content: string;
  timestamp: Date;
  thinkingTime?: number; // Pauzės trukmė (ms) prieš šią žinutę
  actions?: Array<{ label: string; value: string }>; // Mygtukai vartotojui
}

export type SessionStatus =
  | 'initializing'
  | 'titles_generating'
  | 'awaiting_title_selection'
  | 'planning'
  | 'writing'
  | 'reviewing'
  | 'image_planning'
  | 'image_generating'
  | 'meta_generating'
  | 'done'
  | 'error';

export interface AgenticSession {
  id: string;
  userId: string;
  agencyId: string | null;
  status: SessionStatus;
  topic: string;
  generatedTitles?: string[];
  selectedTitle?: string;
  fullArticleHtml?: string;
  chatHistory: AgentMessage[];
  currentStep?: string;
  seoPlan?: {
    fullPlan: string;
  };
  metaData?: {
    metaTitle?: string;
    metaDescription?: string;
    imageAlts?: Record<string, string>;
  };
  // Ateityje bus daugiau laukų, bet pradžiai užtenka šių
  createdAt: Date;
  updatedAt: Date;
}

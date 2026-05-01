import { Blueprint } from './blueprint';

export type ConversationRole = 'user' | 'assistant' | 'system';

export type ConversationIntent =
  | 'PROVIDE_INFO'
  | 'REQUEST_GENERATION'
  | 'FINISH_GATHERING'
  | 'CONFIRM_STRUCTURE'
  | 'REVISE_STRUCTURE'
  | 'REQUEST_UNDO'
  | 'ACCEPT_CHANGES'
  | 'REJECT_CHANGES'
  | 'REQUEST_TOOLS'
  | 'COMPLETE_DOCUMENT'
  | 'UNKNOWN';

export type EditorIntent =
  | 'REWRITE_SECTION'        // Perrašyti nurodytą dalį (pvz., pastraipą, sakinį)
  | 'SHORTEN_SECTION'        // Sutrumpinti nurodytą dalį
  | 'EXPAND_SECTION'         // Išplėsti nurodytą dalį
  | 'FIX_GRAMMAR'            // Ištaisyti gramatiką pažymėtame tekste
  | 'ADD_SECTION'            // Pridėti naują skiltį/pastraipą pagal aprašymą
  | 'REMOVE_SECTION'         // Pašalinti nurodytą skiltį/pastraipą
  | 'CHANGE_TONE'            // Pakeisti teksto toną (pvz., į formalesnį)
  | 'FIND_AND_REPLACE'       // Rasti ir pakeisti tekstą
  | 'RUN_SEO_ANALYSIS'       // Įvykdyti SEO analizę
  | 'RUN_PORTAL_CHECK'       // Įvykdyti portalų suderinamumo patikrą
  | 'REORDER_SECTIONS'       // Pertvarkyti sekcijų tvarką
  | 'FACT_CHECK'             // Patikrinti faktus tekste
  | 'READABILITY_ANALYSIS'   // Įvykdyti skaitomumo analizę
  | 'FORMAT_CONSISTENCY'     // Patikrinti formato nuoseklumą
  | 'CREATE_TABLE_OF_CONTENTS' // Sukurti turinio lentelę
  | 'REQUEST_ANALYSIS'       // Kai vartotojas prašo analizės ar patarimų apie straipsnį
  | 'GENERAL_CHAT'           // Kai komanda yra bendrinio pobūdžio pokalbis
  | 'UNKNOWN';               // Kai intencijos nepavyksta nustatyti

export interface ConversationAction {
  label: string;
  value?: string;
  intent?: ConversationIntent;
}

export type ConversationTimestamp =
  | Date
  | string
  | number
  | null
  | undefined
  | {
      seconds: number;
      nanoseconds: number;
    };

export interface ConversationMessage {
  id?: string;
  role: ConversationRole;
  content: string;
  actions?: ConversationAction[] | null;
  intent?: ConversationIntent;
  timestamp?: ConversationTimestamp;
  withTypingEffect?: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    mimeType?: string;
    size?: number;
  }>;
}

export type ConversationPhase =
  | 'GREETING'
  | 'ARTICLE_TYPE_SELECTION'
  | 'INFORMATION_GATHERING'
  | 'DATA_AUDIT'
  | 'ANGLE_PROPOSAL'
  | 'STRUCTURE_PROPOSAL'
  | 'DRAFT_GENERATION'
  | 'INTERACTIVE_REFINEMENT'
  | 'POST_DRAFT_TOOLS'
  | 'COMPLETED';

export const CONVERSATION_PHASES: ConversationPhase[] = [
  'GREETING',
  'ARTICLE_TYPE_SELECTION',
  'INFORMATION_GATHERING',
  'DATA_AUDIT',
  'ANGLE_PROPOSAL',
  'STRUCTURE_PROPOSAL',
  'DRAFT_GENERATION',
  'INTERACTIVE_REFINEMENT',
  'POST_DRAFT_TOOLS',
  'COMPLETED',
];

export interface ConversationMetadata {
  chatPhase: ConversationPhase;
  blueprint: Blueprint;
  lastUpdatedAt?: ConversationTimestamp;
  lastIntent?: ConversationIntent;
  lastActionLabel?: string;
  lastGeneratedStructure?: string;
  lastGeneratedDraftId?: string;
}

export const DEFAULT_CONVERSATION_METADATA: ConversationMetadata = {
  chatPhase: 'GREETING',
  blueprint: {},
};

export interface ConversationState {
  metadata: ConversationMetadata;
  messages: ConversationMessage[];
}

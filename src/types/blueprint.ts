export type BlueprintStatus = 'draft' | 'in_review' | 'final';

export interface BlueprintSource {
  name?: string;
  url?: string;
  note?: string;
  type?: 'primary' | 'secondary' | 'expert' | 'official' | 'other';
}

export interface BlueprintAudienceSegment {
  label: string;
  needs?: string;
  painPoints?: string;
}

export interface Blueprint {
  topic?: string;
  workingTitle?: string;
  type?: string;
  angle?: string;
  summary?: string;
  audience?: string;
  audienceSegments?: BlueprintAudienceSegment[];
  objectives?: string[];
  successMetrics?: string[];
  keyPoints?: string[];
  keywords?: string[];
  voiceAndTone?: string;
  callToAction?: string;
  targetPublication?: string;
  distributionChannels?: string[];
  factCheckNotes?: string;
  primarySources?: BlueprintSource[];
  supportingSources?: BlueprintSource[];
  deadline?: string;
  status?: BlueprintStatus;
  lastUpdatedBy?: string;
  isJournalistChat?: boolean; // Flag for general conversational AI in journalist chat
  customAttributes?: Record<string, string | string[] | number | boolean | null>;
}

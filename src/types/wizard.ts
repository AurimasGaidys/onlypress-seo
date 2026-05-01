// src/types/wizard.ts
export interface WizardFormData {
  topic: string;
  selectedTitle: string;
  keywords: string[];
  articleConfig: {
    length: 'short' | 'medium' | 'long';
    tone: 'formal' | 'casual' | 'professional';
  };
  generatedArticle: string;
}

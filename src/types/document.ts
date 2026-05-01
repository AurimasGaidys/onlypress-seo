export interface ArticleDocument {
  id: string;
  userId?: string;
  title: string;
  content: string;
  snippet: string;
  lastEdited: string; // ISO string from API
  promptData?: {
    topic?: string;
    tone?: string;
    audience?: string;
    keywords?: string[];
  };
}

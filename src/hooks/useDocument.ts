'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArticleDocument } from '@/types/document';
import { api } from '@/lib/api-client';

interface ApiDoc {
  id: number;
  title: string;
  content: string;
  snippet: string;
  updated_at: string;
  prompt_data?: {
    topic?: string;
    tone?: string;
    keywords?: string[];
  };
}

function mapDoc(d: ApiDoc): ArticleDocument {
  return {
    id: String(d.id),
    title: d.title,
    content: d.content,
    snippet: d.snippet,
    lastEdited: d.updated_at,
    promptData: d.prompt_data,
  };
}

export const useDocument = (docId: string) => {
  const [document, setDocument] = useState<ArticleDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDoc = useCallback(async () => {
    try {
      const result = await api.get<{ data: ApiDoc }>(`/api/seo/documents/${docId}`);
      setDocument(mapDoc(result.data));
    } catch (err: any) {
      if (err?.status === 404) setDocument(null);
      else console.error('Failed to fetch document:', err);
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    if (!user || !docId) {
      setLoading(false);
      return;
    }
    fetchDoc();
  }, [user, docId, fetchDoc]);

  return { document, loading };
};

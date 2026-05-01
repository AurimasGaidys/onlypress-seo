'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArticleDocument } from '@/types/document';
import { api } from '@/lib/api-client';

interface ApiDoc {
  id: number;
  title: string;
  snippet: string;
  updated_at: string;
}

function mapDoc(d: ApiDoc): ArticleDocument {
  return {
    id: String(d.id),
    title: d.title,
    content: '',
    snippet: d.snippet,
    lastEdited: d.updated_at,
  };
}

export const useUserDocuments = () => {
  const [documents, setDocuments] = useState<ArticleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDocs = useCallback(async () => {
    try {
      const result = await api.get<{ data: ApiDoc[] }>('/api/seo/documents');
      setDocuments(result.data.map(mapDoc));
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    fetchDocs();
    const interval = setInterval(fetchDocs, 30_000);
    return () => clearInterval(interval);
  }, [user, fetchDocs]);

  return { documents, loading };
};

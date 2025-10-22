// src/hooks/useDocument.ts
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArticleDocument } from '@/types/document';
import { useAuth } from '@/context/AuthContext';

export const useDocument = (docId: string) => {
  const [document, setDocument] = useState<ArticleDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !docId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'documents', docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DocumentData;
        // Security check: ensure the user owns this document
        if (data.userId === user.uid) {
          setDocument(data as ArticleDocument);
        } else {
          // User is trying to access a document they don't own
          setDocument(null);
        }
      } else {
        setDocument(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [docId, user]);

  return { document, loading };
};

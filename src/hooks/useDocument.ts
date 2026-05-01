// src/hooks/useDocument.ts
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArticleDocument } from '@/types/document';
import { useAuth } from '@/context/AuthContext';
import { useUserAgencies } from './useUserAgencies';

export const useDocument = (docId: string) => {
  const [document, setDocument] = useState<ArticleDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { agencies, loading: agenciesLoading } = useUserAgencies();

  useEffect(() => {
    // Wait for both user and agencies to load
    if (!user || !docId || agenciesLoading) {
      if (!agenciesLoading) setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'documents', docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DocumentData;
        
        // --- PRADĖK PAKEITIMĄ ČIA ---
        const isOwner = data.userId === user.uid;
        const isAgencyMember = data.agencyId ? agencies.some(a => a.id === data.agencyId) : false;

        if (isOwner || isAgencyMember) {
          setDocument({ ...data, id: docSnap.id } as ArticleDocument);
        } else {
          console.error("Permission denied: User is not the owner or a member of the document's agency.");
          setDocument(null);
        }
        // --- PAKEITIMO PABAIGA ---

      } else {
        setDocument(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [docId, user, agencies, agenciesLoading]);

  return { document, loading };
};

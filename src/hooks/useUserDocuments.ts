// src/hooks/useUserDocuments.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ArticleDocument } from '@/types/document';
import { toast } from 'sonner';
import { useWorkspace } from '@/context/WorkspaceContext'; // <-- 1. Importuojame `useWorkspace`

export const useUserDocuments = (folderId?: string) => {
  const [documents, setDocuments] = useState<ArticleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { activeWorkspace, activeClientId, activeProjectId } = useWorkspace(); // <-- 2. Gauname aktyvią darbo aplinką

  // Funkcija kuri lečia rankiniškai atnaujinti duomenis
  const refetch = useCallback(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docsCollectionRef = collection(db, 'documents');
    
    // <-- 3. UNIFIKUOTA UŽKLAUSOS LOGIKA -->
    let q;

    if (activeWorkspace.type === 'agency') {
      // UŽKLAUSA AGENTŪROS APLINKAI
      q = query(
          docsCollectionRef,
          where('agencyId', '==', activeWorkspace.id),
          where('folderId', '==', folderId || null),
          orderBy('lastEdited', 'desc')
      );
    } else {
      // UŽKLAUSA PERSONAL APLINKAI - naudoja personal agency ID
      const personalAgencyId = `personal_${user.uid}`;
      q = query(
          docsCollectionRef,
          where('agencyId', '==', personalAgencyId),
          where('clientId', '==', activeClientId),
          where('projectId', '==', activeProjectId),
          where('folderId', '==', folderId || null),
          orderBy('lastEdited', 'desc')
      );
    }
    // <-- UŽKLAUSOS LOGIKOS PABAIGA -->

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userDocs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ArticleDocument));

        setDocuments(userDocs);
        setLoading(false);
    }, (error) => {
        console.error("Firestore query failed for documents:", error);
        toast.error("Database Query Error", {
            description: "A required database index is missing. Please check out browser console for a link to create it."
        });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, folderId, activeWorkspace, activeClientId, activeProjectId]);

  useEffect(() => {
    const unsubscribe = refetch();
    return unsubscribe;
  }, [refetch]);

  return { documents, loading, refetch };
};

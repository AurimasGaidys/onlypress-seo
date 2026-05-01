// src/hooks/useUserFolders.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Folder } from '@/types/folder';
import { useWorkspace } from '@/context/WorkspaceContext'; // <-- Importuojame

export const useUserFolders = (parentId?: string | null) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { activeWorkspace, activeClientId, activeProjectId } = useWorkspace(); // <-- Gauname aplinką

  // Funkcija kuri lečia rankiniškai atnaujinti duomenis
  const refetch = useCallback(() => {
    if (!user) {
      setFolders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const foldersCollectionRef = collection(db, 'folders');
    
    let q;
    if (activeWorkspace.type === 'agency') {
      q = query(
        foldersCollectionRef,
        where('agencyId', '==', activeWorkspace.id),
        where('parentId', '==', parentId === undefined ? null : parentId),
        orderBy('createdAt', 'desc')
      );
    } else {
      // PERSONAL APLINKA - naudoja personal agency ID
      const personalAgencyId = `personal_${user.uid}`;
      q = query(
        foldersCollectionRef,
        where('agencyId', '==', personalAgencyId),
        where('clientId', '==', activeClientId),
        where('projectId', '==', activeProjectId),
        where('parentId', '==', parentId === undefined ? null : parentId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userFolders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Folder));
      setFolders(userFolders);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching folders:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, parentId, activeWorkspace, activeClientId, activeProjectId]);

  useEffect(() => {
    const unsubscribe = refetch();
    return unsubscribe;
  }, [refetch]);

  return { folders, loading, refetch };
};

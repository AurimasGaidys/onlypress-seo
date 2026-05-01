// src/hooks/useFolderDocumentCounts.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface FolderDocumentCount {
  [folderId: string]: number;
}

export const useFolderDocumentCounts = (folderIds: string[]) => {
  const [documentCounts, setDocumentCounts] = useState<FolderDocumentCount>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();

  useEffect(() => {
    if (!user || folderIds.length === 0) {
      setDocumentCounts({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const docsCollectionRef = collection(db, 'documents');
    
    // Initialize counts for all folders to 0
    const initialCounts: FolderDocumentCount = {};
    folderIds.forEach(folderId => {
      initialCounts[folderId] = 0;
    });
    setDocumentCounts(initialCounts);

    // Handle Firestore's 10-item limit for 'in' queries by batching
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < folderIds.length; i += batchSize) {
      batches.push(folderIds.slice(i, i + batchSize));
    }

    const unsubscribers: (() => void)[] = [];

    batches.forEach((batchFolderIds, batchIndex) => {
      // Get agency ID based on workspace type
      const getAgencyId = () => {
        if (activeWorkspace.type === 'user') {
          return `personal_${user.uid}`;
        } else {
          return activeWorkspace.id;
        }
      };

      const agencyId = getAgencyId();

      // Query for documents
      const q = query(
        docsCollectionRef,
        where('agencyId', '==', agencyId),
        where('folderId', 'in', batchFolderIds)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setDocumentCounts(prevCounts => {
          const newCounts = { ...prevCounts };
          
          // Reset counts for this batch to 0 before recounting
          batchFolderIds.forEach(folderId => {
            newCounts[folderId] = 0;
          });
          
          // Count documents per folder in this batch
          querySnapshot.docs.forEach(doc => {
            const folderId = doc.data().folderId;
            if (folderId && newCounts[folderId] !== undefined) {
              newCounts[folderId]++;
            }
          });

          return newCounts;
        });
      }, (error) => {
        console.error(`Error fetching folder document counts (batch ${batchIndex}):`, error);
      });

      unsubscribers.push(unsubscribe);
    });

    setLoading(false);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user, folderIds, activeWorkspace]);

  return { documentCounts, loading };
};

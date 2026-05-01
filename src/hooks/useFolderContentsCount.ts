// src/hooks/useFolderContentsCount.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface FolderContentsCount {
  [folderId: string]: {
    documents: number;
    folders: number;
  };
}

export const useFolderContentsCount = (folderIds: string[]) => {
  const [contentsCount, setContentsCount] = useState<FolderContentsCount>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();

  useEffect(() => {
    if (!user || folderIds.length === 0) {
      setContentsCount({});
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Initialize counts for all folders to 0
    const initialCounts: FolderContentsCount = {};
    folderIds.forEach(folderId => {
      initialCounts[folderId] = { documents: 0, folders: 0 };
    });
    setContentsCount(initialCounts);

    // Handle Firestore's 10-item limit for 'in' queries by batching
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < folderIds.length; i += batchSize) {
      batches.push(folderIds.slice(i, i + batchSize));
    }

    const unsubscribers: (() => void)[] = [];

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
    const docsCollectionRef = collection(db, 'documents');
    batches.forEach((batchFolderIds, batchIndex) => {
      const q = query(
        docsCollectionRef,
        where('agencyId', '==', agencyId),
        where('folderId', 'in', batchFolderIds)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setContentsCount(prevCounts => {
          const newCounts = { ...prevCounts };
          
          // Reset document counts for this batch to 0 before recounting
          batchFolderIds.forEach(folderId => {
            if (newCounts[folderId]) {
              newCounts[folderId] = { ...newCounts[folderId], documents: 0 };
            } else {
              newCounts[folderId] = { documents: 0, folders: 0 };
            }
          });
          
          // Count documents per folder in this batch
          querySnapshot.docs.forEach(doc => {
            const folderId = doc.data().folderId;
            if (folderId && newCounts[folderId]) {
              newCounts[folderId].documents++;
            }
          });

          return newCounts;
        });
      }, (error) => {
        console.error(`Error fetching folder document counts (batch ${batchIndex}):`, error);
      });

      unsubscribers.push(unsubscribe);
    });

    // Query for folders
    const foldersCollectionRef = collection(db, 'folders');
    batches.forEach((batchFolderIds, batchIndex) => {
      const q = query(
        foldersCollectionRef,
        where('agencyId', '==', agencyId),
        where('parentId', 'in', batchFolderIds)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setContentsCount(prevCounts => {
          const newCounts = { ...prevCounts };
          
          // Reset folder counts for this batch to 0 before recounting
          batchFolderIds.forEach(folderId => {
            if (newCounts[folderId]) {
              newCounts[folderId] = { ...newCounts[folderId], folders: 0 };
            } else {
              newCounts[folderId] = { documents: 0, folders: 0 };
            }
          });
          
          // Count folders per folder in this batch
          querySnapshot.docs.forEach(doc => {
            const parentId = doc.data().parentId;
            if (parentId && newCounts[parentId]) {
              newCounts[parentId].folders++;
            }
          });

          return newCounts;
        });
      }, (error) => {
        console.error(`Error fetching folder folder counts (batch ${batchIndex}):`, error);
      });

      unsubscribers.push(unsubscribe);
    });

    setLoading(false);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user, folderIds, activeWorkspace]);

  return { contentsCount, loading };
};

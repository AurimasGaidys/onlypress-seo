// src/hooks/useUserDocuments.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ArticleDocument } from '@/types/document';

export const useUserDocuments = () => {
  const [documents, setDocuments] = useState<ArticleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docsCollectionRef = collection(db, 'documents');
    const q = query(
      docsCollectionRef,
      where('userId', '==', user.uid),
      orderBy('lastEdited', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userDocs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ArticleDocument));
      setDocuments(userDocs);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  return { documents, loading };
};

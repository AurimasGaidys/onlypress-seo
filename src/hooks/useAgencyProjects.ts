// src/hooks/useAgencyProjects.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  clientId: string;
  agencyId: string;
  createdAt: { toDate: () => Date };
}

export const useAgencyProjects = (agencyId: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agencyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const projectsQuery = query(
      collection(db, 'projects'), 
      where('agencyId', '==', agencyId)
    );
    
    const unsubscribe = onSnapshot(
      projectsQuery, 
      (querySnap) => {
        const projectData = querySnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Project));
        setProjects(projectData);
        setLoading(false);
      }, 
      (err) => {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [agencyId]);

  return { projects, loading, error };
};

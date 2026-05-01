// src/hooks/useClientData.ts
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// Apibrėžiame tipus
interface Client { 
  id: string; 
  name: string; 
  agencyId: string; 
  email?: string;
  phone?: string;
  website?: string;
  status?: 'active' | 'inactive' | 'pending';
  createdAt?: string;
}

interface Project { 
  id: string; 
  name: string; 
  websiteUrl?: string;
  clientId: string;
  agencyId: string;
  createdAt?: Date;
}

interface Document { 
  id: string; 
  title: string; 
  clientId?: string;
  projectId?: string;
  createdAt?: Date;
}

export const useClientData = (agencyId: string, clientId: string) => {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !agencyId || !clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const clientRef = doc(db, 'clients', clientId);

    // 1. Klausomės kliento duomenų
    const unsubscribeClient = onSnapshot(clientRef, (docSnap) => {
      if (docSnap.exists()) {
        const clientData = { id: docSnap.id, ...docSnap.data() } as Client;
        // Saugumo patikra
        if (clientData.agencyId !== agencyId) {
          setError("Client does not belong to this agency.");
          setClient(null);
          setLoading(false);
          return;
        }
        setClient(clientData);
      } else {
        setError("Client not found.");
        setClient(null);
      }
      setLoading(false);
    }, (err) => {
      setError("Failed to load client data.");
      console.error('Error fetching client:', err);
      setLoading(false);
    });

    // 2. Klausomės projektų duomenų
    const projectsQuery = query(collection(db, 'projects'), where('clientId', '==', clientId));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snap) => {
      const projectsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      setProjects(projectsData);
    }, (err) => {
      console.error('Error fetching projects:', err);
    });

    // 3. Klausomės dokumentų duomenų
    const docsQuery = query(collection(db, 'documents'), where('clientId', '==', clientId));
    const unsubscribeDocs = onSnapshot(docsQuery, (snap) => {
      const documentsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Document));
      setDocuments(documentsData);
    }, (err) => {
      console.error('Error fetching documents:', err);
    });

    return () => {
      unsubscribeClient();
      unsubscribeProjects();
      unsubscribeDocs();
    };
  }, [agencyId, clientId, user]);

  return { client, projects, documents, loading, error };
};

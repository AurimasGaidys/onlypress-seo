// src/hooks/useAgencyClients.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Client { 
  id: string; 
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  status: 'active' | 'inactive' | 'pending';
  agencyId: string;
  createdAt: string;
}

export const useAgencyClients = (agencyId: string) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agencyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const clientsQuery = query(
      collection(db, 'clients'), 
      where('agencyId', '==', agencyId)
    );
    
    const unsubscribe = onSnapshot(
      clientsQuery, 
      (querySnap) => {
        const clientData = querySnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Client));
        setClients(clientData);
        setLoading(false);
      }, 
      (err) => {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [agencyId]);

  return { clients, loading, error };
};

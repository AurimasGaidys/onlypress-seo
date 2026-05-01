// src/hooks/useClientInfo.ts
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Client {
  id: string;
  name: string;
}

export const useClientInfo = (clientId?: string) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setClient(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const clientRef = doc(db, 'clients', clientId);

    const unsubscribe = onSnapshot(clientRef, (docSnap) => {
      if (docSnap.exists()) {
        setClient({ id: docSnap.id, ...docSnap.data() } as Client);
        setError(null);
      } else {
        setClient(null);
        setError("Client not found");
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching client:", err);
      setError("Failed to fetch client");
      setClient(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  return { client, loading, error };
};

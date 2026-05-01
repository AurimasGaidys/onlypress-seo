// src/hooks/useAgencyInfo.ts
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { DatabaseTables } from '@/lib/constants/databaseTables';
import { AgencyPrivate } from '@/types/agencyPrivate';


export const useAgencyInfo = (agencyId: string) => {
  const { user } = useAuth();
  const [agency, setAgency] = useState<AgencyPrivate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !agencyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const agencyRef = doc(db, DatabaseTables.agencyPrivate, agencyId);

    const unsubscribe = onSnapshot(agencyRef, (docSnap) => {
      if (docSnap.exists()) {
        const agencyData = { id: docSnap.id, ...docSnap.data() } as AgencyPrivate;
        
        // Saugumo patikra: ar vartotojas priklauso šiai agentūrai?
        if (!agencyData.members || !agencyData.members[user.uid]) {
          setError("You do not have permission to view this agency.");
          setAgency(null);
        } else {
          setAgency(agencyData);
        }
      } else {
        setError("Agency not found.543534");
        setAgency(null);
      }
      setLoading(false);
    }, (err) => {
      setError("Failed to load agency data.");
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [agencyId, user?.uid]);

  return { agency, loading, error };
};

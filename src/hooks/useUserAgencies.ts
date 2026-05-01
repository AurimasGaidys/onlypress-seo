// src/hooks/useUserAgencies.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, doc, query, where, onSnapshot, documentId } from 'firebase/firestore'; // Pakeitėme getDoc ir getDocs į onSnapshot
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Agency } from '@/types/agency';
import { DatabaseTables } from '@/lib/constants/databaseTables';


export const useUserAgencies = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setAgencies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribeUser: () => void = () => {};
    let unsubscribeAgencies: () => void = () => {};

    // 1. Sukuriame realaus laiko klausytoją vartotojo dokumentui
    const userDocRef = doc(db, 'users', user.uid);
    unsubscribeUser = onSnapshot(userDocRef, (userDocSnap) => {
      // Jei agentūrų klausytojas jau veikia, atjungiame jį prieš paleidžiant naują
      if (unsubscribeAgencies) unsubscribeAgencies();
      
      if (!userDocSnap.exists() || !userDocSnap.data()?.agencies) {
        setAgencies([]);
        setLoading(false);
        return;
      }

      const agencyMap = userDocSnap.data().agencies as Record<string, string>;
      const agencyIds = Object.keys(agencyMap);

      if (agencyIds.length === 0) {
        setAgencies([]);
        setLoading(false);
        return;
      }

      // 2. Sukuriame realaus laiko klausytoją agentūrų dokumentams
      const agenciesRef = collection(db, DatabaseTables.agency);
      const q = query(agenciesRef, where(documentId(), 'in', agencyIds));
      
      unsubscribeAgencies = onSnapshot(q, (agenciesSnapshot) => {
        const userAgencies = agenciesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Agency));
        
        setAgencies(userAgencies);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user agencies:", error);
        setAgencies([]);
        setLoading(false);
      });

    }, (error) => {
      console.error("Error fetching user data:", error);
      setAgencies([]);
      setLoading(false);
    });

    // 3. Valymo funkcija, kuri atjungs abu klausytojus, kai komponentas bus sunaikintas
    return () => {
      unsubscribeUser();
      unsubscribeAgencies();
    };
  }, [user]);

  return { agencies, loading };
};

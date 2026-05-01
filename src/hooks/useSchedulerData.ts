// src/hooks/useSchedulerData.ts
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react'; // Pridėk useCallback
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { ScheduledItem } from '@/components/agency/scheduler/types';
import { ArticleDocument } from '@/types/document';

export function useSchedulerData(agencyId: string, clientId: string, currentMonth: Date) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduledItem[]>([]);
  const [documentsMap, setDocumentsMap] = useState<Map<string, ArticleDocument>>(new Map());
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- PRADĖK PAKEITIMĄ ČIA (1/2): Pridėdame trigger būseną ---
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);
  // --- PAKEITIMO PABAIGA ---

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, ScheduledItem[]>();
    schedules.forEach(item => {
      try {
        // Apsauga nuo negaliojančių datos reikšmių
        if (!item.scheduledAt) {
          console.warn('Schedule item missing scheduledAt:', item.id);
          return;
        }
        
        // Teisingai apdorojame Firebase Timestamp
        let scheduledDate: Date;
        if (typeof item.scheduledAt === 'object' && 'toDate' in item.scheduledAt) {
          // Firebase Timestamp objektas
          scheduledDate = item.scheduledAt.toDate();
        } else if (typeof item.scheduledAt === 'string') {
          // String formatas
          scheduledDate = new Date(item.scheduledAt);
        } else {
          // Nežinomas formatas arba jau Date objektas
          try {
            scheduledDate = new Date(item.scheduledAt as any);
          } catch {
            console.warn('Unknown scheduledAt format for item:', item.id, item.scheduledAt);
            return;
          }
        }
        
        // Tikriname, ar data yra galiojanti
        if (isNaN(scheduledDate.getTime())) {
          console.warn('Invalid scheduledAt date for item:', item.id, item.scheduledAt);
          return;
        }
        
        const dayKey = format(scheduledDate, 'yyyy-MM-dd');
        const existing = map.get(dayKey) || [];
        map.set(dayKey, [...existing, item]);
      } catch (error) {
        console.error('Error processing schedule item:', item.id, error);
      }
    });
    return map;
  }, [schedules]);

  // --- PRADĖK PAKEITIMĄ ČIA (2/2): Pridėdame trigger į priklausomybes ---
  useEffect(() => {
    if (!user || !agencyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 1. Sukuriame realaus laiko klausytoją klientams gauti.
    const clientsQuery = query(collection(db, 'clients'), where('agencyId', '==', agencyId));
    const unsubscribeClients = onSnapshot(clientsQuery, (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as {id: string, name: string})));
      // NENUIMAME isLoading čia, laukiame kol pasikraus ir schedules
    }, (error) => {
        console.error("Error fetching clients:", error);
        setIsLoading(false);
    });

    // 2. Sukuriame realaus laiko klausytoją suplanuotiems įrašams gauti.
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('agencyId', '==', agencyId),
      where('scheduledAt', '>=', monthStart),
      where('scheduledAt', '<=', monthEnd),
      ...(clientId && clientId !== 'all' ? [where('clientId', '==', clientId)] : [])
    );

    const unsubscribeSchedules = onSnapshot(schedulesQuery, async (snapshot) => {
      const fetchedSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ScheduledItem);
      setSchedules(fetchedSchedules);

      const docIds = [...new Set(fetchedSchedules.map(s => s.documentId))];

      // 3. Gauname susijusius dokumentus per API, išsprendžiant 'in' limitą
      if (docIds.length > 0) {
        try {
          const response = await fetch('/api/agency/documents-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentIds: docIds }),
          });
          const { documents } = await response.json();
          const newMap = new Map<string, ArticleDocument>();
          documents.forEach((doc: ArticleDocument) => newMap.set(doc.id, doc));
          setDocumentsMap(newMap);
        } catch (error) {
          console.error("Failed to fetch documents batch", error);
          setDocumentsMap(new Map()); // Išvalome map'ą klaidos atveju
        }
      } else {
        setDocumentsMap(new Map());
      }
      setIsLoading(false); // Nustatome krovimą į 'false' TIK po visų duomenų gavimo
    }, (error) => {
        console.error("Error fetching schedules:", error);
        setIsLoading(false);
    });

    // 4. Cleanup funkcija, kuri atjungs abu klausytojus
    return () => {
      unsubscribeSchedules();
      unsubscribeClients();
    };
  }, [user, agencyId, clientId, currentMonth, refetchTrigger]); // Pridėdame refetchTrigger
  // --- PAKEITIMO PABAIGA ---

  return { schedules, documentsMap, clients, isLoading, schedulesByDay, refetch }; // Grąžiname refetch
}

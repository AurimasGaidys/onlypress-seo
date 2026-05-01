// src/hooks/useSchedulerDataByProject.ts
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { ScheduledItem } from '@/components/agency/scheduler/types';
import { ArticleDocument } from '@/types/document';

export function useSchedulerDataByProject(agencyId: string, projectId: string | null, currentMonth: Date) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduledItem[]>([]);
  const [documentsMap, setDocumentsMap] = useState<Map<string, ArticleDocument>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, ScheduledItem[]>();
    schedules.forEach(item => {
      // Patikriname ar scheduledAt egzistuoja ir yra galiojantis datas
      if (!item.scheduledAt) {
        console.warn('Schedule item missing scheduledAt:', item);
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
      } else if (item.scheduledAt instanceof Date) {
        // Jau yra Date objektas
        scheduledDate = item.scheduledAt;
      } else {
        // Nežinomas formatas
        console.warn('Unknown scheduledAt format:', item.scheduledAt, item);
        return;
      }
      
      // Patikriname ar data yra galiojanti
      if (isNaN(scheduledDate.getTime())) {
        console.warn('Invalid scheduledAt date:', item.scheduledAt, item);
        return;
      }
      
      const dayKey = format(scheduledDate, 'yyyy-MM-dd');
      const existing = map.get(dayKey) || [];
      map.set(dayKey, [...existing, item]);
    });
    return map;
  }, [schedules]);

  useEffect(() => {
    if (!user || !agencyId || !projectId) { // Tikriname ar yra projectId
      setSchedules([]);
      setDocumentsMap(new Map());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // --- PRADĖK PAKEITIMĄ ČIA: Filtruojame pagal projectId ---
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('agencyId', '==', agencyId),
      where('projectId', '==', projectId), // Svarbiausias pakeitimas!
      where('scheduledAt', '>=', monthStart),
      where('scheduledAt', '<=', monthEnd)
    );
    // --- PAKEITIMO PABAIGA ---

    const unsubscribeSchedules = onSnapshot(schedulesQuery, async (snapshot) => {
      const fetchedSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ScheduledItem);
      setSchedules(fetchedSchedules);

      const docIds = [...new Set(fetchedSchedules.map(s => s.documentId))];
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
        }
      } else {
        setDocumentsMap(new Map());
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching schedules:", error);
      setIsLoading(false);
    });

    return () => unsubscribeSchedules();
  }, [user, agencyId, projectId, currentMonth, refetchTrigger]);

  return { schedules, documentsMap, isLoading, schedulesByDay, refetch };
}

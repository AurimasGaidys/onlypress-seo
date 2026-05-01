// src/hooks/useSchedulerNotes.ts
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { SchedulerNote } from '@/components/agency/scheduler/types';

export function useSchedulerNotes(agencyId: string, projectId: string | null, currentMonth: Date) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<SchedulerNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  const notesByDay = useMemo(() => {
    const map = new Map<string, SchedulerNote>();
    notes.forEach(note => {
      map.set(note.day, note);
    });
    return map;
  }, [notes]);

  useEffect(() => {
    if (!user || !agencyId || !projectId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Calculate date range for the current month (and a bit more to be safe)
    const startDate = format(monthStart, 'yyyy-MM-dd');
    const endDate = format(monthEnd, 'yyyy-MM-dd');

    const notesQuery = query(
      collection(db, 'schedulerNotes'),
      where('agencyId', '==', agencyId),
      where('projectId', '==', projectId),
      where('day', '>=', startDate),
      where('day', '<=', endDate)
    );

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as SchedulerNote[];
      setNotes(fetchedNotes);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching scheduler notes:", error);
      setIsLoading(false);
    });

    return () => unsubscribeNotes();
  }, [user, agencyId, projectId, currentMonth, refetchTrigger]);

  return { notes, isLoading, notesByDay, refetch };
}

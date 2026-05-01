// src/hooks/useScheduleInfo.ts
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScheduledItem } from '@/components/agency/scheduler/types';
import { useAuth } from '@/context/AuthContext';

export function useScheduleInfo(documentId: string | null) {
  const [scheduleInfo, setScheduleInfo] = useState<ScheduledItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!documentId || !user) {
      setScheduleInfo(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'schedules'),
      where('documentId', '==', documentId),
      where('userId', '==', user.uid),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setScheduleInfo({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ScheduledItem);
      } else {
        setScheduleInfo(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [documentId, user]);

  return { scheduleInfo, loading };
}

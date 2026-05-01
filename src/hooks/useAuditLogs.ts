// src/hooks/useAuditLogs.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: { toDate: () => Date };
}

export const useAuditLogs = (agencyId: string, limitCount: number = 10) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agencyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const logsQuery = query(
      collection(db, 'auditLogs'),
      where('agencyId', '==', agencyId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        const fetchedLogs = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as AuditLog));
        setLogs(fetchedLogs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching audit logs:', err);
        setError('Failed to load audit logs');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [agencyId, limitCount]);

  return { logs, loading, error };
};

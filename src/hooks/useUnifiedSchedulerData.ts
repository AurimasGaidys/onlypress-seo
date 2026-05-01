'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { Workspace } from '@/context/WorkspaceContext';
import { ScheduledItem } from '@/components/agency/scheduler/types';
import { ArticleDocument } from '@/types/document';

export function useUnifiedSchedulerData(workspace: Workspace, currentMonth: Date) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduledItem[]>([]);
  const [documentsMap, setDocumentsMap] = useState<Map<string, ArticleDocument>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => setRefetchTrigger(prev => prev + 1), []);

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, ScheduledItem[]>();
    schedules.forEach(item => {
      if (!item.scheduledAt) return;
      let scheduledDate: Date;
      if (typeof item.scheduledAt === 'object' && 'toDate' in item.scheduledAt) {
        scheduledDate = item.scheduledAt.toDate();
      } else {
        scheduledDate = new Date(item.scheduledAt as string | Date);
      }
      if (isNaN(scheduledDate.getTime())) return;
      const dayKey = format(scheduledDate, 'yyyy-MM-dd');
      const existing = map.get(dayKey) || [];
      map.set(dayKey, [...existing, item]);
    });
    return map;
  }, [schedules]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    console.log('useUnifiedSchedulerData - Workspace:', workspace.type, workspace.id);
    console.log('useUnifiedSchedulerData - User UID:', user.uid);

    setIsLoading(true);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    let schedulesQuery;
    const schedulesCollection = collection(db, 'schedules');

    if (workspace.type === 'agency' && workspace.id) {
      console.log('Using agency workspace:', workspace.id);
      schedulesQuery = query(
        schedulesCollection,
        where('agencyId', '==', workspace.id),
        where('scheduledAt', '>=', monthStart),
        where('scheduledAt', '<=', monthEnd)
      );
    } else { // Personal workspace - naudoja personal agency ID
      const personalAgencyId = `personal_${user.uid}`;
      const personalClientId = `${personalAgencyId}_default_client`;
      const personalProjectId = `${personalAgencyId}_default_project`;
      console.log('Using personal workspace:', { personalAgencyId, personalClientId, personalProjectId });
      schedulesQuery = query(
        schedulesCollection,
        where('agencyId', '==', personalAgencyId),
        where('clientId', '==', personalClientId),
        where('projectId', '==', personalProjectId),
        where('scheduledAt', '>=', monthStart),
        where('scheduledAt', '<=', monthEnd)
      );
    }

    const fetchDocuments = async (docIds: string[]) => {
      if (docIds.length === 0) {
        setDocumentsMap(new Map());
        return;
      }

      try {
        // Naudokime skirtingą API route'ą priklausomai nuo workspace tipo
        const apiUrl = workspace.type === 'agency' ? '/api/agency/documents-batch' : '/api/scheduler/documents-batch-personal';
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        
        // Personal space reikia autentifikavimo headerio
        if (workspace.type === 'user' && user) {
          const idToken = await user.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        }
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ documentIds: docIds }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch documents batch from ${apiUrl}:`, response.status, errorText);
          setDocumentsMap(new Map());
          return;
        }
        
        const { documents } = await response.json();
        console.log(`Fetched ${documents.length} documents from ${apiUrl}:`, documents.map((d: ArticleDocument) => ({ id: d.id, title: d.title, lastEdited: d.lastEdited })));
        const newMap = new Map<string, ArticleDocument>();
        documents.forEach((doc: ArticleDocument) => newMap.set(doc.id, doc));
        setDocumentsMap(newMap);
      } catch (error) {
        console.error("Failed to fetch documents batch", error);
        setDocumentsMap(new Map());
      }
    };

    const unsubscribe = onSnapshot(schedulesQuery, async (snapshot) => {
      const fetchedSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ScheduledItem);
      setSchedules(fetchedSchedules);

      const docIds = [...new Set(fetchedSchedules.map(s => s.documentId))];
      await fetchDocuments(docIds);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching schedules:", error);
      setIsLoading(false);
    });

    // Papildomas listeneris dokumentų pakeitimams - stebi dokumentus, kurie turi schedules
    const setupDocumentListener = async () => {
      try {
        const docIds = [...new Set(schedules.map(s => s.documentId))];
        if (docIds.length === 0) return;

        // Gauname dokumentų reference'us ir nustatome atskirus listenerius
        const documentsCollection = collection(db, 'documents');
        const unsubscribeFunctions: (() => void)[] = [];

        for (const docId of docIds) {
          const docRef = doc(documentsCollection, docId);
          const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const docData = { id: docSnapshot.id, ...docSnapshot.data() } as ArticleDocument;
              console.log(`Document ${docId} updated, lastEdited:`, docData.lastEdited);
              
              // Atnaujiname tik konkretų dokumentą documentsMap'e
              setDocumentsMap(prev => {
                const newMap = new Map(prev);
                newMap.set(docId, docData);
                return newMap;
              });
            }
          });
          unsubscribeFunctions.push(unsubscribe);
        }

        return () => {
          unsubscribeFunctions.forEach(unsub => unsub());
        };
      } catch (error) {
        console.error("Error setting up document listeners:", error);
        return () => {};
      }
    };

    const unsubscribeDocsPromise = setupDocumentListener();

    return () => {
      unsubscribe();
      unsubscribeDocsPromise.then(unsub => unsub?.()).catch(console.error);
    };
  }, [user, workspace, currentMonth, refetchTrigger, schedules.map(s => s.documentId).join(',')]);

  return { schedules, documentsMap, isLoading, schedulesByDay, refetch };
}

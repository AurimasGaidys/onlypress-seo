// src/hooks/useSchedulerDndByProject.ts
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UseSchedulerDndByProjectProps {
  agencyId: string;
  clientId: string | null;
  projectId: string | null;
  onScheduleComplete: () => void;
  refetchData?: () => void;
}

export function useSchedulerDndByProject({ agencyId, clientId, projectId, onScheduleComplete, refetchData }: UseSchedulerDndByProjectProps) {
  const { user } = useAuth();
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);

  const handleDrop = async (file: File, date: Date) => {
    if (!user) return toast.error("Authentication required.");
    if (!projectId) return toast.error("Please select a project before dropping a file.");
    
    setIsProcessingDrop(true);
    toast.info(`Processing "${file.name}"...`);

    try {
      const idToken = await user.getIdToken();
      const importFormData = new FormData();
      importFormData.append('file', file);
      importFormData.append('idToken', idToken);
      
      const importRes = await fetch('/api/documents/import-file', { method: 'POST', body: importFormData });
      const importData = await importRes.json();
      if (!importRes.ok) throw new Error(importData.error || 'File import failed');

      const createRes = await fetch('/api/documents/create-blank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          title: file.name.replace(/\.[^/.]+$/, ""),
          content: importData.html,
          agencyId,
          clientId,
          projectId, // <-- Pridedame projectId
          // Turinys bus pridėtas serverio pusėje, jei `importData.html` egzistuoja
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Document creation failed');
      const { newDocumentId } = createData;

      const scheduleRes = await fetch('/api/agency/schedule-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          documentId: newDocumentId,
          agencyId,
          clientId,
          projectId,
          // PATAISYMAS ČIA:
          scheduledDate: format(date, 'yyyy-MM-dd'),
        }),
      });
      if (!scheduleRes.ok) throw new Error((await scheduleRes.json()).error || 'Scheduling failed');

      toast.success(`"${file.name}" scheduled successfully!`);
      onScheduleComplete();
      refetchData?.();
    } catch (error) {
      toast.error("Failed to schedule file", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsProcessingDrop(false);
    }
  };

  return { isProcessingDrop, handleDrop };
}

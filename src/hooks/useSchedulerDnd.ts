// src/hooks/useSchedulerDnd.ts
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface UseSchedulerDndProps {
  agencyId: string;
  clientId: string | null;
  onScheduleComplete: () => void;
  refetchData: () => void; // <-- PRIDEDAME NAUJĄ PROP
}

export function useSchedulerDnd({ agencyId, clientId, onScheduleComplete, refetchData }: UseSchedulerDndProps) {
  const { user } = useAuth();
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);

  // Funkcija, kuri bus iškviesta numetus failą
  const handleDrop = async (file: File, date: Date) => {
    if (!user) return toast.error("Authentication required.");
    setIsProcessingDrop(true);
    toast.info(`Processing "${file.name}"...`);

    try {
      // 1. Įkeliame failą ir gauname HTML
      const idToken = await user.getIdToken();
      const importFormData = new FormData();
      importFormData.append('file', file);
      importFormData.append('idToken', idToken);
      
      const importRes = await fetch('/api/documents/import-file', { method: 'POST', body: importFormData });
      const importData = await importRes.json();
      if (!importRes.ok) throw new Error(importData.error || 'File import failed');

      // 2. Sukuriame dokumentą
      const createRes = await fetch('/api/documents/create-blank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          title: file.name.replace(/\.[^/.]+$/, ""), // Pavadinimas be plėtinio
          content: importData.html,
          agencyId,
          clientId,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Document creation failed');
      const { newDocumentId } = createData;

      // 3. Suplanuojame dokumentą
      const scheduleRes = await fetch('/api/agency/schedule-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          documentId: newDocumentId,
          agencyId,
          clientId,
          scheduledDate: date.toISOString().split('T')[0], // YYYY-MM-DD
        }),
      });
      if (!scheduleRes.ok) throw new Error((await scheduleRes.json()).error || 'Scheduling failed');

      toast.success(`"${file.name}" scheduled successfully!`);
      
      // --- PRADĖK PAKEITIMĄ ČIA ---
      refetchData(); // Iškviečiame duomenų atnaujinimą
      // --- PAKEITIMO PABAIGA ---
      
      onScheduleComplete();
    } catch (error) {
      toast.error("Failed to schedule file", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsProcessingDrop(false);
    }
  };

  return { isProcessingDrop, handleDrop };
}

// src/app/(app)/docs/[documentId]/page.tsx
'use client';

import { use } from 'react';
import dynamic from 'next/dynamic'; // <-- 1. IMPORTUOJAME 'dynamic'
import AIAssistantSidebar from '@/components/ai-assistant-sidebar';
import { useDocument } from '@/hooks/useDocument';
import { FileText, Loader2 } from 'lucide-react';

// --- 2. DINAMIŠKAI IMPORTUOJAME REDAKTORIŲ SU IŠJUNGTU SSR ---
// Tai nurodo Next.js įkelti Editor komponentą tik kliento pusėje.
const Editor = dynamic(() => import('@/components/editor'), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

interface DocumentPageProps {
  params: Promise<{
    documentId: string;
  }>;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const resolvedParams = use(params);
  const { document, loading } = useDocument(resolvedParams.documentId);

  // Dabar pagrindinis krovimo indikatorius rodomas, kol gaunami dokumento duomenys
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold">Document Not Found</h1>
        <p className="text-muted-foreground">This document may not exist or you may not have permission to view it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl sm:text-3xl font-bold truncate" title={document.title}>
              {document.title}
          </h1>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-grow w-full">
          {/* Editorius dabar bus renderinamas tik kliento pusėje */}
          <Editor document={document} /> 
        </div>
        <div className="w-full lg:w-full lg:max-w-xs lg:sticky top-8">
          <AIAssistantSidebar />
        </div>
      </div>
    </div>
  );
}
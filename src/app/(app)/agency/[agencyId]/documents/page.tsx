// src/app/(app)/agency/[agencyId]/documents/page.tsx
'use client';

import DocumentsBrowser from '@/components/dashboards/DocumentsBrowser';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AgencyDocumentsPage() {
  const { isLoading: workspaceLoading, setActiveWorkspace, activeWorkspace, availableWorkspaces } = useWorkspace();
  const params = useParams();
  const agencyId = params.agencyId as string;

  // Papildomas patikrinimas, kad workspace'as būtų teisingai nustatytas,
  // jei vartotojas ateina į šį puslapį tiesiogiai per URL.
  useEffect(() => {
    if (agencyId && !workspaceLoading) {
      const currentWorkspace = availableWorkspaces.find(ws => ws.id === agencyId);
      if (currentWorkspace && activeWorkspace.id !== agencyId) {
        setActiveWorkspace(currentWorkspace);
      }
    }
  }, [agencyId, workspaceLoading, availableWorkspaces, activeWorkspace, setActiveWorkspace]);

  if (workspaceLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // DocumentsBrowser yra universalus ir automatiškai rodys agentūros dokumentus,
  // nes aktyvi darbo aplinka bus 'agency'.
  return <DocumentsBrowser />;
}

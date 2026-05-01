'use client';

import { useWorkspace } from '@/context/WorkspaceContext';
import AgencySchedulerView from '@/components/agency/scheduler/SchedulerPage'; // We will reuse the existing component
import { Loader2 } from 'lucide-react';
import PersonalSchedulerView from './PersonalSchedulerView'; // Import the new component
import { usePortals } from '@/hooks/usePortals'; // <-- 1. ADD THIS IMPORT

export default function UnifiedScheduler() {
  const { activeWorkspace, isLoading: workspaceIsLoading } = useWorkspace();
  const { portals, loading: portalsLoading } = usePortals(); // <-- 2. ADD THIS LINE

  // <-- 3. UPDATE LOADING STATE -->
  const isLoading = workspaceIsLoading || portalsLoading;

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (activeWorkspace.type === 'agency' && activeWorkspace.id) {
    // <-- 4. PASS `portals` PROP -->
    return <AgencySchedulerView agencyId={activeWorkspace.id} portals={portals} />;
  } else {
    // <-- 4. PASS `portals` PROP -->
    return <PersonalSchedulerView portals={portals} />;
  }
}

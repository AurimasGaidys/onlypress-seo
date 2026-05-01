'use client';

import UnifiedScheduler from '@/components/scheduler/UnifiedScheduler';

export default function Page() {
  // The UnifiedScheduler component now handles all logic for
  // loading state and switching between agency/personal views.
  return <UnifiedScheduler />;
}

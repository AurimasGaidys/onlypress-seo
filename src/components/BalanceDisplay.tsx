// src/components/BalanceDisplay.tsx
'use client';

import { useMe } from '@/context/MeContext/MeContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { formatCredit } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Wallet } from 'lucide-react';
import { useState } from 'react';
import CreditsPaymentModal from './agency/billing/CreditsPaymentModal';


export default function BalanceDisplay() {
  const { userPrivate, loading: userLoading } = useMe();
  const { activeWorkspace, isAgencyWorkspace } = useWorkspace();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Fetch agency data only when agency workspace is selected
  const { agency, loading: agencyLoading } = useAgencyInfo(
    activeWorkspace.type === 'agency' && activeWorkspace.id ? activeWorkspace.id : ''
  );

  const handleAddCredits = () => {
    setPaymentModalOpen(true);
  };

  // Determine which credit to display based on workspace type
  const loading = isAgencyWorkspace ? agencyLoading : userLoading;
  const credit = isAgencyWorkspace ? agency?.credit : userPrivate?.credit;

  // Show loading skeleton while data is being fetched
  if (loading || credit === undefined) {
    return <Skeleton className="h-8 w-24" />;
  }

  //

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold p-2 rounded-md bg-muted/50">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <span>{formatCredit(credit)}</span>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={handleAddCredits} title="Add Credits">
        <Plus className="h-4 w-4" />
      </Button>
      <CreditsPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
      />
    </div>
  );
}

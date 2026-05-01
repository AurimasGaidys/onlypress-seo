'use client';

import { useMemo } from 'react';
import { PortalPublic } from '@/types/portalPublic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PortalSelectionContent from './PortalSelectionContent';

interface PortalSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portals: PortalPublic[];
  selectedPortalIds: string[];
  onSelectionChange: (portalIds: string[]) => void;
}

export default function PortalSelector({
  open,
  onOpenChange,
  portals,
  selectedPortalIds,
  onSelectionChange,
}: PortalSelectorProps) {
  // Calculate total cost
  const totalCost = useMemo(() => {
    return selectedPortalIds.reduce((sum, id) => {
      const portal = portals.find(p => p.id === id);
      return sum + (portal?.price || 0);
    }, 0);
  }, [selectedPortalIds, portals]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pasirinkti Portalus</DialogTitle>
          <DialogDescription>
            Pasirinkite portalus, kuriuose norite publikuoti straipsnį
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          <PortalSelectionContent
            portals={portals}
            selectedPortalIds={selectedPortalIds}
            onSelectionChange={onSelectionChange}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="text-sm">
            Bendra kaina: <span className="font-bold text-lg">€{totalCost.toFixed(2)}</span>
          </div>
          <Button onClick={() => onOpenChange(false)}>
            Patvirtinti ({selectedPortalIds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

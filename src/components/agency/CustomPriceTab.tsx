'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Search } from 'lucide-react';
import { useCustomPricesContext } from '@/context/customPriceContext/CustomPriceContext';
import { usePortalsContext } from '@/context/portalContext/usePortalsContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CustomPriceTable from './custom-price/CustomPriceTable';
import CustomPriceDialog from './custom-price/CustomPriceDialog';
import CustomPriceAuditLogDialog from './custom-price/CustomPriceAuditLogDialog';

interface CustomPriceTabProps {
  agencyId: string;
}

type FilterType = 'all' | 'with-custom' | 'without-custom';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CustomPriceTab({ agencyId }: CustomPriceTabProps) {
  const { customPrices, loading: pricesLoading, setCustomPrice } = useCustomPricesContext();
  const { portals, initializing: portalsLoading } = usePortalsContext();
  const { activeWorkspace } = useWorkspace();
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingAuditLog, setViewingAuditLog] = useState<string | null>(null);
  const [titleFilter, setTitleFilter] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const loading = pricesLoading || portalsLoading;

  const handleOpenDialog = (portalId: string) => {
    setSelectedPortalId(portalId);
    setIsDialogOpen(true);
  };

  const handleSavePrice = async (price: number, note: string) => {
    if (!selectedPortalId || !activeWorkspace.id) return;

    setIsSaving(true);
    try {
      await setCustomPrice({
        portalId: selectedPortalId,
        workspaceId: activeWorkspace.id,
        price,
        note: note || undefined,
      });
      toast.success('Custom price saved successfully');
      setIsDialogOpen(false);
      setSelectedPortalId(null);
    } catch (error) {
      console.error('Error saving custom price:', error);
      toast.error('Failed to save custom price');
    } finally {
      setIsSaving(false);
    }
  };

  const getPortalName = (portalId: string) => {
    const portal = portals.find(p => p.id === portalId);
    return portal?.title || 'Unknown Portal';
  };

  // Filter portals based on search and filter type
  const filteredPortals = useMemo(() => {
    let filtered = portals;

    // Filter by title
    if (titleFilter.trim()) {
      filtered = filtered.filter(portal =>
        portal.title.toLowerCase().includes(titleFilter.toLowerCase())
      );
    }

    // Filter by custom price status
    if (filterType === 'with-custom') {
      filtered = filtered.filter(portal =>
        customPrices.some(cp => cp.portalId === portal.id)
      );
    } else if (filterType === 'without-custom') {
      filtered = filtered.filter(portal =>
        !customPrices.some(cp => cp.portalId === portal.id)
      );
    }

    return filtered;
  }, [portals, titleFilter, filterType, customPrices]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const existingPrice = selectedPortalId ? customPrices.find(p => p.portalId === selectedPortalId) : null;
  const auditLogData = viewingAuditLog ? customPrices.find(p => p.portalId === viewingAuditLog)?.auditLog || [] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Custom Price Settings</CardTitle>
              <CardDescription className="mt-1">
                You can set custom prices you agreed with portal in here
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Section */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Title Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by portal name..."
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filter Type Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterType('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'with-custom' ? 'default' : 'outline'}
                  onClick={() => setFilterType('with-custom')}
                  size="sm"
                >
                  With Custom Price
                </Button>
                <Button
                  variant={filterType === 'without-custom' ? 'default' : 'outline'}
                  onClick={() => setFilterType('without-custom')}
                  size="sm"
                >
                  No Custom Price
                </Button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredPortals.length} of {portals.length} portals
            </div>
          </div>

          <CustomPriceTable
            portals={filteredPortals}
            customPrices={customPrices}
            onEdit={handleOpenDialog}
            onViewAuditLog={setViewingAuditLog}
          />
        </CardContent>
      </Card>

      <CustomPriceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        portalName={selectedPortalId ? getPortalName(selectedPortalId) : ''}
        initialPrice={existingPrice?.price}
        onSave={handleSavePrice}
        isSaving={isSaving}
      />

      <CustomPriceAuditLogDialog
        isOpen={!!viewingAuditLog}
        onClose={() => setViewingAuditLog(null)}
        portalName={viewingAuditLog ? getPortalName(viewingAuditLog) : ''}
        auditLog={auditLogData}
      />
    </div>
  );
}

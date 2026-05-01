'use client';

import { useState, useEffect } from 'react';
import { useDocument } from '@/hooks/useDocument';
import { usePortals } from '@/hooks/usePortals';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ApiBuyerOrderCreate } from '@/context/api';
import { PublishOrder } from '@/types/publishOrder';
import { useMe } from '@/context/MeContext/MeContext';
import { useRouter } from 'next/navigation';

import PortalSelectionContent from './PortalSelectionContent';
import { usePortalsContext } from '@/context/portalContext/usePortalsContext';
import { PublicationDateSelector } from '../aaa_todo/DateSelector';
import { useWorkspace } from '@/context/WorkspaceContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCustomPricesContext } from '@/context/customPriceContext/CustomPriceContext';
import { useEditorTab } from '@/context/EditorTabContext';
import { DocumentPublishedSection } from './DocumentPublishedSection';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { ClientPicker } from '../aa_pickers/clientPicker';
import { Label } from '../ui/label';
import { useAgencyData } from '@/hooks/useAgencyData';

interface PublishTabProps {
  documentId: string;
}

export default function PublishTab({ documentId }: PublishTabProps) {
  const { user } = useAuth();
  const { document, loading: docLoading, } = useDocument(documentId);
  const { loading: portalsLoading, refetch: refetchPortals } = usePortals();
  const { portals } = usePortalsContext();
  const { userPrivate } = useMe();
  const { activeWorkspace, isAgencyWorkspace } = useWorkspace();
  const { customPrices } = useCustomPricesContext()
  const router = useRouter();
  const { setActiveTab } = useEditorTab();
  const { agency } = useAgencyInfo(
    activeWorkspace.type === 'agency' && activeWorkspace.id ? activeWorkspace.id : ''
  );

  const [selectedPortalIds, setSelectedPortalIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const { clients } = useAgencyData(activeWorkspace.id || '');

  useEffect(() => {
    if (document?.selectedPortals) {
      setSelectedPortalIds(document.selectedPortals);
    }
  }, [document]);

  const handleSelectionChange = async (newPortalIds: string[]) => {
    if (!user || !document) return;

    setSelectedPortalIds(newPortalIds);

    try {
      const idToken = await user.getIdToken();
      await fetch('/api/documents/update-selected-portals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          documentId,
          selectedPortals: newPortalIds,
        }),
      });
    } catch (error) {
      console.error('Error updating selected portals:', error);
    }
  };

  const selectedPortals = portals.filter(p => selectedPortalIds.includes(p.id));
  const selectedPortalsselectedPortalsWithPricesPrices = selectedPortals.map(portal => {
    const customPrice = customPrices.find(cp => cp.portalId === portal.id);
    return customPrice?.price || portal.price || 0;
  });

  const loading = docLoading || portalsLoading;

  const totalCost = selectedPortalsselectedPortalsWithPricesPrices.reduce((sum, p) => sum + (p || 0), 0);
  const totalOriginalCost = selectedPortals.reduce((sum, p) => sum + (p.price || 0), 0);
  const credit = isAgencyWorkspace ? (agency?.credit || 0) : (userPrivate?.credit || 0);

  const hasInsufficientCredit = credit < totalCost;
  const canPublish = selectedPortalIds.length > 0 && !hasInsufficientCredit;

  const hasLinks = document?.content?.includes('<a ');
  const hasFeaturedImage = !!document?.metadata?.featuredImage;

  const handleClientChange = async (clientId: string | null, projectId: string | null) => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, {
        clientId: clientId || "",
        projectId: projectId || "",
      });
      toast.success('Featured image saved successfully');
    } catch (error) {
      console.error('Error saving featured image:', error);
      toast.error('Failed to save featured image');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {

    if (!canPublish || !user || !document) return;

    setIsPublishing(true);
    toast.info(`Publishing to ${selectedPortalIds.length} portal(s)...`);

    const order: PublishOrder = {
      id: document.id,
      status: "Created",
      publishers: selectedPortalIds || [],
      prices: selectedPortalsselectedPortalsWithPricesPrices, // prices for each publisher
      publishDate: Date.now(),
      dateToPublish: scheduledDate?.getTime() || Date.now(),
      price: totalCost,

      publisherCategories: [], // text category id
      textInfo: {
        title: document.title,
        content: document.content,
        seo: {
          featuredImage: document.metadata?.featuredImage || "",
          title: document.metadata?.seoTitle || document.title || "",
          description: document.metadata?.seoDescription || document.snippet || "",
        }
      },

      publishTasks: [],

      buyerId: activeWorkspace?.id || userPrivate?.id || "error-no-userid",
      paymentId: "",

      dateCreated: Date.now(),
      dateUpdated: Date.now(),
      offsetInMinutes: Date.now(),
      createPublicReloease: false
    };

    try {
      const data = await ApiBuyerOrderCreate({
        order,
        payCredit: true,
        agencyId: activeWorkspace?.id || 'personal',
      });

      if (!data || !data.success) {
        toast.error(data?.message || "Failed to create order.");
        return;
      }

      toast.success("Order created successfully!");
      refetchPortals();

      if (activeWorkspace?.id) {
        router.push(`/agency/${activeWorkspace?.id}/documents`);
      } else {
        router.push('/agency-select');
      }

    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background p-4 border-b space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* <ClientPicker activeWorkspace={activeWorkspace}
              selectedClientId={document.clientId || 'personal'}
              selectedProjectId={document.projectId || null}
              setSelectedClientId={(val) => { handleClientChange(val, document.projectId || null); }}
              setSelectedProjectId={(val) => { handleClientChange(document.clientId || null, val); }}
              disabled={isSaving}
            /> */}
            <div className='flex-col space-y-2'>
              <Label htmlFor="publication-date">Client: {clients.find(x => x.id == document.clientId)?.name}</Label>
              <ClientPicker
                agencyId={activeWorkspace.id || ''}
                selectedProjectId={document.projectId || null}
                setSelectedProjectId={(projectId, clientId) => { handleClientChange(clientId, projectId); }}
              />
            </div>

            <PublicationDateSelector selectedDate={scheduledDate || new Date()} setSelectedDate={setScheduledDate} />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 font-semibold">
                <Wallet className="h-4 w-4 text-muted-foreground" /> Cost: <span className="text-lg">{totalCost.toFixed(2)}€</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                Original price: {totalOriginalCost.toFixed(2)}€
              </div>
            </div>
            <Button size="lg" onClick={handlePublish} disabled={!canPublish || isPublishing || isSaving}>
              {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Publish ({selectedPortalIds.length})
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {hasInsufficientCredit && (
            <div className="flex items-center gap-1 text-xs text-destructive pt-1">
              <AlertCircle className="h-3 w-3" />
              Insufficient credit. Required: {totalCost.toFixed(2)}€
            </div>
          )}
          {!hasLinks && (
            <div className="flex items-center gap-1 text-xs text-orange-500 pt-1">
              <AlertCircle className="h-3 w-3" />
              Content has no links
            </div>
          )}
          {!hasFeaturedImage && (
            <div className="flex items-center gap-1 text-xs text-orange-500 pt-1">
              <AlertCircle className="h-3 w-3" />
              No featured image selected
              <Button
                variant="outline"
                size="sm"
                className="h-5 text-[10px] px-2 ml-2"
                onClick={() => setActiveTab('image')}
              >
                Fix
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 border-b bg-background/50 p-4 overflow-y-auto flex flex-col">
        <h3 className="text-sm font-medium mb-3">Existing publications</h3>
        <DocumentPublishedSection documentId={documentId} />
      </div>
      <div className="flex-1 border-b bg-background/50 p-4 overflow-y-auto flex flex-col">
        <h3 className="text-sm font-medium mb-3">Select Portals</h3>
        <div className="flex-1 min-h-0">
          <PortalSelectionContent
            portals={portals}
            selectedPortalIds={selectedPortalIds}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </div>
    </div>
  );
}

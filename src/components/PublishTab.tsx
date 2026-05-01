// src/components/PublishTab.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Globe, AlertCircle, FileText, Send, Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Portal {
  id: string;
  name: string;
  price: number;
  active: boolean;
  [key: string]: unknown;
}

interface Document {
  id: string;
  agencyId?: string;
  [key: string]: unknown;
}

interface PublishTabProps {
  document: Document;
}

export default function PublishTab({ document }: PublishTabProps) {
  const { user } = useAuth();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [userCredit, setUserCredit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);

  useEffect(() => {
    const fetchPortalsAndBalance = async () => {
      if (!user || !document.agencyId) return;
      setIsLoading(true);
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/portals/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        if (!response.ok) throw new Error('Failed to fetch portals');
        const result = await response.json();
        setPortals(result.portals);
        setUserCredit(result.userCredit);
      } catch (error) {
        toast.error("Error fetching portals", { description: error instanceof Error ? error.message : "Unknown error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPortalsAndBalance();
  }, [user, document.agencyId]);

  const handleSelectPortal = (portalId: string, checked: boolean) => {
    setSelectedPortals(prev =>
      checked ? [...prev, portalId] : prev.filter(id => id !== portalId)
    );
  };

  const totalPrice = useMemo(() => {
    return selectedPortals.reduce((total, portalId) => {
      const portal = portals.find(p => p.id === portalId);
      return total + (portal?.price || 0);
    }, 0);
  }, [selectedPortals, portals]);

  const handlePublish = async () => {
    if (selectedPortals.length === 0 || !user || !document.agencyId) return;
    setIsPublishing(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/publish-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken, 
          documentId: document.id, 
          portalIds: selectedPortals,
          agencyId: document.agencyId 
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publishing failed");
      toast.success("Publication initiated!", { description: "Your article has been queued for publishing." });
      setSelectedPortals([]);
      // Refresh user credit after successful publishing
      const balanceResponse = await fetch('/api/portals/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (balanceResponse.ok) {
        const balanceResult = await balanceResponse.json();
        setUserCredit(balanceResult.userCredit);
      }
    } catch (error) {
        toast.error("Publishing Failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsPublishing(false);
    }
  };

  // All portals are considered compatible since we're using the new API
  const compatiblePortals = portals;
  const incompatiblePortals: Portal[] = [];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (portals.length === 0) {
    return <div className="text-center p-8 text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2" /><p>No portals found.</p></div>;
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        Select Portals to Publish
      </h3>

      {/* Compatible Portals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compatible Portals ({compatiblePortals.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {compatiblePortals.map(portal => (
            <div
              key={portal.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleSelectPortal(portal.id, !selectedPortals.includes(portal.id))}
            >
              <div className="flex items-center gap-4">
                <Checkbox
                  id={portal.id}
                  checked={selectedPortals.includes(portal.id)}
                  onCheckedChange={(checked) => handleSelectPortal(portal.id, !!checked)}
                />
                {/* Naudojame paprastą <h4> kaip ir sename komponente */}
                <h4 className="font-medium">{portal.name}</h4>
              </div>
              <span className="font-semibold text-sm">{portal.price} EUR</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Incompatible Portals */}
      {incompatiblePortals.length > 0 && (
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">Incompatible Portals ({incompatiblePortals.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incompatiblePortals.map(portal => (
              <div key={portal.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  <Checkbox id={`disabled-${portal.id}`} disabled />
                  <h4 className="font-medium text-muted-foreground">{portal.name}</h4>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <span className="text-sm text-muted-foreground">{portal.price} EUR</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary and Action */}
      <div className="h-24"> {/* Pridedame tuščią tarpą, kad slenkant turinys nelįstų po summary kortele */}
      </div>
      <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-3xl shadow-lg z-20">
        <CardContent className="p-4 flex items-center justify-between">
            <div>
                <p className="text-lg font-bold">Total: {totalPrice.toFixed(2)} EUR</p>
                <p className="text-sm text-muted-foreground">{selectedPortals.length} portal(s) selected</p>
            </div>
            <Button size="lg" onClick={handlePublish} disabled={isPublishing || selectedPortals.length === 0}>
                {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publish to {selectedPortals.length} Site(s)
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

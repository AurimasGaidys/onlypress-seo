// src/app/(app)/agency/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, PlusCircle, Building } from 'lucide-react';
import Link from 'next/link';
import { useUserAgencies } from '@/hooks/useUserAgencies';
import CreateAgencyDialog from '@/components/agency/CreateAgencyDialog';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function AgencyPage() {
  const { agencies, loading: agenciesLoading } = useUserAgencies();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { activeWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    // Laukiame, kol pasikraus Workspace informacija
    if (workspaceLoading) return;

    // Jei vartotojas yra agentūros aplinkoje, bet atsidūrė šiame puslapyje,
    // nukreipiame jį į teisingą agentūros skydą.
    if (activeWorkspace.type === 'agency' && activeWorkspace.id) {
      router.replace(`/agency/${activeWorkspace.id}`);
    }
  }, [activeWorkspace, workspaceLoading, router]);

  const loading = agenciesLoading || workspaceLoading;

  // Jei vartotojas yra agentūros aplinkoje (ir laukia nukreipimo) ARBA kraunami duomenys, rodome krovimo būseną
  if (activeWorkspace.type === 'agency' || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Šis kodas bus pasiektas TIK jei vartotojas yra asmeninėje aplinkoje ir duomenys pasikrovę
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Agencies</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Agency
        </Button>
      </div>

      {agencies.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardHeader>
            <Building className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">You don't belong to any agency yet.</CardTitle>
            <CardDescription>Create a new agency to start collaborating with your team.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Agency</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agencies.map((agency) => (
            <Link href={`/agency/${agency.id}`} key={agency.id}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    {agency.name}
                  </CardTitle>
                  <CardDescription>
                    Click to manage
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
      
      <CreateAgencyDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}

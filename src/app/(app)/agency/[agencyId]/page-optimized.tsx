// src/app/(app)/agency/[agencyId]/page-optimized.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users, Briefcase, Settings, Loader2, LayoutDashboard } from 'lucide-react';

// Optimizuoti importai - naudojame atskirus hook'us kiekvienam skirtukui
import MembersTab from '@/components/agency/MembersTab'; 
import ClientsTab from '@/components/agency/ClientsTab';
import AgencyProjectsTab from '@/components/agency/AgencyProjectsTab';
import DashboardTab from '@/components/agency/DashboardTab';
import { useAgencyInfo } from '@/hooks/useAgencyInfo'; // Tik pagrindinei info
import { useWorkspace } from '@/context/WorkspaceContext';
import SettingsTab from '@/components/agency/SettingsTab';

export default function AgencyDashboardPageOptimized() {
  const params = useParams();
  const agencyId = params.agencyId as string;
  const { agency, loading, error } = useAgencyInfo(agencyId); // Tik pagrindinė info
  const { activeWorkspace, setActiveWorkspace, availableWorkspaces } = useWorkspace();

  // Automatiškai nustatome agency workspace'ą pagal URL
  useEffect(() => {
    if (agencyId && agency && !loading) {
      const currentWorkspace = availableWorkspaces.find(ws => ws.id === agencyId);
      if (currentWorkspace && (!activeWorkspace.id || currentWorkspace.id !== activeWorkspace.id)) {
        console.log('Setting workspace from URL:', agencyId);
        setActiveWorkspace(currentWorkspace);
      }
    }
  }, [agencyId, agency, loading, availableWorkspaces, activeWorkspace.id, setActiveWorkspace]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-muted-foreground">Loading agency data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center p-8">{error}</div>;
  }
  
  if (!agency) {
    return <div className="text-center p-8">Agency not found. #2</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-muted rounded-lg">
            <Building className="h-8 w-8 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-bold">{agency.name}</h1>
            <p className="text-muted-foreground">Agency Management Dashboard (Optimized)</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" /> Members
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Briefcase className="mr-2 h-4 w-4" /> Clients
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Briefcase className="mr-2 h-4 w-4" /> Projects
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>
        
        {/* Kiekvienas skirtukas pats krauna reikiamus duomenis */}
        <TabsContent value="dashboard" className="mt-6">
          <DashboardTab agencyId={agencyId} />
        </TabsContent>
        
        <TabsContent value="members" className="mt-6">
          <MembersTab agencyId={agencyId} />
        </TabsContent>
        
        <TabsContent value="clients" className="mt-6">
          <ClientsTab agencyId={agencyId} />
        </TabsContent>
        
        <TabsContent value="projects" className="mt-6">
          <AgencyProjectsTab agencyId={agencyId} />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <SettingsTab agencyId={agencyId} agency={agency} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// src/app/(app)/agency/[agencyId]/page-optimized-demo.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users, Briefcase, Settings, Loader2, LayoutDashboard } from 'lucide-react';

// Demonstracinė optimizuota versija - rodo principą
// Ši versija naudoja atskirus hook'us kiekvienam skirtukui
// Kiekvienas skirtukas pats krauna savo duomenis
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { useWorkspace } from '@/context/WorkspaceContext';

// Laikini demonstraciniai komponentai, kurie naudoja atskirus hook'us
const OptimizedDashboardTab = ({ agencyId }: { agencyId: string }) => {
  const { useAuditLogs } = require('@/hooks/useAuditLogs');
  const { logs, loading } = useAuditLogs(agencyId);
  
  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">Optimized Dashboard</h3>
      <p className="text-sm text-muted-foreground">Loading: {loading ? 'Yes' : 'No'}</p>
      <p className="text-sm">Logs count: {logs.length}</p>
      <p className="text-xs text-green-600 mt-2">✓ Uses useAuditLogs hook</p>
    </div>
  );
};

const OptimizedMembersTab = ({ agencyId }: { agencyId: string }) => {
  const { useAgencyMembers } = require('@/hooks/useAgencyMembers');
  const { members, loading } = useAgencyMembers(agencyId);
  
  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">Optimized Members</h3>
      <p className="text-sm text-muted-foreground">Loading: {loading ? 'Yes' : 'No'}</p>
      <p className="text-sm">Members count: {members.length}</p>
      <p className="text-xs text-green-600 mt-2">✓ Uses useAgencyMembers hook</p>
    </div>
  );
};

const OptimizedClientsTab = ({ agencyId }: { agencyId: string }) => {
  const { useAgencyClients } = require('@/hooks/useAgencyClients');
  const { clients, loading } = useAgencyClients(agencyId);
  
  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">Optimized Clients</h3>
      <p className="text-sm text-muted-foreground">Loading: {loading ? 'Yes' : 'No'}</p>
      <p className="text-sm">Clients count: {clients.length}</p>
      <p className="text-xs text-green-600 mt-2">✓ Uses useAgencyClients hook</p>
    </div>
  );
};

const OptimizedProjectsTab = ({ agencyId }: { agencyId: string }) => {
  const { useAgencyProjects } = require('@/hooks/useAgencyProjects');
  const { projects, loading } = useAgencyProjects(agencyId);
  
  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">Optimized Projects</h3>
      <p className="text-sm text-muted-foreground">Loading: {loading ? 'Yes' : 'No'}</p>
      <p className="text-sm">Projects count: {projects.length}</p>
      <p className="text-xs text-green-600 mt-2">✓ Uses useAgencyProjects hook</p>
    </div>
  );
};

export default function AgencyDashboardPageOptimizedDemo() {
  const params = useParams();
  const agencyId = params.agencyId as string;
  const { agency, loading, error } = useAgencyInfo(agencyId);
  const { activeWorkspace, setActiveWorkspace, availableWorkspaces } = useWorkspace();

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
    return <div className="text-center p-8">Agency not found. #1</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-muted rounded-lg">
            <Building className="h-8 w-8 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-bold">{agency.name}</h1>
            <p className="text-muted-foreground">Agency Management Dashboard (Optimized Demo)</p>
            <p className="text-xs text-blue-600 mt-1">💡 Each tab loads its own data independently</p>
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
        
        <TabsContent value="dashboard" className="mt-6">
          <OptimizedDashboardTab agencyId={agencyId} />
        </TabsContent>
        
        <TabsContent value="members" className="mt-6">
          <OptimizedMembersTab agencyId={agencyId} />
        </TabsContent>
        
        <TabsContent value="clients" className="mt-6">
          <OptimizedClientsTab agencyId={agencyId} />
        </TabsContent>
        
        <TabsContent value="projects" className="mt-6">
          <OptimizedProjectsTab agencyId={agencyId} />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Settings</h3>
            <p className="text-sm text-muted-foreground">Settings tab (not optimized in this demo)</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

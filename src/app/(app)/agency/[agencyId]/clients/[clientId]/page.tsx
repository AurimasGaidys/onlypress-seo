// src/app/(app)/agency/[agencyId]/clients/[clientId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, FileText, Settings, Loader2, Building2, Mail, Phone, Calendar, Globe } from 'lucide-react';
import Link from 'next/link';
import { useClientData } from '@/hooks/useClientData';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ProjectsTab from '@/components/clients/ProjectsTab';
import ClientDocumentsTab from '@/components/clients/ClientDocumentsTab';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function ClientDashboardPage() {
  const params = useParams();
  const agencyId = params.agencyId as string;
  const clientId = params.clientId as string;
  
  const { client, projects, documents, loading, error } = useClientData(agencyId, clientId);
  const { setActiveClientId, setActiveProjectId, setActiveWorkspace, availableWorkspaces, activeWorkspace } = useWorkspace();

  // Nustatome aktyvų klientą kai atidarome jo puslapį
  useEffect(() => {
    if (clientId) {
      setActiveClientId(clientId);
      setActiveProjectId(null); // Išvalome projektą kai pereiname į klientą
    }

    // Išvalome kai išeiname iš kliento puslapio
    return () => {
      setActiveClientId(null);
      setActiveProjectId(null);
    };
  }, [clientId, setActiveClientId, setActiveProjectId]);

  // Automatiškai nustatome agency workspace'ą pagal URL
  useEffect(() => {
    if (agencyId && client && !loading) {
      const currentWorkspace = availableWorkspaces.find(ws => ws.id === agencyId);
      if (currentWorkspace && (!activeWorkspace.id || currentWorkspace.id !== activeWorkspace.id)) {
        console.log('Setting workspace from client URL:', agencyId);
        setActiveWorkspace(currentWorkspace);
      }
    }
  }, [agencyId, client, loading, availableWorkspaces, activeWorkspace.id, setActiveWorkspace]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-muted-foreground">Loading client data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center p-8">{error}</div>;
  }
  
  if (!client) {
    return <div className="text-center p-8">Client not found.</div>;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="flex items-start gap-6">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary/10 text-primary text-lg">
            {getInitials(client.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{client.name}</h1>
            {client.status && (
              <Badge 
                variant="secondary" 
                className={getStatusColor(client.status)}
              >
                {client.status}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mb-4">Client Management Dashboard</p>
          
          {/* Client Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={client.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {client.website}
                </a>
              </div>
            )}
            {client.createdAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Client since {formatDate(client.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Projects</h3>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Active projects for this client
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Documents</h3>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              Documents created for this client
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Client Status</h3>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{client.status || 'Active'}</div>
            <p className="text-xs text-muted-foreground">
              Current client status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">
            <Briefcase className="mr-2 h-4 w-4" /> Projects ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" /> Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="settings" asChild>
            <Link href={`/agency/${agencyId}/clients/${clientId}/settings`}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Link>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="mt-6">
          <ProjectsTab 
            projects={projects} 
            clientId={clientId} 
            agencyId={agencyId}
            clientName={client.name}
          />
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6">
          <ClientDocumentsTab 
            documents={documents} 
            clientName={client.name}
            clientId={clientId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// src/components/editor/AssignDocumentDropdown.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAgencyData } from '@/hooks/useAgencyData';
import { useUserAgencies } from '@/hooks/useUserAgencies';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuSub, 
  DropdownMenuSubContent, 
  DropdownMenuSubTrigger, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Building, Briefcase, User, Loader2 } from 'lucide-react';

interface AssignDocumentDropdownProps {
  documentId: string;
  currentAgencyId: string | null;
  currentClientId: string | null;
  currentProjectId: string | null;
}

export default function AssignDocumentDropdown({ 
  documentId, 
  currentAgencyId, 
  currentClientId, 
  currentProjectId 
}: AssignDocumentDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { agencies } = useUserAgencies();
  const { clients, projects } = useAgencyData(currentAgencyId || '');

  const handleAssign = async (agencyId: string | null, clientId: string | null, projectId: string | null) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/documents/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, documentId, agencyId, clientId, projectId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success("Document assignment updated!");
      // Optional: You might want to trigger a refresh of the document data here
      window.location.reload();
    } catch (error) {
      toast.error("Assignment failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonLabel = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (currentProjectId) {
      const project = projects.find(p => p.id === currentProjectId);
      return (
        <>
          <Briefcase className="mr-2 h-4 w-4" />
          {project?.name || 'Assigned'}
        </>
      );
    }
    if (currentClientId) {
      const client = clients.find(c => c.id === currentClientId);
      return (
        <>
          <Building className="mr-2 h-4 w-4" />
          {client?.name || 'Assigned'}
        </>
      );
    }
    return (
      <>
        <User className="mr-2 h-4 w-4" />
        Personal Space
      </>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-[200px] justify-between">
          <span className="truncate">{getButtonLabel()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px]">
        <DropdownMenuLabel>Assign Document To</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handleAssign(null, null, null)}>
          <User className="mr-2 h-4 w-4" />
          <span>My Personal Space</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {agencies.map(agency => (
          <DropdownMenuSub key={agency.id}>
            <DropdownMenuSubTrigger>
              <Building className="mr-2 h-4 w-4" />
              <span>{agency.name}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <AssignAgencySubMenu agencyId={agency.id} onAssign={handleAssign} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Sub-komponentas, kad išvengtume per daug hook'ų viename lygyje
function AssignAgencySubMenu({ 
  agencyId, 
  onAssign 
}: { 
  agencyId: string; 
  onAssign: (agencyId: string | null, clientId: string | null, projectId: string | null) => void; 
}) {
  const { clients, projects, loading } = useAgencyData(agencyId);

  if (loading) return <DropdownMenuItem disabled>Loading...</DropdownMenuItem>;

  return (
    <>
      {clients.map(client => (
        <DropdownMenuSub key={client.id}>
          <DropdownMenuSubTrigger>{client.name}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onSelect={() => onAssign(agencyId, client.id, null)}>
              Assign to client "{client.name}"
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {projects.filter(p => p.clientId === client.id).map(project => (
              <DropdownMenuItem key={project.id} onSelect={() => onAssign(agencyId, client.id, project.id)}>
                <Briefcase className="mr-2 h-4 w-4" />
                {project.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      ))}
      {clients.length === 0 && <DropdownMenuItem disabled>No clients in this agency.</DropdownMenuItem>}
    </>
  );
}

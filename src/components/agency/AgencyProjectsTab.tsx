// src/components/agency/AgencyProjectsTab.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Briefcase, 
  Plus, 
  Search, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Calendar,
  Globe,
  User,
  Filter
} from 'lucide-react';
import EditProjectDialog from './EditProjectDialog';
import DeleteProjectDialog from './DeleteProjectDialog';
import { useAgencyProjects } from '@/hooks/useAgencyProjects';
import { useAgencyClients } from '@/hooks/useAgencyClients';
import CreateProjectDialog from './CreateProjectDialog';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  clientId: string;
  agencyId: string;
  createdAt: { toDate: () => Date };
}

interface AgencyProjectsTabProps {
  agencyId: string;
}

export default function AgencyProjectsTab({ agencyId }: AgencyProjectsTabProps) {
  const { projects } = useAgencyProjects(agencyId);
  const { clients } = useAgencyClients(agencyId);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Filtravimo ir paieškos logika
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = clientFilter === 'all' || project.clientId === clientFilter;
    return matchesSearch && matchesClient;
  });

  // Sortavimo logika
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      case 'client':
        const clientA = clients.find(c => c.id === a.clientId)?.name || '';
        const clientB = clients.find(c => c.id === b.clientId)?.name || '';
        return clientA.localeCompare(clientB);
      default:
        return 0;
    }
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('lt-LT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const handleCreateProject = () => {
    if (clients.length === 0) {
      toast.error("First you need to create at least one client");
      return;
    }
    setIsCreateDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditProject(project);
  };

  const handleDeleteProject = (project: Project) => {
    setDeleteProject(project);
  };

  const handleViewProject = (project: Project) => {
    // Nukreipiam į kliento dashboard su konkrečiu projektu
    router.push(`/agency/${agencyId}/clients/${project.clientId}?projectId=${project.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header su veiksmais */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">
            Manage all your agency projects in one place
          </p>
        </div>
        <Button onClick={handleCreateProject} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Paieška ir filtrai */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Paieška */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Kliento filtras */}
            <div className="w-full lg:w-48">
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sortavimas */}
            <div className="w-full lg:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="client">Sort by Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projektų sąrašas */}
      {sortedProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {projects.length === 0 ? 'No projects yet' : 'No projects found'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {projects.length === 0 
                ? 'Create your first project to get started'
                : 'Try adjusting your search or filters'
              }
            </p>
            {projects.length === 0 && (
              <Button onClick={handleCreateProject}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate">
                        {getClientName(project.clientId)}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    Project
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Website URL */}
                  {project.websiteUrl && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <a 
                        href={project.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary truncate"
                      >
                        {project.websiteUrl}
                      </a>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}

                  {/* Data */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(project.createdAt.toDate())}
                  </div>

                  {/* Veiksmai */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewProject(project)}
                      className="flex-1"
                    >
                      <Briefcase className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditProject(project)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteProject(project)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Statistika */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {clients.filter(client => 
                    projects.some(project => project.clientId === client.id)
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">Active Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sortedProjects.filter(p => p.websiteUrl).length}
                </div>
                <div className="text-sm text-muted-foreground">With Website</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {new Date().getMonth() - projects[0]?.createdAt.toDate().getMonth() < 2 ? 1 : 0}
                </div>
                <div className="text-sm text-muted-foreground">New This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogai */}
      <EditProjectDialog
        open={!!editProject}
        onOpenChange={(open) => !open && setEditProject(null)}
        project={editProject}
        onSuccess={() => setEditProject(null)}
      />

      <DeleteProjectDialog
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
        project={deleteProject}
        onSuccess={() => setDeleteProject(null)}
      />

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        clients={clients}
        agencyId={agencyId}
        onSuccess={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}

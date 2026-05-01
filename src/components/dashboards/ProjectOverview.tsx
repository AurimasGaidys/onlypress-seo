// src/components/dashboards/ProjectOverview.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Briefcase, Calendar, Users, Loader2 } from 'lucide-react';
import { useAgencyData } from '@/hooks/useAgencyData';

export default function ProjectOverview({ agencyId }: { agencyId: string }) {
  // --- PRADĖK PAKEITIMĄ ČIA (1/3): Gauname visus reikiamus duomenis ---
  const { projects, clients, documents, loading } = useAgencyData(agencyId);
  // --- PAKEITIMO PABAIGA ---

  // --- PRADĖK PAKEITIMĄ ČIA (2/3): Apskaičiuojame progresą pagal suplanuotus dokumentus ---
  const projectsWithProgress = useMemo(() => {
    return projects.map(project => {
      const projectDocuments = documents.filter(doc => doc.projectId === project.id);
      
      // --- PRADĖK PAKEITIMĄ ČIA ---
      const scheduledDocuments = projectDocuments.filter(doc => 
        ['scheduled', 'in-review', 'approved', 'published'].includes(doc.status || '')
      );
      
      const publishedDocuments = scheduledDocuments.filter(doc => 
        doc.status === 'published'
      ).length;

      const totalScheduled = scheduledDocuments.length;
      const progress = totalScheduled > 0 ? Math.round((publishedDocuments / totalScheduled) * 100) : 0;
      
      return {
        ...project,
        progress,
        totalTasks: totalScheduled,
        completedTasks: publishedDocuments
      };
      // --- PAKEITIMO PABAIGA ---
      
    }).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [projects, documents]);
  // --- PAKEITIMO PABAIGA ---

  const recentProjects = projectsWithProgress.slice(0, 5);
  
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Project Overview</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (progress: number) => {
    if (progress > 80) return 'bg-green-500 text-white';
    if (progress > 50) return 'bg-yellow-500 text-white';
    return 'bg-secondary text-secondary-foreground';
  };
  
  // --- PRADĖK PAKEITIMĄ ČIA (3/3): Atnaujiname JSX ---
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Project Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentProjects.length === 0 ? (
          <p className="text-muted-foreground">No projects yet. Create your first project to get started!</p>
        ) : (
          <div className="space-y-4">
            {recentProjects.map(project => {
              const client = clients.find(c => c.id === project.clientId);
              
              return (
                <div key={project.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{project.name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {client?.name || 'Unknown Client'}
                      </p>
                    </div>
                    <Badge className={getProgressColor(project.progress)}>
                      {project.progress}%
                    </Badge>
                  </div>
                  <Progress value={project.progress} className="mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown date'}
                    </span>
                    <span>
                      {project.completedTasks} / {project.totalTasks} tasks completed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
  // --- PAKEITIMO PABAIGA ---
}

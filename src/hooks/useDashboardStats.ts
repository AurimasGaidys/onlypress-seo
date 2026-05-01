// src/hooks/useDashboardStats.ts
'use client';

import { useMemo } from 'react';
import { useAgencyData } from './useAgencyData';
import { useAuth } from '@/context/AuthContext';
import { differenceInDays, subMonths, isWithinInterval } from 'date-fns';

// Sąsaja lieka ta pati
interface DashboardStats {
  // KPIs
  revenue: number;
  revenueChange: number;
  activeProjects: number;
  projectsChange: number;
  totalClients: number;
  clientsChange: number;
  publishedDocuments: number;
  documentsChange: number;

  // My Tasks
  documentsToReview: number;
  myDocuments: number;
  
  // Bottom Widgets
  completionRate: number;
  avgProjectDuration: number;
  clientSatisfaction: string;
  recentDocuments: number;
  recentProjects: number;
  activeMembers: number;
  upcomingDeadlines: number;
  scheduledReviews: number;
  pendingApprovals: number;
}

export const useDashboardStats = (agencyId: string) => {
  const { user } = useAuth();
  // --- PRADĖK PAKEITIMĄ ČIA (1/3): Gauname visus reikiamus duomenis ---
  const { clients, projects, documents, members, loading } = useAgencyData(agencyId);
  // --- PAKEITIMO PABAIGA ---

  const stats = useMemo(() => {
    if (loading || !user) {
      return {} as DashboardStats;
    }

    const now = new Date();
    const lastMonthStart = subMonths(now, 1);

    // --- PRADĖK PAKEITIMĄ ČIA (2/3): Realių duomenų skaičiavimas ---

    // 1. KPI kortelių statistika
    const activeProjects = projects.length;
    const totalClients = clients.length;
    const publishedDocuments = documents.filter(doc => doc.status === 'published').length;

    const projectsLastMonth = projects.filter(p => isWithinInterval(new Date(p.createdAt), { start: lastMonthStart, end: now })).length;
    const clientsLastMonth = 0; // Client data doesn't have createdAt, so we'll return 0 for now
    const documentsPublishedLastMonth = documents.filter(d => d.status === 'published' && d.lastEdited && isWithinInterval(new Date(d.lastEdited), { start: lastMonthStart, end: now })).length;
    
    // Paprasta procentinė "pokyčio" logika (galima tobulinti ateityje)
    const projectsChange = projects.length > 0 ? Math.round((projectsLastMonth / projects.length) * 100) : 0;
    const clientsChange = clients.length > 0 ? Math.round((clientsLastMonth / clients.length) * 100) : 0;
    const documentsChange = publishedDocuments > 0 ? Math.round((documentsPublishedLastMonth / publishedDocuments) * 100) : 0;

    // 2. "My Tasks" statistika
    const documentsToReview = documents.filter(doc => doc.status === 'in-review' && doc.userId !== user.uid).length;

    // 3. "Performance Overview" statistika
    const approvedOrPublished = documents.filter(d => ['approved', 'published'].includes(d.status || ''));
    const completionRate = documents.length > 0 ? Math.round((approvedOrPublished.length / documents.length) * 100) : 0;
    
    const projectDurations = projects
      .map(p => differenceInDays(now, new Date(p.createdAt)))
      .filter(days => days > 0);
    const avgProjectDuration = projectDurations.length > 0 
      ? Math.round(projectDurations.reduce((a, b) => a + b, 0) / projectDurations.length) 
      : 0;

    // 4. "Recent Activity" statistika
    const recentDocuments = documents.filter(d => isWithinInterval(new Date(d.createdAt), { start: subMonths(now, 1), end: now })).length;
    const recentProjects = projects.filter(p => isWithinInterval(new Date(p.createdAt), { start: subMonths(now, 1), end: now })).length;
    const activeMembers = members.length; // Paprasta

    // 5. "Upcoming" statistika (supaprastinta)
    const pendingApprovals = documents.filter(d => d.status === 'in-review').length;
    // --- PAKEITIMO PABAIGA ---

    return {
      activeProjects,
      projectsChange,
      totalClients,
      clientsChange,
      publishedDocuments,
      documentsChange,
      documentsToReview,
      myDocuments: documents.filter(doc => doc.userId === user.uid).length,
      completionRate,
      avgProjectDuration,
      clientSatisfaction: '4.7', // Mock data, nes neturime reitingavimo sistemos
      recentDocuments,
      recentProjects,
      activeMembers,
      upcomingDeadlines: 0, // Mock data, nes neturime terminų
      scheduledReviews: documentsToReview,
      pendingApprovals,
      revenue: 0, // Mock
      revenueChange: 0, // Mock
    };
  }, [clients, projects, documents, members, loading, user]);

  return { stats, loading };
};

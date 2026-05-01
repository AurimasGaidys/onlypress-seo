// src/components/agency/DashboardTab.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  Briefcase,
  Download,
  RefreshCw
} from 'lucide-react';
// import { toast } from 'sonner';

// Import our new dashboard components
import KPIStatsCard from '@/components/dashboards/KPIStatsCard';
import QuickActionsPanel from '@/components/dashboards/QuickActionsPanel';
import ActivityFeed from '@/components/dashboards/ActivityFeed';
import ProjectOverview from '@/components/dashboards/ProjectOverview';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardTabProps {
  agencyId: string;
}

export default function DashboardTab({ agencyId }: DashboardTabProps) {
  const [activeTimeRange, setActiveTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { stats, loading: statsLoading } = useDashboardStats(agencyId);
  const { agency, loading: agencyLoading } = useAgencyInfo(agencyId);

  const loading = statsLoading || agencyLoading;

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simple refresh solution - reload the page to fetch fresh data
    window.location.reload();
  };

  // const handleExport = () => {
  //   // Create dashboard data for export
  //   const exportData = {
  //     agencyName: agency?.name || 'Unknown Agency',
  //     exportDate: new Date().toISOString(),
  //     timeRange: activeTimeRange,
  //     stats: stats,
  //     generatedAt: new Date().toLocaleString()
  //   };

  //   // Convert to JSON and download
  //   const dataStr = JSON.stringify(exportData, null, 2);
  //   const dataBlob = new Blob([dataStr], { type: 'application/json' });
  //   const url = URL.createObjectURL(dataBlob);
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.download = `${agency?.name || 'agency'}-dashboard-${activeTimeRange}.json`;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  //   URL.revokeObjectURL(url);

  //   toast.success("Dashboard exported successfully!");
  // };

  const getChangeType = (change: number): 'increase' | 'decrease' | 'neutral' => {
    if (change > 0) return 'increase';
    if (change < 0) return 'decrease';
    return 'neutral';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-72" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{agency?.name || 'Agency'} Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening in your agency today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(['7D', '30D', '90D'] as const).map((range) => (
              <Button
                key={range}
                size="sm"
                variant={activeTimeRange === `${range.toLowerCase()}d` ? 'default' : 'ghost'}
                onClick={() => setActiveTimeRange(`${range.toLowerCase()}d` as '7d' | '30d' | '90d')}
                className="h-7 text-xs"
              >
                {range}
              </Button>
            ))}
          </div>
       
          <Button size="sm" variant="outline" className="h-8" disabled={isRefreshing} onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          {/* <Button size="sm" variant="outline" className="h-8" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button> */}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPIStatsCard
          title="Active Projects"
          value={stats?.activeProjects || 0}
          change={stats?.projectsChange || 0}
          changeType={getChangeType(stats?.projectsChange || 0)}
          icon={<Briefcase />}
        />
        <KPIStatsCard
          title="Total Clients"
          value={stats?.totalClients || 0}
          change={stats?.clientsChange || 0}
          changeType={getChangeType(stats?.clientsChange || 0)}
          icon={<Users />}
        />
        <KPIStatsCard
          title="Documents Published"
          value={stats?.publishedDocuments || 0}
          change={stats?.documentsChange || 0}
          changeType={getChangeType(stats?.documentsChange || 0)}
          icon={<FileText />}
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <ProjectOverview agencyId={agencyId} />
          <ActivityFeed agencyId={agencyId} />
        </div>
        <div className="space-y-6">
          {/* todo implement tasks */}
          {/* <TasksWidget agencyId={agencyId} /> */}
          <QuickActionsPanel agencyId={agencyId} />
        </div>
      </div>

      {/* Bottom Stats Row
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Performance Overview</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Completion Rate</span><span>{stats?.completionRate}%</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg. Project Duration</span><span>{stats?.avgProjectDuration} days</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Client Satisfaction</span><span>{stats?.clientSatisfaction}/5</span></div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Documents Created</span><span>{stats?.recentDocuments}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Projects Updated</span><span>{stats?.recentProjects}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Team Members Active</span><span>{stats?.activeMembers}</span></div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Upcoming</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deadlines This Week</span><span>{stats?.upcomingDeadlines}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Scheduled Reviews</span><span>{stats?.scheduledReviews}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pending Approvals</span><span>{stats?.pendingApprovals}</span></div>
            </CardContent>
        </Card>
      </div>
    */}
    </div>
  );
}

// src/components/dashboards/ActivityFeed.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Activity, Clock } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { formatDistanceToNow } from 'date-fns';

interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: { toDate: () => Date };
}

export default function ActivityFeed({ agencyId }: { agencyId: string }) {
  const { logs, loading, error } = useAuditLogs(agencyId);

  const renderLogAction = (log: AuditLog) => {
    switch (log.action) {
      case 'client_created':
        return `created a new client: ${log.details.clientName as string}`;
      case 'project_created':
        return `created a new project: ${log.details.projectName as string}`;
      case 'member_added':
        return `added a new member: ${log.details.invitedEmail as string}`;
      case 'member_invited':
        return `invited a new member: ${log.details.invitedEmail as string}`;
      default:
        return log.action.replace(/_/g, ' ');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : error ? (
          <p className="text-destructive">Failed to load activity: {error}</p>
        ) : logs.length === 0 ? (
          <p className="text-muted-foreground">No recent activity.</p>
        ) : (
          <ul className="space-y-4">
            {logs.map(log => (
              <li key={log.id} className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p>
                    <span className="font-semibold">{log.userEmail}</span> {renderLogAction(log)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

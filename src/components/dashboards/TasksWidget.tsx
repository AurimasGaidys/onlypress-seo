// src/components/dashboards/TasksWidget.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, ListTodo } from 'lucide-react';
import { useAgencyData } from '@/hooks/useAgencyData';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function TasksWidget({ agencyId }: { agencyId: string }) {
  const { user } = useAuth();
  const { documents, loading } = useAgencyData(agencyId);

  if (loading || !user) {
    return <Card><CardHeader><CardTitle>My Tasks</CardTitle></CardHeader><CardContent>Loading...</CardContent></Card>;
  }

  const documentsToReview = documents.filter(d => d.status === 'in-review' && d.userId !== user.uid).slice(0, 3);
  const myRecentDrafts = documents.filter(d => d.status === 'draft' && d.userId === user.uid).slice(0, 3);
  const totalTasks = documentsToReview.length + myRecentDrafts.length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          My Tasks
        </CardTitle>
        <Badge variant={totalTasks > 0 ? 'default' : 'secondary'}>{totalTasks} Active</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Pending Review ({documentsToReview.length})</h4>
            {documentsToReview.length > 0 ? (
                <div className="space-y-2">
                    {documentsToReview.map(doc => (
                        <div key={doc.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted">
                            <span className="truncate pr-2">{doc.title}</span>
                            <Link href={`/docs/${doc.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-muted-foreground">All clear!</p>}
        </div>
        <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">My Recent Drafts ({myRecentDrafts.length})</h4>
             {myRecentDrafts.length > 0 ? (
                <div className="space-y-2">
                    {myRecentDrafts.map(doc => (
                        <div key={doc.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted">
                           <span className="truncate pr-2">{doc.title}</span>
                           <Link href={`/docs/${doc.id}`}><Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button></Link>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-muted-foreground">No recent drafts.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

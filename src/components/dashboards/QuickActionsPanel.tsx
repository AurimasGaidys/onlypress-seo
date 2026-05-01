// src/components/dashboards/QuickActionsPanel.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Building, Briefcase, Users, Zap } from 'lucide-react';

// Importuojame dialogus
import CreateProjectDialog from '../agency/CreateProjectDialog';
import AddClientDialog from '../agency/AddClientDialog';
import InviteMemberDialog from '../agency/InviteMemberDialog';
import { useAgencyData } from '@/hooks/useAgencyData';

export default function QuickActionsPanel({ agencyId }: { agencyId: string }) {
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  const [isClientDialogOpen, setClientDialogOpen] = useState(false);
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isComingSoonDialogOpen, setComingSoonDialogOpen] = useState(false);
  
  const { clients } = useAgencyData(agencyId);

  return (
    <>
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
              <Button onClick={() => setProjectDialogOpen(true)} variant="outline" className="h-24 flex-col gap-2">
                  <Briefcase className="h-6 w-6" />
                  <span>New Project</span>
              </Button>
              <Button onClick={() => setClientDialogOpen(true)} variant="outline" className="h-24 flex-col gap-2">
                  <Building className="h-6 w-6" />
                  <span>Add Client</span>
              </Button>
              <Button onClick={() => setInviteDialogOpen(true)} variant="outline" className="h-24 flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Invite Member</span>
              </Button>
              <Button onClick={() => setComingSoonDialogOpen(true)} variant="outline" className="h-24 flex-col gap-2">
                  <Plus className="h-6 w-6" />
                  <span>Create Report</span>
              </Button>
          </CardContent>
      </Card>

      {/* Dialogų komponentai */}
      <CreateProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        clients={clients}
        agencyId={agencyId}
        onSuccess={() => setProjectDialogOpen(false)}
      />
      <AddClientDialog
        isOpen={isClientDialogOpen}
        setIsOpen={setClientDialogOpen}
        agencyId={agencyId}
        onClientAdded={() => setClientDialogOpen(false)}
      />
      <InviteMemberDialog
        isOpen={isInviteDialogOpen}
        setIsOpen={setInviteDialogOpen}
        agencyId={agencyId}
      />
      
      {/* Coming Soon Modal */}
      <Dialog open={isComingSoonDialogOpen} onOpenChange={setComingSoonDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>🚀 Coming Soon</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">Report Generation</p>
            <p className="text-muted-foreground">
              This feature is currently under development. Soon you'll be able to generate comprehensive reports for your clients, projects, and agency performance.
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setComingSoonDialogOpen(false)}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

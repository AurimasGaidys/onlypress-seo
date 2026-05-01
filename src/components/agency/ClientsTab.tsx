// src/components/agency/ClientsTab.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Plus, Mail, Phone, Calendar, Edit, Trash2, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAgencyClients } from '@/hooks/useAgencyClients';
import AddClientDialog from './AddClientDialog';
import EditClientDialog from './EditClientDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  createdAt?: string;
  status?: 'active' | 'inactive' | 'pending';
}

interface ClientsTabProps {
  agencyId: string;
}

export default function ClientsTab({ agencyId }: ClientsTabProps) {
  const { clients } = useAgencyClients(agencyId);
  const { user } = useAuth();
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddClient = () => {
    setIsAddClientOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditClient(client);
  };

  const handleDeleteClient = (client: Client) => {
    setDeleteClient(client);
  };

  const confirmDeleteClient = async () => {
    if (!user || !deleteClient) return;
    
    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/delete-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken, 
          agencyId, 
          clientId: deleteClient.id
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Client ${deleteClient.name} deleted successfully!`);
      setDeleteClient(null);
    } catch (error) {
      toast.error("Failed to Delete Client", { 
        description: error instanceof Error ? error.message : "Unknown error" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Clients</h2>
          <p className="text-muted-foreground">
            Manage your agency clients and their projects
          </p>
        </div>
        <Button 
          onClick={handleAddClient}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id} className="relative hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{client.name}</p>
                    {client.status && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs mt-1 ${getStatusColor(client.status)}`}
                      >
                        {client.status}
                      </Badge>
                    )}
                  </div>
                </div>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{client.phone}</span>
                  </div>
                )}
                {client.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Added {formatDate(client.createdAt)}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/agency/${agencyId}/clients/${client.id}`} className="flex-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEditClient(client)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteClient(client)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your first client to manage their projects and content
            </p>
            <Button onClick={handleAddClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Client
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Client Management</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Add and manage client information including contact details</p>
          <p>• Track client status and project history</p>
          <p>• Organize content and documents by client</p>
          <p>• Collaborate with team members on client projects</p>
        </div>
      </div>

      <AddClientDialog 
        isOpen={isAddClientOpen} 
        setIsOpen={setIsAddClientOpen} 
        agencyId={agencyId}
        onClientAdded={() => setIsAddClientOpen(false)}
      />

      {editClient && (
        <EditClientDialog 
          isOpen={!!editClient} 
          setIsOpen={(open) => !open && setEditClient(null)} 
          agencyId={agencyId}
          client={editClient}
          onClientUpdated={(client) => {
            // update cleint in server
            
            setEditClient(null);
          }}
        />
      )}

      {deleteClient && (
        <AlertDialog open={!!deleteClient} onOpenChange={(open) => !open && setDeleteClient(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{deleteClient.name}&rdquo;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteClient}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

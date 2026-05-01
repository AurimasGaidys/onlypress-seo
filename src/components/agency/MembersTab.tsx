// src/components/agency/MembersTab.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, User, Crown, UserPlus, Mail, Edit, Clock, X, Users, Trash2Icon } from 'lucide-react';
import InviteMemberDialog from './InviteMemberDialog';
import EditRoleDialog from './EditRoleDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import moment from 'moment';

interface Member {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
}

import { useAgencyMembers } from '@/hooks/useAgencyMembers';

interface MembersTabProps {
  agencyId: string;
}

export default function MembersTab({ agencyId }: MembersTabProps) {
  const { members, pendingInvites } = useAgencyMembers(agencyId);
  const { user } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editRoleMember, setEditRoleMember] = useState<Member | null>(null);
  const [editNameMember, setEditNameMember] = useState<Member | null>(null);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [removeMember, setRemoveMember] = useState<Member | null>(null);

  const handleEditRole = (member: Member) => {
    setEditRoleMember(member);
  };

  const handleEditName = (member: Member) => {
    setEditNameMember(member);
    setNewDisplayName(member.displayName || '');
  };

  const confirmEditName = async () => {
    if (!editNameMember || !user || !newDisplayName.trim()) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/update-member-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          agencyId,
          memberUid: editNameMember.uid,
          newDisplayName: newDisplayName.trim()
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Name updated successfully!`);
      setEditNameMember(null);
      setNewDisplayName('');
    } catch (error) {
      toast.error("Failed to update name", { description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const handleRemoveMember = (member: Member) => {
    setRemoveMember(member);
  };

  const confirmRemoveMember = async () => {
    if (!removeMember || !user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/remove-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          agencyId,
          memberUid: removeMember.uid
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Member ${removeMember.email} removed successfully!`);
      setRemoveMember(null);
    } catch (error) {
      toast.error("Failed to Remove Member", { description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? (
      <Crown className="h-4 w-4 text-yellow-500" />
    ) : (
      <User className="h-4 w-4 text-blue-500" />
    );
  };

  const getInitials = (displayName: string) => {
    // Jei nėra displayName, grąžiname tuščią string'ą (tuščias avatar)
    if (!displayName) {
      return '';
    }

    const name = displayName;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  const handleCancelInvite = async (email: string) => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/cancel-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          agencyId,
          email
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Invitation cancelled successfully!`);
    } catch (error) {
      toast.error("Failed to cancel invitation", { description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const formatInviteDate = (dateString: string) => {
    const date = new Date(dateString);
    return moment(date).fromNow();
    // return moveMessagePortToContext. date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">
            Manage your agency team members and their permissions
          </p>
        </div>
        <Button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Pending Invitations ({pendingInvites.length})</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingInvites.map((invite) => (
              <Card key={invite.email} className="relative border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-small max-w-32 truncate text-muted-foreground">
                          {invite.email}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {getRoleIcon(invite.role)}
                          <Badge variant={getRoleBadgeVariant(invite.role)} className="text-xs">
                            {invite.role}
                          </Badge>
                          <Badge variant="outline" className="text-xs ml-1">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="h-3 w-3" />
                    <span className="truncate">Invited {formatInviteDate(invite.invitedAt)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleCancelInvite(invite.email)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel Invite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Members Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Active Members ({members.length})</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.uid} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.displayName || (member.email ? (
                          <span>
                            {member.email}
                            <Button variant="ghost" size="sm" className="ml-2 h-6 px-2" onClick={() => handleEditName(member)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </span>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleEditName(member)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        ))}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {getRoleIcon(member.role)}
                        <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditName(member)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Name
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditRole(member)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Role
                  </Button>
                  <div className="flex-1" />
                  {member.role !== 'admin' && (
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveMember(member)}>
                      <Trash2Icon className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {members.length === 0 && pendingInvites.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No members yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start building your team by inviting your first member
              </p>
              <Button onClick={() => setIsInviteOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <InviteMemberDialog isOpen={isInviteOpen} setIsOpen={setIsInviteOpen} agencyId={agencyId} />

      {editRoleMember && (
        <EditRoleDialog
          isOpen={!!editRoleMember}
          setIsOpen={(open) => !open && setEditRoleMember(null)}
          agencyId={agencyId}
          memberUid={editRoleMember.uid}
          memberEmail={editRoleMember.email}
          currentRole={editRoleMember.role}
          onRoleUpdated={() => setEditRoleMember(null)}
        />
      )}

      {removeMember && (
        <AlertDialog open={!!removeMember} onOpenChange={(open) => !open && setRemoveMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {removeMember.email} from the agency?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remove Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {editNameMember && (
        <Dialog open={!!editNameMember} onOpenChange={(open) => !open && setEditNameMember(null)}>
          <DialogHeader>
            <DialogTitle>Edit Member Name</DialogTitle>
            <DialogDescription>
              Change the display name for {editNameMember.email}
            </DialogDescription>
          </DialogHeader>
          <DialogContent>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  className="w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditNameMember(null)}>
                Cancel
              </Button>
              <Button onClick={confirmEditName}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Role Permissions Info */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Role Permissions</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-start gap-2">
            <Crown className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Admin</p>
              <p className="text-xs text-muted-foreground">
                Full access to agency settings, members, clients, and all content
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Member</p>
              <p className="text-xs text-muted-foreground">
                Can create and edit content, manage clients, but limited access to settings
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

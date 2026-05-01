// src/components/agency/EditRoleDialog.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface EditRoleDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agencyId: string;
  memberUid: string;
  memberEmail: string;
  currentRole: 'admin' | 'member';
  onRoleUpdated: () => void;
}

export default function EditRoleDialog({ 
  isOpen, 
  setIsOpen, 
  agencyId, 
  memberUid, 
  memberEmail, 
  currentRole,
  onRoleUpdated 
}: EditRoleDialogProps) {
  const [newRole, setNewRole] = useState<'admin' | 'member'>(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleRoleUpdate = async () => {
    if (!user || newRole === currentRole) {
      setIsOpen(false);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken, 
          agencyId, 
          memberUid, 
          newRole 
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Role updated for ${memberEmail}!`);
      setIsOpen(false);
      onRoleUpdated();
    } catch (error) {
      toast.error("Role Update Failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Member Role</DialogTitle>
          <DialogDescription>
            Change the role for {memberEmail}. Admins have full access to agency settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label htmlFor="role">New Role</Label>
          <Select value={newRole} onValueChange={(value: 'admin' | 'member') => setNewRole(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            <p><strong>Member:</strong> Can create content and manage clients</p>
            <p><strong>Admin:</strong> Full access to agency settings and member management</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleRoleUpdate} disabled={isSubmitting || newRole === currentRole}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

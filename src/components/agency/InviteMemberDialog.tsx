// src/components/agency/InviteMemberDialog.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShieldCheck, User } from 'lucide-react';

interface InviteMemberDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agencyId: string;
}

export default function InviteMemberDialog({ isOpen, setIsOpen, agencyId }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async () => {
    if (!user || !email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!validateEmail(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken, 
          agencyId, 
          emailToInvite: email.trim(), 
          role 
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400 && data.error?.includes('already a member')) {
          toast.error("User is already a member of this agency");
        } else if (response.status === 403) {
          toast.error("You don't have permission to invite members");
        } else {
          throw new Error(data.error);
        }
        return;
      }

      toast.success(`Invitation sent to ${email}!`, {
        description: data.isExistingUser 
          ? "They can accept by clicking the link in their email." 
          : "They'll be added after registration."
      });
      setEmail('');
      setRole('member');
      setIsOpen(false);
    } catch (error) {
      toast.error("Invitation Failed", { 
        description: error instanceof Error ? error.message : "Unknown error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting && email.trim() && validateEmail(email.trim())) {
      handleInvite();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Enter the email address of the person you want to invite to join your agency.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@example.com" 
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              className={email && !validateEmail(email) ? 'border-red-500' : ''}
            />
            {email && !validateEmail(email) && (
              <p className="text-sm text-red-500">Please enter a valid email address</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'member') => setRole(value)} disabled={isSubmitting}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Member</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {role === 'admin' 
                ? 'Admins can manage members, settings, and all agency resources.'
                : 'Members can collaborate on projects and access shared resources.'
              }
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleInvite} 
            disabled={isSubmitting || !email.trim() || !validateEmail(email.trim())}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

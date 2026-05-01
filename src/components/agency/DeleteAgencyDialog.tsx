// src/components/agency/DeleteAgencyDialog.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteAgencyDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agencyId: string;
  agencyName: string;
  onAgencyDeleted: () => void;
}

export default function DeleteAgencyDialog({ 
  isOpen, 
  setIsOpen, 
  agencyId,
  agencyName,
  onAgencyDeleted 
}: DeleteAgencyDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!user || confirmText !== `DELETE ${agencyName.toUpperCase()}`) return;
    
    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, agencyId }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Agency "${agencyName}" deleted successfully!`);
      setIsOpen(false);
      setConfirmText('');
      onAgencyDeleted();
    } catch (error) {
      toast.error("Failed to Delete Agency", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConfirmEnabled = confirmText === `DELETE ${agencyName.toUpperCase()}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Agency
          </DialogTitle>
          <DialogDescription>
            This action <strong>cannot be undone</strong> and will permanently delete:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-destructive">This will delete:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>The agency and all its settings</li>
                  <li>All members from this agency</li>
                  <li>All clients and their data</li>
                  <li>All related projects and content</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-text">
              Type <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                DELETE {agencyName.toUpperCase()}
              </code> to confirm
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`DELETE ${agencyName.toUpperCase()}`}
              className="font-mono"
            />
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
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isSubmitting || !isConfirmEnabled}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Agency
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

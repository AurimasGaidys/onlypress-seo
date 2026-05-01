'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  day: Date;
  projectId: string;
  agencyId: string;
  initialContent: string;
  onSave: () => void;
}

export default function NoteModal({
  isOpen,
  setIsOpen,
  day,
  projectId,
  agencyId,
  initialContent,
  onSave
}: NoteModalProps) {
  const [content, setContent] = useState(initialContent || '');
  const [isSaving, setIsSaving] = useState(false);

  // Reset content when modal opens with different initial content
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent || '');
    }
  }, [isOpen, initialContent]);

  const handleSave = async () => {
    if (!projectId) {
      toast.error("Project ID is required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/scheduler/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: await getCurrentUserIdToken(), // You'll need to implement this function
          agencyId,
          projectId,
          day: format(day, 'yyyy-MM-dd'),
          content
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save note');
      }

      toast.success(content ? 'Note saved successfully' : 'Note deleted successfully');
      onSave();
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Note for {format(day, 'MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Add a note for this day..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
            disabled={isSaving}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {content ? 'Save' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get current user's ID token
// You may need to adjust this based on your auth context
async function getCurrentUserIdToken(): Promise<string> {
  // This should match your auth implementation
  // For example, if you're using Firebase Auth:
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw new Error('Authentication required');
  }
}

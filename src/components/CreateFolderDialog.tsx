// src/components/CreateFolderDialog.tsx
'use client';

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateFolderDialogProps {
  folderId?: string;
  children?: React.ReactNode;
}

export default function CreateFolderDialog({ folderId, children }: CreateFolderDialogProps) {
  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { activeWorkspace, activeClientId, activeProjectId } = useWorkspace();
  
  // Get current folderId from URL if not provided as prop
  const searchParams = useSearchParams();
  const currentFolderId = folderId || searchParams.get('folderId') || undefined;

  const handleCreate = async () => {
    if (!user || !name.trim()) {
      toast.error('Folder name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const folderData = {
        name: name.trim(),
        userId: user.uid,
        parentId: currentFolderId || null,
        createdAt: serverTimestamp(),
      };

      // Set agencyId based on workspace type
      if (activeWorkspace.type === 'user') {
        // Personal workspace - use personal agency ID format
        folderData.agencyId = `personal_${user.uid}`;
        folderData.clientId = activeClientId;
        folderData.projectId = activeProjectId;
      } else {
        // Agency workspace - use agency ID directly
        folderData.agencyId = activeWorkspace.id;
      }

      await addDoc(collection(db, 'folders'), folderData);
      toast.success('Folder created successfully!');
      setName('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <span>New Folder</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Enter a name for your new folder. This will help you organize your documents.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
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
          <Button onClick={handleCreate} disabled={isSubmitting || !name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import FolderCard from '@/components/folder-card';
import NewFolderCard from '@/components/NewFolderCard';
import CreateFolderDialog from '@/components/CreateFolderDialog';
import { useUserFolders } from '@/hooks/useUserFolders';

export default function FoldersPage() {
  const { folders, loading } = useUserFolders();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this folder? All documents inside will remain.')) {
      return;
    }

    setDeletingIds(prev => new Set([...prev, id]));

    try {
      await deleteDoc(doc(db, 'folders', id));
      toast.success('Folder deleted successfully!');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder.');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Folders</h1>
      </div>

      {/* Empty state */}
      {folders.length === 0 ? (
        <div className="text-center text-muted-foreground h-64 flex flex-col justify-center items-center">
          <p>You don't have any folders yet.</p>
          <p className="text-sm mt-2">Create folders to organize your documents.</p>
          <CreateFolderDialog />
        </div>
      ) : (
        /* Folders Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <NewFolderCard />
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onDelete={handleDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

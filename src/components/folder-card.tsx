'use client';

import { useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

import { Folder as FolderIcon, Pen, MoreVertical, Trash2, FileText, FolderOpen } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import Link from 'next/link';
import { Folder } from '@/types/folder';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface FolderCardProps {
  folder: Folder;
  onDelete: (id: string) => void;
  documentCount?: number;
  folderCount?: number;
  agencyId?: string; // Pridėtas agencyId prop
}

export default function FolderCard({ folder, onDelete, documentCount, folderCount, agencyId }: FolderCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const createdAt = folder.createdAt instanceof Timestamp ? folder.createdAt.toDate() : new Date(folder.createdAt);

  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${folder.id}`, // <--- Svarbus prefiksas!
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: `folder-${folder.id}`,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1, // <--- Tempimo metu padaryti permatomą
  };

  // Apjunkime ref'us
  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node);
    setDraggableRef(node);
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === folder.name) {
      setIsRenaming(false);
      return;
    }
    try {
      const folderRef = doc(db, 'folders', folder.id);
      await updateDoc(folderRef, { name: newName.trim() });
      toast.success("Folder renamed.");
    } catch {
      toast.error("Failed to rename folder.");
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div ref={combinedRef} style={style} {...(!isRenaming && listeners)} {...(!isRenaming && attributes)} className={cn("group", !isRenaming && "cursor-grab")}>
      <Card className={cn(
        "hover:shadow-lg transition-all relative",
        isOver && "border-primary ring-2 ring-primary bg-primary/10" // <-- Stilius, kai tempiama virš aplanko
      )}>
        <CardContent className="p-0">
          {/* Pervadinimo logika */}
          {isRenaming ? (
            <div className="p-6 flex flex-col items-center text-center">
              <FolderIcon className="h-20 w-20 text-primary mb-3" />
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
              />
            </div>
          ) : (
            <Link href={
              agencyId
                ? `/agency/${agencyId}/documents?folderId=${folder.id}`
                : `/?folderId=${folder.id}`
            }>
              <div className="flex h-full min-h-[178px]">
                <div className="flex flex-col items-center text-center p-4 w-full mt-2">
                  <FolderIcon className="h-20 w-20 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-2 truncate">{folder.name}</h3>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-2">
                    {documentCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{documentCount} {documentCount === 1 ? 'file' : 'files'}</span>
                      </div>
                    )}
                    {folderCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <FolderOpen className="h-4 w-4" />
                        <span>{folderCount} {folderCount === 1 ? 'folder' : 'folders'}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {formatDistanceToNow(createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Actions menu - shown on hover, hidden when renaming */}
          {!isRenaming && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()} // SVARBUS PATAISYMAS
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsRenaming(true); }}>
                    <Pen className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => { e.preventDefault(); onDelete(folder.id); }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

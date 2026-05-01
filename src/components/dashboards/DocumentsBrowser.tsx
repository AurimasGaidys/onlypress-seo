// src/components/dashboards/DocumentsBrowser.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import { Loader2 } from 'lucide-react';

import { useUserDocuments } from '@/hooks/useUserDocuments';
import { useUserFolders } from '@/hooks/useUserFolders';
import { useFolderContentsCount } from '@/hooks/useFolderContentsCount';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

import DocumentCard from '@/components/document-card';
import FolderCard from '@/components/folder-card';
import NewFolderCard from '@/components/NewFolderCard';
import FolderBreadcrumbs from '@/components/FolderBreadcrumbs';
import { deleteDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { PlusCircle, ArrowUpLeft } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import CreateDocumentDialog from '../creation-hub/CreateDocumentDialog';
import { useWorkspace } from '@/context/WorkspaceContext';

// NewDocumentCardWithDialog component
function NewDocumentCardWithDialog({ activeId, folderId }: { activeId: string | null; folderId?: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'move-to-root-droppable',
  });

  const isDragging = !!activeId;
  const showAsDropZone = isDragging && !!folderId;

  if (showAsDropZone) {
    return (
      <Card
        ref={setNodeRef}
        className={cn(
          "flex h-full flex-col items-center justify-center border-2 border-dashed transition-colors",
          isOver ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-primary/50"
        )}
      >
        <ArrowUpLeft className="h-12 w-12 text-primary" />
        <p className="mt-4 font-medium text-primary">Move to Root</p>
      </Card>
    );
  }

  return (
    <CreateDocumentDialog>
      <Card className="flex h-full flex-col items-center justify-center border-2 border-dashed bg-muted/50 hover:border-primary/50 hover:bg-muted transition-colors cursor-pointer">
        <PlusCircle className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 font-medium text-muted-foreground">Generate New Article</p>
      </Card>
    </CreateDocumentDialog>
  );
}

export default function DocumentsBrowser() {
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId') || undefined;
  const [activeId, setActiveId] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace(); // Pridėtas workspace hook

  const { documents, loading: docsLoading, refetch: refetchDocuments } = useUserDocuments(folderId);
  const { folders, loading: foldersLoading, refetch: refetchFolders } = useUserFolders(folderId);
  
  // Get document and folder counts for folders
  const folderIds = useMemo(() => folders.map(folder => folder.id), [folders]);
  const { contentsCount } = useFolderContentsCount(folderIds);
  
  // Pridėtas effect kuris atnaujina duomenis kai pasikeičia workspace
  useEffect(() => {
    console.log('Workspace changed:', activeWorkspace);
    // Atnaujiname duomenis kai pasikeičia workspace
    refetchDocuments();
    refetchFolders();
  }, [activeWorkspace.type, activeWorkspace.id, refetchDocuments, refetchFolders]);
  
  // Debug logging
  useEffect(() => {
    console.log('Folder IDs:', folderIds);
    console.log('Contents counts:', contentsCount);
    console.log('Documents:', documents);
    console.log('Folders:', folders);
  }, [folderIds, contentsCount, documents, folders]);
  
  const loading = docsLoading || foldersLoading;

  // DND jutikliai
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 8,
      },
    })
  );

  // Aktyvaus elemento nustatymas DragOverlay
  const activeDocument = useMemo(() => {
    if (!activeId || !activeId.startsWith('doc-')) return null;
    const docId = activeId.replace('doc-', '');
    return documents.find(d => d.id === docId);
  }, [activeId, documents]);

  const activeFolder = useMemo(() => {
    if (!activeId || !activeId.startsWith('folder-')) return null;
    const folderId = activeId.replace('folder-', '');
    return folders.find(f => f.id === folderId);
  }, [activeId, folders]);

  // Drag-and-Drop funkcijos
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    // Atvejis 1: Perkeliama į kitą aplanką
    if (activeIdStr !== overIdStr) {
      if (activeIdStr.startsWith('doc-') && overIdStr.startsWith('folder-')) {
        const documentId = activeIdStr.replace('doc-', '');
        const targetFolderId = overIdStr.replace('folder-', '');
        try {
          await updateDoc(doc(db, 'documents', documentId), { 
            folderId: targetFolderId, 
            lastEdited: serverTimestamp() 
          });
          toast.success("Document moved to folder.");
          // Atnaujiname duomenis po perkėlimo
          refetchDocuments();
        } catch (error) {
          console.error("Failed to move document:", error);
          toast.error("Failed to move document.");
        }
        return;
      }

      if (activeIdStr.startsWith('folder-') && overIdStr.startsWith('folder-')) {
        const movedFolderId = activeIdStr.replace('folder-', '');
        const targetFolderId = overIdStr.replace('folder-', '');
        try {
          await updateDoc(doc(db, 'folders', movedFolderId), { parentId: targetFolderId });
          toast.success("Folder moved successfully.");
          // Atnaujiname duomenis po perkėlimo
          refetchFolders();
        } catch (error) {
          console.error("Failed to move folder:", error);
          toast.error("Failed to move folder.");
        }
        return;
      }
    }

    // Atvejis 2: Perkeliama į root
    if (overIdStr === 'move-to-root-droppable') {
      if (activeIdStr.startsWith('doc-')) {
        const documentId = activeIdStr.replace('doc-', '');
        try {
          await updateDoc(doc(db, 'documents', documentId), { 
            folderId: null, 
            lastEdited: serverTimestamp() 
          });
          toast.success("Document moved to root.");
          // Atnaujiname duomenis po perkėlimo
          refetchDocuments();
        } catch (error) {
          console.error("Failed to move document to root:", error);
          toast.error("Failed to move document to root.");
        }
      } else if (activeIdStr.startsWith('folder-')) {
        const folderIdToMove = activeIdStr.replace('folder-', '');
        try {
          await updateDoc(doc(db, 'folders', folderIdToMove), { parentId: null });
          toast.success("Folder moved to root.");
          // Atnaujiname duomenis po perkėlimo
          refetchFolders();
        } catch (error) {
          console.error("Failed to move folder to root:", error);
          toast.error("Failed to move folder.");
        }
      }
    }
  };

  const handleFolderDelete = async (folderId: string) => {
    if (!window.confirm("Are you sure you want to delete this folder? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'folders', folderId));
      toast.success("Folder deleted successfully.");
      // Atnaujiname duomenis po trynimo
      refetchFolders();
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("Failed to delete folder.");
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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <FolderBreadcrumbs 
          folderId={folderId} 
          agencyId={activeWorkspace.type === 'agency' ? activeWorkspace.id || undefined : undefined}
        />

        {/* Grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* New items */}
          <NewFolderCard />
          {/* --- PRADĖK PAKEITIMĄ ČIA --- */}
          <NewDocumentCardWithDialog activeId={activeId} folderId={folderId} />
          {/* --- PAKEITIMO PABAIGA --- */}

          {/* Folders */}
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onDelete={handleFolderDelete}
              documentCount={contentsCount[folder.id]?.documents}
              folderCount={contentsCount[folder.id]?.folders}
              agencyId={activeWorkspace.type === 'agency' ? activeWorkspace.id || undefined : undefined}
            />
          ))}

          {/* Documents */}
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>

        {/* Empty state */}
        {folders.length === 0 && documents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No documents or folders yet. Create your first one!</p>
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div style={{ transform: 'rotate(2deg)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
            {activeId.startsWith('doc-') && activeDocument ? (
              <DocumentCard doc={activeDocument} />
            ) : activeId.startsWith('folder-') && activeFolder ? (
              <FolderCard folder={activeFolder} onDelete={() => {}} />
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

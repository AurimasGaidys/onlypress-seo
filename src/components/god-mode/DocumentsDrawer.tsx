// src/components/god-mode/DocumentsDrawer.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

// UI Komponentai
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X, Search, LayoutGrid, List, PlusCircle } from 'lucide-react';

// Komponentai
import FolderBreadcrumbs from '@/components/FolderBreadcrumbs';
import DocumentCard from '@/components/document-card';
import FolderCard from '@/components/folder-card';
import DocumentListRow from '@/components/DocumentListRow';
import CreateFolderDialog from '@/components/CreateFolderDialog';

// Hooks ir logika
import { useUserDocuments } from '@/hooks/useUserDocuments';
import { useUserFolders } from '@/hooks/useUserFolders';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface DocumentsDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function DocumentsDrawer({ isOpen, setIsOpen }: DocumentsDrawerProps) {
  const router = useRouter();
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sortBy, setSortBy] = useState('lastEdited');
  const [viewType, setViewType] = useState('grid');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Naudojame esamus hooks duomenims gauti
  const { documents, loading: docsLoading } = useUserDocuments(currentFolderId);
  const { folders, loading: foldersLoading } = useUserFolders(currentFolderId);
  const loading = docsLoading || foldersLoading;

  // DND jutikliai, kaip ir pagrindiniame puslapyje
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 8,
      },
    })
  );

  // Sujungiame aplankus ir dokumentus į vieną masyvą, kad būtų patogu atvaizduoti
  const gridItems = useMemo(() => {
    return [
      ...folders.map(folder => ({ type: 'folder' as const, data: folder })),
      ...documents.map(doc => ({ type: 'document' as const, data: doc }))
    ];
  }, [folders, documents]);

  const sortedAndFilteredDocuments = useMemo(() => {
    const filtered = debouncedSearchTerm
      ? documents.filter(doc => doc.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      : documents;

    const sorted = [...filtered];
    if (sortBy === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    // `lastEdited` yra numatytasis rūšiavimas iš `useUserDocuments`
    return sorted;
  }, [documents, debouncedSearchTerm, sortBy]);

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

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleDocumentClick = (documentId: string) => {
    setIsOpen(false);
    // Naudojame router.push, kad pakeistume URL ir perkrautume puslapį su nauju dokumentu
    router.push(`/docs/${documentId}`);
  };

  // Drag-and-Drop funkcijos (nukopijuotos iš page.tsx)
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
          await updateDoc(doc(db, 'documents', documentId), { folderId: targetFolderId, lastEdited: serverTimestamp() });
          toast.success("Document moved to folder.");
        } catch (error) { toast.error("Failed to move document."); }
        return;
      }

      if (activeIdStr.startsWith('folder-') && overIdStr.startsWith('folder-')) {
        const movedFolderId = activeIdStr.replace('folder-', '');
        const targetFolderId = overIdStr.replace('folder-', '');
        try {
          await updateDoc(doc(db, 'folders', movedFolderId), { parentId: targetFolderId });
          toast.success("Folder moved successfully.");
        } catch (error) { toast.error("Failed to move folder."); }
        return;
      }
    }

    // Atvejis 2: Perkeliama į root
    if (overIdStr === 'move-to-root-droppable') {
      if (activeIdStr.startsWith('doc-')) {
        const documentId = activeIdStr.replace('doc-', '');
        try {
          await updateDoc(doc(db, 'documents', documentId), { folderId: null, lastEdited: serverTimestamp() });
          toast.success("Document moved to root.");
        } catch (error) { toast.error("Failed to move document to root."); }
      } else if (activeIdStr.startsWith('folder-')) {
        const folderIdToMove = activeIdStr.replace('folder-', '');
        try {
          await updateDoc(doc(db, 'folders', folderIdToMove), { parentId: null });
          toast.success("Folder moved to root.");
        } catch (error) { toast.error("Failed to move folder to root."); }
      }
    }
  };

  const handleSelectChange = (id: string, checked: boolean) => {
    setSelectedDocuments(prev => checked ? [...new Set([...prev, id])] : prev.filter(i => i !== id));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedDocuments(checked ? sortedAndFilteredDocuments.map(d => d.id) : []);
  };

  // Funkcija, kurią iškvies FolderBreadcrumbs
  const handleBreadcrumbClick = (folderId: string | undefined) => {
    setCurrentFolderId(folderId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fonas, kurį paspaudus stalčius užsidaro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />

          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {/* Šis motion.div valdys animaciją */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed bottom-0 left-0 right-0 h-[45vh] bg-card border-t shadow-lg z-50 rounded-t-lg flex flex-col" // Nustatome aukštį čia
            >
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <FolderBreadcrumbs folderId={currentFolderId} onNavigate={setCurrentFolderId} />
                <div className="flex items-center gap-2">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-9 w-48" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                    <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lastEdited">Last edited</SelectItem><SelectItem value="title">Title</SelectItem></SelectContent></Select>
                    <ToggleGroup type="single" value={viewType} onValueChange={(v) => v && setViewType(v)}><ToggleGroupItem value="grid"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem><ToggleGroupItem value="list"><List className="h-4 w-4" /></ToggleGroupItem></ToggleGroup>
                    <CreateFolderDialog folderId={currentFolderId} />
                    <Button asChild size="sm" onClick={() => setIsOpen(false)}><Link href="/new"><PlusCircle className="mr-2 h-4 w-4" />New</Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></Button>
                </div>
              </div>

              {/* Stalčiaus turinys */}
              <div className="p-4 overflow-y-auto flex-grow">
                {loading ? (
                  <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : viewType === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gridItems.map(item =>
                      item.type === 'folder' ? (
                        <div key={`folder-${item.data.id}`} onClick={(e) => { e.stopPropagation(); handleFolderClick(item.data.id); }}>
                          <FolderCard folder={item.data} onDelete={() => {}} />
                        </div>
                      ) : (
                        <div key={`doc-${item.data.id}`} onClick={(e) => { e.stopPropagation(); handleDocumentClick(item.data.id); }}>
                          <DocumentCard doc={item.data} />
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-12"><Checkbox onCheckedChange={handleSelectAll} /></TableHead><TableHead>Title</TableHead><TableHead>Edited</TableHead><TableHead>Words</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>{sortedAndFilteredDocuments.map((doc) => (<DocumentListRow key={doc.id} doc={doc} selectedDocuments={selectedDocuments} onSelectChange={handleSelectChange} />))}</TableBody>
                  </Table>
                )}
              </div>
            </motion.div>

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
        </>
      )}
    </AnimatePresence>
  );
}

// src/app/(god-mode-layout)/layout.tsx
'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import DocumentsDrawer from '@/components/god-mode/DocumentsDrawer';
import { usePathname, useRouter } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { AnimatePresence, motion } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// UI
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, type PanelRef } from '@/components/ui/resizable';
import Sidebar from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PanelLeftOpen, PanelLeftClose, FileText, Folder as FolderIcon, ChevronLeft, Search, SortAsc, SortDesc } from 'lucide-react';

// Hooks & Types
import { useUserFolders } from '@/hooks/useUserFolders';
import { useUserDocuments } from '@/hooks/useUserDocuments';
import { ArticleDocument } from '@/types/document';
import { Folder } from '@/types/folder';
import DocumentCard from '@/components/document-card';
import FolderCard from '@/components/folder-card';

function GodModeLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isDocumentsDrawerOpen, setIsDocumentsDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<'recent' | 'browse'>('recent');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const panelRef = useRef<PanelRef>(null);
  const pathname = usePathname();
  const router = useRouter();

  const isGodMode = pathname.includes('/god-mode');
  const isDocsView = pathname.startsWith('/docs/');
  const showNavToggleButton = !isDocsView;

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const { documents: recentDocuments, loading: recentLoading } = useUserDocuments();
  const { folders, loading: foldersLoading } = useUserFolders(currentFolderId);
  const { documents: folderDocuments, loading: documentsLoading } = useUserDocuments(currentFolderId || undefined);

  const isLoadingDrawer = recentLoading || foldersLoading || documentsLoading;

  const displayedItems = useMemo(() => {
    let items: Array<{ type: 'folder'; data: Folder } | { type: 'document'; data: ArticleDocument }> = [];

    if (drawerView === 'recent') {
      items = recentDocuments.map(d => ({ type: 'document' as const, data: d }));
    } else { // browse
      items = [
        ...folders.map(f => ({ type: 'folder' as const, data: f })),
        ...folderDocuments.map(d => ({ type: 'document' as const, data: d }))
      ];
    }

    const filtered = debouncedSearchQuery
      ? items.filter(item => {
          const searchValue = (item.type === 'folder' ? item.data.name : item.data.title) || '';
          return searchValue.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        })
      : items;

    return filtered.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;

      let comparison = 0;
      switch (sortBy) {
        case 'name':
          const nameA = 'name' in a.data ? a.data.name : a.data.title;
          const nameB = 'name' in b.data ? b.data.name : b.data.title;
          comparison = nameA.localeCompare(nameB);
          break;
        case 'date':
          const dateA = a.type === 'folder' ? a.data.createdAt.toDate().getTime() : new Date(a.data.lastEdited).getTime();
          const dateB = b.type === 'folder' ? b.data.createdAt.toDate().getTime() : new Date(b.data.lastEdited).getTime();
          comparison = dateB - dateA;
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [drawerView, recentDocuments, folders, folderDocuments, debouncedSearchQuery, sortBy, sortOrder]);

  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const currentPath = pathname;
    const previousPath = previousPathnameRef.current;

    const isEnteringGodMode = currentPath.includes('/god-mode') && !previousPath.includes('/god-mode');
    const isEnteringDocsView = currentPath.startsWith('/docs/') && !previousPath.startsWith('/docs/');

    // Automatiškai sutraukiame TIK kai įeiname į God Mode
    if (isEnteringGodMode) {
      panel.collapse();
    }
    // Automatiškai išskleidžiame TIK kai įeiname į paprastą redaktorių
    else if (isEnteringDocsView) {
      panel.expand();
    }

    // Atnaujiname ankstesnio maršruto reikšmę
    previousPathnameRef.current = currentPath;

  }, [pathname]); // Priklausomybė lieka tik nuo `pathname`

  const handleBack = async () => {
    if (!currentFolderId) {
      setDrawerView('recent');
      return;
    }
    try {
      const folderRef = doc(db, 'folders', currentFolderId);
      const folderSnap = await getDoc(folderRef);
      if (folderSnap.exists()) {
        setCurrentFolderId(folderSnap.data().parentId || null);
      } else {
        setCurrentFolderId(null);
      }
    } catch {
      setCurrentFolderId(null);
    }
  };

  const handleShowAllFolders = () => {
    setDrawerView('browse');
    setCurrentFolderId(null);
  };

  const handleOpenFolder = (folderId: string) => {
    setDrawerView('browse');
    setCurrentFolderId(folderId);
  };

  const toggleSidebar = () => {
    if (panelRef.current) {
      if (isCollapsed) {
        panelRef.current.expand();
      } else {
        panelRef.current.collapse();
      }
    }
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b bg-card">
        <div className="flex items-center gap-2">
          {showNavToggleButton && (
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="flex items-center gap-1">
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              <span>{isCollapsed ? 'Show Navigation' : 'Hide Navigation'}</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsDocumentsDrawerOpen(true)} className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </Button>
        </div>
        <div>{/* Placeholder */}</div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal" onLayout={(sizes: number[]) => { setIsCollapsed(sizes[0] === 0); }}>
          <ResizablePanel ref={panelRef} collapsible={true} collapsedSize={0} minSize={15} maxSize={25} defaultSize={isGodMode ? 0 : 20}>
            <Sidebar />
          </ResizablePanel>
          <ResizableHandle withHandle className={isCollapsed ? "opacity-0 pointer-events-none" : ""} />
          <ResizablePanel defaultSize={isGodMode ? 100 : 80}>
            <main className="h-full overflow-hidden">{children}</main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <DocumentsDrawer isOpen={isDocumentsDrawerOpen} setIsOpen={setIsDocumentsDrawerOpen} />
    </div>
  );
}

export default withAuth(GodModeLayout);

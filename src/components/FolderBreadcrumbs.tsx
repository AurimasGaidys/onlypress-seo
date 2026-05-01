// src/components/FolderBreadcrumbs.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Folder } from '@/types/folder';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FolderBreadcrumbsProps {
  folderId?: string;
  onNavigate?: (folderId: string | undefined) => void;
  agencyId?: string; // Pridėtas agencyId prop
}

interface Crumb {
  id: string;
  name: string;
}

export default function FolderBreadcrumbs({ folderId, onNavigate, agencyId }: FolderBreadcrumbsProps) {
  const [path, setPath] = useState<Crumb[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Navigation history state
  const [history, setHistory] = useState<(string | null)[]>([folderId || null]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInternalNavigation, setIsInternalNavigation] = useState(false);

  // Update history when folderId changes (only for external navigation)
  useEffect(() => {
    const currentFolderId = folderId || null;
    const lastHistoryItem = history[currentIndex];

    if (!isInternalNavigation && currentFolderId !== lastHistoryItem) {
      // Add new folder to history only if it's external navigation (not from breadcrumbs)
      setHistory(prev => {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(currentFolderId);
        return newHistory;
      });
      setCurrentIndex(prev => prev + 1);
    }
    // Reset internal navigation flag
    setIsInternalNavigation(false);
  }, [folderId, currentIndex, history, isInternalNavigation]);

  useEffect(() => {
    const buildPath = async () => {
      if (!folderId) {
        setPath([]);
        return;
      }

      setLoading(true);
      const newPath: Crumb[] = [];
      let currentId: string | null = folderId;

      while (currentId) {
        const folderDocRef = doc(db, 'folders', currentId);
        const docSnap = await getDoc(folderDocRef);
        if (docSnap.exists()) {
          const folderData = docSnap.data() as Omit<Folder, 'id'>;
          newPath.unshift({ id: currentId, name: folderData.name });
          currentId = folderData.parentId;
        } else {
          currentId = null; // Stop if folder not found
        }
      }
      setPath(newPath);
      setLoading(false);
    };

    buildPath();
  }, [folderId]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  const handleNavigation = (targetId: string | undefined) => {
    if (onNavigate) {
      // Jei duota onNavigate funkcija, naudojame ją
      onNavigate(targetId);
    } else {
      // Kitu atveju naudojame standartinį router su agencyId logika
      if (agencyId) {
        router.push(targetId ? `/agency/${agencyId}/documents?folderId=${targetId}` : `/agency/${agencyId}/documents`);
      } else {
        router.push(targetId ? `/?folderId=${targetId}` : '/');
      }
    }
  };

  const handleGoBack = () => {
    if (canGoBack) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const targetFolderId = history[newIndex];
      setIsInternalNavigation(true); // Nurodome, kad tai vidinė navigacija
      handleNavigation(targetFolderId || undefined);
    }
  };

  const handleGoForward = () => {
    if (canGoForward) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const targetFolderId = history[newIndex];
      setIsInternalNavigation(true); // Nurodome, kad tai vidinė navigacija
      handleNavigation(targetFolderId || undefined);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          disabled={!canGoBack}
          className="h-8 w-8 p-0"
          title="Go Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoForward}
          disabled={!canGoForward}
          className="h-8 w-8 p-0"
          title="Go Forward"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {onNavigate ? (
              <BreadcrumbLink
                asChild
                className="cursor-pointer"
                onClick={() => handleNavigation(undefined)}
              >
                <span>Documents</span>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbLink asChild>
                <Link href={agencyId ? `/agency/${agencyId}/documents` : "/"}>Documents</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {path.map((crumb, index) => {
            const isLast = index === path.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  ) : onNavigate ? (
                    <BreadcrumbLink
                      asChild
                      className="cursor-pointer"
                      onClick={() => {
                        setIsInternalNavigation(true); // Nurodome, kad tai vidinė navigacija
                        handleNavigation(crumb.id);
                      }}
                    >
                      <span>{crumb.name}</span>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={agencyId ? `/agency/${agencyId}/documents?folderId=${crumb.id}` : `/?folderId=${crumb.id}`}>{crumb.name}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

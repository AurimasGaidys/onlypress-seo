// src/components/DocumentListRow.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, MoreVertical, Trash2, FileText } from 'lucide-react';
import { deleteDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { MESSAGES } from '@/lib/constants/messages';
import { formatDistanceToNow } from 'date-fns';
import { ArticleDocument } from '@/types/document';
import { useUserFolders } from '@/hooks/useUserFolders';
import { useClientInfo } from '@/hooks/useClientInfo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getStatusInfo } from '@/lib/status-utils';
import { generateDocumentZip } from '@/lib/zip-generator';

// Helper function to calculate word count from HTML content
const calculateWordCount = (content: string): number => {
  if (!content) return 0;
  
  // Remove HTML tags and decode HTML entities
  const textContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&/g, '&') // Replace HTML entities
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/'/g, "'")
    .trim();
  
  if (!textContent) return 0;
  
  // Count words (splits by whitespace, filters out empty strings)
  const words = textContent.split(/\s+/).filter(word => word.length > 0);
  return words.length;
};

interface DocumentListRowProps {
  doc: ArticleDocument;
  selectedDocuments: string[];
  onSelectChange: (id: string, checked: boolean) => void;
}

export default function DocumentListRow({
  doc: articleDoc,
  selectedDocuments,
  onSelectChange,
}: DocumentListRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { folders } = useUserFolders();
  const { client } = useClientInfo(articleDoc.clientId);
  const isSelected = selectedDocuments.includes(articleDoc.id);

  const statusInfo = getStatusInfo(articleDoc.status);

  const handleDownload = async (e: React.MouseEvent | Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDownloading) return; // Prevent double clicks
    
    setIsDownloading(true);
    toast.info("Preparing document for download...");

    try {
      // Fetch the full document content
      const docRef = doc(db, 'documents', articleDoc.id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Document not found.");
      }
      
      const fullDocData = docSnap.data();

      // Call the new ZIP generator
      await generateDocumentZip({
        title: fullDocData.title,
        htmlContent: fullDocData.content,
        featuredImageUrl: fullDocData.thumbnailUrl,
      });

    } catch (error) {
      toast.error("Download failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent | Event) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'documents', articleDoc.id));
      toast.success(MESSAGES.success.documentDeleted);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(MESSAGES.errors.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMove = async (targetFolderId: string) => {
    try {
      await updateDoc(doc(db, 'documents', articleDoc.id), { folderId: targetFolderId });
      toast.success(MESSAGES.success.contentUpdated);
    } catch (error) {
      console.error('Error moving document:', error);
      toast.error(MESSAGES.errors.operationFailed);
    }
  };

  const handleMoveToRoot = async (e: React.MouseEvent | Event) => {
    e.stopPropagation(); // Svarbu, kad Nepaspaustų Link
    try {
      await updateDoc(doc(db, 'documents', articleDoc.id), { folderId: null });
      toast.success(MESSAGES.success.contentUpdated);
    } catch (error) {
      toast.error(MESSAGES.errors.operationFailed);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectChange(articleDoc.id, checked as boolean)}
        />
      </TableCell>
      <TableCell>
        <Link href={`/docs/${articleDoc.id}`} className="flex items-center gap-2 hover:underline">
          <FileText className="h-4 w-4" />
          <span className="font-medium">{articleDoc.title}</span>
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant={statusInfo.variant} className={statusInfo.className}>
          {statusInfo.label}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        Edited {formatDistanceToNow((articleDoc.lastEdited as unknown as Timestamp).toDate(), { addSuffix: true })}
      </TableCell>
      <TableCell className="text-muted-foreground">{articleDoc.wordCount || calculateWordCount(articleDoc.content || '')}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {client && (
            <div className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{client.name}</span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="force-ghost-button" disabled={isDeleting || isDownloading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleDownload} disabled={isDownloading}>
                <Download className="mr-2 h-4 w-4" />
                Download ZIP
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to...</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {articleDoc.folderId && (
                    <>
                      <DropdownMenuItem onSelect={handleMoveToRoot}>
                        Move to Root
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {folders.map((folder) => (
                    <DropdownMenuItem key={folder.id} onSelect={() => handleMove(folder.id)}>
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

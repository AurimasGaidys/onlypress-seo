import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState } from "react";
import { Card, CardTitle } from "./ui/card";
import Link from "next/link";
import { Button } from "./ui/button";
import { Download, MoreVertical, Trash2, FileText } from "lucide-react";
import { deleteDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "./ui/badge";
import { ArticleDocument } from "@/types/document";
import { useClientInfo } from "@/hooks/useClientInfo";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { getStatusInfo } from "@/lib/status-utils";
import { generateDocumentZip } from "@/lib/zip-generator";
import { useOrderContext } from '@/context/orders/useOrdersContext';

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

export default function DocumentCard({ doc: articleDoc }: { doc: ArticleDocument }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { client } = useClientInfo(articleDoc.clientId);
  const { myOrders, initializing } = useOrderContext();

  const filteredAndSortedOrders = useMemo(() => {
    const filtered = myOrders.filter((order) =>
      (order.seoDocumentId || "belenkas") == articleDoc.id
    );

    console.log("FILTERED ORDERS:", filtered, articleDoc.id);

    return filtered.sort((a, b) => {
      const dateA = a.dateCreated || 0;
      const dateB = b.dateCreated || 0;
      return dateB - dateA
    });
  }, [myOrders, articleDoc.id]);

  // Extract thumbnail from content if not present in thumbnailUrl
  const thumbnailUrl = articleDoc.metadata?.featuredImage;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `doc-${articleDoc.id}`,
    data: { document: articleDoc },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const aaaaa = filteredAndSortedOrders?.[0]?.status || articleDoc.status;
  // console.log("AAAAA STATUS:", articleDoc.id, filteredAndSortedOrders);
  const statusInfo = getStatusInfo(aaaaa);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    toast.info("Preparing document for download...");
    try {
      const docRef = doc(db, 'documents', articleDoc.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Document not found.");
      }
      const fullDocData = docSnap.data();
      await generateDocumentZip({
        title: fullDocData.title,
        htmlContent: fullDocData.content,
        featuredImageUrl: fullDocData.thumbnailUrl
      });
      toast.success("Document downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'documents', articleDoc.id));
      toast.success("Document deleted successfully.");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document.");
    } finally {
      setIsDeleting(false);
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

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab group">
      <Link href={`/docs/${articleDoc.id}`}>
        <Card className="hover:border-primary/50 transition-colors h-full relative p-4 flex flex-col">
          {/* Status badge */}
          <Badge variant={statusInfo.variant} className={cn("absolute top-2 left-2 z-10", statusInfo.className)}>
            {statusInfo.label}
          </Badge>
          {/* Actions menu */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownload();
                  }}
                  disabled={isDownloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? "Downloading..." : "Download ZIP"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Card content with always-visible image */}
          <div className="flex-grow flex flex-col">
            <div className="w-full h-32 mb-3 overflow-hidden rounded-md bg-muted flex items-center justify-center">
              {thumbnailUrl && thumbnailUrl.length > 0 ? (
                <Image
                  src={thumbnailUrl}
                  alt={`${articleDoc.title} thumbnail`}
                  width={400}
                  height={128}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    // Fallback to file icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              {(!thumbnailUrl || thumbnailUrl.length === 0) && (
                <FileText className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-grow flex flex-col justify-between">
              <CardTitle className="line-clamp-2">{articleDoc.title}</CardTitle>
              <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                <span>Edited {articleDoc.lastEdited ? formatDistanceToNow((articleDoc.lastEdited as unknown as Timestamp).toDate(), { addSuffix: true }) : 'Never'}</span>
                <span className="mx-1">•</span>
                <span>{articleDoc.wordCount || calculateWordCount(articleDoc.content || '')} words</span>
                {client && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      {client.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}

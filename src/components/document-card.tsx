'use client';

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { Button } from "./ui/button";
import { Download, MoreVertical, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface DocumentCardProps {
  id: string;
  title: string;
  snippet: string;
  lastEdited: string;
  onDeleted?: (id: string) => void;
}

export default function DocumentCard({ id, title, snippet, lastEdited, onDeleted }: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent | Event) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDownloading(true);
    toast.info("Preparing document for download...");

    try {
      const result = await api.get<{ data: { content: string } }>(`/api/seo/documents/${id}`);
      const content = result.data.content ?? '';
      const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/ /g, '_')}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Document downloaded successfully.");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent | Event) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      await api.delete(`/api/seo/documents/${id}`);
      toast.success("Document deleted successfully.");
      onDeleted?.(id);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors duration-200 cursor-pointer relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isDeleting || isDownloading}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={handleDownload} disabled={isDownloading}>
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={handleDelete}
              disabled={isDeleting}
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <Link href={`/docs/${id}`} className="flex flex-col flex-grow">
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">{snippet}</p>
        </CardContent>
      </Link>
      <Link href={`/docs/${id}`}>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Edited {lastEdited}</p>
        </CardFooter>
      </Link>
    </Card>
  );
}

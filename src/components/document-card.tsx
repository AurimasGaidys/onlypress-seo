// src/components/document-card.tsx
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { Button } from "./ui/button";
import { Download, MoreVertical, Trash2 } from "lucide-react";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface DocumentCardProps {
  id: string; // Add id to link to the correct page
  title: string;
  snippet: string;
  lastEdited: string;
}

export default function DocumentCard({ id, title, snippet, lastEdited }: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent | Event) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDownloading(true);
    toast.info("Preparing document for download...");

    try {
      const docRef = doc(db, 'documents', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const docData = docSnap.data();
        const content = docData.content || ''; // Assuming content is stored in 'content' field
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-f8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${title.replace(/ /g, "_")}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Document downloaded successfully.");
      } else {
        toast.error("Document not found.");
      }
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
      await deleteDoc(doc(db, 'documents', id));
      toast.success("Document deleted successfully.");
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
          <p className="text-sm text-muted-foreground line-clamp-3">
            {snippet}
          </p>
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

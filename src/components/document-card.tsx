// src/components/document-card.tsx
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link"; // Import Link
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface DocumentCardProps {
  id: string; // Add id to link to the correct page
  title: string;
  snippet: string;
  lastEdited: string;
}

export default function DocumentCard({ id, title, snippet, lastEdited }: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Ar tikrai norite ištrinti šį dokumentą? Šis veiksmas negrįžtamas.")) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'documents', id));
      toast.success("Dokumentas sėkmingai ištrintas.");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Klaida trinant dokumentą.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors duration-200 cursor-pointer relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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

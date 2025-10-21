// src/components/document-card.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link"; // Import Link

interface DocumentCardProps {
  id: string; // Add id to link to the correct page
  title: string;
  snippet: string;
  lastEdited: string;
}

export default function DocumentCard({ id, title, snippet, lastEdited }: DocumentCardProps) {
  return (
    <Link href={`/docs/${id}`}>
      <Card className="flex flex-col h-full hover:border-primary/50 transition-colors duration-200 cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {snippet}
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Edited {lastEdited}</p>
        </CardFooter>
      </Card>
    </Link>
  );
}

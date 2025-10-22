// src/app/(authed)/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DocumentCard from '@/components/document-card';
import Link from "next/link";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { useUserDocuments } from '@/hooks/useUserDocuments'; // Import the hook
import { formatDistanceToNow } from 'date-fns'; // For displaying human-readable dates

export default function DashboardPage() {
  const { documents, loading } = useUserDocuments();

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Docs</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search docs..." className="pl-9 w-full md:w-64" />
          </div>
          <Link href="/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              New doc
            </Button>
          </Link>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center text-muted-foreground h-64 flex flex-col justify-center items-center">
            <p>You don&#39;t have any documents yet.</p>
            <Link href="/new" className="mt-4"><Button>Create your first document</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              id={doc.id} // The document ID is now a string
              title={doc.title}
              snippet={doc.snippet}
              // Format the Firestore Timestamp into a readable string
              lastEdited={formatDistanceToNow(doc.lastEdited.toDate(), { addSuffix: true })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// src/components/clients/ClientDocumentsTab.tsx
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  clientId?: string;
  projectId?: string;
  createdAt?: Date;
}

interface ClientDocumentsTabProps {
  documents: Document[];
  clientName: string;
  clientId: string;
}

export default function ClientDocumentsTab({ documents, clientName, clientId }: ClientDocumentsTabProps) {
  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
  };

  const getDocumentUrl = (documentId: string) => {
    // This could link to the document editor or viewer
    return `/document/${documentId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-muted-foreground">
            Documents created for {clientName}
          </p>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Documents created for {clientName} will appear here
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Create documents from the main dashboard</p>
              <p>• Generate articles using AI tools</p>
              <p>• Import existing content</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold truncate">{document.title}</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  {document.createdAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(document.createdAt)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Doc ID: {document.id.substring(0, 8)}...
                    </div>
                    <Link href={getDocumentUrl(document.id)}>
                      <div className="text-primary hover:text-primary/80 text-sm flex items-center gap-1">
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </Link>
                  </div>
                  {document.projectId && (
                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      Associated with project ID: {document.projectId.substring(0, 8)}...
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Document Organization</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• All documents are automatically associated with this client</p>
              <p>• Documents can be linked to specific projects</p>
              <p>• Use the AI tools to create content for this client</p>
              <p>• Import existing documents and organize them by client</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

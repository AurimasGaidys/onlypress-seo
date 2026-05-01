// src/components/creation-hub/CreateDocumentDialog.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Rocket, FilePlus, Loader2, Sparkles, Upload, CheckCircle, XCircle 
} from 'lucide-react';

interface CreateDocumentDialogProps {
  children: React.ReactNode;
}

// File processing status interface
interface FileProcessingStatus {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

export default function CreateDocumentDialog({ children }: CreateDocumentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingBlank, setIsCreatingBlank] = useState(false);
  
  // --- NEW: File processing states ---
  const [view, setView] = useState<'initial' | 'upload' | 'processing'>('initial');
  const [filesStatus, setFilesStatus] = useState<FileProcessingStatus[]>([]);
  // --- END NEW ---
  
  const { activeClientId, activeProjectId, activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const router = useRouter();
  
  // Get current folderId from URL
  const searchParams = useSearchParams();
  const currentFolderId = searchParams.get('folderId') || undefined;

  // Get agency ID based on workspace type
  const getAgencyId = () => {
    if (activeWorkspace.type === 'user') {
      return `personal_${user?.uid}`;
    } else {
      return activeWorkspace.id;
    }
  };

  const agencyId = getAgencyId();

  // URL construction with context
  const wizardHref = `/new?${new URLSearchParams({
    clientId: activeClientId || '',
    projectId: activeProjectId || '',
    folderId: currentFolderId || '',
  }).toString()}`;

  const godModeHref = `/god-mode?${new URLSearchParams({
    clientId: activeClientId || '',
    projectId: activeProjectId || '',
    folderId: currentFolderId || '',
  }).toString()}`;
  
  const handleCreateBlank = async () => {
    if (!user) return toast.error("Authentication required.");
    setIsCreatingBlank(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          creationData: {
            source: 'blank',
            title: 'Article title',
            folderId: currentFolderId,
            context: {
              agencyId: agencyId,
              clientId: activeClientId,
              projectId: activeProjectId,
            }
          }
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create document.');
      toast.success("Blank document created successfully!");
      router.push(`/docs/${data.newDocumentId}`);
      setIsOpen(false);
    } catch (error) {
      toast.error("Creation failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsCreatingBlank(false);
    }
  };

  // --- NEW: Unified file processing function ---
  const processFiles = async (files: File[]) => {
    setView('processing');
      const initialStatuses: FileProcessingStatus[] = files.map(file => ({ file, status: 'pending' }));
      setFilesStatus(initialStatuses);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setFilesStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'processing', message: 'Processing...' } : s));

      try {
        const idToken = await user!.getIdToken();
        
        // Convert file to base64
        const fileBuffer = await file.arrayBuffer();
        const fileBase64 = Buffer.from(fileBuffer).toString('base64');
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        // Single call to unified endpoint
        const response = await fetch('/api/documents/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            creationData: {
              source: 'file',
              title: file.name.replace(/\.[^/.]+$/, ""),
              file: fileBase64,
              fileExtension: fileExtension,
              folderId: currentFolderId,
              context: {
                agencyId: agencyId,
                clientId: activeClientId,
                projectId: activeProjectId,
              }
            }
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'File processing failed');

        setFilesStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'success', message: 'Created!' } : s));
      } catch (error) {
        setFilesStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', message: error instanceof Error ? error.message : 'Unknown error' } : s));
      }
    }
    
    toast.success(`${files.length} file(s) processed.`);
    setTimeout(() => {
      setIsOpen(false);
      resetDialog();
    }, 2000);
  };

  const FileUploadZone = ({ onFileSelect }: { onFileSelect: (files: File[]) => void }) => (
    <div 
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.txt,.doc,.docx,.pdf,.md';
        input.onchange = (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files) onFileSelect(Array.from(files));
        };
        input.click();
      }}
      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
    >
      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <p className="font-semibold mb-2">Drop files here or click to browse</p>
      <p className="text-sm text-muted-foreground">Supports TXT, DOC, DOCX, PDF, MD</p>
    </div>
  );
  
  const resetDialog = () => {
    setView('initial');
    setFilesStatus([]);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(resetDialog, 300); // Reset on close with a small delay
    }
  };
  
  const renderContent = () => {
    switch (view) {
      case 'initial':
        return (
          <div className="grid grid-cols-2 gap-4">
            <Link href={wizardHref} onClick={() => setIsOpen(false)}>
              <Card className="h-full cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold">Wizard</h3>
                  <p className="text-sm text-muted-foreground">Guided creation</p>
                </CardContent>
              </Card>
            </Link>

            <Link href={godModeHref} onClick={() => setIsOpen(false)}>
              <Card className="h-full cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <Rocket className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold">God Mode</h3>
                  <p className="text-sm text-muted-foreground">Advanced tools</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="h-full cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setView('upload')}>
              <CardContent className="p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold">Upload File(s)</h3>
                <p className="text-sm text-muted-foreground">Import content</p>
              </CardContent>
            </Card>

            <Card className="h-full cursor-pointer hover:border-primary/50 transition-colors" onClick={handleCreateBlank}>
              <CardContent className="p-6 text-center">
                {isCreatingBlank ? <Loader2 className="h-8 w-8 mx-auto mb-3 text-primary animate-spin" /> : <FilePlus className="h-8 w-8 mx-auto mb-3 text-primary" />}
                <h3 className="font-semibold">Blank Document</h3>
                <p className="text-sm text-muted-foreground">Start from scratch</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'upload':
        return (
          <div>
            <Button variant="outline" onClick={() => setView('initial')} className="mb-4">← Back</Button>
            <FileUploadZone onFileSelect={processFiles} />
          </div>
        );
      case 'processing':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-center">Processing Files...</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {filesStatus.map((status, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  {status.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {status.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {status.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                  {status.status === 'pending' && <div className="h-4 w-4 rounded-full bg-muted" />}
                  <div className="flex-1">
                    <p className="font-medium truncate">{status.file.name}</p>
                    <p className="text-sm text-muted-foreground">{status.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create a New Document</DialogTitle>
          <DialogDescription>Choose how you want to start creating your new document.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

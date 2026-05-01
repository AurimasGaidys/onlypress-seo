// src/components/agency/scheduler/CreationModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Sparkles, Plus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CreationModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onCreationSuccess: () => void;
  selectedDate: Date;
  agencyId: string;
  clientId: string;
  projectId: string;
  timeInterval?: number; // Laiko intervalas valandomis
}

interface FileProcessingStatus {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

// Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

export default function CreationModal({ isOpen, setIsOpen, onCreationSuccess, selectedDate, agencyId, clientId, projectId, timeInterval = 4 }: CreationModalProps) {
  const { user } = useAuth();
  const [view, setView] = useState<'initial' | 'upload' | 'processing'>('initial');
  const [filesStatus, setFilesStatus] = useState<FileProcessingStatus[]>([]);

  const processFiles = async (files: File[]) => {
    setView('processing');
    
    const initialStatuses: FileProcessingStatus[] = files.map(file => ({
      file,
      status: 'pending' as const,
    }));
    setFilesStatus(initialStatuses);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      setFilesStatus(prev => prev.map((status, index) => 
        index === i ? { ...status, status: 'processing', message: 'Processing...' } : status
      ));

      try {
        const idToken = await user!.getIdToken();
        
        // Convert file to base64
        const fileBase64 = await fileToBase64(file);
        const fileExtension = file.name.substring(file.name.lastIndexOf('.'));

        // --- PAKEITIMAS: Naudojame VIENINGĄ '/api/documents/create' API tiesiogiai su file ---
        const createRes = await fetch('/api/documents/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            creationData: {
              source: 'file',
              title: file.name.replace(/\.[^/.]+$/, ""),
              file: fileBase64,
              fileExtension: fileExtension,
              context: {
                agencyId,
                clientId,
                projectId,
              }
            }
          }),
        });
        // --- PAKEITIMO PABAIGA ---

        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || 'Document creation failed');
        const { newDocumentId } = createData;

        const scheduleRes = await fetch('/api/agency/schedule-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            documentId: newDocumentId,
            agencyId,
            clientId,
            projectId,
            portalId: '', // Laikinai tuščias string, kad nebūtų "No Portal"
            scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
            timeInterval, // Pridedame timeInterval
          }),
        });
        if (!scheduleRes.ok) throw new Error((await scheduleRes.json()).error || 'Scheduling failed');

        setFilesStatus(prev => prev.map((status, index) => 
          index === i ? { ...status, status: 'success', message: 'Scheduled!' } : status
        ));

      } catch (error) {
        setFilesStatus(prev => prev.map((status, index) => 
          index === i ? { 
            ...status, 
            status: 'error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
          } : status
        ));
      }
    }
    
    onCreationSuccess();
    setIsOpen(false); // UŽDAROME MODAL'Ą IŠKART PO SĖKMĖS
    toast.info(`${files.length} file(s) processed. Calendar updated.`);
    
    setTimeout(() => {
      setView('initial');
      setFilesStatus([]);
    }, 500);
  };

  const handleCreateBlankAndSchedule = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();

      // --- PRADĖK PAKEITIMĄ ČIA ---

      // Naudojame VIENINGĄ '/api/documents/create' API
      const createRes = await fetch('/api/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          creationData: { // Duomenis įdedame į 'creationData' objektą
            source: 'blank',
            title: `New Document for ${format(selectedDate, 'yyyy-MM-dd')}`,
            context: { // Kontekstą taip pat įdedame į vidų
              agencyId,
              clientId,
              projectId,
            }
          }
        }),
      });

      // --- PAKEITIMO PABAIGA ---

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Document creation failed');
      const { newDocumentId } = createData;

      // Likusi dalis (planavimas) lieka nepakitusi
      const scheduleRes = await fetch('/api/agency/schedule-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          documentId: newDocumentId,
          agencyId,
          clientId,
          projectId,
          portalId: '', // Laikinai tuščias string, kad nebūtų "No Portal"
          scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
          timeInterval,
        }),
      });
      if (!scheduleRes.ok) throw new Error((await scheduleRes.json()).error || 'Scheduling failed');

      toast.success('Blank document scheduled!');
      onCreationSuccess();
      setIsOpen(false); // UŽDAROME MODAL'Ą IŠKART PO SĖKMĖS
    } catch (error) {
      console.error('Error creating blank document:', error);
      toast.error('Failed to create and schedule document', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ... (likusi render dalis lieka tokia pati)
  const FileUploadZone = ({ onFileSelect, multiple = false }: { onFileSelect: (files: File[]) => void, multiple?: boolean }) => {
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFileSelect(files);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    return (
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = multiple;
          input.accept = '.txt,.doc,.docx,.pdf,.html';
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) onFileSelect(Array.from(files));
          };
          input.click();
        }}
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="font-semibold mb-2">
          {multiple ? 'Drop files here or click to browse' : 'Drop a file here or click to browse'}
        </p>
        <p className="text-sm text-muted-foreground">
          Supports TXT, DOC, DOCX, PDF, HTML
        </p>
      </div>
    );
  };
  
  const renderContent = () => {
    switch (view) {
      case 'initial':
        return (
          <div className="grid grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => window.open(`/new?agencyId=${agencyId}&clientId=${clientId}&projectId=${projectId}&scheduledDate=${format(selectedDate, 'yyyy-MM-dd')}`, '_blank')}>
              <CardContent className="p-6 text-center">
                <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold">Wizard</h3>
                <p className="text-sm text-muted-foreground">Guided creation</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => window.open(`/god-mode?agencyId=${agencyId}&clientId=${clientId}&projectId=${projectId}&scheduledDate=${format(selectedDate, 'yyyy-MM-dd')}`, '_blank')}>
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold">God Mode</h3>
                <p className="text-sm text-muted-foreground">Advanced tools</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setView('upload')}>
              <CardContent className="p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold">Upload File(s)</h3>
                <p className="text-sm text-muted-foreground">Import & schedule</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={handleCreateBlankAndSchedule}>
              <CardContent className="p-6 text-center">
                <Plus className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold">Blank Document</h3>
                <p className="text-sm text-muted-foreground">Start from scratch</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'upload':
        return (
          <div>
            <Button 
              variant="outline" 
              onClick={() => setView('initial')}
              className="mb-4"
            >
              ← Back
            </Button>
              <FileUploadZone 
                onFileSelect={(files) => processFiles(Array.isArray(files) ? files : [files])} 
                multiple={true} 
              />
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-center">Processing Files...</h3>
            <div className="space-y-3">
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
            <p className="text-sm text-muted-foreground text-center">
              Files are being processed sequentially to ensure proper time slot allocation...
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Content for {selectedDate.toLocaleDateString()}</DialogTitle>
          <DialogDescription>
            Choose how you want to create content for this date.
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

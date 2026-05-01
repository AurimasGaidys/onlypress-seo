import { useState } from "react";
import { CheckCircle, Loader2, Upload, XCircle } from "lucide-react";
import { fileToBase64 } from "@/utils/helpers/fileToBase64";
import { toast } from "sonner";
import { txtExtractor } from "@/utils/extractors/txtExtractor";
import { wordDocExtractor } from "@/utils/extractors/wordDocExtractor";
import { pdfExtractor } from "@/utils/extractors/pdfExtractor";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useRouter, useSearchParams } from "next/navigation";

interface FileProcessingStatus {
    file: File;
    status: 'pending' | 'processing' | 'success' | 'error';
    message?: string;
}

interface FromFileWizardProps {
    onSubmit: (mode: 'simple', payload: Record<string, unknown>) => void;
    isGenerating: boolean;
    clientId?: string | null;
    projectId?: string | null;
}

// TODO fix duplicated



export const FromFileWizard = ({
    // onSubmit,
    clientId,
    projectId,
}: FromFileWizardProps) => {
    // const { user } = useAuth();
    const [view, setView] = useState<'upload' | 'processing'>('upload');
    const [filesStatus, setFilesStatus] = useState<FileProcessingStatus[]>([]);
    const { user } = useAuth();

    const searchParams = useSearchParams();
    const currentFolderId = searchParams.get('folderId') || undefined;
    const router = useRouter();


    const { activeClientId, activeProjectId, activeWorkspace } = useWorkspace();

      const getAgencyId = () => {
    if (activeWorkspace.type === 'user') {
      return `personal_${user?.uid}`;
    } else {
      return activeWorkspace.id;
    }
  };

  const agencyId = getAgencyId();

    const processFiles2 = async (files: File[]) => {
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
           console.log("redirect to current folder or home");
           router.back();
        }, 2000);
    };

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

    // TODO moeve to utils
    const decode = (str: string): string => Buffer.from(str, 'base64').toString('binary');

    const processFiles = async (files: File[]) => {
        setView('processing');

        const initialStatuses: FileProcessingStatus[] = files.map(file => ({
            file,
            status: 'pending' as const,
        }));
        setFilesStatus(initialStatuses);

        const filesContentTasks = files.map(async (file, i) => {

            setFilesStatus(prev => prev.map((status, index) =>
                index === i ? { ...status, status: 'processing', message: 'Processing...' } : status
            ));

            try {
                // const idToken = await user!.getIdToken();

                // Convert file to base64
                const fileBase64 = await fileToBase64(file);
                const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
                let fileContent = '';

                // .txt,.doc,.docx,.pdf,.html
                switch (fileExtension) {
                    case ".txt":
                        // decode base64 to text
                        fileContent = txtExtractor().extract(fileBase64);
                        break;
                    case ".doc":
                    case ".docx":
                        // Word documents - extract and convert to HTML
                        fileContent = await wordDocExtractor().extract(file) || "parse failed";
                        break;
                    case ".pdf":
                        fileContent = pdfExtractor().extract(fileBase64);
                        break;
                    case ".html":
                        fileContent = decode(fileBase64);
                        break;

                        break;

                    default:
                        break;
                        return '';
                }

                console.log("agencyId: ", activeWorkspace?.id);

                // // --- PAKEITIMAS: Naudojame VIENINGĄ '/api/documents/create' API tiesiogiai su file ---
                const createRes = await fetch('/api/documents/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idToken: user?.getIdToken(),
                        creationData: {
                            source: 'file',
                            title: file.name.replace(/\.[^/.]+$/, ""),
                            file: fileContent,
                            fileExtension: fileExtension,
                            context: {
                                agencyId: activeWorkspace?.id || "qqq", // Pakeiskite į tinkamą agencyId
                                clientId,
                                projectId,
                            }
                        }
                    }),
                });

                console.log('Create document response:', createRes);

                setFilesStatus(prev => prev.map((status, index) =>
                    index === i ? { ...status, status: 'success', message: 'Created successfully!' } : status
                ));


                return `Content summary of file: ${file.name}`; // Pakeiskite į tinkamą santrauką

            } catch (error) {
                setFilesStatus(prev => prev.map((status, index) =>
                    index === i ? {
                        ...status,
                        status: 'error',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    } : status
                ));
            }
        });

        const filesContentSummaries = await Promise.all(filesContentTasks);

        console.log('Files summary:', filesContentSummaries);

        toast.info(`${files.length} file(s) processed. Document created.`);

        setTimeout(() => {
            setView('upload');
            setFilesStatus([]);
        }, 500);
    };

    console.log("filesStatus:", processFiles);

    if (view === 'processing') {
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
    }


    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Create article from file</h2>
            <FileUploadZone
                onFileSelect={(files) => { processFiles2(Array.isArray(files) ? files : [files]); }}
                multiple
            />
        </div>
    );
};

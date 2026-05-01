// src/components/chat/FileUploadPreview.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, ImageIcon, X } from 'lucide-react';

interface FileUploadPreviewProps {
  file: File;
  onRemove: () => void;
  uploadProgress: number | null;
}

export default function FileUploadPreview({ file, onRemove, uploadProgress }: FileUploadPreviewProps) {
  const isImage = file.type.startsWith('image/');

  return (
    <Card className="p-2 flex items-center justify-between bg-muted/50 border-dashed relative overflow-hidden">
      {uploadProgress !== null && (
        <div
          className="absolute top-0 left-0 h-full bg-primary/20 transition-all duration-300"
          style={{ width: `${uploadProgress}%` }}
        />
      )}
      <div className="flex items-center gap-2 overflow-hidden z-10">
        {isImage ? <ImageIcon className="h-5 w-5 text-green-500 flex-shrink-0" /> : <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />}
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium truncate">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB {uploadProgress !== null ? `(${Math.round(uploadProgress)}%)` : ''}
          </span>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6 flex-shrink-0 z-10">
        <X className="h-4 w-4" />
      </Button>
    </Card>
  );
}

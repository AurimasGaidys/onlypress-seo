'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, FileText, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FromFileFormProps {
  onSubmit?: (data: {
    file: File;
    fileName: string;
  }) => void;
}

export default function FromFileForm({ onSubmit }: FromFileFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ['.docx', '.pdf', '.txt', '.png', '.jpg', '.jpeg'];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (isFileValid(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isFileValid(file)) {
        setSelectedFile(file);
      }
    }
  };

  const isFileValid = (file: File): boolean => {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return acceptedTypes.includes(fileExtension);
  };

  const getFileIcon = () => {
    if (!selectedFile) return <UploadCloud className="h-12 w-12 text-muted-foreground" />;

    const ext = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      return <ImageIcon className="h-12 w-12 text-green-500" />;
    }
    return <FileText className="h-12 w-12 text-blue-500" />;
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit?.({
        file: selectedFile,
        fileName: selectedFile.name,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer hover:bg-muted/50",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground",
          selectedFile && "border-green-500 bg-green-50"
        )}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.txt,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />

        {getFileIcon()}

        <div className="mt-4">
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <span className="font-medium text-lg">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragOver ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: DOCX, PDF, TXT, PNG, JPG, JPEG
              </p>
            </div>
          )}
        </div>
      </div>

      {!selectedFile && (
        <div className="text-center">
          <Button
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
        </div>
      )}

      {selectedFile && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Button onClick={handleSubmit} className="w-full">
                Generate Article from {selectedFile.name}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

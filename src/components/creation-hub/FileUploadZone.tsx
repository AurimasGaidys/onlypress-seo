'use client';

import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void;
  acceptedTypes?: string; // pvz., ".docx,.pdf,.txt"
  selectedFile: File | null;
}

export default function FileUploadZone({ onFileSelect, acceptedTypes, selectedFile }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileChange = (file: File | null) => {
    if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
      // Čia galite naudoti `toast` pranešimą
      alert("File is too large (max 10MB).");
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  }, [onFileSelect]);

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-primary/50",
        isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30",
        selectedFile && "border-green-500/50 bg-green-500/5"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />
      {selectedFile ? (
        <div className="flex flex-col items-center gap-2">
          <FileText className="h-10 w-10 text-primary" />
          <span className="font-medium">{selectedFile.name}</span>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
          <Button variant="ghost" size="sm" onClick={removeFile} className="text-destructive hover:text-destructive">
            <X className="h-4 w-4 mr-1" /> Remove
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <UploadCloud className="h-10 w-10" />
          <p className="font-medium">Drag & drop your file here</p>
          <p className="text-sm">or click to browse</p>
        </div>
      )}
    </div>
  );
}

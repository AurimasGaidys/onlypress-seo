'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FileUploadZone from '../FileUploadZone'; // Įsitikinkite, kad šis komponentas egzistuoja
import { Loader2, Bot, Lightbulb, FileUp, PlayCircle } from 'lucide-react';

interface GuidedModeStartProps {
  onStart: (topic: string, file: File | null) => void;
  isStarting: boolean;
}

export default function GuidedModeStart({ onStart, isStarting }: GuidedModeStartProps) {
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const canStart = !isStarting && (topic.trim().length > 0 || file !== null);

  const handleSubmit = () => {
    if (canStart) {
      // If a file is uploaded but topic is empty, use filename as topic
      const finalTopic = topic.trim() || file?.name || 'Uploaded Document Analysis';
      onStart(finalTopic, file);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-center">
        <div>
            <h3 className="text-xl font-semibold flex items-center gap-2 justify-center">
                <Bot className="h-6 w-6 text-primary" />
                Start with the Co-pilot
            </h3>
            <p className="text-muted-foreground">Provide a topic or upload a document with information.</p>
        </div>
        <div className="space-y-2 text-left">
            <Label htmlFor="guided-topic" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
                Article Topic
            </Label>
            <Input
              id="guided-topic"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., The Future of Space Exploration"
            />
        </div>

        <div className="relative flex items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-xs uppercase text-muted-foreground">Or</span>
            <div className="flex-grow border-t border-border"></div>
        </div>

        <div className="space-y-2 text-left">
            <Label className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" />
                Upload a Document
            </Label>
            <FileUploadZone
              onFileSelect={setFile}
              selectedFile={file}
              acceptedTypes=".docx,.pdf,.txt,.md"
            />
             <p className="text-xs text-muted-foreground pt-1">
                This is optional. Use a document to provide context or specific information.
            </p>
        </div>

        <Button onClick={handleSubmit} disabled={!canStart} className="w-full">
            {isStarting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            {isStarting ? 'Preparing Session...' : 'Start with Co-pilot'}
        </Button>
    </div>
  );
}

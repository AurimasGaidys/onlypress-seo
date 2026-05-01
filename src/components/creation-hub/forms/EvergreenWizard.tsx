'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label as RadioLabel } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import FileUploadZone from '../FileUploadZone';
import { Sparkles, Lightbulb, FileUp, Wand2, Settings2, Rocket, Loader2 } from 'lucide-react';

// Atnaujiname props sąsają
interface EvergreenWizardProps {
  onSubmit: (mode: 'simple', payload: Record<string, unknown>) => void;
  isGenerating: boolean;
  clientId?: string | null;
  projectId?: string | null;
}

export default function EvergreenWizard({ onSubmit, isGenerating, clientId, projectId }: EvergreenWizardProps) {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [wordCount, setWordCount] = useState(1200);
  const [tone, setTone] = useState('Professional');
  const [isLoadingTitles, setIsLoadingTitles] = useState(false);

  const handleGenerateTitles = async () => {
    if (!topic.trim() && !file) return;

    setIsLoadingTitles(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please log in to generate titles');
        return;
      }
      const idToken = await user.getIdToken();

      const effectiveTopic = topic.trim() || file?.name || "Uploaded document analysis";

      const response = await fetch('/api/generate-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: effectiveTopic, idToken }),
      });

      const data = await response.json();

      if (response.ok && data.titles) {
        setGeneratedTitles(data.titles);
        setStep(2);
      } else {
        toast.error(data.error || 'Failed to generate titles');
      }
    } catch (error) {
      console.error('Error generating titles:', error);
      toast.error('Failed to generate titles. Please try again.');
    } finally {
      setIsLoadingTitles(false);
    }
  };

  const uploadFile = async (fileToUpload: File): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required for upload.");

    const storage = getStorage();
    const filePath = `uploads/${user.uid}/${Date.now()}-${fileToUpload.name}`;
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, fileToUpload);
    return getDownloadURL(snapshot.ref);
  };

  const handleGenerateArticle = async () => {
    if (!selectedTitle.trim()) return;

    let fileUrl: string | undefined;

    // Upload file if present
    if (file) {
      try {
        toast.info("Uploading file...");
        fileUrl = await uploadFile(file);
        toast.success("File uploaded.");
      } catch (error: unknown) {
        toast.error("File upload failed. Article not generated." + (error instanceof Error ? ` ${error.message}` : ''));
        return;
      }
    }

    const effectiveTopic = topic.trim() || file?.name || "Uploaded document analysis";

    const payload = {
      topic: effectiveTopic,
      title: selectedTitle,
      wordCount,
      writingStyle: tone,
      fileUrl, // Pass file URL
      clientId, // Pass clientId
      projectId, // Pass projectId
    };

    // Use parent component's handler
    onSubmit('simple', payload);
  };



  if (step === 1) {
    return (
      <div className="max-w-xl mx-auto space-y-6 text-center">
        <div>
            {/* ========================================= PAKEITIMAS PRASIDEDA ČIA ========================================= */}
            <h3 className="text-xl font-semibold flex items-center gap-2 justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
                Generate a Quick Article
            </h3>
            <p className="text-muted-foreground">Start with a topic or upload a document.</p>
            {/* ========================================= PAKEITIMO PABAIGA ========================================= */}
        </div>

        <div className="space-y-2 text-left">
            <Label htmlFor="topic" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
                Article Topic
            </Label>
            <Input
              id="topic"
              placeholder="e.g., The Future of Renewable Energy"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
              if (e.key === 'Enter' && topic.trim()) {
                e.preventDefault();
                handleGenerateTitles();
              }
            }}
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

        <Button
          onClick={handleGenerateTitles}
          disabled={(!topic.trim() && !file) || isLoadingTitles || isGenerating}
          className="w-full"
        >
          {isLoadingTitles ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Titles
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        {/* ========================================= PAKEITIMAS PRASIDEDA ČIA ========================================= */}
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Configure Your Quick Article
        </CardTitle>
        {/* ========================================= PAKEITIMO PABAIGA ========================================= */}
        <p className="text-sm text-muted-foreground">Topic: {topic}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Select a suggested title:</Label>
          <RadioGroup value={selectedTitle} onValueChange={setSelectedTitle}>
            <div className="space-y-2">
              {generatedTitles.map((title, index) => (
                <div key={index} className="flex items-center space-x-2 py-2 hover:bg-accent/50 rounded px-2">
                  <RadioGroupItem value={title} id={`title-${index}`} />
                  <RadioLabel htmlFor={`title-${index}`} className="flex-1 cursor-pointer text-sm">
                    <div className="flex items-center">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs mr-3">
                        {index + 1}
                      </span>
                      <span className="font-medium">{title}</span>
                    </div>
                  </RadioLabel>
                </div>
              ))}
            </div>
          </RadioGroup>
          <div className="space-y-2">
            <Label htmlFor="customTitle">Or enter a custom title</Label>
            <Input
              id="customTitle"
              placeholder="Enter custom title..."
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Word Count</Label>
            <Select value={wordCount.toString()} onValueChange={(value) => setWordCount(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="700">Short (~700 words)</SelectItem>
                <SelectItem value="1200">Medium (~1200 words)</SelectItem>
                <SelectItem value="1800">Long (~1800 words)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Writing Style</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Formal">Formal</SelectItem>
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerateArticle}
          disabled={!selectedTitle.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Article...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Generate Article
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

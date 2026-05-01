// src/components/god-mode/ImageGenerator.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageGeneratorProps {
  // Pakeičiame tipą
  headings: { id: string; text: string }[];
  onBack: () => void;
  handleGeneratePrompts?: (selectedHeadings: { id: string; text: string }[]) => Promise<Record<string, string>>;
  handleGenerateImages?: (prompts: Record<string, string>) => Promise<void>;
}

type Stage = 'selection' | 'prompts' | 'generation';

export default function ImageGenerator({ headings, onBack, handleGeneratePrompts, handleGenerateImages }: ImageGeneratorProps) {
  const [stage, setStage] = useState<Stage>('selection');
  // Būseną keičiame, kad saugotų ID, o ne tekstą
  const [selectedHeadingIds, setSelectedHeadingIds] = useState<Record<string, boolean>>({});
  const [generatedPrompts, setGeneratedPrompts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleHeadingToggle = (headingId: string, checked: boolean) => {
    setSelectedHeadingIds(prev => ({ ...prev, [headingId]: checked }));
  };

  const handleGeneratePromptsClick = async () => {
    setIsLoading(true);
    try {
      // Surenkame pilnus objektus pagal pasirinktus ID
      const selected = headings.filter(h => selectedHeadingIds[h.id]);

      if (handleGeneratePrompts) {
        const prompts = await handleGeneratePrompts(selected);
        setGeneratedPrompts(prompts);
        setStage('prompts');
        toast.success('Prompts generated successfully!');
      } else {
        toast.error('Prompt generation function not available');
      }
    } catch (error) {
      console.error('Error generating prompts:', error);
      toast.error('Failed to generate prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImagesClick = async () => {
    setIsLoading(true);
    try {
      if (handleGenerateImages) {
        await handleGenerateImages(generatedPrompts);
        toast.success("Images generated and inserted!");
        onBack();
      } else {
        toast.error('Image generation function not available');
      }
    } catch (error) {
      console.error('Error generating images:', error);
      toast.error('Failed to generate images');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-muted/30 border-r">
      <div className="flex-shrink-0 flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <h2 className="text-lg font-semibold">Image Generation</h2>
      </div>

      {/* 1 Etapas: Antraščių Pasirinkimas */}
      {stage === 'selection' && (
        <div className="flex-grow overflow-y-auto space-y-3">
          <p className="text-sm text-muted-foreground mb-2">Select headings to generate images for:</p>
          {headings.map((h) => (
            <div key={h.id} className="flex items-center space-x-2 p-2 rounded-md bg-background border">
              <Checkbox
                id={h.id}
                onCheckedChange={(checked) => handleHeadingToggle(h.id, !!checked)}
              />
              <label htmlFor={h.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {h.text}
              </label>
            </div>
          ))}
          <Button onClick={handleGeneratePromptsClick} disabled={isLoading || Object.values(selectedHeadingIds).every(v => !v)} className="w-full mt-4">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Prompts
          </Button>
        </div>
      )}

      {/* 2 Etapas: Prompt'ų Redagavimas */}
      {stage === 'prompts' && (
         <div className="flex-grow overflow-y-auto space-y-4">
            <p className="text-sm text-muted-foreground mb-2">Review and edit the generated prompts:</p>
            {Object.entries(generatedPrompts).map(([heading, prompt]) => (
                <div key={heading} className="space-y-2">
                    <Label htmlFor={`prompt-${heading}`} className="font-semibold">{heading}</Label>
                    <Textarea
                        id={`prompt-${heading}`}
                        value={prompt}
                        onChange={(e) => setGeneratedPrompts(prev => ({...prev, [heading]: e.target.value}))}
                        rows={3}
                    />
                </div>
            ))}
             <Button onClick={handleGenerateImagesClick} disabled={isLoading} className="w-full mt-4">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                Generate Images
            </Button>
         </div>
      )}
    </div>
  );
}

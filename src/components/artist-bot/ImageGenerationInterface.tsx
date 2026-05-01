// src/components/artist-bot/ImageGenerationInterface.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles, Loader2, PenTool } from 'lucide-react';

interface ImageGenerationInterfaceProps {
  headings: { id: string; text: string }[];
  onSubmit: (selectedHeadings: { id: string; text: string }[], customInstructions: string) => void;
  isLoading: boolean;
}

export default function ImageGenerationInterface({ headings, onSubmit, isLoading }: ImageGenerationInterfaceProps) {
  const [selectedHeadingIds, setSelectedHeadingIds] = useState<Record<string, boolean>>({});
  const [customInstructions, setCustomInstructions] = useState('');

  const handleHeadingToggle = (headingId: string, checked: boolean) => {
    setSelectedHeadingIds(prev => ({ ...prev, [headingId]: checked }));
  };

  const handleSubmit = () => {
    const selected = headings.filter(h => selectedHeadingIds[h.id]);
    if (selected.length > 0) {
      onSubmit(selected, customInstructions);
    }
  };

  const selectedCount = Object.values(selectedHeadingIds).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* ===== PRADŽIA: Pasisveikinimo žinutė kaip pokalbio burbulas ===== */}
      <div className="flex flex-col gap-2 items-start flex-shrink-0">
          {/* Asistento "galva" (avataras ir vardas) */}
          <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-primary">
                      <PenTool className="h-3 w-3" />
                  </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">AI Artist</span>
          </div>
          {/* Žinutės burbulas */}
          <div className="flex flex-col gap-1 pl-8">
              <Card className="max-w-md p-3 bg-muted text-foreground">
                  <p className="prose prose-sm dark:prose-invert max-w-none">
                      I&apos;m your AI Artist. Select the headings you want images for, add any special requests, and I&apos;ll create them.
                  </p>
              </Card>
          </div>
      </div>
      {/* ===== PABAIGA: Pasisveikinimo žinutės pabaiga ===== */}

      <div className="flex-grow overflow-y-auto space-y-3 pr-2">
        <Label className="font-semibold">Available Headings (H1 & H2)</Label>
        {headings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No headings found in the document.</p>
        ) : (
          headings.map((h) => (
            <div key={h.id} className="flex items-center space-x-3 p-3 rounded-md bg-background border hover:bg-accent/50 transition-colors">
              <Checkbox
                id={h.id}
                onCheckedChange={(checked) => handleHeadingToggle(h.id, !!checked)}
                checked={!!selectedHeadingIds[h.id]}
                disabled={isLoading}
              />
              <label htmlFor={h.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
                {h.text}
              </label>
            </div>
          ))
        )}
      </div>

      <div className="flex-shrink-0 space-y-3">
        <div className="space-y-2">
            <Label htmlFor="custom-instructions">Additional Instructions (Optional)</Label>
            <Textarea
                id="custom-instructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g., 'all images should be in a minimalist style', 'use a blue color palette'"
                rows={3}
                disabled={isLoading}
            />
        </div>
        <Button onClick={handleSubmit} disabled={isLoading || selectedCount === 0} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate {selectedCount > 0 ? `${selectedCount} Image(s)` : 'Images'}
        </Button>
      </div>
    </div>
  );
}

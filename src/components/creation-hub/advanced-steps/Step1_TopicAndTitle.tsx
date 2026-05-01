'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label as RadioLabel } from '@/components/ui/label';
import { Loader2, Lightbulb, PenSquare, Heading1, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';

interface Step1TopicAndTitleProps {
  topic: string;
  seoTitle: string;
  updateFormData: (updates: { topic?: string; seoTitle?: string }) => void;
}

export default function Step1_TopicAndTitle({
  topic,
  seoTitle,
  updateFormData,
}: Step1TopicAndTitleProps) {
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [flashBorder, setFlashBorder] = useState(false);

  const handleGenerateTitles = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic first.');
      return;
    }

    setIsLoading(true);
    try {
      // Get the current user's ID token
      const user = auth.currentUser;
      if (!user) {
        toast.error("Authentication required", {
          description: "Please log in to generate titles.",
        });
        return;
      }

      const idToken = await user.getIdToken();

      const response = await fetch('/api/generate-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, idToken }),
      });

      const data = await response.json();

      if (response.ok && data.titles) {
        setGeneratedTitles(data.titles);
      } else {
        toast.error("Title Generation Failed", {
          description: data.error || "The AI could not generate titles for this topic. Please try again or use a different topic.",
        });
      }
    } catch (error) {
      console.error('Title generation error:', error);
      toast.error("Title Generation Failed", {
        description: "The AI could not generate titles for this topic. Please try again or use a different topic.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleSelect = (selectedTitle: string) => {
    updateFormData({ seoTitle: selectedTitle });
    setFlashBorder(true);
    setTimeout(() => setFlashBorder(false), 500);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heading1 className="h-5 w-5 text-primary" />
          Step 1: Topic & Title Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Topic Input */}
        <div className="space-y-2">
          <Label htmlFor="topic" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            Article Topic *
          </Label>
          <Input
            id="topic"
            placeholder="e.g., The Benefits of Green Energy in Modern Society"
            value={topic}
            onChange={(e) => updateFormData({ topic: e.target.value })}
          />
        </div>

        {/* Final Title Input */}
        <div className="space-y-2">
          <Label htmlFor="seoTitle" className="flex items-center gap-2">
            <PenSquare className="h-4 w-4 text-muted-foreground" />
            Final Title
          </Label>
          <Input
            id="seoTitle"
            placeholder="Enter or select a title above..."
            value={seoTitle}
            onChange={(e) => updateFormData({ seoTitle: e.target.value })}
            className={cn(flashBorder && "border-green-500 transition-colors duration-300")}
          />
        </div>

        {/* Generate Titles Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleGenerateTitles}
            disabled={isLoading || !topic.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Titles with AI
              </>
            )}
          </Button>
        </div>

        {/* Generated Titles */}
        {generatedTitles.length > 0 && (
          <div className="space-y-4">
            <Label>Select a suggested title:</Label>
            <RadioGroup
              value={seoTitle}
              onValueChange={handleTitleSelect}
              className="space-y-2"
            >
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
            </RadioGroup>
          </div>
        )}


      </CardContent>
    </Card>
  );
}

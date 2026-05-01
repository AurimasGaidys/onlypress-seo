'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Loader2, KeyRound, FileText, PlusCircle, Sparkles } from 'lucide-react';
import { auth } from '@/lib/firebase';

interface Step2KeywordsProps {
  topic: string;
  seoTitle: string;
  targetKeywords: string[];
  updateFormData: (updates: { targetKeywords?: string[] }) => void;
}

export default function Step2_Keywords({
  topic,
  seoTitle,
  targetKeywords,
  updateFormData,
}: Step2KeywordsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateKeywords = async () => {
    if (!topic.trim() || !seoTitle.trim()) {
      alert('Topic and title are required for keyword generation.');
      return;
    }

    setIsLoading(true);
    try {
      // Get the current user's ID token
      const user = auth.currentUser;
      if (!user) {
        toast.error("Authentication required", {
          description: "Please log in to generate keywords.",
        });
        return;
      }

      const idToken = await user.getIdToken();

      const response = await fetch('/api/generate-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, title: seoTitle, idToken }),
      });

      const data = await response.json();

      if (response.ok && data.keywords) {
        const newKeywords = [...targetKeywords, ...data.keywords];
        updateFormData({ targetKeywords: newKeywords });
      } else {
        toast.error("Keyword Generation Failed", {
          description: data.error || "The AI could not generate keywords for this topic and title. Please try again.",
        });
      }
    } catch (error) {
      console.error('Keyword generation error:', error);
      toast.error("Keyword Generation Failed", {
        description: "The AI could not generate keywords for this topic and title. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !targetKeywords.includes(keyword.trim())) {
      updateFormData({ targetKeywords: [...targetKeywords, keyword.trim()] });
    }
  };

  const removeKeyword = (keyword: string) => {
    updateFormData({ targetKeywords: targetKeywords.filter(k => k !== keyword) });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          Step 2: Keywords
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Context Display */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Current Article
          </h4>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium">Topic:</span> {topic}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Title:</span> {seoTitle}
          </p>
        </div>

        {/* Manual Keyword Input */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-primary" />
            Add Keywords Manually
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a keyword..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value) {
                    addKeyword(value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <Button
              type="button"
              onClick={() => {
                const input = document.querySelector('input[placeholder="Add a keyword..."]') as HTMLInputElement;
                const value = input?.value?.trim();
                if (value) {
                  addKeyword(value);
                  input.value = '';
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Generate Keywords */}
        <div className="flex gap-4">
          <Button
            onClick={handleGenerateKeywords}
            disabled={isLoading}
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
                Generate Keywords with AI
              </>
            )}
          </Button>
        </div>

        {/* Keywords List */}
        {targetKeywords.length > 0 && (
          <div className="space-y-2">
            <Label>Keywords ({targetKeywords.length})</Label>
            <div className="flex flex-wrap gap-2">
              {targetKeywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  );
}

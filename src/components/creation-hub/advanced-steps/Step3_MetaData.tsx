'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Tags, FileText, Heading2, BookText, Sparkles } from 'lucide-react';
import { auth } from '@/lib/firebase';

interface Step3MetaDataProps {
  topic: string;
  seoTitle: string;
  seoDescription: string;
  targetKeywords: string[];
  updateFormData: (updates: { seoTitle?: string; seoDescription?: string }) => void;
}

export default function Step3_MetaData({
  topic,
  seoTitle,
  seoDescription,
  targetKeywords,
  updateFormData,
}: Step3MetaDataProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateMeta = async () => {
    if (!topic.trim() || !seoTitle.trim() || targetKeywords.length === 0) {
      alert('Topic, title, and at least one keyword are required for meta generation.');
      return;
    }

    setIsLoading(true);
    try {
      // Get the current user's ID token
      const user = auth.currentUser;
      if (!user) {
        toast.error("Authentication required", {
          description: "Please log in to generate meta data.",
        });
        return;
      }

      const idToken = await user.getIdToken();

      const response = await fetch('/api/generate-meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, title: seoTitle, keywords: targetKeywords, idToken }),
      });

      const data = await response.json();

      if (response.ok && data.metaTitle && data.metaDescription) {
        updateFormData({
          seoTitle: data.metaTitle,
          seoDescription: data.metaDescription
        });
      } else {
        toast.error("Meta Data Generation Failed", {
          description: data.error || "The AI could not generate meta data for this topic and title. Please try again.",
        });
      }
    } catch (error) {
      console.error('Meta generation error:', error);
      toast.error("Meta Data Generation Failed", {
        description: "The AI could not generate meta data for this topic and title. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-5 w-5 text-primary" />
          Step 4: Meta Data Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Context Display */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Article Details
          </h4>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium">Topic:</span> {topic}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium">Title:</span> {seoTitle}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Keywords:</span> {targetKeywords.join(', ')}
          </p>
        </div>

        {/* SEO Meta Title */}
        <div className="space-y-2">
          <Label htmlFor="seoTitle" className="flex items-center gap-2">
            <Heading2 className="h-4 w-4 text-primary" />
            SEO Meta Title
          </Label>
          <Input
            id="seoTitle"
            value={seoTitle}
            onChange={(e) => updateFormData({ seoTitle: e.target.value })}
            placeholder="Enter SEO meta title..."
          />
        </div>

        {/* SEO Meta Description */}
        <div className="space-y-2">
          <Label htmlFor="seoDescription" className="flex items-center gap-2">
            <BookText className="h-4 w-4 text-primary" />
            SEO Meta Description
          </Label>
          <Textarea
            id="seoDescription"
            value={seoDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData({ seoDescription: e.target.value })}
            placeholder="Enter SEO meta description..."
            rows={3}
            className="resize-y"
          />
        </div>

        {/* Generate Meta Data */}
        <div className="flex gap-4">
          <Button
            onClick={handleGenerateMeta}
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
                Generate Meta Data with AI
              </>
            )}
          </Button>
        </div>


      </CardContent>
    </Card>
  );
}

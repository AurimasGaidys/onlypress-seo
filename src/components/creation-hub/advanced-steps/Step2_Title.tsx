'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Step2TitleProps {
  seoTitle: string;
  seoDescription: string;
  updateFormData: (updates: { seoTitle?: string; seoDescription?: string }) => void;
  onPrev: () => void;
  onNext: () => void;
  onGenerate: () => void;
}

export default function Step2_Title({
  seoTitle,
  seoDescription,
  updateFormData,
  onPrev,
  onNext,
  onGenerate,
}: Step2TitleProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Step 2: SEO Title & Description</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO Meta Title</Label>
          <Input
            id="seoTitle"
            placeholder="Enter compelling SEO title..."
            value={seoTitle}
            onChange={(e) => updateFormData({ seoTitle: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO Meta Description</Label>
          <textarea
            id="seoDescription"
            placeholder="Write an engaging meta description (150-160 characters)..."
            value={seoDescription}
            onChange={(e) => updateFormData({ seoDescription: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        <div className="flex gap-4">
          <Button
            onClick={onGenerate}
            variant="outline"
            className="flex-1"
          >
            AI Generate Title & Description
          </Button>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={onPrev}
            variant="outline"
            className="flex-1"
          >
            Previous
          </Button>

          <Button
            onClick={onNext}
            className="flex-1"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

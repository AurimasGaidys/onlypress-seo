'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Step1TopicProps {
  topic: string;
  updateFormData: (updates: { topic: string }) => void;
  onNext: () => void;
  onGenerate: () => void;
}

export default function Step1_Topic({ topic, updateFormData, onNext, onGenerate }: Step1TopicProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Step 1: Article Topic</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic">Enter your article topic *</Label>
          <Input
            id="topic"
            placeholder="e.g., The Benefits of Green Energy in Modern Society"
            value={topic}
            onChange={(e) => updateFormData({ topic: e.target.value })}
          />
        </div>

        <div className="flex gap-4">
          <Button
            onClick={onGenerate}
            variant="outline"
            className="flex-1"
          >
            AI Generate Topic Ideas
          </Button>

          <Button
            onClick={onNext}
            disabled={!topic.trim()}
            className="flex-1"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface Step3KeywordsProps {
  targetKeywords: string[];
  updateFormData: (updates: { targetKeywords: string[] }) => void;
  onPrev: () => void;
  onNext: () => void;
  onGenerate: () => void;
}

export default function Step3_Keywords({
  targetKeywords,
  updateFormData,
  onPrev,
  onNext,
  onGenerate,
}: Step3KeywordsProps) {
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
        <CardTitle>Step 3: Target Keywords</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Target Keywords</Label>
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
          {targetKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
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
          )}
        </div>

        <div className="flex gap-4">
          <Button
            onClick={onGenerate}
            variant="outline"
            className="flex-1"
          >
            AI Generate Keywords
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

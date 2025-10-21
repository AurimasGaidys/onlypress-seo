// src/components/article-wizard/Step1_Idea.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WizardFormData } from '@/types/wizard';
import { ArrowRight } from 'lucide-react';

interface Step1Props {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
  handleNextStep: () => void;
}

export default function Step1_Idea({ formData, updateFormData, handleNextStep }: Step1Props) {
  const [topic, setTopic] = useState(formData.topic || '');

  const handleNext = () => {
    if (topic.trim()) {
      updateFormData({ topic });
      handleNextStep();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Let's start with a topic</CardTitle>
        <CardDescription>
          What is the main subject you want to write an article about?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Article Topic</Label>
            <Input
              id="topic"
              placeholder="e.g., The Future of Renewable Energy"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              autoFocus
            />
          </div>
          <Button onClick={handleNext} disabled={!topic.trim()} className="w-full">
            Generate Titles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

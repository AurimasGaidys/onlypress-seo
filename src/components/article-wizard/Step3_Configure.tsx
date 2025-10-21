// src/components/article-wizard/Step3_Configure.tsx
'use client';

import { WizardFormData } from '@/types/wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowRight } from 'lucide-react';

interface Step3Props {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
}

export default function Step3_Configure({ formData, updateFormData, handleNextStep, handlePreviousStep }: Step3Props) {
  const { articleConfig } = formData;

  const setConfig = (key: keyof typeof articleConfig, value: string) => {
    updateFormData({
      articleConfig: {
        ...articleConfig,
        [key]: value,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Fine-tune your article</CardTitle>
        <CardDescription>
          Set the desired length and tone for the generated content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Article Length */}
        <div className="space-y-3">
          <Label>Article Length</Label>
          <RadioGroup
            value={articleConfig.length}
            onValueChange={(value) => setConfig('length', value)}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="short" id="short" />
              <Label htmlFor="short" className="font-normal">Short (~500 words)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="font-normal">Medium (~1000 words)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="long" id="long" />
              <Label htmlFor="long" className="font-normal">Long (~1500+ words)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Article Tone */}
        <div className="space-y-3">
          <Label>Tone of Voice</Label>
          <RadioGroup
            value={articleConfig.tone}
            onValueChange={(value) => setConfig('tone', value)}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="professional" id="professional" />
              <Label htmlFor="professional" className="font-normal">Professional</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="casual" id="casual" />
              <Label htmlFor="casual" className="font-normal">Casual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="formal" id="formal" />
              <Label htmlFor="formal" className="font-normal">Formal</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handlePreviousStep}>
            Back to Title
          </Button>
          <Button onClick={handleNextStep}>
            Generate Article
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

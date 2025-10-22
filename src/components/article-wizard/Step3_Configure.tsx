'use client';
import { useMemo } from 'react';
import { WizardFormData } from '@/types/wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArticleLengthPicker } from '@/components/pickers/ArticleLengthPicker';
import { TonePicker } from '@/components/pickers/TonePicker';
import { KeywordsInput } from '@/components/keywords-input';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Step3Props {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
}

export default function Step3_Configure({ formData, updateFormData, handleNextStep, handlePreviousStep }: Step3Props) {
  const { articleConfig } = formData;
  const keywords = formData.keywords ?? [];

  const setConfig = <K extends keyof typeof articleConfig>(key: K, value: (typeof articleConfig)[K]) => {
    updateFormData({
      articleConfig: { ...articleConfig, [key]: value },
    });
  };

  const keywordSuggestions = useMemo(
    () => [
      'AI trends',
      'content strategy',
      'thought leadership',
      'market analysis',
      'product updates',
      'customer stories',
    ],
    []
  );

  const handleKeywordChange = (nextKeywords: string[]) => {
    updateFormData({ keywords: nextKeywords });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Fine-tune your article</CardTitle>
        <CardDescription>
          Shape how the assistant generates your content by choosing keywords, length, and tone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-5">
          <KeywordsInput
            value={keywords}
            onChange={handleKeywordChange}
            label="Keywords"
            placeholder="Add keywords and press Enter"
            helperText="These guide the AI to emphasize the right ideas. Paste or type multiple keywords separated by commas."
            suggestions={keywordSuggestions}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-border/60 p-5">
            <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Article Length
            </Label>
            <ArticleLengthPicker
              value={articleConfig.length}
              onChange={(value) => setConfig('length', value)}
              className="mt-1"
              idPrefix="wizard-length"
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-border/60 p-5">
            <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Tone of Voice
            </Label>
            <TonePicker
              value={articleConfig.tone}
              onChange={(value) => setConfig('tone', value)}
              className="mt-1"
              idPrefix="wizard-tone"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={handlePreviousStep} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Title
          </Button>
          <Button onClick={handleNextStep} className="w-full sm:w-auto">
            Generate Article
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

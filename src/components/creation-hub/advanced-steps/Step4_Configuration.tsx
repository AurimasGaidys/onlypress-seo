// src/components/creation-hub/advanced-steps/Step4_Configuration.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    PenTool,
    SlidersHorizontal,
    FileText,
    CheckCircle2,
    AlignLeft,
    Search,
    BookOpen,
    Layers,
    MessageCircleQuestion,
    Settings,
    Loader2
} from 'lucide-react';

interface Step4ConfigurationProps {
  tone: string;
  wordCount: number;
  articleStructure: string;
  customInstructions: string;
  updateFormData: (updates: {
    tone?: string;
    wordCount?: number;
    articleStructure?: string;
    customInstructions?: string;
  }) => void;
  onSubmit: () => void;
  isSubmitting: boolean; // <-- PRIDĖK ŠĮ PROP
}

const articleStructureOptions = [
  {
      value: "simple",
      label: "Simple Article",
      description: "Clean, straightforward article without structured sections.",
      icon: AlignLeft
  },
  {
      value: "seo-standard",
      label: "SEO Standard",
      description: "Professional structure with distinct H2 sections for better ranking.",
      icon: Search
  },
  {
      value: "detailed-guide",
      label: "Detailed Guide",
      description: "Comprehensive guide using H2 and H3 sub-sections for depth.",
      icon: BookOpen
  },
  {
      value: "comprehensive",
      label: "Comprehensive How-To",
      description: "Full hierarchy (H2-H4) with step-by-step instructions.",
      icon: Layers
  },
  {
      value: "faq-focused",
      label: "FAQ Article",
      description: "Article structured around frequently asked questions.",
      icon: MessageCircleQuestion
  },
];

export default function Step4_Configuration({
  tone,
  wordCount,
  articleStructure,
  customInstructions,
  updateFormData,
  onSubmit,
  isSubmitting, // <-- Gauk prop'ą
}: Step4ConfigurationProps) {
  return (
    <Card className="h-full border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Step 5: Final Configuration
        </CardTitle>
        <CardDescription>
          Define the final parameters for the AI to generate your article.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 px-0">

        {/* === GRUPĖ 1: PAGRINDINIAI STRAIPSNIO NUSTATYMAI === */}
        <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                Article Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone of Voice</Label>
                <Select value={tone} onValueChange={(value) => updateFormData({ tone: value })}>
                  <SelectTrigger id="tone">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Formal">Formal</SelectItem>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wordCount">Target Length</Label>
                <Select value={wordCount.toString()} onValueChange={(value) => updateFormData({ wordCount: parseInt(value) })}>
                  <SelectTrigger id="wordCount">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">~500 words</SelectItem>
                    <SelectItem value="800">~800 words</SelectItem>
                    <SelectItem value="1200">~1200 words</SelectItem>
                    <SelectItem value="1500">~1500 words</SelectItem>
                    <SelectItem value="2000">~2000 words</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>

        <Separator />

        {/* === GRUPĖ 2: STRUKTŪROS KORTELĖS === */}
        <div className="space-y-4">
          <div className="space-y-1">
              <h3 className="text-lg font-medium flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Content Structure
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a template that best fits your content goals.
              </p>
          </div>

          {/* KORTELIŲ TINKLELIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {articleStructureOptions.map((option, index) => {
                const isSelected = articleStructure === option.value;
                const Icon = option.icon;
                // Paskutinė kortelė užima visą plotį, jei elementų skaičius nelyginis (simetrijai)
                const isLastAndOdd = index === articleStructureOptions.length - 1 && articleStructureOptions.length % 2 !== 0;

                return (
                    <div
                        key={option.value}
                        onClick={() => updateFormData({ articleStructure: option.value })}
                        className={cn(
                            "relative flex cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:bg-accent/50",
                            isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted bg-card hover:border-primary/30",
                            isLastAndOdd && "sm:col-span-2"
                        )}
                    >
                        <div className="flex items-start gap-4 w-full">
                            <div className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h4 className={cn("font-medium leading-none", isSelected && "text-primary")}>
                                    {option.label}
                                </h4>
                                <p className="text-sm text-muted-foreground leading-snug">
                                    {option.description}
                                </p>
                            </div>
                            {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 absolute top-4 right-4" />
                            )}
                        </div>
                    </div>
                );
            })}
          </div>
        </div>

        <Separator />

        {/* === GRUPĖ 3: PAPILDOMOS INSTRUKCIJOS === */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" />
                Advanced Customization
          </h3>
          <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
          <Textarea
            id="customInstructions"
            placeholder="E.g., 'Focus on benefits for small businesses', 'Use a friendly intro but serious body', 'Include a call-to-action for newsletter signup'..."
            value={customInstructions}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData({ customInstructions: e.target.value })}
            rows={3}
            className="resize-y"
          />
        </div>

        {/* === GALUTINIS MYGTUKAS === */}
        <Button
          onClick={onSubmit}
          disabled={isSubmitting} // <-- PRITAIKYK ČIA
          size="lg"
          className="w-full text-base font-semibold mt-6"
        >
          {/* PRIDĖK ŠIĄ LOGIKĄ */}
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Advanced SEO Article'
          )}
        </Button>

      </CardContent>
    </Card>
  );
}

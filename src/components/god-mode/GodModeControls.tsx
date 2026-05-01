// src/components/god-mode/GodModeControls.tsx
'use client';

import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { AdvancedFormData } from "@/types/god-mode";
import { cn } from "@/lib/utils";
import ImageGenerator from './ImageGenerator';
import {
    SlidersHorizontal, Save, Loader2, Lightbulb, PenSquare, Sparkles, KeyRound, Tags, Link as LinkIcon, FileText,
    CheckCircle2, AlignLeft, Search, BookOpen, Layers, MessageCircleQuestion, X, Rocket, Image as ImageIcon, HelpCircle
} from "lucide-react";

// Pernaudojame struktūros tipus iš Advanced Mode (Step 4 - Configuration)
const articleStructureOptions = [
    { value: "simple", label: "Simple Article", description: "Clean, straightforward article without structured sections.", icon: AlignLeft },
    { value: "seo-standard", label: "SEO Standard", description: "Professional structure with distinct H2 sections for better ranking.", icon: Search },
    { value: "detailed-guide", label: "Detailed Guide", description: "Comprehensive guide using H2 and H3 sub-sections for depth.", icon: BookOpen },
    { value: "comprehensive", label: "Comprehensive How-To", description: "Full hierarchy (H2-H4) with step-by-step instructions.", icon: Layers },
    { value: "faq-focused", label: "FAQ Article", description: "Article structured around frequently asked questions.", icon: MessageCircleQuestion },
];

interface GodModeControlsProps {
    formData: AdvancedFormData;
    updateFormData: (updates: Partial<AdvancedFormData>) => void;
    // API handleriai
    handleGenerateTitles?: () => void;
    handleGenerateKeywords?: () => void;
    handleGenerateMeta?: () => void;
    handleGenerateArticle?: () => void;
    generationState?: {
      titles: string[];
      isGeneratingTitles: boolean;
      isGeneratingKeywords: boolean;
      isGeneratingMeta: boolean;
      isGeneratingArticle: boolean;
    };
    isLocalSession: boolean;
    onSave: () => void;
    isSaving: boolean;
    // Image generation props
    headings?: { id: string; text: string }[];
    handleGeneratePrompts?: (selectedHeadings: { id: string; text: string }[]) => Promise<Record<string, string>>;
    handleGenerateImages?: (prompts: Record<string, string>) => Promise<void>;
}

export default function GodModeControls({
    formData,
    updateFormData,
    handleGenerateTitles,
    handleGenerateKeywords,
    handleGenerateMeta,
    handleGenerateArticle,
    generationState,
    isLocalSession,
    onSave,
    isSaving,
    headings = [],
    handleGeneratePrompts,
    handleGenerateImages,
}: GodModeControlsProps) {

    // --- PRADĖKITE PAKEITIMĄ ČIA ---

    // 1. Pridedame būseną akordeono valdymui
    const [openAccordion, setOpenAccordion] = useState<string[]>(['item-1']);

    const [keywordInput, setKeywordInput] = useState('');
    const [backlinkInput, setBacklinkInput] = useState('');
    const [view, setView] = useState<'controls' | 'images'>('controls');

    // 2. Sukuriame funkciją, kuri valdys mygtuko paspaudimą
    const handleTitleStepAction = () => {
      // Jei pavadinimas yra iš įvesties lauko arba paspaustas passelecas, bet jau yra sugeneruoti pavadinimai
      if (formData.seoTitle.trim() && generationState?.titles && generationState.titles.length > 0) {
        // Regeneruoti naujus pavadinimus
        handleGenerateTitles?.();
      } else if (formData.seoTitle.trim()) {
        // Pereiname prie kito žingsnio
        setOpenAccordion(prev => {
          // Uzdarome pirmą ir atidarome antrą
          const newOpen = prev.filter(item => item !== 'item-1');
          if (!newOpen.includes('item-2')) {
            newOpen.push('item-2');
          }
          return newOpen;
        });
      } else {
        // Sugeneruoti naujus pavadinimus
        handleGenerateTitles?.();
      }
    };

    // 3. Stebime, ar pasikeitė generuoti pavadinimai, ir atidarome akordeoną, jei reikia
    useEffect(() => {
        if (generationState?.titles && generationState.titles.length > 0) {
            // Atidarome "Article Setup", jei jis buvo uždarytas, kad vartotojas pamatytų rezultatus
            if (!openAccordion.includes('item-1')) {
                setOpenAccordion(prev => [...prev, 'item-1']);
            }
        }
    }, [generationState?.titles]);

    // --- PAKEITIMO PABAIGA ---

    const getHeadingsFromContent = (): string[] => {
        // Čia bus funkcija, kuri ištraukia H2 antraštes iš editoriaus turinio
        // Ją perduosime per props'us iš pagrindinio puslapio
        return ["Pavyzdinė antraštė 1", "Pavyzdinė antraštė 2"];
    };

    const handleAddKeyword = () => {
        if (keywordInput.trim() && !formData.targetKeywords.includes(keywordInput.trim())) {
            updateFormData({ targetKeywords: [...formData.targetKeywords, keywordInput.trim()] });
            setKeywordInput('');
        }
    };

    const handleRemoveKeyword = (kw: string) => {
        updateFormData({ targetKeywords: formData.targetKeywords.filter(k => k !== kw) });
    };

    const handleAddBacklink = () => {
        if (backlinkInput.trim()) {
            // Allow multiple backlinks separated by commas, spaces, or newlines
            const backlinkUrls = backlinkInput
                .split(/[,;\n\s]+/) // Split by comma, semicolon, newline, or whitespace
                .map(url => url.trim())
                .filter(url => url && url !== '');

            const newBacklinks = backlinkUrls.filter(url =>
                !formData.backlinks.includes(url) &&
                url.startsWith('http') // Basic validation for URLs
            );

            if (newBacklinks.length > 0) {
                updateFormData({ backlinks: [...formData.backlinks, ...newBacklinks] });
                setBacklinkInput('');
            }
        }
    };

    const handleRemoveBacklink = (backlink: string) => {
        updateFormData({ backlinks: formData.backlinks.filter(b => b !== backlink) });
    };

    if (view === 'images') {
        return (
            <ImageGenerator
                headings={headings.length > 0 ? headings : getHeadingsFromContent()}
                onBack={() => setView('controls')}
                handleGeneratePrompts={handleGeneratePrompts}
                handleGenerateImages={handleGenerateImages}
            />
        );
    }

  return (
    <div
      className="h-full overflow-y-auto p-4 bg-muted/30 border-r"
      style={{
        scrollbarWidth: 'none',  // Firefox
        msOverflowStyle: 'none'   // IE and Edge
      }}
    >
        <style dangerouslySetInnerHTML={{
          __html: `
            .god-mode-scroll::-webkit-scrollbar {
              display: none;
            }
          `
        }} />
        <div className="god-mode-scroll">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 px-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            God Mode Controls
        </h2>

        {/* 4. Atnaujiname Accordion komponentą */}
        <Accordion type="multiple" value={openAccordion} onValueChange={setOpenAccordion} className="w-full">
            {/* --- 1. ARTICLE SETUP --- */}
            <AccordionItem value="item-1">
                <AccordionTrigger className="text-base">Article Setup</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="topic" className="flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Topic</Label>
                        <Input id="topic" value={formData.topic} onChange={e => updateFormData({ topic: e.target.value })} placeholder="The future of AI..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="seoTitle" className="flex items-center gap-2"><PenSquare className="h-4 w-4" /> Title</Label>
                        <Input id="seoTitle" value={formData.seoTitle} onChange={e => updateFormData({ seoTitle: e.target.value })} placeholder="Enter or generate a title..." />
                    </div>
                    {/* 5. Atnaujiname mygtuką */}
                    <Button
                        className="w-full"
                        onClick={handleTitleStepAction}
                        disabled={generationState?.isGeneratingTitles || (generationState?.titles && generationState.titles.length > 0 && !formData.seoTitle.trim())}
                        variant={(generationState?.titles && generationState.titles.length > 0 && !formData.seoTitle.trim()) ? "secondary" : "default"}
                    >
                        {formData.seoTitle.trim() ? (
                            (generationState?.titles && generationState.titles.length > 0) ? 'Regenerate' : 'Continue'
                        ) : (
                            <>
                                {generationState?.isGeneratingTitles ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (generationState?.titles && generationState.titles.length > 0) ? (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                {generationState?.titles && generationState.titles.length > 0 ? 'Select a Title Above' : 'Generate Titles with AI'}
                            </>
                        )}
                    </Button>

                    {/* === NAUJAS STILIZUOTAS BLOKAS: SUGENERUOTŲ PAVADINIMŲ SĄRAŠAS === */}
                    {generationState && generationState.titles && generationState.titles.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <Label className="font-semibold">Suggested Titles:</Label>
                            <div className="space-y-2">
                                {generationState.titles.map((title: string, index: number) => {
                                    const isSelected = formData.seoTitle === title;
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => updateFormData({ seoTitle: title })}
                                            className={cn(
                                                "relative flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all duration-200 hover:bg-accent/50",
                                                isSelected
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-muted bg-card"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <p className="flex-1 text-sm font-medium leading-tight">
                                                {title}
                                            </p>
                                            {isSelected && (
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* === BLOKO PABAIGA === */}
                </AccordionContent>
            </AccordionItem>

            {/* --- 2. SEO & KEYWORDS --- */}
            <AccordionItem value="item-2">
                <AccordionTrigger className="text-base">SEO & Keywords</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-2">
                    {/* Keywords */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Keywords</Label>
                        <div className="flex gap-2">
                            <Input
                                value={keywordInput}
                                onChange={e => setKeywordInput(e.target.value)}
                                placeholder="Add a keyword..."
                                onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                            />
                            <Button size="sm" onClick={handleAddKeyword} disabled={!keywordInput.trim()}>Add</Button>
                        </div>
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={handleGenerateKeywords}
                            disabled={generationState?.isGeneratingKeywords || (!formData.topic.trim() || !formData.seoTitle.trim())}
                        >
                            {generationState?.isGeneratingKeywords ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )} {formData.targetKeywords.length > 0 ? 'Generate More' : 'Generate Keywords'}
                        </Button>
                        <div className="flex flex-wrap gap-1 pt-2">
                            {formData.targetKeywords.map(kw =>
                                <Badge key={kw} variant="secondary" className="cursor-pointer hover:bg-destructive/20" onClick={() => handleRemoveKeyword(kw)}>
                                    {kw} <X className="ml-1 h-3 w-3" />
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Separator />
                    {/* Meta Data */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Tags className="h-4 w-4" /> Meta Data</Label>
                        <Input value={formData.metaTitle} onChange={e => updateFormData({ metaTitle: e.target.value })} placeholder="Meta Title... (max 60 characters)" />
                        <Textarea value={formData.seoDescription} onChange={e => updateFormData({ seoDescription: e.target.value })} placeholder="SEO Meta Description... (max 160 characters)" rows={3} />
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={handleGenerateMeta}
                            disabled={generationState?.isGeneratingMeta || (!formData.topic.trim() || !formData.seoTitle.trim())}
                        >
                            {generationState?.isGeneratingMeta ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )} {formData.metaTitle.trim() ? 'Regenerate Meta Data' : 'Generate Meta Data'}
                        </Button>
                    </div>
                    <Separator />
                    {/* Backlinks */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Backlinks</Label>
                        <div className="flex gap-2">
                           <Input
                               value={backlinkInput}
                               onChange={e => setBacklinkInput(e.target.value)}
                               placeholder="https://example.com, https://another.com"
                               onKeyDown={e => e.key === 'Enter' && handleAddBacklink()}
                           />
                           <Button size="sm" onClick={handleAddBacklink} disabled={!backlinkInput.trim()}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-2">
                            {formData.backlinks.map(backlink =>
                                <Badge key={backlink} variant="outline" className="cursor-pointer hover:bg-destructive/20" onClick={() => handleRemoveBacklink(backlink)}>
                                    {backlink} <X className="ml-1 h-3 w-3" />
                                </Badge>
                            )}
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* --- 3. STRUCTURE & STYLE --- */}
            <AccordionItem value="item-3">
                <AccordionTrigger className="text-base">Structure & Style</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                            <Label>Tone of Voice</Label>
                            <Select value={formData.tone} onValueChange={v => updateFormData({ tone: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Professional">Professional</SelectItem>
                                    <SelectItem value="Casual">Casual</SelectItem>
                                    <SelectItem value="Expert">Expert</SelectItem>
                                    <SelectItem value="Friendly">Friendly</SelectItem>
                                </SelectContent>
                            </Select>
                       </div>
                       <div className="space-y-2">
                            <Label>Article Length</Label>
                            <Select value={String(formData.wordCount)} onValueChange={v => updateFormData({ wordCount: Number(v) })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="300">~300 words</SelectItem>
                                    <SelectItem value="700">~700 words</SelectItem>
                                    <SelectItem value="1200">~1200 words</SelectItem>
                                    <SelectItem value="1800">~1800 words</SelectItem>
                                </SelectContent>
                            </Select>
                       </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Article Structure</Label>
                        <RadioGroup value={formData.articleStructure} onValueChange={v => updateFormData({ articleStructure: v })} className="space-y-2">
                           {articleStructureOptions.map(opt => (
                               <Label key={opt.value} className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-accent has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
                                   <RadioGroupItem value={opt.value} id={opt.value} />
                                   <opt.icon className="h-5 w-5 text-primary" />
                                   <div>
                                       <p className="font-semibold">{opt.label}</p>
                                       <p className="text-xs text-muted-foreground">{opt.description}</p>
                                   </div>
                               </Label>
                           ))}
                        </RadioGroup>
                    </div>
                    <div
                        className={cn(
                            "relative flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all duration-200",
                            formData.addFAQ
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted bg-card",
                            formData.articleStructure === "faq-focused" && "opacity-50 cursor-not-allowed hover:bg-card"
                        )}
                        onClick={() => {
                            if (formData.articleStructure !== "faq-focused") {
                                updateFormData({ addFAQ: !formData.addFAQ })
                            }
                        }}
                    >
                        <div className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            formData.addFAQ && formData.articleStructure !== "faq-focused"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                        )}>
                            <HelpCircle className="h-3 w-3" />
                        </div>
                        <p className="flex-1 text-sm font-medium">
                            Add FAQ section
                            {formData.articleStructure === "faq-focused" && (
                                <span className="block text-xs text-muted-foreground font-normal">
                                    Not applicable for FAQ Article structure
                                </span>
                            )}
                        </p>
                        {formData.addFAQ && formData.articleStructure !== "faq-focused" && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Custom Instructions</Label>
                        <Textarea value={formData.customInstructions} onChange={e => updateFormData({ customInstructions: e.target.value })} placeholder="E.g., 'Do not mention competitor X'..." rows={4} />
                    </div>
                </AccordionContent>
            </AccordionItem>

        </Accordion>

        {/* --- ACTIONS SECTION --- */}
        <div className="mt-6 space-y-4">
            <div className="border-t pt-4">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    Actions
                </h3>
                <div className="space-y-3">
                    <Button
                        className="w-full"
                        onClick={handleGenerateArticle}
                        disabled={generationState?.isGeneratingArticle || (!formData.topic.trim() && !formData.seoTitle.trim())}
                    >
                        {generationState?.isGeneratingArticle ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Rocket className="mr-2 h-4 w-4" />
                        )} Generate SEO Article
                    </Button>
                </div>
            </div>
        </div>

        {/* --- NAUJA KORTELĖ --- */}
        <Card
            className="mt-4 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setView('images')}
        >
            <CardHeader className="flex flex-col items-center gap-2 p-4 text-center">
                <ImageIcon className="h-6 w-6 text-primary" />
                <div>
                    <CardTitle className="text-base">Generate Images</CardTitle>
                    <p className="text-sm text-muted-foreground">AI-powered images for your headings.</p>
                </div>
            </CardHeader>
        </Card>
        {/* --- KORTELĖS PABAIGA --- */}

        {/* --- SAVED META DESCRIPTION FIELD --- */}
        {!isLocalSession && (
            <div className="mt-4 space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                    <Tags className="h-4 w-4 text-primary" />
                    Saved Meta Description
                </Label>
                <Textarea
                    value={formData.seoDescription}
                    readOnly
                    rows={3}
                    className="bg-muted/50 text-muted-foreground resize-none"
                    placeholder="No meta description saved yet..."
                />
            </div>
        )}
        {/* --- META DESCRIPTION FIELD END --- */}
        </div>
    </div>
  );
}

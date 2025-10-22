// src/components/ai-assistant-sidebar.tsx
'use client';

import { useMemo, useState } from 'react';
import { BrainCircuit, ChevronDown, Lightbulb, PenSquare, SearchCheck, Wand2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArticleLengthPicker } from './pickers/ArticleLengthPicker';
import { TonePicker } from './pickers/TonePicker';
import { KeywordsInput } from './keywords-input';

type SidebarLength = 'short' | 'medium' | 'long';
type SidebarTone = 'professional' | 'casual' | 'formal';
type SidebarArticleConfig = { length: SidebarLength; tone: SidebarTone };

export default function AIAssistantSidebar() {
  const [articleConfig, setArticleConfig] = useState<SidebarArticleConfig>({
    length: 'medium',
    tone: 'professional',
  });
  const [keywords, setKeywords] = useState<string[]>(['AI strategy', 'growth']);
  const [openSections, setOpenSections] = useState({
    keywords: true,
    length: true,
    tone: true,
  });

  const setConfig = <K extends keyof typeof articleConfig>(key: K, value: (typeof articleConfig)[K]) => {
    setArticleConfig({ ...articleConfig, [key]: value });
  };

  const keywordSuggestions = useMemo(
    () => ['automation', 'thought leadership', 'customer success', 'product launch', 'industry trends'],
    []
  );

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const accordionBaseClasses = 'rounded-xl border border-border/60 bg-muted/20 shadow-sm backdrop-blur-sm';
  const accordionHeaderClasses =
    'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
  const accordionContentWrapper = 'overflow-hidden px-4 pb-4';
  const accordionChevron = (isOpen: boolean) =>
    `h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? '-rotate-180' : 'rotate-0'}`;

  return (
    <aside className="space-y-6">
      {/* Suggestions Card */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="gap-2">
          <CardTitle className="flex items-center text-lg">
            <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
            Fine-tune Suggestions
          </CardTitle>
          <CardDescription>
            Adjust focus keywords, length, and tone to guide the assistant before regenerating.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <section className={accordionBaseClasses}>
            <button
              type="button"
              onClick={() => toggleSection('keywords')}
              className={accordionHeaderClasses}
              aria-expanded={openSections.keywords}
              aria-controls="assistant-keywords"
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Keywords</span>
                <span className="text-xs text-muted-foreground">
                  Curate guiding phrases for the assistant to emphasize.
                </span>
              </span>
              <ChevronDown className={accordionChevron(openSections.keywords)} />
            </button>
            <div id="assistant-keywords" className={openSections.keywords ? 'block' : 'hidden'}>
              <div className={accordionContentWrapper}>
                <KeywordsInput
                  value={keywords}
                  onChange={setKeywords}
                  placeholder="Add a keyword and press Enter"
                  helperText="These are kept local to your current session."
                  suggestions={keywordSuggestions}
                />
              </div>
            </div>
          </section>

          <section className={accordionBaseClasses}>
            <button
              type="button"
              onClick={() => toggleSection('length')}
              className={accordionHeaderClasses}
              aria-expanded={openSections.length}
              aria-controls="assistant-length"
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Article Length</span>
                <span className="text-xs text-muted-foreground">
                  Choose how comprehensive the generated draft should be.
                </span>
              </span>
              <ChevronDown className={accordionChevron(openSections.length)} />
            </button>
            <div id="assistant-length" className={openSections.length ? 'block' : 'hidden'}>
              <div className={accordionContentWrapper}>
                <ArticleLengthPicker
                  value={articleConfig.length}
                  onChange={(value) => setConfig('length', value)}
                  idPrefix="sidebar-length"
                />
              </div>
            </div>
          </section>

          <section className={accordionBaseClasses}>
            <button
              type="button"
              onClick={() => toggleSection('tone')}
              className={accordionHeaderClasses}
              aria-expanded={openSections.tone}
              aria-controls="assistant-tone"
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Tone of Voice</span>
                <span className="text-xs text-muted-foreground">
                  Align the assistant with your brand or audience expectations.
                </span>
              </span>
              <ChevronDown className={accordionChevron(openSections.tone)} />
            </button>
            <div id="assistant-tone" className={openSections.tone ? 'block' : 'hidden'}>
              <div className={accordionContentWrapper}>
                <TonePicker
                  value={articleConfig.tone}
                  onChange={(value) => setConfig('tone', value)}
                  idPrefix="sidebar-tone"
                />
              </div>
            </div>
          </section>

          <Button className="w-full gap-2" disabled>
            <Wand2 className="h-4 w-4" />
            Regenerate article
          </Button>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">What do you want to do?</CardTitle>
          <CardDescription>
            Follow-up actions will appear here as the AI reviews your draft.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" disabled>
            <PenSquare className="mr-2 h-4 w-4" />
            Improve it
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <SearchCheck className="mr-2 h-4 w-4" />
            Identify any gaps
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Lightbulb className="mr-2 h-4 w-4" />
            More ideas
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}

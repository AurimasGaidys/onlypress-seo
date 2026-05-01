'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WizardFormData } from '@/types/wizard';
import { ArrowRight, Image as ImageIcon, PenSquare, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step1Props {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
  handleNextStep: () => void;
}

export default function Step1_Idea({ formData, updateFormData, handleNextStep }: Step1Props) {
  type TabKey = 'ai' | 'image' | 'manual';

  const [activeTab, setActiveTab] = useState<TabKey>('ai');
  const [topic, setTopic] = useState(formData.topic || '');
  const tabOptions: Array<{ key: TabKey; label: string; description: string; icon: LucideIcon }> = [
    {
      key: 'ai',
      label: 'Create with AI',
      description: 'Let the assistant craft ideas tailored to your topic.',
      icon: Sparkles,
    },
    {
      key: 'image',
      label: 'Create from image',
      description: 'Use a reference image to inspire your article.',
      icon: ImageIcon,
    },
    {
      key: 'manual',
      label: 'Create manually',
      description: 'Start from scratch and guide every detail yourself.',
      icon: PenSquare,
    },
  ];
  const handleNext = () => {
    if (topic.trim()) {
      updateFormData({ topic });
      handleNextStep();
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Let&#39;s start with a topic</CardTitle>
        <CardDescription>What is the main subject you want to write an article about?</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-1">
            <div className="grid gap-1 sm:grid-cols-3">
              {tabOptions.map(({ key, label, description, icon: Icon }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      'group flex items-start gap-3 rounded-lg px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      isActive
                        ? 'bg-background shadow-sm ring-1 ring-primary/40 text-primary'
                        : 'text-muted-foreground hover:bg-background/80'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg transition-colors',
                        isActive ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/70 bg-background/40 text-muted-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium leading-tight">{label}</span>
                      <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">
                        {description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Article Topic</Label>
                <Input id="topic" placeholder="e.g., The Future of Renewable Energy" value={topic} onChange={(e) => setTopic(e.target.value)} autoFocus />
              </div>
              <Button onClick={handleNext} disabled={!topic.trim()} className="w-full">
                Generate Titles <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageFile">Upload Image</Label>
                <Input id="imageFile" type="file" accept="image/*" />
              </div>
              <Button className="w-full">
                Process Image
              </Button>
            </div>
          )}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <p>words todo</p>
            </div>
          )}
        </div>
      </CardContent>
     </Card>
   );
 }

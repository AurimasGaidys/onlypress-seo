'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AgenticSession } from '@/types/agentic-generation';
import { Loader2, Sparkles, CheckCircle, Rocket, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ControlSidebarProps {
  session: AgenticSession | null;
  isLoading: boolean;
  startGeneration: (topic: string, context?: { agencyId?: string }) => Promise<void>;
  updateSession: (payload: Partial<AgenticSession>) => Promise<void>;
  saveDocument: () => Promise<void>;
}

export default function AgenticControlSidebar({
  session,
  isLoading,
  startGeneration,
  updateSession,
  saveDocument,
}: ControlSidebarProps) {
  const [topic, setTopic] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');

  const handleGenerateTitles = async () => {
    if (topic.trim()) {
      await startGeneration(topic.trim());
    }
  };

  const handleStartConversation = async () => {
    if (selectedTitle) {
      await updateSession({ selectedTitle });
    }
  };

  const wizardStep = !session ? 'topic' : session.status === 'awaiting_title_selection' ? 'titles' : 'running';

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4 pl-2">Control Panel</h2>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={wizardStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {wizardStep === 'topic' && (
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>1. Enter Topic</CardTitle>
                <CardDescription>What would you like to write about?</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <Label htmlFor="topic">Article Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., The Future of AI in Marketing"
                    disabled={isLoading}
                  />
                </div>
                <Button onClick={handleGenerateTitles} disabled={isLoading || !topic.trim()} className="w-full mt-4">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Titles
                </Button>
              </CardContent>
            </Card>
          )}

          {wizardStep === 'titles' && (
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>2. Select a Title</CardTitle>
                <CardDescription>Choose the best title for your article.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {session?.generatedTitles?.map((title, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedTitle(title)}
                      className={cn(
                        "relative flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all",
                        selectedTitle === title ? "border-primary bg-primary/5" : "border-muted bg-card hover:bg-accent/50"
                      )}
                    >
                      <p className="flex-1 text-sm font-medium">{title}</p>
                      {selectedTitle === title && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                  ))}
                </div>
                <Button onClick={handleStartConversation} disabled={isLoading || !selectedTitle} className="w-full mt-4">
                  <Rocket className="mr-2 h-4 w-4" />
                  Start Conversation
                </Button>
              </CardContent>
            </Card>
          )}
          
          {wizardStep === 'running' && (
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>3. Generation in Progress</CardTitle>
                <CardDescription>AI agents are working on your article.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div><strong className="text-muted-foreground">Topic:</strong> {session?.topic}</div>
                  <div><strong className="text-muted-foreground">Selected Title:</strong> {session?.selectedTitle}</div>
                  <div className="flex items-center gap-2"><strong className="text-muted-foreground">Status:</strong> <span className="font-semibold text-primary">{session?.status}</span></div>
                  {session?.currentStep && <p className="text-sm p-3 bg-muted rounded-md">{session.currentStep}</p>}
                </div>

                {session?.status === 'done' && (
                  <Button onClick={saveDocument} disabled={isLoading} className="w-full mt-4">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save as Document
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

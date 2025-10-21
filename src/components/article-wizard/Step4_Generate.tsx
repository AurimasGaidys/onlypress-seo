// src/components/article-wizard/Step4_Generate.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Step4Props {
  handlePreviousStep: () => void;
}

const mockArticle = `
In the ever-evolving landscape of technology, Artificial Intelligence (AI) stands as a monumental pillar of innovation. Once a concept confined to science fiction, AI has now permeated nearly every facet of our daily lives, reshaping industries from healthcare to finance...

(This is a mock article generated for demonstration purposes. The actual content will be created by the AI in the next development phase.)
`;

export default function Step4_Generate({ handlePreviousStep }: Step4Props) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate AI generation time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // 2.5 seconds delay

    return () => clearTimeout(timer);
  }, []);

  const handleStartOver = () => {
    // In a real app, this would likely reset the wizard state.
    // For the prototype, we can just reload the page.
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Article is Ready!</CardTitle>
        <CardDescription>
          Here is the generated content. You can now review, edit, and export it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[200px] space-y-3"
          >
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="font-semibold">AI is writing your article...</p>
            <p className="text-sm text-muted-foreground">This may take a moment.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="prose prose-invert max-w-none p-4 border rounded-md bg-secondary/30 min-h-[200px]">
              <div>{mockArticle.trim()}</div>
            </div>
          </motion.div>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handlePreviousStep} disabled={isLoading}>
            Back to Config
          </Button>
          <Button onClick={handleStartOver} variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

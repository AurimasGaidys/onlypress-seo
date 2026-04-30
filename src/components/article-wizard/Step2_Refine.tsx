// src/components/article-wizard/Step2_Refine.tsx
'use client';

import { WizardFormData } from '@/types/wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface Step2Props {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
}

export default function Step2_Refine({ formData, updateFormData, handleNextStep, handlePreviousStep }: Step2Props) {
  const { user } = useAuth();
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTitle, setSelectedTitle] = useState(formData.selectedTitle || '');

  useEffect(() => {
    const fetchTitles = async () => {
      if (!formData.topic) {
        toast.error("No topic provided.");
        handlePreviousStep();
        return;
      }
      setIsLoading(true);
      try {
        const token = await user?.getIdToken();
        const response = await fetch('/api/generate-titles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ topic: formData.topic }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch titles');
        }
        const data = await response.json();
        if (!data.titles || data.titles.length === 0) {
          throw new Error("AI returned no titles. Please try a different topic.");
        }
        setGeneratedTitles(data.titles);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error("Title Generation Failed", { description: message });
        handlePreviousStep();
      } finally {
        setIsLoading(false);
      }
    };

    fetchTitles();
  }, [formData.topic, handlePreviousStep]);

  const handleSelectTitle = (title: string) => {
    setSelectedTitle(title);
    setTimeout(() => {
      updateFormData({ selectedTitle: title });
      handleNextStep();
    }, 300);
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } } };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Choose the Perfect Title</CardTitle>
        <CardDescription>
          We&#39;ve generated a few title options for your topic: &ldquo;{formData.topic}&rdquo;. Select the one you like best.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] space-y-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="font-semibold">Generating titles with AI...</p>
          </div>
        ) : (
          <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
            {generatedTitles.map((title, index) => (
              <motion.button key={index} variants={itemVariants} onClick={() => handleSelectTitle(title)} className="w-full text-left p-4 rounded-lg border transition-all duration-300 ease-in-out" style={{ borderColor: selectedTitle === title ? 'hsl(var(--primary))' : 'hsl(var(--border))', backgroundColor: selectedTitle === title ? 'hsl(var(--primary) / 0.1)' : 'transparent' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{title}</span>
                  {selectedTitle === title && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle className="h-5 w-5 text-primary" /></motion.div>)}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
        <div className="mt-6 flex justify-start">
          <Button variant="outline" onClick={handlePreviousStep} disabled={isLoading}>
            Back to Topic
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

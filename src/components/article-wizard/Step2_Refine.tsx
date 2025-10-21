'use client';
import { WizardFormData } from '@/types/wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface Step2Props {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
}

const mockTitles = ["The Unseen Revolution: How AI is Reshaping Modern Industries", "Beyond the Hype: A Realistic Look at AI's Impact on Our Future", "AI in 2025: Trends, Challenges, and Opportunities Ahead"];

export default function Step2_Refine({ formData, updateFormData, handleNextStep, handlePreviousStep }: Step2Props) {
  const [selectedTitle, setSelectedTitle] = useState(formData.selectedTitle || '');
  const handleSelectTitle = (title: string) => {
    setSelectedTitle(title);
    setTimeout(() => {
      updateFormData({ selectedTitle: title });
      handleNextStep();
    }, 500);
  };
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Choose the Perfect Title</CardTitle>
        <CardDescription>We've generated a few title options for your topic: "{formData.topic}". Select the one you like best.</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
          {mockTitles.map((title, index) => (
            <motion.button key={index} variants={itemVariants} onClick={() => handleSelectTitle(title)} className="w-full text-left p-4 rounded-lg border transition-all duration-300 ease-in-out" style={{ borderColor: selectedTitle === title ? 'hsl(var(--primary))' : 'hsl(var(--border))', backgroundColor: selectedTitle === title ? 'hsl(var(--primary) / 0.1)' : 'transparent' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{title}</span>
                {selectedTitle === title && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle className="h-5 w-5 text-primary" /></motion.div>)}
              </div>
            </motion.button>
          ))}
        </motion.div>
        <div className="mt-6 flex justify-start"><Button variant="outline" onClick={handlePreviousStep}>Back to Topic</Button></div>
      </CardContent>
    </Card>
  );
}

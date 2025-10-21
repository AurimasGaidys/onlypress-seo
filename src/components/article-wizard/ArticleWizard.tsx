"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WizardFormData {
  topic: string;
  title: string;
  keywords: string[];
  length?: number;
  tone?: string;
  // Ateityje čia pradėsime daugiau laukų
}

import { Step1_Idea } from "./steps/Step1_Idea";
import { Step2_Refine } from "./steps/Step2_Refine";
import { Step3_Configure } from "./steps/Step3_Configure";
import { Step4_Generate } from "./steps/Step4_Generate";
import { WizardProgress } from "./WizardProgress";

export default function ArticleWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({
    topic: '',
    title: '',
    keywords: [],
  });

  const handleNextStep = () => setCurrentStep(prev => prev + 1);
  const handlePreviousStep = () => setCurrentStep(prev => prev - 1);

  const updateFormData = (newData: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1_Idea
          onNextStep={handleNextStep}
          updateFormData={updateFormData}
        />;
      case 2:
        return <Step2_Refine
          onNextStep={handleNextStep}
          onPreviousStep={handlePreviousStep}
          updateFormData={updateFormData}
        />;
      case 3:
        return <Step3_Configure
          onNextStep={handleNextStep}
          onPreviousStep={handlePreviousStep}
          updateFormData={updateFormData}
        />;
      case 4:
        return <Step4_Generate
          onPreviousStep={handlePreviousStep}
        />;
      default:
        return null;
    }
  };

  return (
    <div>
      <WizardProgress currentStep={currentStep} totalSteps={4} />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

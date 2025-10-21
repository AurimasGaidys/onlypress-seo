// src/components/article-wizard/ArticleWizard.tsx
'use client';

import { useState } from 'react';
import { WizardFormData } from '@/types/wizard';
import Step1_Idea from './Step1_Idea';
import Step2_Refine from './Step2_Refine';
import Step3_Configure from './Step3_Configure';
import Step4_Generate from './Step4_Generate';

const TOTAL_STEPS = 4;

const PlaceholderStep = ({ stepName }: { stepName: string }) => (
  <div className="p-8 border-2 border-dashed border-primary/20 rounded-lg text-center">
    <h2 className="text-xl font-semibold">Placeholder for: {stepName}</h2>
    <p className="text-slate-400">This component will be built in the next task.</p>
  </div>
);

export default function ArticleWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({
    topic: '',
    selectedTitle: '',
    keywords: [],
    articleConfig: {
      length: 'medium',
      tone: 'professional',
    },
    generatedArticle: '',
  });

  const handleNextStep = () => {
    // Prevent going past the last step
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prevStep) => Math.max(1, prevStep - 1));
  };

  const updateFormData = (data: Partial<WizardFormData>) => {
    setFormData((prevData) => ({ ...prevData, ...data }));
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1_Idea
            formData={formData}
            updateFormData={updateFormData}
            handleNextStep={handleNextStep}
          />
        );
      case 2:
        return (
          <Step2_Refine
            formData={formData}
            updateFormData={updateFormData}
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
          />
        );
      case 3:
        return (
          <Step3_Configure
            formData={formData}
            updateFormData={updateFormData}
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
          />
        );
      case 4:
        return <Step4_Generate handlePreviousStep={handlePreviousStep} />;
      default:
        // Fallback to step 1 if state is invalid
        return (
          <Step1_Idea
            formData={formData}
            updateFormData={updateFormData}
            handleNextStep={handleNextStep}
          />
        );
    }
  };

  return (
    <div>
      {/* We will add a progress bar here later */}
      <div className="mt-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
}

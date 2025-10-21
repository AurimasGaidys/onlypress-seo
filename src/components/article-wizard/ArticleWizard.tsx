'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { WizardFormData } from '@/types/wizard';
import Step1_Idea from './Step1_Idea';
import Step2_Refine from './Step2_Refine';
import Step3_Configure from './Step3_Configure';
import Step4_Generate from './Step4_Generate';
import { toast } from 'sonner';

const TOTAL_STEPS = 4;

export default function ArticleWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({
    topic: '',
    selectedTitle: '',
    keywords: [],
    articleConfig: { length: 'medium', tone: 'professional' },
    generatedArticle: '',
  });

  const handleNextStep = () => { if (currentStep < TOTAL_STEPS) setCurrentStep((prev) => prev + 1) };
  const handlePreviousStep = () => { setCurrentStep((prev) => Math.max(1, prev)) };
  const updateFormData = (data: Partial<WizardFormData>) => { setFormData((prev) => ({ ...prev, ...data })) };

  const handleFinish = async () => {
    if (!user) {
      toast.error("Authentication Error", { description: "You must be logged in to create a document." });
      return;
    }

    setIsSubmitting(true);

    const mockArticleContent = `<h1>${formData.selectedTitle}</h1><p>This is the beginning of your new article about ${formData.topic}.</p>`;
    const snippet = `This is the beginning of your new article about ${formData.topic}.`;

    try {
      const docRef = await addDoc(collection(db, 'documents'), {
        userId: user.uid,
        title: formData.selectedTitle || 'Untitled Document',
        content: mockArticleContent,
        snippet: snippet.substring(0, 150),
        lastEdited: serverTimestamp(),
      });

      toast.success("Document created successfully!");
      router.push(`/docs/${docRef.id}`);
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to create document", { description: "Please try again." });
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <Step1_Idea formData={formData} updateFormData={updateFormData} handleNextStep={handleNextStep} />;
      case 2: return <Step2_Refine formData={formData} updateFormData={updateFormData} handleNextStep={handleNextStep} handlePreviousStep={handlePreviousStep} />;
      case 3: return <Step3_Configure formData={formData} updateFormData={updateFormData} handleNextStep={handleNextStep} handlePreviousStep={handlePreviousStep} />;
      case 4: return <Step4_Generate handleFinish={handleFinish} isSubmitting={isSubmitting} />;
      default: return <Step1_Idea formData={formData} updateFormData={updateFormData} handleNextStep={handleNextStep} />;
    }
  };

  return <div><div className="mt-8">{renderCurrentStep()}</div></div>;
}

// src/components/article-wizard/ArticleWizard.tsx
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
import { marked } from 'marked'; // We will install this to convert Markdown to HTML

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

  const handleNextStep = () => { if (currentStep < TOTAL_STEPS) setCurrentStep((prev) => prev + 1); };
  const handlePreviousStep = () => { setCurrentStep((prev) => Math.max(1, prev)); };
  const updateFormData = (data: Partial<WizardFormData>) => { 
    setFormData((prev) => ({ ...prev, ...data })); 
  };

  const handleFinish = async () => {
    if (!user) {
      toast.error("Authentication Error", { description: "You must be logged in to create a document." });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Generate the article content from our API
      const articleResponse = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formData.topic,
          title: formData.selectedTitle,
          config: formData.articleConfig,
        }),
      });

      if (!articleResponse.ok) {
        const errorData = await articleResponse.json();
        throw new Error(errorData.error || "Failed to generate article content.");
      }

      const { article: markdownContent } = await articleResponse.json();

      // Step 2: Convert Markdown to HTML for the editor
      const htmlContent = marked(markdownContent);
      const snippet = markdownContent.substring(0, 150).replace(/[^a-zA-Z0-9 ]/g, " "); // Create a clean snippet

      // Step 3: Save the final document to Firestore
      const docRef = await addDoc(collection(db, 'documents'), {
        userId: user.uid,
        title: formData.selectedTitle || 'Untitled Document',
        content: htmlContent, // Save HTML content
        snippet: snippet,
        lastEdited: serverTimestamp(),
      });

      toast.success("Article generated and saved successfully!");
      router.push(`/docs/${docRef.id}`);

    } catch (error) {
      console.error("Error in finish process:", error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast.error("Process Failed", { description: message });
      setIsSubmitting(false);
    }
  };

  // ... (renderCurrentStep function remains the same)
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

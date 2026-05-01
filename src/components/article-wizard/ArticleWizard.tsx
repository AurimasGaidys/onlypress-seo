'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WizardFormData } from '@/types/wizard';
import Step1_Idea from './Step1_Idea';
import Step2_Refine from './Step2_Refine';
import Step3_Configure from './Step3_Configure';
import Step4_Generate from './Step4_Generate';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

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
            toast.error('Authentication Error', { description: 'You must be logged in to create a document.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const token = await user.getIdToken();

            const articleResponse = await fetch('/api/generate-article', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    topic: formData.topic,
                    title: formData.selectedTitle,
                    keywords: formData.keywords,
                    config: formData.articleConfig,
                }),
            });

            if (!articleResponse.ok) {
                const errorData = await articleResponse.json();
                throw new Error(errorData.error || 'Failed to generate article content.');
            }

            const { article: htmlContent } = await articleResponse.json();
            const snippet = htmlContent.replace(/<[^>]+>/g, ' ').substring(0, 150).replace(/\s+/g, ' ').trim();

            const result = await api.post<{ data: { id: number } }>('/api/seo/documents', {
                title: formData.selectedTitle || 'Untitled Document',
                content: htmlContent,
                snippet,
                prompt_data: {
                    topic: formData.topic,
                    tone: formData.articleConfig.tone,
                    keywords: formData.keywords,
                },
            });

            toast.success('Article generated and saved successfully!');
            router.push(`/docs/${result.data.id}`);

        } catch (error) {
            console.error('Error in finish process:', error);
            const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
            toast.error('Process Failed', { description: message });
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

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';

// Importai naujiems komponentams
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import FileUploadZone from '../FileUploadZone';
import HorizontalStepIndicator from '../advanced/HorizontalStepIndicator';
import { Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, Lightbulb, FileUp, PlayCircle } from 'lucide-react';

// Importai seniems žingsnių komponentams
import Step1_TopicAndTitle from '../advanced-steps/Step1_TopicAndTitle';
import Step2_Keywords from '../advanced-steps/Step2_Keywords';
import Step3_Backlinks from '../advanced-steps/Step3_Backlinks';
import Step4_MetaData from '../advanced-steps/Step3_MetaData'; // Note: filename might be confusing
import Step5_Configuration from '../advanced-steps/Step4_Configuration'; // Note: filename might be confusing

interface AdvancedFormData {
  topic: string;
  targetKeywords: string[];
  seoTitle: string;
  seoDescription: string;
  backlinks: string[];
  tone: string;
  wordCount: number;
  articleStructure: string;
  customInstructions: string;
  file: File | null;
  fileUrl: string;
  clientId?: string | null; // Pridedame clientId
  projectId?: string | null; // Pridedame projectId
}

interface AdvancedFormProps {
  // Atnaujiname onSubmit tipą
  onSubmit?: (mode: 'advanced', data: AdvancedFormData) => void;
  isGenerating: boolean; // Pridedame isGenerating
  clientId?: string | null; // Pridedame clientId
  projectId?: string | null; // Pridedame projectId
}

const stepTitles = ['Topic & Title', 'Keywords', 'Backlinks', 'Meta Data', 'Configuration'];
const totalSteps = stepTitles.length;

export default function AdvancedForm({ onSubmit, isGenerating, clientId, projectId }: AdvancedFormProps) {
  const { user } = useAuth();
  const [view, setView] = useState<'initial' | 'wizard'>('initial');
  const [isStarting, setIsStarting] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    topic: '',
    targetKeywords: [] as string[],
    seoTitle: '',
    seoDescription: '',
    backlinks: [] as string[],
    tone: 'Professional',
    wordCount: 700,
    articleStructure: 'seo-standard',
    customInstructions: '',
    file: null as File | null,
    fileUrl: '',
  });

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleStartWizard = async () => {
    if (!user) return toast.error("You must be logged in.");
    if (!formData.topic.trim() && !formData.file) return toast.error("Please provide a topic or a file.");

    setIsStarting(true);
    let uploadedFileUrl = '';

    if (formData.file) {
      try {
        const storage = getStorage();
        const filePath = `uploads/${user.uid}/${Date.now()}-${formData.file.name}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, formData.file);
        uploadedFileUrl = await getDownloadURL(snapshot.ref);
        toast.success("File uploaded successfully.");
        updateFormData({ fileUrl: uploadedFileUrl });
      } catch (error) {
        toast.error("File upload failed." + (error instanceof Error ? error.message : ''));
        setIsStarting(false);
        return;
      }
    }

    // If topic is empty but file is present, use filename as topic
    if (!formData.topic.trim() && formData.file) {
        updateFormData({ topic: formData.file.name });
    }

    setIsStarting(false);
    setView('wizard');
  };

  const handleNext = () => {
    if (isStepEnabled(currentStep + 1)) {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const isStepEnabled = (step: number): boolean => {
    if (step <= currentStep) return true;
    switch (step) {
      case 2: return !!formData.topic.trim() && !!formData.seoTitle.trim();
      case 3:
      case 4:
      case 5: return isStepEnabled(2); // All subsequent steps depend on step 1 & 2
      default: return false;
    }
  };

  const handleSubmit = () => {
    // Iškviečiame su teisingais parametrais
    const dataWithClient = { ...formData, clientId, projectId }; // Pridedame clientId ir projectId
    onSubmit?.('advanced', dataWithClient);
  };

  const renderStepContent = () => {
    // Čia galite pridėti animaciją tarp žingsnių
    const commonProps = { updateFormData };
    switch (currentStep) {
        case 1: return <Step1_TopicAndTitle {...commonProps} topic={formData.topic} seoTitle={formData.seoTitle} />;
        case 2: return <Step2_Keywords {...commonProps} topic={formData.topic} seoTitle={formData.seoTitle} targetKeywords={formData.targetKeywords} />;
        case 3: return <Step3_Backlinks {...commonProps} backlinks={formData.backlinks} />;
        case 4: return <Step4_MetaData {...commonProps} topic={formData.topic} seoTitle={formData.seoTitle} seoDescription={formData.seoDescription} targetKeywords={formData.targetKeywords} />;
        case 5: return <Step5_Configuration
                       {...commonProps}
                       tone={formData.tone}
                       wordCount={formData.wordCount}
                       articleStructure={formData.articleStructure}
                       customInstructions={formData.customInstructions}
                       onSubmit={handleSubmit}
                       isSubmitting={isGenerating} // Perduodam isGenerating kaip isSubmitting
                   />;
        default: return null;
    }
  };

  if (view === 'initial') {
    return (
      <div className="max-w-xl mx-auto space-y-6 text-center">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2 justify-center">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            Start with Advanced Mode
          </h3>
          <p className="text-muted-foreground">Provide a topic or upload a document to begin advanced setup.</p>
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="advanced-topic" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            Article Topic
          </Label>
          <Input
            id="advanced-topic"
            value={formData.topic}
            onChange={e => updateFormData({ topic: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && formData.topic.trim()) {
                e.preventDefault();
                handleStartWizard();
              }
            }}
            placeholder="e.g., The Impact of AI on Modern Journalism"
          />
        </div>
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-xs uppercase text-muted-foreground">Or</span>
          <div className="flex-grow border-t border-border"></div>
        </div>
        <div className="space-y-2 text-left">
          <Label className="flex items-center gap-2">
            <FileUp className="h-4 w-4 text-muted-foreground" />
            Upload a Document
          </Label>
          <FileUploadZone
            onFileSelect={(file) => updateFormData({ file })}
            selectedFile={formData.file}
            acceptedTypes=".docx,.pdf,.txt,.md"
          />
           <p className="text-xs text-muted-foreground pt-1">
            This is optional. Use a document to provide context or specific information.
          </p>
        </div>
        <Button onClick={handleStartWizard} disabled={isStarting || (!formData.topic.trim() && !formData.file)} className="w-full">
          {isStarting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlayCircle className="mr-2 h-4 w-4" />
          )}
          {isStarting ? 'Preparing...' : 'Start Advanced Setup'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-8">
        {/* Žingsnio turinys */}
        <div className="flex-grow">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderStepContent()}
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Horizontalus indikatorius (apačioje, kaip prašyta) */}
        <div className="py-4 border-t">
            <HorizontalStepIndicator
                totalSteps={totalSteps}
                currentStep={currentStep}
                stepTitles={stepTitles}
            />
        </div>

        {/* Navigacijos mygtukai */}
        <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {currentStep < totalSteps ? (
                 <Button onClick={handleNext} disabled={!isStepEnabled(currentStep + 1)}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                // Paskutiniame žingsnyje generavimo mygtukas yra pačiame komponente (Step5_Configuration)
                // Bet palikime čia kaip fallback
                <div/>
            )}
        </div>
    </div>
  );
}

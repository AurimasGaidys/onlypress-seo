'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WizardFormData } from '@/types/wizard';
import { ArrowRight } from 'lucide-react';

interface Step1Props {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
  handleNextStep: () => void;
}

export default function Step1_Idea({ formData, updateFormData, handleNextStep }: Step1Props) {
  const [activeTab, setActiveTab] = useState<'ai' | 'image' | 'manual'>('ai');
  const [topic, setTopic] = useState(formData.topic || '');
  const handleNext = () => {
    if (topic.trim()) {
      updateFormData({ topic });
      handleNextStep();
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Let&#39;s start with a topic</CardTitle>
        <CardDescription>What is the main subject you want to write an article about?</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'ai'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
              onClick={() => setActiveTab('ai')}
            >
              Create with AI
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'image'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
              onClick={() => setActiveTab('image')}
            >
              Create from image
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'manual'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
              onClick={() => setActiveTab('manual')}
            >
              Create manually
            </button>
          </div>
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Article Topic</Label>
                <Input id="topic" placeholder="e.g., The Future of Renewable Energy" value={topic} onChange={(e) => setTopic(e.target.value)} autoFocus />
              </div>
              <Button onClick={handleNext} disabled={!topic.trim()} className="w-full">
                Generate Titles <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageFile">Upload Image</Label>
                <Input id="imageFile" type="file" accept="image/*" />
              </div>
              <Button className="w-full">
                Process Image
              </Button>
            </div>
          )}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <p>words todo</p>
            </div>
          )}
        </div>
      </CardContent>
     </Card>
   );
 }

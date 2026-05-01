'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type Step = 'topic' | 'titles' | 'configure';

interface SimpleFormProps {
  onSubmit?: (data: {
    topic: string;
    title: string;
    wordCount: number;
    writingStyle: string;
  }) => void;
}

export default function SimpleForm({ onSubmit }: SimpleFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('topic');
  const [topic, setTopic] = useState('');
  const [titles, setTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [wordCount, setWordCount] = useState('1000');
  const [writingStyle, setWritingStyle] = useState('Informative Article');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateTitles = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('You must be logged in to generate titles');
        return;
      }
      const idToken = await user.getIdToken();

      const response = await fetch('/api/generate-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, idToken }),
      });

      const data = await response.json();

      if (response.ok && data.titles) {
        setTitles(data.titles);
        setCurrentStep('titles');
      } else {
        alert(data.error || 'Failed to generate titles');
      }
    } catch (error) {
      console.error('Error generating titles:', error);
      alert('Failed to generate titles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleSelection = (title: string) => {
    setSelectedTitle(title);
    setCurrentStep('configure');
  };

  const handleSubmit = () => {
    onSubmit?.({
      topic,
      title: selectedTitle,
      wordCount: parseInt(wordCount),
      writingStyle,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {currentStep === 'topic' && (
        <Card>
          <CardHeader>
            <CardTitle>What topic would you like to write about?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Article Topic</Label>
              <Input
                id="topic"
                placeholder="Enter your article topic..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="text-lg"
              />
            </div>
            <Button
              onClick={handleGenerateTitles}
              disabled={!topic.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? 'Generating...' : 'Generate Titles'}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'titles' && (
        <Card>
          <CardHeader>
            <CardTitle>Select a Title</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose the title that best captures your article
            </p>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedTitle} onValueChange={handleTitleSelection}>
              <div className="space-y-3">
                {titles.map((title, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={title} id={`title-${index}`} />
                    <Label
                      htmlFor={`title-${index}`}
                      className="text-sm cursor-pointer p-3 rounded-lg border hover:bg-muted/50 flex-1"
                    >
                      {title}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <Button
              variant="outline"
              onClick={() => setCurrentStep('topic')}
              className="mt-4"
            >
              ← Back
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'configure' && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Your Article</CardTitle>
            <p className="text-sm text-muted-foreground">
              Selected title: <span className="font-medium">{selectedTitle}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wordCount">Word Count</Label>
                <Select value={wordCount} onValueChange={setWordCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select word count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="700">700 words</SelectItem>
                    <SelectItem value="1000">1000 words</SelectItem>
                    <SelectItem value="1500">1500 words</SelectItem>
                    <SelectItem value="1800">1800 words</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="writingStyle">Writing Style</Label>
                <Select value={writingStyle} onValueChange={setWritingStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select writing style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Informative Article">Informative Article</SelectItem>
                    <SelectItem value="Local News Report">Local News Report</SelectItem>
                    <SelectItem value="Press Release">Press Release</SelectItem>
                    <SelectItem value="Opinion Piece">Opinion Piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep('titles')}>
                ← Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                Generate Article
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgenticSession } from '@/types/agentic-generation';

interface ControlPanelProps {
  isLoading: boolean;
  startGeneration: (topic: string, context?: { agencyId?: string }) => Promise<void>;
  session: AgenticSession | null;
  updateSession: (payload: Partial<AgenticSession>) => Promise<void>;
  saveDocument: () => Promise<void>;
}

export default function ControlPanel({ isLoading, startGeneration, session, updateSession, saveDocument }: ControlPanelProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      await startGeneration(topic.trim());
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Control Panel</h2>
      
      {!session ? (
        <Card>
          <CardHeader>
            <CardTitle>Pradėti generavimą</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="topic">Tema</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Įveskite straipsnio temą..."
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading || !topic.trim()} className="w-full">
                {isLoading ? 'Kuriama...' : 'Pradėti generavimą'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><strong>Topic:</strong> {session.topic}</div>
            <div><strong>Status:</strong> <span className="text-primary font-semibold">{session.status}</span></div>
            {session.currentStep && (
              <div><strong>Progress:</strong> <span className="text-blue-600 font-medium">{session.currentStep}</span></div>
            )}
            {session.selectedTitle && (
              <div><strong>Selected Title:</strong> {session.selectedTitle}</div>
            )}
            
            {/* --- PRIDĖKITE ŠĮ BLOKĄ --- */}
            {session.status === 'done' && session.metaData && (
              <div className="pt-4 border-t space-y-3">
                <h4 className="font-semibold">Generated Meta Data</h4>
                <div className="p-3 bg-muted rounded-md space-y-2 text-sm">
                  <p><strong>Meta Title:</strong> {session.metaData.metaTitle}</p>
                  <p><strong>Meta Description:</strong> {session.metaData.metaDescription}</p>
                  {session.metaData.imageAlts && (
                    <div>
                      <strong>Image ALT Texts:</strong>
                      <ul className="list-disc pl-5">
                        {Object.values(session.metaData.imageAlts).map((alt: string, i: number) => <li key={i}>{alt}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                <Button onClick={saveDocument} disabled={isLoading} className="w-full">
                  {isLoading ? 'Saving...' : 'Save as Document'}
                </Button>
              </div>
            )}
            {/* --- BLOKO PABAIGA --- */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

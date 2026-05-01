'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import ModeSelectionCard from './ModeSelectionCard';
import GenerationLoader from './GenerationLoader';
import AdvancedForm from './forms/AdvancedForm';
import EvergreenWizard from './forms/EvergreenWizard';
import { FromFileWizard } from './forms/fromFileWizzard';

type CreationMode = 'evergreen' | 'fromFile' | 'advanced';

export default function CreationHub() {
  const { activeWorkspace, activeClientId, activeProjectId } = useWorkspace();
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState<CreationMode>('evergreen');
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get('clientId');
  const projectIdFromUrl = searchParams.get('projectId');
  const scheduledDateFromUrl = searchParams.get('scheduledDate');

  // Get agency ID based on workspace type
  const getAgencyId = () => {
    if (activeWorkspace.type === 'user') {
      return `personal_${user?.uid}`;
    } else {
      return activeWorkspace.id;
    }
  };

  const agencyId = getAgencyId();

  const handleGenerate = async (mode: 'simple' | 'advanced', payload: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      setIsGenerating(true);

      // Get current user token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('Please log in to generate articles');
        return;
      }

      const idToken = await currentUser.getIdToken();

      // Convert wordCount to number if it's a string (from Select component)
      const correctedPayload = {
        ...payload,
        wordCount: typeof payload.wordCount === 'string' ? parseInt(payload.wordCount as string, 10) : payload.wordCount,
      };

      const requestBody = {
        mode,
        payload: {
          ...correctedPayload,
          agencyId: agencyId,
          clientId: clientIdFromUrl || activeClientId || null,
          projectId: projectIdFromUrl || activeProjectId || null,
          scheduledDate: scheduledDateFromUrl || undefined,
        },
        idToken,
      };

      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Article generated successfully!');
        router.push(`/docs/${data.documentId}`);
      } else {
        throw new Error(data.error || 'Failed to generate article');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate article. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };


  const handleCreateBlank = async () => {
    if (!user) return toast.error("Authentication required.");
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          creationData: {
            source: 'blank',
            title: 'Article Title',
            folderId: "",
            context: {
              agencyId: agencyId,
              clientId: activeClientId,
              projectId: activeProjectId,
            }
          }
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create document.');
      toast.success("Blank document created successfully!");
      router.push(`/docs/${data.newDocumentId}`);
    } catch (error) {
      toast.error("Creation failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
    }
  };

  const renderActiveForm = () => {
    switch (activeMode) {
      case 'evergreen':
        // Perduodame onSubmit, isGenerating, activeClientId ir activeProjectId
        return <EvergreenWizard onSubmit={handleGenerate} isGenerating={isGenerating} clientId={clientIdFromUrl || activeClientId} projectId={projectIdFromUrl || activeProjectId} />;
      case 'fromFile':
        // ... (šis lieka nepakitęs)
        return <FromFileWizard onSubmit={handleGenerate} isGenerating={isGenerating} clientId={clientIdFromUrl || activeClientId} projectId={projectIdFromUrl || activeProjectId} />;
      case 'advanced':
        // Perduodame isGenerating, activeClientId ir activeProjectId
        return <AdvancedForm onSubmit={handleGenerate} isGenerating={isGenerating} clientId={clientIdFromUrl || activeClientId} projectId={projectIdFromUrl || activeProjectId} />;
      default:
        return null;
    }
  };

  return (
    <>
      {isGenerating && (
        <GenerationLoader
          messages={[
            "Analyzing your request...",
            "Waking up to AI assistants...",
            "Building article structure...",
            "Writing first draft...",
            "Polishing content...",
            "Checking plagiarism...",
            "Finalizing and saving..."
          ]}
        />
      )}

      <div className="max-w-4xl mx-auto px-6 pt-2 pb-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create a New Article</h1>
          <p className="text-lg text-muted-foreground">
            Choose your preferred method to start generating content
          </p>
        </div>

        <div className="flex flex-row gap-6 justify-center mb-8">
          <ModeSelectionCard
            icon="Sparkles"
            title="Quick Article"
            description="Generate a draft from a topic using AI's knowledge, or upload a document for AI to summarize and rewrite."
            isActive={activeMode === 'evergreen'}
            onClick={() => setActiveMode('evergreen')}
          />
          <ModeSelectionCard
            icon="FilePlus"
            title="Upload File(s)"
            description="Work with existing file. upload a documents and let AI summarize and rewrite it into a polished article."
            isActive={activeMode === 'fromFile'}
            onClick={() => setActiveMode('fromFile')}
          />
          <ModeSelectionCard
            icon="MessageSquarePlus"
            title="Advanced Mode"
            description="Control every SEO and content aspect yourself. Designed for experienced users who want maximum control."
            isActive={activeMode === 'advanced'}
            onClick={() => setActiveMode('advanced')}
          />
          <ModeSelectionCard
            icon="FilePlus2"
            title="Blank Document"
            description="Start from scratch"
            isActive={false}
            onClick={handleCreateBlank}
          />
        </div>

        <Card>
          <CardContent className="p-6">
            {renderActiveForm()}
          </CardContent>
        </Card>
      </div>
    </>
  );
}


//  <ModeSelectionCard
//             icon="MessageSquarePlus"
//             title="Journalist Co-pilot"
//             description="Work with an AI co-writer in an interview format. You provide unique facts and expertise, and AI asks guiding questions to help write article."
//             isActive={activeMode === 'fromFile'}
//             onClick={() => setActiveMode('fromFile')}
//           />

// return !isGuidedModeStarted ? (
//           <GuidedModeStart onStart={handleStartGuided} isStarting={isStartingSession} />
//         ) : (
//           <GuidedCreationChat
//             initialTopic={initialChatData.topic}
//             initialFileUrl={initialChatData.fileUrl}
//             onBack={handleCancelGuidedMode} // <-- Perduodame naują funkciją
//           />
//         );
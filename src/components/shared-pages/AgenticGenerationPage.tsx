// src/components/shared-pages/AgenticGenerationPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { type Editor as EditorInstance } from '@tiptap/react';
import { Maximize, Minimize } from 'lucide-react';
import { useAgenticGeneration } from '../../hooks/useAgenticGeneration';
import { useEditorUpdater } from '../../hooks/useEditorUpdater';
import { useUI } from '../../context/UIContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import AgentChat from '../agentic-generation/AgentChat';
import AgenticControlSidebar from '../agentic-generation/AgenticControlSidebar';
import Editor from '../editor';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '../ui/resizable';
import { Button } from '../ui/button';

export default function AgenticGenerationPage() {
  const { session, isLoading, startGeneration, updateSession, saveDocument } = useAgenticGeneration();
  const { isFocusMode, setFocusMode } = useUI();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);
  
  const { handleContentUpdate } = useEditorUpdater({
    editorInstance,
    isLocalSession: true,
  });

  // Get agency ID based on workspace type
  const getAgencyId = (): string => {
    if (activeWorkspace.type === 'user') {
      return `personal_${user?.uid || 'unknown'}`;
    } else {
      return activeWorkspace.id || 'unknown-agency';
    }
  };

  const agencyId = getAgencyId();

  useEffect(() => {
    setFocusMode(true);
    return () => setFocusMode(false);
  }, [setFocusMode]);

  useEffect(() => {
    if (session?.fullArticleHtml && editorInstance) {
      handleContentUpdate({
        command: 'REPLACE_ARTICLE_CONTENT',
        newFullHtml: session.fullArticleHtml,
        reasoning: 'Agent update'
      });
    }
  }, [session?.fullArticleHtml, editorInstance, handleContentUpdate]);

  const handleStartGeneration = async (topic: string) => {
    await startGeneration(topic, { agencyId });
  };

  return (
    <div className="relative h-screen w-screen">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50"
        onClick={() => setFocusMode(!isFocusMode)}
        title={isFocusMode ? "Exit Presentation Mode (Esc)" : "Enter Presentation Mode"}
      >
        {isFocusMode ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </Button>

      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        {/* Panel 1: Agent Chat */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <AgentChat session={session} />
        </ResizablePanel>
        <ResizableHandle withHandle />

        {/* Panel 2: Editor */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <div className="p-4 h-full overflow-y-auto">
            <Editor
              document={{
                id: 'agentic-session',
                title: session?.selectedTitle || 'Agentic Generation',
                content: '',
                createdAt: new Date(),
                lastEdited: new Date(),
                snippet: '',
                userId: user?.uid || ""
              }}
              onEditorReady={setEditorInstance}
              onSendMessage={async () => {}}
              setCommandPaletteOpen={() => {}}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        {/* Panel 3: Control Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <AgenticControlSidebar
            session={session}
            isLoading={isLoading}
            startGeneration={handleStartGeneration}
            updateSession={updateSession}
            saveDocument={saveDocument}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

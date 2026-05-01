'use client';
import { useState, useEffect } from 'react';
import { type Editor as EditorInstance } from '@tiptap/react';
import Editor from '@/components/editor';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';
import { useAgenticGeneration } from '@/hooks/useAgenticGeneration';
import { useEditorUpdater } from '@/hooks/useEditorUpdater';
import { useUI } from '@/context/UIContext';
import AgentChat from '@/components/agentic-generation/AgentChat';
import AgenticControlSidebar from '@/components/agentic-generation/AgenticControlSidebar';

export default function AgenticGenerationPage() {
  const { session, isLoading, startGeneration, updateSession, saveDocument } = useAgenticGeneration();
  const { isFocusMode, setFocusMode } = useUI();
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);
  
  const { handleContentUpdate } = useEditorUpdater({
    editorInstance,
    isLocalSession: true,
  });

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
                userId: ''
              }}
              onEditorReady={setEditorInstance}
              onSendMessage={async () => undefined}
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
            startGeneration={startGeneration}
            updateSession={updateSession}
            saveDocument={saveDocument}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

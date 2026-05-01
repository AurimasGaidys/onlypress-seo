// src/app/(god-mode-layout)/docs/[documentId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { type Editor as EditorInstance } from '@tiptap/react';
import { Loader2, Bot } from 'lucide-react';
import { toast } from 'sonner';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import AIAssistantSidebar from '@/components/ai-assistant-sidebar';
import GenerationLoader from '@/components/creation-hub/GenerationLoader';
import { useDocument } from '@/hooks/useDocument';
import { useAuth } from '@/context/AuthContext';
import { useKeyPress } from '@/hooks/useKeyPress';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useEditorUpdater } from '@/hooks/useEditorUpdater';
import { useScheduleInfo } from '@/hooks/useScheduleInfo';
import { CommandPalette } from '@/components/editor/CommandPalette';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorModeToggle, type EditorAssistantMode } from '@/components/editor/EditorModeToggle';
import { EditorTabProvider } from '@/context/EditorTabContext';

const Editor = dynamic(() => import('@/components/editor'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

export default function DocumentEditorPage() {
  const params = useParams();
  const { document, loading } = useDocument(params.documentId as string);
  const { user } = useAuth();
  const { scheduleInfo, loading: isScheduleLoading } = useScheduleInfo(document?.id || null);

  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);

  // Initialize editor updater hook
  const { handleContentUpdate, animatingBlockId, isReplacingArticle } = useEditorUpdater({
    editorInstance,
    document: document || undefined,
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState<'editor' | 'artist'>('editor');
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  const isCmdKPressed = useKeyPress('k', true, false); // metaKey (Cmd) + K
  const isCtrlKPressed = useKeyPress('k', false, true); // ctrlKey + K

  useEffect(() => {
    if (isCmdKPressed || isCtrlKPressed) {
      setCommandPaletteOpen(true);
    }
  }, [isCmdKPressed, isCtrlKPressed]);

  useEffect(() => {
    if (document) {
      setEditableTitle(document.title);
    }
  }, [document]);

  const handleUndo = useCallback(() => {
    if (!editorInstance) return;

    // Suteikiame Tiptap'ui šiek tiek laiko apdoroti `undo` prieš scroll'inant
    editorInstance
      .chain()
      .focus() // Išlaikome fokusą
      .undo()
      .run();

    // Po `undo` komandos iškvietimo, iškart paleidžiame `scrollIntoView`
    // Tai užtikrina, kad matomas laukas išliks ties kursoriaus pozicija.
    setTimeout(() => {
      editorInstance.view.dispatch(
        editorInstance.state.tr.scrollIntoView()
      );
    }, 50); // Mažas delay, kad `undo` spėtų įvykti

  }, [editorInstance]);

  // Įklijuok šią funkciją į docs/[documentId]/page.tsx komponentą
  const getHeadingsFromContent = useCallback((): { id: string; text: string }[] => {
    if (!editorInstance?.state?.doc) {
      return [];
    }

    const headings: { id: string; text: string }[] = [];

    editorInstance.state.doc.forEach((node) => {
      // Ieškome H1 ir H2 antraščių
      if (node.type.name === 'heading' && (node.attrs?.level === 1 || node.attrs?.level === 2)) {
        const id = node.attrs['data-block-id'];
        const text = node.textContent?.trim();
        if (id && text) {
          headings.push({ id, text });
        }
      }
    });

    return headings;
  }, [editorInstance]);

  const insertImagesIntoEditor = useCallback((imageDataById: Record<string, { imageUrl: string; prompt: string }>) => {
    if (!editorInstance) {
      console.error("Editor instance not available for image insertion.");
      return;
    }

    const { state, view } = editorInstance;
    const { tr } = state;
    let imagesInserted = false;

    // Surenkame pozicijas, kur reikia įterpti, kad išvengtume problemų su besikeičiančiomis pozicijomis iteracijos metu
    const insertions: { pos: number; node: ProsemirrorNode[] }[] = [];


    state.doc.descendants((node: ProsemirrorNode, pos: number) => {
      const blockId = node.attrs['data-block-id'];
      const imageData = imageDataById[blockId];

      if (imageData && imageData.imageUrl !== 'error') {
        console.log(`Preparing to insert image for blockId ${blockId} at position ${pos}`);

        const imageNode = state.schema.nodes.image.create({
          src: imageData.imageUrl,
          alt: imageData.prompt,
        });

        const paragraphNode = state.schema.nodes.paragraph.create();

        const insertPos = pos + node.nodeSize;
        console.log(`Inserting image at position ${insertPos} - ${node.nodeSize}`);

        insertions.push({ pos: insertPos, node: [imageNode, paragraphNode] });
        imagesInserted = true;
      }
    });
    // Įterpiame visus surinktus elementus viena transakcija, pradedant nuo galo,
    // kad ankstesni įterpimai nepakeistų vėlesnių pozicijų.
    if (imagesInserted) {
      console.log('Inserting images at positions:', insertions);
      insertions.reverse().forEach(({ pos, node }) => {
        tr.insert(pos, node);
      });
      imagesInserted = false;
      insertions.length = 0; // Išvalome masyvą kitai iteracijai
      view.dispatch(tr);
      toast.success("Images inserted successfully!");
    } else {
      toast.info("No matching headings found to insert images.");
    }
  }, [editorInstance]);

  const handleGenerateImages = async (selectedHeadings: { id: string; text: string }[], customInstructions: string) => {
    console.log('handleGenerateImages called with:', selectedHeadings, customInstructions);

    if (!user || !editorInstance) return toast.error("Editor or user not available.");

    setIsGeneratingImages(true);
    try {
      const idToken = await user.getIdToken();
      toast.info("Generating prompts for images...");

      // 1. Generate prompts
      const promptsResponse = await fetch('/api/god-mode/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          headings: selectedHeadings,
          content: editorInstance.getHTML(),
          customInstructions,
        }),
      });
      const promptsData = await promptsResponse.json();
      if (!promptsResponse.ok) throw new Error(promptsData.error || "Failed to generate prompts.");

      toast.info("Prompts generated. Now creating images...");
      console.log('Generated prompts:', promptsData);

      // 2. Generate images
      const imagesResponse = await fetch('/api/god-mode/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, prompts: promptsData }),
      });
      const imagesData = await imagesResponse.json();
      if (!imagesResponse.ok && imagesResponse.status !== 207) { // 207 is Multi-Status for partial success
        console.error('Images generation error data:', imagesData);
        throw new Error(imagesData.error || "Failed to generate images.");
      }


      console.log('===Images generated:', imagesData);
      //3. Insert images
      insertImagesIntoEditor(imagesData);

      console.log('Images generated and inserted:', imagesData);

      toast.success("Images generated and inserted successfully!");
    } catch (error) {
      toast.error("Image generation failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // === VIENINTELIS IR PAGRINDINIS AI LOGIKOS ŠALTINIS ===
  const {
    messages,
    isLoading,
    isStreaming,
    isAiActionLoading,
    selectedFile,
    uploadProgress,
    sendMessage,
    handleFileSelect,
    cancelStreaming,
    clearChatHistory,
    startContextualConversation,
  } = useAIAssistant({
    document: document || undefined,
    editor: editorInstance,
    mode: 'solo',
    onContentUpdate: handleContentUpdate
  });

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!document) {
    return (
      <div className="flex h-full w-full items-center justify-center text-center p-8">
        <div>
          <h1 className="text-2xl font-bold">Document Not Found</h1>
          <p className="text-muted-foreground">This document may not exist or you may not have permission to view it.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isReplacingArticle && (
        <GenerationLoader
          messages={[
            "Rewriting entire article...",
            "Applying new style...",
            "Finalizing..."
          ]}
        />
      )}
      <CommandPalette
        isOpen={commandPaletteOpen}
        setIsOpen={setCommandPaletteOpen}
        sendMessage={sendMessage}
        isStreaming={isStreaming || !!animatingBlockId}
      />
      <ResizablePanelGroup direction="horizontal" className="h-full w-full bg-background">
        <ResizablePanel defaultSize={65} minSize={40}>
          <EditorTabProvider>
            <div className="flex flex-col h-full">
             
              <div className="flex-grow overflow-y-auto">
                <Editor
                  document={document}
                  onEditorReady={setEditorInstance}
                  onSendMessage={sendMessage}
                  setCommandPaletteOpen={setCommandPaletteOpen}
                  onAskAI={startContextualConversation}
                  setAssistantMode={setAssistantMode}
                />
              </div>
            </div>
          </EditorTabProvider>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="h-full flex flex-col bg-muted/30 border-l">
            <div className="flex-shrink-0 p-4 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Assistants
              </h2>
              {/* PRIDEDAME PERJUNGIMO KOMPONENTĄ */}
              <EditorModeToggle
                currentMode={assistantMode}
                onModeChange={(mode) => setAssistantMode(mode as EditorAssistantMode)}
              />
            </div>
            <div className="flex-1 overflow-y-auto pt-0 pr-4 pb-4 pl-4">
              {/* SĄLYGINIS ATVAIZDAVIMAS */}
              <AIAssistantSidebar
                mode={assistantMode}
                // Props 'editor' režimui
                messages={messages}
                isLoading={isLoading || !!animatingBlockId}
                isStreaming={isStreaming}
                isAiActionLoading={isAiActionLoading || !!animatingBlockId}
                selectedFile={selectedFile}
                uploadProgress={uploadProgress}
                sendMessage={sendMessage}
                handleFileSelect={handleFileSelect}
                cancelStreaming={cancelStreaming}
                clearChatHistory={clearChatHistory}
                onUndo={handleUndo}
                // Props 'artist' režimui
                headings={getHeadingsFromContent()}
                onGenerateImages={handleGenerateImages}
                isGeneratingImages={isGeneratingImages}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}

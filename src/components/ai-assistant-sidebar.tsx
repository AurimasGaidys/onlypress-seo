// src/components/ai-assistant-sidebar.tsx
'use client';

import ChatInterface from './chat/ChatInterface';
import ImageGenerationInterface from './artist-bot/ImageGenerationInterface';
import { ConversationMessage } from '../types/conversation';
import { ArticleDocument } from '@/types/document';

// Apibrėžiame visus galimus props abiem režimams
interface AIAssistantSidebarProps {
  mode: 'editor' | 'artist';
  // Props for ChatInterface ('editor' mode)
  messages?: ConversationMessage[];
  isLoading?: boolean;
  isStreaming?: boolean;
  isAiActionLoading?: boolean;
  selectedFile?: File | null;
  uploadProgress?: number | null;
  sendMessage?: (userInput: string) => void;
  handleFileSelect?: (file: File | null) => void;
  cancelStreaming?: () => void;
  onUndo?: () => void;
  clearChatHistory?: () => void;
  // Props for ImageGenerationInterface ('artist' mode)
  headings?: { id: string; text: string }[];
  onGenerateImages?: (selectedHeadings: { id: string; text: string }[], customInstructions: string) => void;
  isGeneratingImages?: boolean;
}

export default function AIAssistantSidebar(props: AIAssistantSidebarProps) {
  const { mode } = props;

  if (mode === 'artist') {
    return (
      <ImageGenerationInterface
        headings={props.headings || []}
        onSubmit={props.onGenerateImages!}
        isLoading={props.isGeneratingImages || false}
      />
    );
  }

  // Default to 'editor' mode
  return (
    <ChatInterface
      document={{} as ArticleDocument} // Dummy prop, since it's not used in this specific interface
      messages={props.messages || []}
      isLoading={props.isLoading || false}
      isStreaming={props.isStreaming || false}
      isAiActionLoading={props.isAiActionLoading || false}
      selectedFile={props.selectedFile || null}
      uploadProgress={props.uploadProgress || null}
      onSendMessage={props.sendMessage!}
      onFileSelect={props.handleFileSelect!}
      onCancelStreaming={props.cancelStreaming!}
      onUndo={props.onUndo!}
      onClearChat={props.clearChatHistory!}
    />
  );
}

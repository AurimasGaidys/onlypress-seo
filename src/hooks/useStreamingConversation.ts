import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ConversationMessage, ConversationMetadata } from '@/types/conversation';

interface StreamingChunk {
  type: 'contentUpdateStart' | 'messageStart' | 'text' | 'metadata' | 'complete';
  data?: Record<string, unknown>;
}

interface StreamingState {
  isStreaming: boolean;
  streamingMessageId: string | null;
  streamingText: string;
}

export const useStreamingConversation = (documentId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [metadata, setMetadata] = useState<ConversationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState<StreamingState>({
    isStreaming: false,
    streamingMessageId: null,
    streamingText: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentStreamRef = useRef<ReadableStream | null>(null);

  // Listen to Firestore for non-streaming updates
  useEffect(() => {
    if (!user || !documentId) {
      setLoading(false);
      return;
    }

    // ... existing Firestore listeners ...

    return () => {
      // Cleanup existing listeners
    };
  }, [documentId, user]);

  const handleStreamingResponse = useCallback(async (
    response: Response,
    tempMessageId: string,
    tempUserMessage: ConversationMessage
  ) => {
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Start streaming state
    setMessages(prev => [...prev, { ...tempUserMessage }]);
    setStreaming({
      isStreaming: true,
      streamingMessageId: tempMessageId,
      streamingText: '',
    });

    try {
      let actions: unknown[] = [];
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const parsed: StreamingChunk = JSON.parse(line);

            switch (parsed.type) {
              case 'contentUpdateStart':
                // Handle content update streaming if needed
                break;

              case 'messageStart':
                // Message streaming starts
                setMessages(prev => [...prev, {
                  id: tempMessageId,
                  role: 'assistant',
                  content: '',
                  timestamp: new Date(),
                }]);
                break;

              case 'text':
                // Real-time text streaming
                if (parsed.data) {
                  const newText = parsed.data;
                  if (typeof newText === 'string') {
                    accumulatedText += newText;
                  }

                  setStreaming(prev => ({ ...prev, streamingText: accumulatedText }));
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === tempMessageId
                        ? { ...msg, content: accumulatedText }
                        : msg
                    )
                  );
                }
                // Add small delay for natural typing effect
                await new Promise(resolve => setTimeout(resolve, 10));
                break;

              case 'metadata':
                // Final metadata with actions
                if (parsed.data?.actions && Array.isArray(parsed.data.actions)) {
                  actions = parsed.data.actions;
                }
                break;

              case 'complete':
                // Streaming complete
                setStreaming({
                  isStreaming: false,
                  streamingMessageId: null,
                  streamingText: '',
                });

                // Update final message with actions
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === tempMessageId
                      ? { ...msg, content: accumulatedText, actions: actions as any }
                      : msg
                  )
                );
                break;
            }
          } catch (parseError) {
            console.error('Error parsing streaming chunk:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setStreaming({
        isStreaming: false,
        streamingMessageId: null,
        streamingText: '',
      });
    }
  }, []);

  const sendMessage = useCallback(async (
    userInput: string,
    fileUrl?: string,
    mode: 'solo' | 'guided-creation' | 'god-mode' = 'solo'
  ) => {
    if (!user || streaming.isStreaming) return;

    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Create temporary message IDs
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    const userMessage: ConversationMessage = {
      id: userMessageId,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
      attachments: fileUrl ? [{ name: 'Attachment', url: fileUrl }] : undefined,
    };

    try {
      // Determine API endpoint and payload based on mode
      const apiUrl = '/api/chat-assistant';
      let payload: Record<string, unknown> = {};

      if (mode === 'solo') {
        payload = {
          idToken: await user.getIdToken(),
          documentId,
          lastUserMessage: userInput,
          documentContent: '', // Will be filled by parent component
          mode: 'solo',
          selectedText: '',
        };
      } else if (mode === 'guided-creation') {
        // Handle guided creation mode
        payload = {
          idToken: await user.getIdToken(),
          chatPhase: metadata?.chatPhase || 'greeting',
          lastUserMessage: userInput,
          messages: [...messages, userMessage],
          mode: 'guided-creation',
          fileUrl,
        };
      } else if (mode === 'god-mode') {
        // Handle god mode
        payload = {
          idToken: await user.getIdToken(),
          lastUserMessage: userInput,
          messages: [...messages, userMessage],
          metadata,
          documentContent: '', // Will be filled by parent component
          mode: 'god-mode',
          fileUrl,
        };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error('API request failed');

      // Check if response is streaming
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/x-ndjson')) {
        // Handle streaming response
        await handleStreamingResponse(response, assistantMessageId, userMessage);
      } else {
        // Handle regular JSON response
        const data = await response.json();
        const assistantMessage: ConversationMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: data.response || 'Response received',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error('Error sending message:', error);
        // Handle error state
        const errorMessage: ConversationMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: 'Sorry, an error occurred while processing your message.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage, errorMessage]);
      }
    } finally {
      setStreaming({
        isStreaming: false,
        streamingMessageId: null,
        streamingText: '',
      });
      abortControllerRef.current = null;
    }
  }, [user, documentId, messages, metadata, streaming.isStreaming, handleStreamingResponse]);

  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming({
      isStreaming: false,
      streamingMessageId: null,
      streamingText: '',
    });
  }, []);

  return {
    messages,
    metadata,
    loading,
    streaming,
    sendMessage,
    cancelStreaming,
  };
};

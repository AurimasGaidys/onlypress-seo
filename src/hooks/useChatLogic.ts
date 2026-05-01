import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ConversationMessage, ConversationMetadata } from '@/types/conversation';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { ArticleDocument } from '@/types/document';
import { type Editor as EditorInstance } from '@tiptap/react';
import { identifyTextTarget, validateTextTarget, describeTextTarget, TextTarget } from '@/lib/editor-targeting';
import { blockCommands } from '@/lib/tiptap/BlockExtension';

// REAL-TIME STREAMING TYPES
interface StreamingUpdate {
  type: 'text' | 'contentUpdate' | 'metadata' | 'complete' | 'error';
  data?: any;
}

// Welcome message for local sessions
const GOD_MODE_WELCOME_MESSAGE: ConversationMessage = {
  id: 'god-mode-welcome',
  role: 'assistant',
  content: `**Sveiki atvykę į "God Mode"!**

Aš esu jūsų asistentas, pasiruošęs padėti sukurti išskirtinį turinį.

**Kaip viskas veikia:**
1. Kairėje pusėje esančiuose valdikliuose suveskite visą straipsnio informaciją: temą, raktažodžius, stilių ir t.t.
2. Pasinaudokite **"Generate with AI"** mygtukais, kad gaučiau pasiūlymų.
3. Kai būsite pasiruošę, paspauskite **"Generate SEO Article"**.
4. Sugeneruotą straipsnį matysite redaktoriuje ir galėsite jį tobulinti kartu su manimi.

Pradėkime nuo temos kairėje!`,
  timestamp: new Date(),
};

// Unified Chat Mode Types
type ChatMode = 'solo' | 'god-mode' | 'guided-creation';

// Chat Logic Hook Configuration
interface UseChatLogicConfig {
  document: ArticleDocument;
  isLocalSession: boolean;
  editor: EditorInstance | null;
  onContentUpdate?: (newHtml: string) => Promise<void> | void;
}

// Unified Chat State
interface ChatState {
  messages: ConversationMessage[];
  metadata: ConversationMetadata | null;
  isStreaming: boolean;
  streamingMessageId: string | null;
  streamingText: string;
  isLoading: boolean;
  isAiActionLoading: boolean;
  uploadProgress: number | null;
}

// File upload state
interface FileState {
  selectedFile: File | null;
  uploadProgress: number | null;
}

export const useChatLogic = (config: UseChatLogicConfig) => {
  const { document, isLocalSession, editor, onContentUpdate } = config;
  const { user } = useAuth();

  // Main state management
  const [chatState, setChatState] = useState<ChatState>({
    messages: isLocalSession ? [GOD_MODE_WELCOME_MESSAGE] : [],
    metadata: null,
    isStreaming: false,
    streamingMessageId: null,
    streamingText: '',
    isLoading: true,
    isAiActionLoading: false,
    uploadProgress: null,
  });

  const [fileState, setFileState] = useState<FileState>({
    selectedFile: null,
    uploadProgress: null,
  });

  // Refs for streaming control
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize messages from database for non-local sessions
  useEffect(() => {
    if (isLocalSession || !document.id) {
      setChatState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Here we would initialize from Firebase, but for now we keep it simple
    // since the legacy useConversation hook handles this
    setChatState(prev => ({ ...prev, isLoading: false }));
  }, [isLocalSession, document.id]);

  const handleContentUpdate = useCallback((newHtml: string) => {
    if (onContentUpdate) {
      onContentUpdate(newHtml);
    }
  }, [onContentUpdate]);

  const handleStreamingResponse = useCallback(async (
    response: Response,
    tempMessageId: string,
    tempUserMessage: ConversationMessage,
    mode: ChatMode
  ) => {
    if (!response.body) return;

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    // Start streaming state
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, tempUserMessage],
      isStreaming: true,
      streamingMessageId: tempMessageId,
      streamingText: '',
      isAiActionLoading: true,
    }));

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
            const parsed: any = JSON.parse(line);

            switch (parsed.type) {
              case 'contentUpdateStart':
                // Handle content update streaming for god-mode
                if (mode === 'god-mode' && parsed.data?.confirmationMessage) {
                  toast.info(parsed.data.confirmationMessage);
                }
                break;

              case 'messageStart':
                // Message streaming starts for chat
                setChatState(prev => ({
                  ...prev,
                  messages: [...prev.messages, {
                    id: tempMessageId,
                    role: 'assistant',
                    content: '',
                    timestamp: new Date(),
                  }]
                }));
                break;

              case 'text':
                // Real-time text streaming
                if (parsed.data) {
                  const newText = typeof parsed.data === 'string' ? parsed.data : '';
                  accumulatedText += newText;

                  if (mode === 'god-mode') {
                    // For god-mode, update editor content directly
                    handleContentUpdate(accumulatedText);
                  }

                  // Update streaming UI with accumulated text
                  setChatState(prev => ({
                    ...prev,
                    streamingText: accumulatedText,
                    messages: prev.messages.map(msg =>
                      msg.id === tempMessageId
                        ? { ...msg, content: accumulatedText }
                        : msg
                    )
                  }));
                }
                // Add small delay for natural typing effect (adjustable)
                await new Promise(resolve => setTimeout(resolve, 12));
                break;

              case 'metadata':
                // Final metadata with actions (context-aware response)
                if (parsed.data?.actions && Array.isArray(parsed.data.actions)) {
                  actions = parsed.data.actions;
                }
                break;

              case 'complete':
                // Streaming complete
                setChatState(prev => ({
                  ...prev,
                  isStreaming: false,
                  streamingMessageId: null,
                  streamingText: '',
                  isAiActionLoading: false,
                  messages: prev.messages.map(msg =>
                    msg.id === tempMessageId
                      ? { ...msg, content: accumulatedText, actions: actions as any }
                      : msg
                  )
                }));

                if (mode === 'god-mode') {
                  toast.success("Content updated successfully!");
                }
                break;
            }
          } catch (parseError) {
            console.error('Error parsing streaming chunk:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setChatState(prev => ({
        ...prev,
        isStreaming: false,
        streamingMessageId: null,
        streamingText: '',
        isAiActionLoading: false,
      }));

      toast.error("Streaming failed", {
        description: error instanceof Error ? error.message : "An error occurred"
      });
    }
  }, [handleContentUpdate]);

  const sendMessage = useCallback(async (userInput: string) => {
    if (!user || chatState.isStreaming) return;

    const messageId = `msg-${Date.now()}`;
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let selectedText: string | undefined;
      let targetInfo: TextTarget | undefined;
      let currentBlockId: string | undefined;
      let fileUrl: string | undefined;

      // Handle file uploads
      if (fileState.selectedFile) {
        fileUrl = await uploadFile(fileState.selectedFile);
        setFileState(prev => ({ ...prev, selectedFile: null, uploadProgress: null }));
      }

      // DETERMINISTIC BLOCK TARGETING: Get the current block ID
      if (editor) {
        try {
          // Get the current cursor position
          const { from } = editor.state.selection;

          // Find the block at cursor position by traversing ancestors
          const { state } = editor;
          const { doc } = state;

          // Traverse up from cursor to find first block with an ID
          let pos = from;
          let foundNode: any = null;

          while (pos >= 0) {
            const resolvedPos = doc.resolve(pos);
            const node = resolvedPos.node();

            if (node.attrs && (node.attrs as any)['data-block-id']) {
              foundNode = node;
              break;
            }

            // Move to parent position - with bounds checking
            if (resolvedPos.depth > 0) {
              const parentPos = resolvedPos.before();
              if (parentPos >= 0) {
                pos = parentPos;
              } else {
                break; // Can't go further up
              }
            } else {
              break; // Already at top level
            }
          }

          if (foundNode) {
            currentBlockId = (foundNode.attrs as any)['data-block-id'];
          }
        } catch (error) {
          console.warn('Failed to detect current block:', error);
        }

        // Use reliable text targeting as fallback
        targetInfo = identifyTextTarget(editor, {
          prioritizeSelection: true,
          fallbackToParagraph: true,
          fallbackToSentence: true,
          includeContext: true
        });

        // Validate the target
        const validation = validateTextTarget(targetInfo);
        if (!validation.isValid) {
          toast.error(validation.error, {
            description: validation.suggestion
          });
          return;
        }

        selectedText = targetInfo.text;

        // Show user what text was identified
        if (targetInfo.type !== 'selection') {
          const targetDescription = currentBlockId
            ? `blokas ID: ${currentBlockId}`
            : describeTextTarget(targetInfo);

          toast.info(`Veiksmas taikomas: ${targetDescription}`, {
            description: 'Jei reikia pakeisti tekstą, pažymėkite norimą vietą prieš cevklant' +
                        `${targetInfo.text.length > 100 ? targetInfo.text.substring(0, 50) + '...' : ''}`
          });
        }
      }

      // Determine mode
      const mode: ChatMode = isLocalSession ? 'god-mode' : 'solo';

      // Prepare request body
      const requestBody = mode === 'god-mode' ? {
        idToken: await user.getIdToken(),
        lastUserMessage: userInput,
        messages: chatState.messages.filter(msg => msg.role === 'assistant'), // Only send previous AI messages for local session
        metadata: { chatPhase: 'INTERACTIVE_REFINEMENT', blueprint: {} },
        documentContent: editor?.getHTML() || '',
        fileUrl,
        selectedText,
        targetBlockId: currentBlockId, // DETERMINISTIC TARGETING
        mode: 'god-mode'
      } : {
        idToken: await user.getIdToken(),
        documentId: document.id,
        lastUserMessage: userInput,
        documentContent: editor?.getHTML() || '',
        fileUrl,
        selectedText,
        targetBlockId: currentBlockId, // DETERMINISTIC TARGETING
        mode: 'solo'
      };

      setChatState(prev => ({ ...prev, isAiActionLoading: true }));

      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error(`API request failed: ${response.status}`);

      // Check if response is streaming
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/x-ndjson')) {
        // Handle streaming response
        await handleStreamingResponse(response, messageId, userMessage, mode);
      } else {
        // Handle regular JSON response
        const data = await response.json();
        const assistantMessage: ConversationMessage = {
          id: messageId,
          role: 'assistant',
          content: data.response || 'Response received',
          timestamp: new Date(),
        };

        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, userMessage, assistantMessage],
          isAiActionLoading: false,
        }));
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error('Message sending error:', error);
        toast.error("Failed to send message", {
          description: error instanceof Error ? error.message : "An unexpected error occurred"
        });
      }

      setChatState(prev => ({ ...prev, isAiActionLoading: false }));
    } finally {
      setChatState(prev => ({
        ...prev,
        isStreaming: false,
        streamingMessageId: null,
        streamingText: '',
      }));
      abortControllerRef.current = null;
    }
  }, [user, chatState.isStreaming, fileState.selectedFile, editor, isLocalSession, document.id, chatState.messages, handleStreamingResponse]);

  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storage = getStorage();
      const filePath = `uploads/${user!.uid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setFileState(prev => ({ ...prev, uploadProgress: progress }));
        },
        (error) => {
          setFileState(prev => ({ ...prev, uploadProgress: null }));
          reject(new Error("File upload failed."));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setFileState(prev => ({ ...prev, uploadProgress: null }));
            resolve(downloadURL);
          } catch (error) {
            reject(new Error("Failed to get download URL."));
          }
        }
      );
    });
  };

  const handleFileSelect = useCallback((file: File | null) => {
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("File is too large", { description: "Maximum file size is 10MB." });
      return;
    }
    setFileState(prev => ({ ...prev, selectedFile: file, uploadProgress: null }));
  }, []);

  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setChatState(prev => ({
      ...prev,
      isStreaming: false,
      streamingMessageId: null,
      streamingText: '',
      isAiActionLoading: false,
    }));
  }, []);

  // Actions for toolbar integration
  const handleToolbarAction = useCallback((action: string) => {
    let command = '';
    switch (action) {
      case 'shorten': command = 'Sutrumpink pažymėtą tekstą'; break;
      case 'expand': command = 'Išplėsk pažymėtą tekstą'; break;
      case 'rephrase': command = 'Perfrazuok pažymėtą tekstą'; break;
      case 'fix_grammar': command = 'Ištaisyk gramatikos klaidas pažymėtame tekste'; break;
      case 'summarize_document': command = 'Sukurk viso dokumento santrauką'; break;
      case 'suggest_titles': command = 'Pasiūlyk geresnių pavadinimų šiam dokumentui'; break;
      case 'propose_structure': command = 'Pasiūlyk geresnę struktūrą šiam dokumentui'; break;
      case 'run_seo_analysis': command = 'Atlik SEO analizę šiam dokumentui'; break;
      case 'create_table_of_contents': command = 'Sukurk turinio lentelę šiam dokumentui'; break;
      default: command = action;
    }
    sendMessage(command);
  }, [sendMessage]);

  return {
    // State
    messages: chatState.messages,
    metadata: chatState.metadata,
    isLoading: chatState.isLoading,
    isStreaming: chatState.isStreaming,
    streamingMessageId: chatState.streamingMessageId,
    streamingText: chatState.streamingText,
    isAiActionLoading: chatState.isAiActionLoading,

    // File handling
    selectedFile: fileState.selectedFile,
    uploadProgress: fileState.uploadProgress,

    // Actions
    sendMessage,
    handleFileSelect,
    cancelStreaming,
    handleToolbarAction,
  };
};

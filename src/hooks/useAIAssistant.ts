// src/hooks/useAIAssistant.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ConversationMessage, ConversationMetadata, ConversationAction } from '../types/conversation';
import { ArticleDocument } from '../types/document';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, onSnapshot, query, orderBy, doc, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { type Editor as EditorInstance } from '@tiptap/react';
import { findParentNode } from '@tiptap/core';
import { AiOperation } from '../types/ai-commands';

// --- (Sąsajos ir konstantos lieka nepakitusios) ---
interface UseAIAssistantConfig {
  document?: ArticleDocument;
  editor?: EditorInstance | null;
  mode: 'solo' | 'god-mode' | 'guided-creation';
  onContentUpdate?: (payload: AiOperation | string) => Promise<void> | void;
  onCreationSuccess?: (newDocumentId: string, initialContent: string) => void;
}
interface AIAssistantState {
  messages: ConversationMessage[];
  metadata: ConversationMetadata | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  streamingText: string;
  isAiActionLoading: boolean;
}
interface FileState {
  selectedFile: File | null;
  uploadProgress: number | null;
}
const GOD_MODE_CREATOR_WELCOME_MESSAGE: ConversationMessage = {
  id: 'god-mode-creator-welcome',
  role: 'assistant',
  content: `Sveiki! Aš – jūsų Kūrėjas (Creator), pasiruošęs padėti sukurti išskirtinį turinį.

Galite dirbti dviem būdais:

**1. Struktūrizuotas kūrimas:** Kairėje pusėje esančiuose „God Mode Controls“ valdikliuose galite žingsnis po žingsnio suvesti visą straipsnio informaciją – nuo temos iki SEO detalių – ir sugeneruoti straipsnį vienu paspaudimu.

**2. Interaktyvus kūrimas (interviu):** Arba galite dirbti tiesiogiai su manimi. Aš veiksiu kaip žurnalistas-asistentas: uždavinėsiu klausimus, rinksime informaciją ir kartu parengsime straipsnio planą.

**Norėdami pradėti interviu, tiesiog įrašykite temą, apie kurią norėtumėte rašyti šiandien.**`,
  timestamp: new Date(),
};


export const useAIAssistant = (config: UseAIAssistantConfig) => {
  const { document, editor, mode, onContentUpdate, onCreationSuccess } = config;
  const { user } = useAuth();
  const currentAbortController = useRef<AbortController | null>(null);

  const [assistantState, setAssistantState] = useState<AIAssistantState>({
    messages: mode === 'guided-creation' ? [GOD_MODE_CREATOR_WELCOME_MESSAGE] : [],
    metadata: null,
    isLoading: true,
    isStreaming: false,
    streamingMessageId: null,
    streamingText: '',
    isAiActionLoading: false,
  });

  const [fileState, setFileState] = useState<FileState>({
    selectedFile: null,
    uploadProgress: null,
  });

  const [contextualText, setContextualText] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'solo' || !document?.id || !user) {
      setAssistantState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setAssistantState(prev => ({ ...prev, isLoading: true, messages: [] })); // Išvalome pranešimus prieš kraunant

    const messagesRef = collection(db, `documents/${document.id}/conversation/metadata/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ConversationMessage[];
      setAssistantState(prev => ({ ...prev, messages: msgs, isLoading: false }));
    }, (error) => {
      console.error("Error fetching conversation messages:", error);
      toast.error("Failed to load conversation history.");
      setAssistantState(prev => ({ ...prev, isLoading: false }));
    });

    return () => unsubscribe();
  }, [mode, document?.id, user]);


  const sendMessage = useCallback(async (userInput: string) => {
    if (!user || assistantState.isStreaming || assistantState.isAiActionLoading) return;

    const abortController = new AbortController();
    currentAbortController.current = abortController;

    const userMessage: ConversationMessage = { id: `user-${Date.now()}`, role: 'user', content: userInput, timestamp: new Date() };

    // 'solo' režime vartotojo žinutę išsaugome DB, o ne tik state
    if (mode === 'solo' && document?.id) {
        try {
            await addDoc(collection(db, `documents/${document.id}/conversation/metadata/messages`), {
                ...userMessage,
                timestamp: new Date() // Naudojame kliento laiką, kad iškart atsirastų
            });
        } catch (e) {
            toast.error("Failed to send your message.");
            return;
        }
    } else {
        // Kitais režimais atliekame optimistini atnaujinimą
        setAssistantState(prev => ({ ...prev, messages: [...prev.messages, userMessage] }));
    }

    setAssistantState(prev => ({ ...prev, isAiActionLoading: true }));

    try {
        let fileUrl: string | undefined;
        if (fileState.selectedFile) {
            fileUrl = await uploadFile(fileState.selectedFile);
            setFileState({ selectedFile: null, uploadProgress: null });
        }

        if (mode === 'guided-creation') {
            const isInitialMessage = assistantState.messages.length <= 1;
            const messagesToSend = isInitialMessage ? [] : assistantState.messages;

            const response = await fetch('/api/chat-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken: await user.getIdToken(),
                    mode: 'guided-creation',
                    lastUserMessage: userInput,
                    messages: messagesToSend,
                    chatPhase: assistantState.metadata?.chatPhase || 'GREETING',
                    fileUrl,
                }),
                signal: abortController.signal,
            });

            if (!response.ok) throw new Error((await response.json()).error || 'API request failed');

            const data = await response.json();

            if (data.type === 'creationSuccess' && onCreationSuccess) {
                onCreationSuccess(data.newDocumentId, data.html);
                const successMsg: ConversationMessage = { role: 'assistant', content: 'Straipsnis sėkmingai sukurtas! Pereinama į redaktoriaus režimą.', timestamp: new Date() };
                setAssistantState(prev => ({ ...prev, messages: [...prev.messages, successMsg] }));
            } else if (data.assistantMessage) {
                setAssistantState(prev => ({
                    ...prev,
                    messages: [...prev.messages, data.assistantMessage],
                    metadata: { ...prev.metadata, chatPhase: data.newChatPhase } as ConversationMetadata
                }));
            }
        } else { // 'solo' or 'god-mode' editor
            let selectedTextForApi: string | undefined;

            // ========================= PRASIDEDA PAGRINDINIS PAKEITIMAS =========================
            // Nebenaudojame `selection` iš propsų, o gauname naujausią būseną tiesiai iš editoriaus
            const currentSelection = editor?.state.selection;

            // PATOBULINTA LOGIKA:
            // 1. Prioritetas - aktyvus pokalbio kontekstas.
            if (contextualText) {
                selectedTextForApi = contextualText;
                setContextualText(null); // Išvalome po panaudojimo.
            }
            // 2. Jei jo nėra, naudojame naujausią pažymėjimą iš redaktoriaus.
            else if (editor && currentSelection && !currentSelection.empty) {
                selectedTextForApi = editor.state.doc.textBetween(currentSelection.from, currentSelection.to, ' ');
            }

            let targetBlockId: string | undefined;
            if (editor && currentSelection) {
                // ... (block ID gavimo logika lieka ta pati, bet naudoja `currentSelection`)
                try {
                    let node = editor.state.doc.nodeAt(currentSelection.from);
                    let pos = currentSelection.from;
                    while (node && !node.attrs?.['data-block-id']) {
                        pos--;
                        node = editor.state.doc.nodeAt(pos);
                    }
                    if (node?.attrs?.['data-block-id']) {
                        targetBlockId = node.attrs['data-block-id'];
                    }
                } catch (error) {
                    console.warn('Failed to find block ID:', error);
                }
            }
            // ========================== PAKEITIMO PABAIGA ===========================

            const response = await fetch('/api/chat-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken: await user.getIdToken(),
                    mode: 'solo',
                    documentId: document?.id, // Bus `undefined` God Mode, ir tai yra gerai
                    lastUserMessage: userInput,
                    documentContent: editor?.getHTML() || '',
                    selectedText: selectedTextForApi,
                    targetBlockId,
                    fileUrl,
                }),
                signal: abortController.signal,
            });

            if (!response.ok) throw new Error((await response.json()).error || 'API request failed');

            const data = await response.json();

            // =========================================================================
            // === PAGRINDINIS PATAISYMAS: PAŠALINAME PERTEKLINĮ IŠSAUGOJIMĄ         ===
            // =========================================================================
            if (data.type === 'contentUpdate' && data.payload) {
                onContentUpdate?.(data.payload as AiOperation);
                // Daugiau nieko nedarome - backend'as pats įrašys patvirtinimo žinutę,
                // o `onSnapshot` ją pagaus ir atvaizduos.
            } else if (data.type === 'message') {
                // Taip pat nieko nedarome. `onSnapshot` atliks darbą.
                // God Mode (be documentId) atveju, atsakymas bus pridėtas rankiniu būdu.
                if (mode !== 'solo') {
                    const answerMsg: ConversationMessage = { role: 'assistant', content: data.response, actions: data.actions || null, timestamp: new Date() };
                    setAssistantState(prev => ({...prev, messages: [...prev.messages, answerMsg]}));
                }
            } else {
                console.warn('Received unexpected non-streaming response structure for editor:', data);
                toast.error('Gautas netikėtas atsakymas iš AI redaktoriaus.');
                // Atstatome vartotojo žinutę, nes operacija nepavyko
                if (mode !== 'solo') {
                    setAssistantState(prev => ({...prev, messages: prev.messages.slice(0, -1)}));
                }
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Request was aborted');
        } else {
            toast.error("Failed to process command", { description: error instanceof Error ? error.message : "An unexpected error occurred" });
        }
        // Atstatome vartotojo žinutę, jei tai ne 'solo' režimas
        if (mode !== 'solo') {
            setAssistantState(prev => ({ ...prev, messages: prev.messages.slice(0, -1) }));
        }
    } finally {
        setAssistantState(prev => ({ ...prev, isStreaming: false, streamingMessageId: null, isAiActionLoading: false }));
    }
  }, [
      user, assistantState.messages, assistantState.isStreaming, assistantState.isAiActionLoading,
      fileState.selectedFile, editor, mode, document, onContentUpdate, onCreationSuccess,
      contextualText // <-- PRIDĖKITE `contextualText` Į PRIKLAUSOMYBES
  ]);

  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if(!user) return reject(new Error("User not authenticated."));
      const storage = getStorage();
      const filePath = `uploads/${user.uid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => setFileState(prev => ({ ...prev, uploadProgress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100 })),
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
    setFileState({ selectedFile: file, uploadProgress: null });
  }, []);

  const cancelStreaming = useCallback(() => {
    if (currentAbortController.current) {
      currentAbortController.current.abort();
    }
    setAssistantState(prev => ({ ...prev, isStreaming: false, streamingMessageId: null, streamingText: '', isAiActionLoading: false }));
    toast.info("Operation cancelled");
  }, []);

  const startContextualConversation = useCallback((text: string) => {
    // 1. Išsaugome tekstą būsenoje, kad `sendMessage` vėliau jį panaudotų.
    setContextualText(text);

    // 2. Sukuriame AI žinutę, kuri bus parodyta vartotojui.
    // Naudojame Markdown `blockquote` formatavimą, kad tekstas išsiskirtų.
    const snippet = text.length > 250 ? text.substring(0, 247) + '...' : text;
    const aiMessage: Omit<ConversationMessage, 'id'> = {
      role: 'assistant',
      // Pakeičiame tekstą į jūsų pageidaujamą formatą
      content: `Ką norėtumėte daryti su šia teksto dalimi?\n\n> ${snippet.replace(/\n/g, '\n> ')}`,
      timestamp: new Date(),
    };

    // 3. Įrašome šią AI žinutę į duomenų bazę.
    // `onSnapshot` listener'is ją automatiškai parodys vartotojui.
    if (document?.id) {
      addDoc(collection(db, `documents/${document.id}/conversation/metadata/messages`), aiMessage);
    }
  }, [document?.id]);

  const clearChatHistory = useCallback(async () => {
    if (!user) return;

    if (mode === 'solo' && document?.id) {
      // Delete all messages from Firestore for documents
      try {
        const messagesRef = collection(db, `documents/${document.id}/conversation/metadata/messages`);
        const snapshot = await getDocs(messagesRef);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error("Failed to clear chat history from Firestore:", error);
        toast.error("Failed to clear chat history.");
        return;
      }
    } else {
      // For other modes, just reset local messages
      setAssistantState(prev => ({
        ...prev,
        messages: mode === 'guided-creation' ? [GOD_MODE_CREATOR_WELCOME_MESSAGE] : []
      }));
    }

    toast.success("Chat history cleared.");
  }, [user, mode, document?.id]);

  return {
    messages: assistantState.messages,
    isLoading: assistantState.isLoading,
    isStreaming: assistantState.isStreaming,
    isAiActionLoading: assistantState.isAiActionLoading,
    selectedFile: fileState.selectedFile,
    uploadProgress: fileState.uploadProgress,
    sendMessage,
    handleFileSelect,
    cancelStreaming,
    startContextualConversation,
    clearChatHistory,
  };
};

// src/app/(god-mode-layout)/god-mode/page.tsx
'use client';

import { useState, useCallback, useEffect, KeyboardEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { type Editor as EditorInstance } from '@tiptap/react';
import { Loader2, FileText, Bot } from 'lucide-react';
import { toast } from 'sonner';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import GodModeControls from '@/components/god-mode/GodModeControls';
import GodModeActions from '@/components/god-mode/GodModeActions';
import AIAssistantSidebar from '@/components/ai-assistant-sidebar';
import AIToolbar from '@/components/god-mode/AIToolbar';
import GenerationLoader from '@/components/creation-hub/GenerationLoader';
import { AssistantModeToggle, type AssistantMode } from '@/components/god-mode/AssistantModeToggle';
import { useDocument } from '@/hooks/useDocument';
import { ArticleDocument } from '@/types/document';
import { AdvancedFormData } from '@/types/god-mode';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useEditorUpdater } from '@/hooks/useEditorUpdater';
import { DOMParser } from 'prosemirror-model';
import { AiOperation } from '@/types/ai-commands';

const Editor = dynamic(() => import('@/components/editor'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

const DEFAULT_DOCUMENT: ArticleDocument = {
  id: 'god-mode-session',
  title: 'Sveiki atvykę į God Mode!',
  content: `<h1>Sveiki atvykę į „God Mode" – Jūsų kūrybinę erdvę!</h1>
<p>Tai – Jūsų asmeninė turinio kūrimo laboratorija, kurioje dirbtinis intelektas tampa Jūsų partneriu. Ši aplinka sujungia galingus automatizuotus įrankius su Jūsų kūrybine laisve. Susipažinkite su galimybėmis:</p>

<h2>Kūrimo procesas: nuo idėjos iki publikacijos</h2>
<p>„God Mode" sukurtas taip, kad vestų Jus per visą straipsnio kūrimo ciklą. Procesas susideda iš dviejų pagrindinių etapų: <strong>struktūrizuoto kūrimo</strong> ir <strong>interaktyvaus redagavimo</strong>.</p>

<h3>1. Struktūrizuotas kūrimas su „God Mode Controls" (kairėje)</h3>
<p>Kairėje pusėje esantis valdymo skydelis – tai Jūsų strateginis centras. Čia galite nuosekliai apibrėžti būsimo straipsnio parametrus:</p>
<ul>
  <li><strong>Article Setup:</strong> Pradėkite nuo temos ir leiskite AI pasiūlyti patrauklių antraščių (SEO Title).</li>
  <li><strong>SEO & Keywords:</strong> Įveskite raktažodžius arba leiskite AI juos sugeneruoti. Dirbtinis intelektas taip pat gali sukurti SEO meta aprašymą.</li>
  <li><strong>Structure & Style:</strong> Nustatykite straipsnio toną (pvz., profesionalus, laisvas), apimtį ir pasirinkite struktūros šabloną.</li>
  <li><strong>Actions:</strong> Baigę konfigūraciją, paspauskite <strong>„Generate SEO Article"</strong>, ir AI, remdamasis Jūsų nurodymais, sukurs pilną juodraštį.</li>
  <li><strong>Generate Images:</strong> Sugeneravus straipsnį, ši sekcija leis automatiškai sukurti ir įterpti paveikslėlius prie kiekvienos Jūsų H2 antraštės.</li>
</ul>

<h3>2. Interaktyvus kūrimas su „Editor" (dešinėje)</h3>
<p>Jei norite dinamiškesnio proceso, galite dirbti tiesiogiai su <strong>Creator</strong> asistentu. Jis veikia kaip žurnalistas-asistentas:</p>
<ol>
  <li><strong>Pradėkite pokalbį:</strong> Įveskite temą į pokalbių langą.</li>
  <li><strong>Atsakinėkite į klausimus:</strong> AI uždavinės klausimus, siekdamas surinkti kuo daugiau informacijos.</li>
  <li><strong>Patvirtinkite planą:</strong> AI pasiūlys straipsnio struktūrą. Jums patvirtinus, jis sugeneruos juodraštį.</li>
</ol>
<p>Sugeneruotas straipsnis automatiškai atsiras šiame redaktoriuje.</p>

<h2>Redagavimas ir tobulinimas</h2>
<p>Sukūrus juodraštį, procesas nesibaigia. Pereikite į <strong>Editor</strong> režimą dešinėje ir naudokite AI kaip savo asmeninį redaktorių:</p>
<ul>
  <li><strong>Teksto keitimas:</strong> Pažymėkite bet kurią teksto dalį ir duokite AI komandą, pvz., <em>„Sutrumpink šią pastraipą"</em> arba <em>„Perrašyk tai laisvesniu stiliumi"</em>.</li>
  <li><strong>Turinio papildymas:</strong> Nurodykite, kurioje vietoje pridėti naują skiltį, pvz., <em>„Po trečios pastraipos pridėk skiltį apie X naudą"</em>.</li>
  <li><strong>Klaidų taisymas:</strong> Paprašykite AI ištaisyti gramatikos klaidas arba patikrinti faktus.</li>
</ul>

<p><strong>Patarimas:</strong> Būkite konkretūs. Kuo aiškesnę komandą duosite, tuo geresnį rezultatą gausite.</p>
<p>Dabar Jūs esate pasiruošę. Išbandykite kairėje esančius valdiklius arba pradėkite pokalbį su asistentu. Sėkmės kūryboje!</p>`,
  snippet: 'Išsami instrukcija, kaip naudotis "God Mode" funkcijomis: nuo temos generavimo iki interaktyvaus redagavimo su AI asistentu.',
  userId: '',
  createdAt: new Date(),
  lastEdited: new Date(),
};

export default function GodModePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { activeWorkspace, activeClientId, activeProjectId } = useWorkspace();
  const documentId = searchParams.get('documentId');
  
  const clientIdFromUrl = searchParams.get('clientId');
  const projectIdFromUrl = searchParams.get('projectId');

  const { document: loadedDocument, loading: documentLoading } = useDocument(documentId || '');
  
  const [activeDocument, setActiveDocument] = useState<ArticleDocument>(DEFAULT_DOCUMENT);
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('creator');

  // --- PRIDĖTI NAUJĄ BŪSENĄ TEKSTO PAŽYMĖJIMUI ---
  const [hasSelection, setHasSelection] = useState(false);

  const isLocalSession = !documentId || !loadedDocument;

  // Initialize editor updater hook
  const { handleContentUpdate, animatingBlockId, isReplacingArticle } = useEditorUpdater({
    editorInstance,
    document: isLocalSession ? undefined : activeDocument,
    isLocalSession: isLocalSession,
    onLocalContentChange: (newContent) => {
      setActiveDocument(prev => ({...prev, content: newContent}));
    }
  });

  // --- NAUJA, IŠPLĖSTA BŪSENA ---
  const [formData, setFormData] = useState<AdvancedFormData>({
    topic: '',
    seoTitle: '',
    targetKeywords: [],
    seoDescription: '',
    metaTitle: '',
    backlinks: [],
    tone: 'Professional',
    wordCount: 700,
    articleStructure: 'seo-standard',
    customInstructions: '',
    addFAQ: true,
  });

  const [generationState, setGenerationState] = useState({
    titles: [],
    isGeneratingTitles: false,
    isGeneratingKeywords: false,
    isGeneratingMeta: false,
    isGeneratingArticle: false,
  });

  // Animation functions removed - now using useEditorUpdater hook

  // --- PRIDĖKITE ŠIĄ NAUJĄ FUNKCIJĄ ---
  const handleCreationSuccess = (newDocumentId: string, initialContent: string) => {
    if (!user) return;
    toast.success("Document created! Switching to Editor mode.");

    // 1. Atnaujiname URL be perkrovimo, kad atitiktų naują dokumentą
    const newUrl = `/god-mode?documentId=${newDocumentId}`;
    window.history.pushState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);

    // 2. Atnaujiname redaktoriaus turinį ir lokalią būseną
    if (editorInstance) {
      editorInstance.commands.setContent(initialContent);
    }
    const newDocumentTitle = formData.topic || "New AI Document";
    setActiveDocument({
      id: newDocumentId,
      title: newDocumentTitle,
      content: initialContent,
      userId: user.uid,
      createdAt: new Date(),
      lastEdited: new Date(),
      snippet: ''
    } as ArticleDocument);
    setEditableTitle(newDocumentTitle);

    // 3. Automatiškai perjungiame asistentą į redaktoriaus režimą
    setAssistantMode('editor');
  };
  // --- NAUJOS FUNKCIJOS PABAIGA ---

  // Get agency ID based on workspace type
  const getAgencyId = () => {
    if (activeWorkspace.type === 'user') {
      return `personal_${user?.uid}`;
    } else {
      return activeWorkspace.id;
    }
  };

  const agencyId = getAgencyId();

  const updateFormData = (updates: Partial<AdvancedFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Efekto, kuris atnaujina aktyvų dokumentą, kai įkeliamas iš DB arba kai keičiasi documentId
  useEffect(() => {
    if (loadedDocument) {
      setActiveDocument(loadedDocument);
      setEditableTitle(loadedDocument.title);
    } else if (!documentId) { // Grįžtame į lokalią sesiją
      setActiveDocument(DEFAULT_DOCUMENT);
      setEditableTitle(DEFAULT_DOCUMENT.title);
    }
  }, [loadedDocument, documentId]);

  // --- NAUJA PAVADINIMO IŠSAUGOJIMO LOGIKA ---
  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    
    if (isLocalSession) {
      // Lokaliai sesijai tiesiog atnaujiname būseną
      setActiveDocument(prev => ({ ...prev, title: editableTitle.trim() }));
    } else {
      // Išsaugotam dokumentui siunčiame atnaujinimą į Firestore
      if (!activeDocument || !editableTitle.trim() || editableTitle === activeDocument.title) {
        return;
      }
      try {
        const docRef = doc(db, 'documents', activeDocument.id);
        await updateDoc(docRef, {
          title: editableTitle.trim(),
          lastEdited: serverTimestamp(),
        });
        toast.success("Document title updated.");
      } catch (error) {
        toast.error("Failed to update title.");
        setEditableTitle(activeDocument.title); // Atstatome seną pavadinimą
      }
    }
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTitleSave();
    else if (e.key === 'Escape') {
      setEditableTitle(activeDocument.title);
      setIsEditingTitle(false);
    }
  };

  // --- NAUJA "IŠSAUGOTI KAIP NAUJĄ" LOGIKA ---
  const handleSaveAsNew = async () => {
    if (!user) return;
    if (!activeDocument.title.trim()) {
        toast.error("Please enter a title before saving.");
        return;
    }

    setIsSaving(true);
    try {
        const idToken = await user.getIdToken();
        // Use unified endpoint instead of /api/god-mode/save-document
        const response = await fetch('/api/documents/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idToken,
                creationData: {
                    source: 'god-mode',
                    title: activeDocument.title,
                    htmlContent: editorInstance?.getHTML() || activeDocument.content,
                    context: {
                        agencyId: agencyId,
                        clientId: clientIdFromUrl || activeClientId,
                        projectId: projectIdFromUrl || activeProjectId,
                    }
                },
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to save document.');

        toast.success("Document saved successfully!");
        router.push(`/docs/${data.newDocumentId}`);

    } catch (error) {
        toast.error("Save failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
        setIsSaving(false);
    }
  };

  // Old handleContentUpdate removed - now using useEditorUpdater hook

  const handleUndo = useCallback(() => {
    if (!editorInstance) return;
    
    editorInstance
      .chain()
      .focus()
      .undo()
      .run();
      
    setTimeout(() => {
      editorInstance.view.dispatch(
        editorInstance.state.tr.scrollIntoView()
      );
    }, 50);

  }, [editorInstance]);

  // ✅ ASISTENTAS KŪRĖJAS (CREATOR)
  const creatorAssistant = useAIAssistant({
    editor: editorInstance,
    mode: 'guided-creation',
    onCreationSuccess: handleCreationSuccess
  });

  // ✅ ASISTENTAS REDAKTORIUS (EDITOR)
  const {
    messages: editorMessages,
    isLoading: isEditorLoading,
    isStreaming: isEditorStreaming,
    isAiActionLoading: isEditorAiActionLoading,
    selectedFile: editorSelectedFile,
    uploadProgress: editorUploadProgress,
    sendMessage: sendEditorMessage,
    handleFileSelect: handleEditorFileSelect,
    cancelStreaming: cancelEditorStreaming,
    clearChatHistory,
    startContextualConversation: startEditorContextualConversation,
  } = useAIAssistant({
    document: activeDocument.id === 'god-mode-session' ? undefined : activeDocument,
    editor: editorInstance,
    // === PROTINGAS PERJUNGIMAS ===
    // Jei tai laikina sesija (PRIEŠ generavimą), naudojame 'god-mode' (nors jis ir nebus naudojamas).
    // Jei tai TIKRAS dokumentas (PO generavimo), naudojame 'solo' režimą, kuris veikia lygiai taip pat kaip /docs aplinkoje.
    mode: isLocalSession ? 'god-mode' : 'solo',
    onContentUpdate: handleContentUpdate
  });

  // Send message to active assistant (bubble menu commands always go to editor)
  const sendMessage = useCallback((message: string) => {
    // Auto-switch to editor mode for bubble menu commands
    setAssistantMode('editor');
    sendEditorMessage(message);
  }, [sendEditorMessage]);

  // --- API IŠKVIEČIMO FUNKCIJOS ---
  const handleApiCall = async (
    endpoint: string,
    payload: Record<string, unknown>,
    stateSetter: (data: any) => void,
    loadingKey: keyof typeof generationState
  ) => {
    if (!user) return toast.error("Authentication required.");

    setGenerationState(prev => ({ ...prev, [loadingKey]: true }));
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, idToken }),
      });
      const data: any = await response.json();
      if (!response.ok) throw new Error(data.error || "API call failed.");
      stateSetter(data);
      toast.success("Generation completed successfully!");
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      toast.error(error instanceof Error ? error.message : "API call failed.");
    } finally {
      setGenerationState(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleGenerateTitles = () => {
    if (!formData.topic.trim()) {
      toast.error("Prašome pirma įvesti temą", {
        description: "Negalima generuoti pavadinimų be pradinės temos.",
      });
      return;
    }

    handleApiCall(
      '/api/generate-titles',
      { topic: formData.topic },
      (data: any) => setGenerationState(prev => ({ ...prev, titles: data.titles || [] })),
      'isGeneratingTitles'
    );
  };

  const handleGenerateKeywords = () => {
    if (!formData.topic.trim() || !formData.seoTitle.trim()) {
      toast.error("Trūksta informacijos", {
        description: "Raktažodžiams generuoti reikalinga tema ir Pavadinimas.",
      });
      return;
    }

    handleApiCall(
      '/api/generate-keywords',
      { topic: formData.topic, title: formData.seoTitle },
      (data: any) => updateFormData({ targetKeywords: [...formData.targetKeywords, ...(data.keywords || [])] }),
      'isGeneratingKeywords'
    );
  };

  const handleGenerateMeta = () => {
    if (!formData.topic.trim() || !formData.seoTitle.trim()) {
      toast.error("Trūksta informacijos", {
        description: "Meta duomenims generuoti reikalinga tema ir Pavadinimas.",
      });
      return;
    }

    handleApiCall(
      '/api/generate-meta',
      { topic: formData.topic, title: formData.seoTitle, keywords: formData.targetKeywords },
      (data: any) => updateFormData({
        metaTitle: data.metaTitle || formData.seoTitle,
        seoDescription: data.metaDescription || formData.seoDescription
      }),
      'isGeneratingMeta'
    );
  };

  const handleGenerateArticle = async () => {
    if (!formData.topic.trim()) {
      toast.error("Straipsnio generavimas negalimas", {
        description: "Privalote nurodyti straipsnio temą kairėje esančiuose valdikliuose.",
      });
      return;
    }

    if (!user) {
      toast.error("You must be logged in to generate an article.");
      return;
    }
    setGenerationState(prev => ({ ...prev, isGeneratingArticle: true }));
    try {
      const idToken = await user.getIdToken();

      // === PAKEITIMAS: Dabar atliekamas TIK VIENAS API iškvietimas ===
      const response = await fetch('/api/god-mode/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken, 
          formData,
          agencyId: agencyId,
          clientId: clientIdFromUrl || activeClientId,
          projectId: projectIdFromUrl || activeProjectId,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Failed to generate and save article.");

      const { newDocumentId, generatedHtml } = responseData;
      const documentTitle = formData.metaTitle || formData.seoTitle || formData.topic || "New God Mode Document";

      toast.success("Article generated successfully! Loading into editor...");

      // Vietoj rankinio būsenos atnaujinimo, atliekame pilną navigaciją.
      // Tai užtikrina švarų duomenų srautą iš ką tik sukurto dokumento per `useDocument` hook'ą.
      router.push(`/god-mode?documentId=${newDocumentId}`);
      // Visi kiti būsenos atnaujinimai (activeDocument, editoriaus turinys, assistantMode)
      // įvyks automatiškai, kai komponentas persikraus su naujais duomenimis.

    } catch (error) {
      console.error('Article generation and save failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate and save article.");
    } finally {
      setGenerationState(prev => ({ ...prev, isGeneratingArticle: false }));
    }
  };

  // --- ATNAUJINTA FUNKCIJA, APDOROJANTI ĮRANKIŲ JUOSTOS VEIKSMUS ---
  const handleToolbarAction = (action: string) => {
    // Since we're using centralized sendMessage, we'll map actions to commands here
    let command = '';
    switch (action) {
      case 'shorten': command = 'Sutrumpink pažymėtą tekstą'; break;
      case 'expand': command = 'Išplėsk pažymėtą tekstą'; break;
      case 'rephrase': command = 'Perfrazuok pažymėtą tekstą'; break;
      case 'fix_grammar': command = 'Ištaisyk gramatikos klaidas pažymėtame tekste'; break;
      default: command = action;
    }
    sendMessage(command);
  };

  // --- atnaujiname editor.tsx, kad sektų pažymėjimą
  // ... (Editor'iaus onEditorReady funkcijoje, po editoriaus inicializavimo)
  useEffect(() => {
    if (editorInstance) {
        const handleSelectionUpdate = () => {
            setHasSelection(!editorInstance!.state.selection.empty);
        };

        editorInstance.on('selectionUpdate', handleSelectionUpdate);

        return () => {
            editorInstance.off('selectionUpdate', handleSelectionUpdate);
        };
    }
  }, [editorInstance]);

  // --- IMAGE GENERATION FUNCTIONS ---
  const getHeadingsFromContent = useCallback((): { id: string; text: string }[] => {
    if (!editorInstance?.state?.doc) {
      return [];
    }

    const headings: { id: string; text: string }[] = [];

    editorInstance.state.doc.forEach((node) => {
      if (node.type.name === 'heading' && node.attrs?.level === 2) {
        const id = node.attrs['data-block-id'];
        const text = node.textContent?.trim();
        // Įtraukiame tik antraštes, kurios turi ir ID, ir tekstą
        if (id && text) {
          headings.push({ id, text });
        }
      }
    });

    return headings;
  }, [editorInstance]);

  const handleGeneratePrompts = async (selectedHeadings: { id: string; text: string }[]): Promise<Record<string, string>> => {
    if (!user || !editorInstance) {
      toast.error("Authentication or Editor not ready.");
      throw new Error("Authentication or Editor not ready.");
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/god-mode/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          // Siunčiame visą objektą, kad backend'as galėtų grąžinti atsakymą su ID
          headings: selectedHeadings,
          content: editorInstance.getHTML(),
        }),
      });

      const data: any = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate prompts.");

      // Atsakymas dabar bus formatu { "block-id-1": "prompt...", "block-id-2": "prompt..." }
      return data;
    } catch (error) {
      console.error('Prompt generation failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate prompts.");
      throw error;
    }
  };

  const handleGenerateImages = async (prompts: Record<string, string>): Promise<void> => {
    if (!user || !editorInstance) {
        // ... (klaidos apdorojimas lieka tas pats)
        return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/god-mode/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          prompts, // prompts dabar yra { "block-id": "prompt text" }
        }),
      });
      
      const data: any = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate images.");

      // Atsakymas dabar bus { "block-id-1": { imageUrl: "...", prompt: "..." }, ... }
      insertImagesIntoEditor(data);

    } catch (error) {
        // ... (klaidos apdorojimas lieka tas pats)
    }
  };

  const insertImagesIntoEditor = useCallback((imageDataById: Record<string, { imageUrl: string; prompt: string }>) => {
    if (!editorInstance) return;

    const { state, view } = editorInstance;
    const { tr } = state;
    let imagesInserted = false;

    // Surenkame pozicijas, kur reikia įterpti, kad išvengtume problemų su besikeičiančiomis pozicijomis iteracijos metu
    const insertions: { pos: number; node: any }[] = [];

    state.doc.descendants((node, pos) => {
      const blockId = node.attrs['data-block-id'];
      const imageData = imageDataById[blockId];

      if (imageData && imageData.imageUrl !== 'error') {
        const imageNode = state.schema.nodes.image.create({
          src: imageData.imageUrl,
          alt: imageData.prompt,
        });

        const paragraphNode = state.schema.nodes.paragraph.create();

        const insertPos = pos + node.nodeSize;

        insertions.push({ pos: insertPos, node: [imageNode, paragraphNode] });
        imagesInserted = true;
      }
    });

    // Įterpiame visus surinktus elementus viena transakcija, pradedant nuo galo,
    // kad ankstesni įterpimai nepakeistų vėlesnių pozicijų.
    if (imagesInserted) {
      insertions.reverse().forEach(({ pos, node }) => {
        tr.insert(pos, node);
      });
      view.dispatch(tr);
      toast.success("Images inserted successfully!");
    } else {
      toast.info("No matching headings found to insert images.");
    }
  }, [editorInstance]);

  if (documentLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // PRIDĖK ŠĮ BLOKĄ
  const isProcessing = generationState.isGeneratingArticle ||
                       generationState.isGeneratingTitles ||
                       generationState.isGeneratingKeywords ||
                       generationState.isGeneratingMeta;

  // Pakeisk `return` sakinį į šį:
  return (
    <>
      {isProcessing && (
        <GenerationLoader
          messages={[
            "Waking up AI assistants...",
            "Analyzing context and instructions...",
            "Crafting high-quality content...",
            "Running SEO optimizations...",
            "Finalizing the draft..."
          ]}
        />
      )}

      {isReplacingArticle && (
        <GenerationLoader
          messages={[
            "Rewriting entire article...",
            "Applying new style...",
            "Finalizing..."
          ]}
        />
      )}

      <ResizablePanelGroup direction="horizontal" className="h-full w-full bg-background">
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
        <GodModeControls
          formData={formData}
          updateFormData={updateFormData}
          handleGenerateTitles={handleGenerateTitles}
          handleGenerateKeywords={handleGenerateKeywords}
          handleGenerateMeta={handleGenerateMeta}
          handleGenerateArticle={handleGenerateArticle}
          generationState={generationState}
          isLocalSession={isLocalSession}
          onSave={handleSaveAsNew}
          isSaving={isSaving}
          headings={getHeadingsFromContent()}
          handleGeneratePrompts={handleGeneratePrompts}
          handleGenerateImages={handleGenerateImages}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={40}>
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-6 w-6 text-muted-foreground" />
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    className="text-2xl font-bold bg-transparent border-0 ring-0 focus:ring-0 outline-none w-full"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-2xl font-bold truncate cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2"
                    title="Click to edit title"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {activeDocument.title}
                  </h1>
                )}
                <Badge variant="outline" className="text-xs font-normal text-muted-foreground shrink-0">
                  Meta Title
                </Badge>
              </div>
              
              {/* Add new actions component here */}
              <div className="flex-shrink-0">
                <GodModeActions 
                  document={activeDocument} 
                  isLocalSession={isLocalSession} 
                />
              </div>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {/* Svarbu: `Editor` komponentas automatiškai išsaugos pakeitimus į DB, jei dokumentas ne lokalus */}
            <Editor
              document={activeDocument}
              onEditorReady={setEditorInstance}
              onSendMessage={sendMessage}
              setCommandPaletteOpen={() => {}}
              onAskAI={startEditorContextualConversation}
            />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={30} minSize={20} maxSize={35}>
        <div className="h-full flex flex-col bg-muted/30 border-l">
          <div className="flex-shrink-0 p-4 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Assistants
            </h2>
            <AssistantModeToggle
              currentMode={assistantMode}
              onModeChange={setAssistantMode}
              isEditorDisabled={activeDocument.id === 'god-mode-session'}
            />
          </div>
          <div className="flex-1 overflow-y-auto pt-0 pr-4 pb-4 pl-4">
            {assistantMode === 'creator' ? (
              <AIAssistantSidebar
                document={activeDocument}
                editor={editorInstance}
                onUndo={handleUndo}
                messages={creatorAssistant.messages}
                isLoading={creatorAssistant.isLoading}
                isStreaming={creatorAssistant.isStreaming}
                isAiActionLoading={creatorAssistant.isAiActionLoading}
                selectedFile={creatorAssistant.selectedFile}
                uploadProgress={creatorAssistant.uploadProgress}
                sendMessage={creatorAssistant.sendMessage}
                handleFileSelect={creatorAssistant.handleFileSelect}
                cancelStreaming={creatorAssistant.cancelStreaming}
                clearChatHistory={creatorAssistant.clearChatHistory}
              />
            ) : (
              <AIAssistantSidebar
                document={activeDocument}
                editor={editorInstance}
                onUndo={handleUndo}
                messages={editorMessages}
                isLoading={isEditorLoading || !!animatingBlockId}
                isStreaming={isEditorStreaming}
                isAiActionLoading={isEditorAiActionLoading || !!animatingBlockId}
                selectedFile={editorSelectedFile}
                uploadProgress={editorUploadProgress}
                sendMessage={sendEditorMessage}
                handleFileSelect={handleEditorFileSelect}
                cancelStreaming={cancelEditorStreaming}
                clearChatHistory={clearChatHistory}
              />
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
    </>
  );
}

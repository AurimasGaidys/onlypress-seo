'use client';

import { useEditor, EditorContent, type Editor as EditorInstance } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align';
// import Image from '@tiptap/extension-image';
// import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
import BlockExtension from '@/lib/tiptap/BlockExtension';
import CustomImage from '../lib/tiptap/CustomImage';
import Link from '@tiptap/extension-link';

import { useEffect, useCallback, useState, useRef } from 'react';
import { doc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy, limit, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { ArticleDocument, DocumentVersion, DocumentVersionChangeType } from '@/types/document';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useEditorTab } from '@/context/EditorTabContext';
import { useMe } from '@/context/MeContext/MeContext';
import './editor-styles.css';
import { CheckCircle, Loader2, AlertCircle, RotateCcw, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import EditorToolbar from './EditorToolbar';
// import AIContextMenu from './AIContextMenu';
import BubbleMenu, { BubbleAction } from './editor/BubbleMenu';
// import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
// import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { MESSAGES } from '@/lib/constants/messages';

// interface StreamingEditResponse {
//   type: 'text' | 'complete' | 'error';
//   data: unknown;
// }

const CHANGE_TYPE_STYLES: Record<DocumentVersionChangeType, string> = {
  auto: 'bg-blue-100 text-blue-700',
  manual: 'bg-green-100 text-green-700',
  ai: 'bg-purple-100 text-purple-700',
};

const CHANGE_TYPE_LABELS: Record<DocumentVersionChangeType, string> = {
  auto: 'Auto',
  manual: 'Manual',
  ai: 'AI Snapshot',
};

function isDocumentVersionChangeType(value: unknown): value is DocumentVersionChangeType {
  return value === 'auto' || value === 'manual' || value === 'ai';
}

// Content Analysis Components
// Content Analysis Components
import PublishTab from './editor/PublishTab';
import SeoMetadataPanel from './editor/SeoMetadataPanel';
import ImagePanel from './editor/ImagePanel';
import DiffViewer from './editor/DiffViewer';
import EditorMenuTabs from './editor/EditorMenuTabs';
import { EditorTitle } from './editor/editorTitle';
import LinkNavigator from './editor/LinkNavigator';
import LinkHoverMenu from './editor/LinkHoverMenu';


interface EditorProps {
  document: ArticleDocument;
  onEditorReady: (editor: EditorInstance) => void;
  onSendMessage: (command: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  onAskAI?: (selectedText: string) => void;
  onSelectionUpdate?: (selection: { from: number; to: number } | null) => void;
  setAssistantMode?: (mode: "editor" | "artist") => void
}

type SavingStatus = 'idle' | 'saving' | 'success' | 'error';

function StatusIndicator({ status }: { status: SavingStatus }) {
  if (status === 'idle') return null;

  const statusConfig = {
    saving: { text: MESSAGES.info.saving, icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'text-muted-foreground' },
    success: { text: MESSAGES.success.documentSaved, icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-500' },
    error: { text: MESSAGES.errors.saveFailed, icon: <AlertCircle className="h-4 w-4" />, color: 'text-destructive' },
  };

  const { text, icon, color } = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 text-sm ${color}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

const useVersionManagement = (documentId: string, documentTitle: string) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  // Prevent duplicate saves
  const isSavingRef = useRef<boolean>(false);

  const saveSnapshot = useCallback(async (
    editor: EditorInstance,
    changeType: DocumentVersionChangeType = 'auto',
    options: { updateMainDoc?: boolean } = { updateMainDoc: true }
  ): Promise<void> => {
    if (!documentId || !editor) return;

    const currentContent = editor.getHTML();

    // Saugumo patikrinimas: neišsaugome, jei turinys tuščias arba labai trumpas.
    // Tai apsaugo nuo atsitiktinių išsaugojimų, kai dokumentas dar kraunasi.
    if (currentContent.length < 10) {
      console.log('Skipping snapshot save: content is too short.');
      return;
    }

    // Prevent duplicate saves from overlapping auto-save timers
    if (changeType === 'auto') {
      // Skip auto save if another save is in progress to avoid duplicates
      if (isSavingRef.current) {
        console.log('Skipping auto save: another save is in progress');
        return;
      }
      isSavingRef.current = true;
    }

    try {
      const batch = writeBatch(db); // Naudosime batch, kad abi operacijos būtų atominės

      // 1. Atnaujiname pagrindinį dokumentą
      if (options.updateMainDoc) {
        const docRef = doc(db, 'documents', documentId);
        batch.update(docRef, {
          content: currentContent,
          lastEdited: serverTimestamp(),
          // Galime atnaujinti ir žodžių skaičių
          wordCount: editor.storage.characterCount?.words?.() || 0,
        });
      }

      // 2. Sukuriame naują versijos įrašą
      const versionRef = collection(db, 'documents', documentId, 'versions');
      const newVersionRef = doc(versionRef); // Sukuriame ref'ą naujam dokumentui
      batch.set(newVersionRef, {
        documentId,
        content: currentContent, // <-- SVARBU: Įrašome dabartinį turinį
        title: documentTitle,
        createdAt: serverTimestamp(),
        changeType,
      });

      await batch.commit();
      console.log(`Snapshot saved (${changeType}).`);
      // Reset saving flag - no toast notifications for auto-saves
      isSavingRef.current = false;

    } catch (error) {
      console.error('Error saving snapshot:', error);
      toast.error('Failed to save version.');
      // Reset saving flag on error too
      isSavingRef.current = false;
    }

  }, [documentId, documentTitle]);

  const loadVersions = useCallback(async () => {
    if (!documentId) return;

    try {
      const versionRef = collection(db, 'documents', documentId, 'versions');
      const versionsQuery = query(versionRef, orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(versionsQuery);

      const versionsData: DocumentVersion[] = snapshot.docs.map((docSnapshot) => {
        const rawData = docSnapshot.data() as Record<string, unknown>;

        const rawChangeType = rawData.changeType;
        const changeType: DocumentVersionChangeType = isDocumentVersionChangeType(rawChangeType)
          ? rawChangeType
          : 'auto';

        const createdAtRaw = rawData.createdAt;
        let createdAtValue: Date;
        if (createdAtRaw instanceof Date) {
          createdAtValue = createdAtRaw;
        } else if (createdAtRaw instanceof Timestamp) {
          createdAtValue = createdAtRaw.toDate();
        } else if (
          createdAtRaw &&
          typeof createdAtRaw === 'object' &&
          typeof (createdAtRaw as { toDate?: () => Date }).toDate === 'function'
        ) {
          createdAtValue = (createdAtRaw as { toDate: () => Date }).toDate();
        } else {
          createdAtValue = new Date();
        }

        return {
          id: docSnapshot.id,
          documentId: (rawData.documentId as string) ?? documentId,
          content: (rawData.content as string) ?? '',
          title: (rawData.title as string) ?? 'Untitled',
          createdAt: createdAtValue,
          changeType,
        };
      });

      setVersions(versionsData);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  }, [documentId]);

  const restoreVersion = useCallback(async (version: DocumentVersion, editor: EditorInstance | null) => {
    if (!editor) return;

    const confirmed = window.confirm(MESSAGES.info.confirmRestore);

    if (!confirmed) return;

    try {
      // Save current state before restore
      await saveSnapshot?.(editor, 'manual', { updateMainDoc: false });
      editor.commands.setContent(version.content);

      // Explicitly update the main document with the RESTORED content
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, {
        content: version.content,
        lastEdited: serverTimestamp(),
        wordCount: editor.storage.characterCount?.words?.() || 0,
      });

      toast.success(MESSAGES.success.versionRestored);
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error(MESSAGES.errors.operationFailed);
    }
  }, [saveSnapshot]);

  return {
    versions,
    setVersions,
    saveSnapshot,
    loadVersions,
    restoreVersion,
  };
};

const useEditorCore = (
  document: ArticleDocument,
  onEditorReady: (editor: EditorInstance) => void,
  onActivity: () => void,
  onSelectionUpdate?: EditorProps['onSelectionUpdate'],
  saveSnapshot?: (editor: EditorInstance, changeType: DocumentVersionChangeType, options?: { updateMainDoc?: boolean }) => Promise<void>
) => {
  const [savingStatus, setSavingStatus] = useState<SavingStatus>('idle');
  const [toolbarUpdateKey, setToolbarUpdateKey] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Prevent multiple simultaneous saves
  // const isSavingRef = useRef<boolean>(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TableKit,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      CustomImage.configure({
        inline: false, // Allow images to be block elements
        allowBase64: false, // Disable base64, since we use URLs
      }),
      BlockExtension,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      // Underline already included in StarterKit
    ],
    content: document.content,
    immediatelyRender: false, // Fix for SSR hydration mismatch in Next.js
    editorProps: {
      attributes: { class: 'prose dark:prose-invert focus:outline-none max-w-full' },
    },
    onUpdate: ({ editor }) => { // <-- Gauname `editor` instanciją
      onActivity();
      setToolbarUpdateKey(prev => prev + 1);
      // setSavingStatus('saving'); // Iškart parodome "Saving..."  <-- UŽKOMENTUOTA

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (editor && editor.isEditable && saveSnapshot) {
          // === PRASIDEDA PAKEITIMAS ===
          // Iškviečiame `saveSnapshot` su 'auto' tipu
          saveSnapshot?.(editor, 'auto').then(() => {
            setSavingStatus('idle'); // <-- PAKEISTA EILUTĖ
          }).catch(() => {
            setSavingStatus('error');
          });
          // === PAKEITIMO PABAIGA ===
        }
      }, 1500); // 1.5 sekundės delsa
    },
    onSelectionUpdate: ({ editor }) => {
      setToolbarUpdateKey(prev => prev + 1);

      // Siūlomas patobulinimas:
      if (onSelectionUpdate) {
        const { empty, from, to } = editor.state.selection;
        onSelectionUpdate(empty ? null : { from, to });
      }
    },
    // >>> PRADŽIA: PRIDĖK ŠĮ BLOKĄ <<<
    onCreate({ editor }) {
      // Atidedame blokų ID priskyrimą iki pirmo vartotojo įvesties įvykio
      let idsAssigned = false;

      const assignBlockIds = () => {
        if (idsAssigned) return;

        // Naudojame queueMicrotask ir requestAnimationFrame, kad dispatch vyktų po render ciklo
        queueMicrotask(() => {
          requestAnimationFrame(() => {
            const { tr } = editor.state;
            let modified = false;

            // Perbėgame per visus node'us ir pridedame ID, jei trūksta
            editor.state.doc.descendants((node, pos) => {
              // Tikriname ar node yra bloko tipo ir ar neturi ID
              if (['paragraph', 'heading', 'listItem', 'blockquote'].includes(node.type.name) && !node.attrs['data-block-id']) {
                const uniqueId = `bl-${Math.random().toString(36).substr(2, 9)}`;
                tr.setNodeAttribute(pos, 'data-block-id', uniqueId);
                modified = true;
              }
            });

            // Jei buvo atlikti pakeitimai, atnaujiname transakciją
            if (modified) {
              editor.view.dispatch(tr);
              idsAssigned = true;
            }
          });
        });
      };

      // Skiriame blokų ID tik po pirmo įvesties įvykio (ne fokuso)
      editor.on('update', ({ editor: editorInstance }) => {
        if (!idsAssigned && editorInstance.isEditable) {
          assignBlockIds();
        }
      });
    },
    // >>> PABAIGA: PRIDĖK ŠĮ BLOKĄ <<<
  });

  // Initialize editor ready callback
  useEffect(() => {
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Reset status to idle after a successful save to hide message
  useEffect(() => {
    if (savingStatus === 'success') {
      const timer = setTimeout(() => setSavingStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [savingStatus]);

  return {
    editor,
    savingStatus,
    setSavingStatus,
    toolbarUpdateKey,
  };
};

export default function Editor({ document, onEditorReady, onSendMessage, onAskAI, onSelectionUpdate, setAssistantMode }: EditorProps) {
  const { user } = useAuth();
  const { userPrivate } = useMe();
  // const [showHistory, setShowHistory] = useState(false);
  const [isAiActionLoading, setIsAiActionLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingPosition, setStreamingPosition] = useState<{ from: number; to: number } | null>(null);
  const { activeTab, setActiveTab } = useEditorTab();
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Get menu version preference (default to 'menu1')
  const menuVersion = userPrivate?.menuVersion || 'menu1';


  // Use custom hooks
  const { versions, saveSnapshot, loadVersions, restoreVersion } = useVersionManagement(document.id, document.title);

  // Timer refs
  const lastActivityTimer = useRef<NodeJS.Timeout | null>(null);

  const startInactivityTimer = useCallback(() => {
    if (lastActivityTimer.current) {
      clearTimeout(lastActivityTimer.current);
    }
    lastActivityTimer.current = setTimeout(() => {
      if (editor) {
        console.log('User inactive, saving snapshot...');
        saveSnapshot(editor, 'auto');
      }
    }, 60000);
  }, [saveSnapshot]);

  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const { editor, savingStatus, setSavingStatus } = useEditorCore(document, onEditorReady, startInactivityTimer, onSelectionUpdate, saveSnapshot);


  const handleBubbleAction = (action: BubbleAction) => {
    if (!editor || editor.state.selection.empty) return;

    let command = '';
    switch (action) {
      case 'shorten':
        command = 'Sutrumpink pažymėtą tekstą.';
        break;
      case 'expand':
        command = 'Išplėsk pažymėtą tekstą, pridedant daugiau detalių.';
        break;
      case 'rephrase':
        command = 'Perrašyk pažymėtą tekstą kitais žodžiais, išlaikant prasmę.';
        break;
      case 'fix_grammar':
        command = 'Ištaisyk gramatikos ir stiliaus klaidas pažymėtame tekste.';
        break;
      case 'improve':
        command = 'Pagerink šį tekstą: padaryk jį sklandesnį ir labiau įtraukiantį.';
        break;
    }

    if (command) {
      onSendMessage(command);
      setShowBubbleMenu(false);
    }
  };

  const handleAskAI = () => {
    if (!editor || editor.state.selection.empty) return;
    const selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    onAskAI?.(selectedText);
    setShowBubbleMenu(false);
  };

  // Funkcija, kuri apdoroja failą ir siunčia jį į API
  const uploadAndProcessFile = async (file: File) => {
    if (!user || !editor) return;
    if (isImporting) return;

    setIsImporting(true);
    toast.info("Importing and processing file...", { description: file.name });

    try {
      const idToken = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('idToken', idToken);

      const response = await fetch('/api/documents/import-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      editor.chain().focus().insertContent(data.html).run();
      toast.success("File imported successfully!");

    } catch (error) {
      toast.error("Import failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsImporting(false);
    }
  };

  // Mygtuko paspaudimo handler'is
  const handleFileImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAndProcessFile(file);
    }
    // Išvalome input, kad būtų galima įkelti tą patį failą vėl
    event.target.value = '';
  };

  // Drag-and-drop handler'iai
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadAndProcessFile(file);
    }
  };

  // Update bubble menu visibility and position based on selection
  useEffect(() => {
    if (editor) {
      const updateBubbleMenu = () => {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (hasSelection) {
          // Get coordinates exactly at cursor position
          const coords = editor.view.coordsAtPos(from);
          if (coords) {
            const menuHeight = 50; // Approximate height of bubble menu
            const menuWidth = 300; // Approximate width
            const viewportWidth = window.innerWidth;
            // const viewportHeight = window.innerHeight;

            let top = coords.top - menuHeight - 10; // Above selection
            let left = coords.left; // Position exactly at cursor

            // If too high, position below selection instead
            if (top < 20) {
              top = coords.bottom + 10;
            }

            // Ensure menu doesn't overflow viewport horizontally
            if (left + menuWidth > viewportWidth) {
              left = viewportWidth - menuWidth - 10;
            }

            // Ensure minimum left position
            left = Math.max(10, left);

            setBubbleMenuPosition({ top, left });
            setShowBubbleMenu(true);
          }
        } else {
          setShowBubbleMenu(false);
          setBubbleMenuPosition(null);
        }
      };

      editor.on('selectionUpdate', updateBubbleMenu);
      return () => {
        editor.off('selectionUpdate', updateBubbleMenu);
      };
    }
  }, [editor]);

  const changeTab = (tab: string) => {
    if (tab === activeTab) return;
    if (tab === 'images' && setAssistantMode) {
      // change tab to artists images panel
      setAssistantMode('artist');
    }
    setActiveTab(tab as any);
  }

  // // === SAVE CONTENT FUNCTION ===
  // const saveContent = useCallback(async (content: string) => {
  //   if (!editor || !document.id) return;

  //   setSavingStatus('saving');
  //   try {
  //     const docRef = doc(db, 'documents', document.id);
  //     await updateDoc(docRef, {
  //       content,
  //       lastEdited: serverTimestamp(),
  //     });
  //     console.log('Document saved successfully');
  //     setSavingStatus('success');
  //   } catch (error) {
  //     console.error('Error saving document:', error);
  //     setSavingStatus('error');
  //     toast.error(MESSAGES.errors.saveFailed);
  //   } finally {
  //     // Reset status to idle after a short delay to show success message
  //     setTimeout(() => setSavingStatus('idle'), 1000);
  //   }
  // }, [editor, document.id]);

  // === LINK HANDLER ===
  // const handleLink = useCallback(() => {
  //   if (!editor) return;
  //   const url = window.prompt(MESSAGES.info.selectFile, 'https://');
  //   if (url) {
  //     const { from, to } = editor.state.selection;
  //     if (from !== to) {
  //       editor.chain().focus().setLink({ href: url }).run();
  //     }
  //   }
  // }, [editor]);

  // === ENSURE EDITOR CONTENT IS UPDATED ===
  useEffect(() => {
    if (editor && document.content !== editor.getHTML()) {
      editor.commands.setContent(document.content, { emitUpdate: false }); // prevent firing update event
    }
  }, [document, editor]);

  // === AUTO-SAVE TIMER ===
  useEffect(() => {
    if (!editor) return;

    // Paleidžiame ilgalaikį periodinį saugojimą
    const autoSaveInterval = setInterval(() => {
      console.log('Periodic 10-minute save...');
      saveSnapshot(editor, 'auto');
    }, 600000); // 10 minučių

    // Paleidžiame neaktyvumo laikmatį pirmą kartą
    startInactivityTimer();

    // Svarbu išvalyti intervalą, kai komponentas sunaikinamas
    return () => {
      clearInterval(autoSaveInterval);
      if (lastActivityTimer.current) {
        clearTimeout(lastActivityTimer.current);
      }
    };
  }, [editor, saveSnapshot, startInactivityTimer]);

  useEffect(() => {
    console.log("Pre-selecting portals:", document);
    if (document.status !== 'draft') {
      setActiveTab('publish');
    } else {
      console.warn("doc status => ", document.status)
    }
  }, [document]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className="min-h-[500px]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      {/* Paslėptas failo input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".docx,.pdf,.md,.txt"
        style={{ display: 'none' }}
      />

      {/* === BUBBLE MENU === */}
      {showBubbleMenu && bubbleMenuPosition && (
        <div
          className="fixed z-50"
          style={{
            top: bubbleMenuPosition.top,
            left: bubbleMenuPosition.left,
          }}
        >
          <BubbleMenu
            editor={editor}
            onAction={handleBubbleAction}
            onAskAI={handleAskAI}
          />
        </div>
      )}

      {/* Tab Navigation */}


      {/* Tab Content */}
      <div className="relative">
        {activeTab === 'editor' && (
          <div>
            {/* Status indicator and simplified toolbar */}
            <div className="sticky top-0 z-10 bg-card">
              <div className="absolute top-2 right-4">
                <StatusIndicator status={savingStatus} />
              </div>
              <EditorMenuTabs
                activeTab={activeTab}
                setActiveTab={changeTab}
                onLoadVersions={loadVersions}
                menuVersion={menuVersion}
              />
              <EditorTitle document={document} />
              {/* Simplified toolbar */}
              <div className="border-b">
                <EditorToolbar
                  editor={editor}
                  document={document}
                  // onSave={() => saveContent(editor?.getHTML() || document.content)}
                  onFileImport={handleFileImportClick}
                />
              </div>
            </div>

            <div className={cn(
              "p-4 pl-12 sm:p-8 sm:pl-16 flex-grow relative transition-all duration-300",
              isAiActionLoading && "bg-primary/5 border-l-4 border-l-primary shadow-inner",
              isDraggingOver && "outline-dashed outline-2 outline-offset-[-4px] outline-primary"
            )}>
              <EditorContent editor={editor} />

              {/* Subtle visual indicator during AI editing */}
              {isAiActionLoading && !streamingText && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20">
                    <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-primary">AI Edituoja</span>
                  </div>
                </div>
              )}

              {/* === VISUAL STREAMING FEEDBACK === */}
              {streamingText && streamingPosition && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                  <div className="bg-card border-2 border-primary p-6 rounded-lg shadow-lg max-w-md">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium text-primary">AI keičia tekstą</span>
                    </div>
                    <div className="bg-muted p-3 rounded text-sm leading-relaxed min-h-[2rem]">
                      {streamingText}
                      <span className="animate-pulse">|</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Realiu laiku matote kaip dirba AI
                    </div>
                  </div>
                </div>
              )}

              {/* Drag-and-drop indikatorius */}
              {(isDraggingOver || isImporting) && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  {isImporting ? (
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  ) : (
                    <Upload className="h-10 w-10 text-primary" />
                  )}
                  <p className="mt-4 font-medium text-lg">
                    {isImporting ? "Processing file..." : "Drop file to import"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div>
            {/* Status indicator and simplified toolbar */}
            <div className="sticky top-0 z-10 bg-card">
              <div className="absolute top-2 right-4">
                <StatusIndicator status={savingStatus} />
              </div>
              <EditorMenuTabs
                activeTab={activeTab}
                setActiveTab={changeTab}
                onLoadVersions={loadVersions}
                menuVersion={menuVersion}
              />
              <EditorTitle document={document} />
              {/* Simplified toolbar */}
              <div className="border-b">
                <EditorToolbar
                  editor={editor}
                  document={document}
                  // onSave={() => saveContent(editor?.getHTML() || document.content)}
                  onFileImport={handleFileImportClick}
                />
              </div>
            </div>

            <div className={cn(
              "p-4 pl-12 sm:p-8 sm:pl-16 flex-grow relative transition-all duration-300",
              isAiActionLoading && "bg-primary/5 border-l-4 border-l-primary shadow-inner",
              isDraggingOver && "outline-dashed outline-2 outline-offset-[-4px] outline-primary"
            )}>
              <EditorContent editor={editor} />

              {/* Subtle visual indicator during AI editing */}
              {isAiActionLoading && !streamingText && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20">
                    <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-primary">AI Edituoja</span>
                  </div>
                </div>
              )}

              {/* === VISUAL STREAMING FEEDBACK === */}
              {streamingText && streamingPosition && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                  <div className="bg-card border-2 border-primary p-6 rounded-lg shadow-lg max-w-md">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium text-primary">AI keičia tekstą</span>
                    </div>
                    <div className="bg-muted p-3 rounded text-sm leading-relaxed min-h-[2rem]">
                      {streamingText}
                      <span className="animate-pulse">|</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Realiu laiku matote kaip dirba AI
                    </div>
                  </div>
                </div>
              )}

              {/* Drag-and-drop indikatorius */}
              {(isDraggingOver || isImporting) && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  {isImporting ? (
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  ) : (
                    <Upload className="h-10 w-10 text-primary" />
                  )}
                  <p className="mt-4 font-medium text-lg">
                    {isImporting ? "Processing file..." : "Drop file to import"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'publish' && (
          <>
            <EditorMenuTabs
              activeTab={activeTab}
              setActiveTab={changeTab}
              onLoadVersions={loadVersions}
              menuVersion={menuVersion}
            />
            <PublishTab
              documentId={document.id}
            />
          </>
        )}

        {activeTab === 'history' && (
          <div className="p-4 sm:p-8">
            <EditorMenuTabs
              activeTab={activeTab}
              setActiveTab={changeTab}
              onLoadVersions={loadVersions}
              menuVersion={menuVersion}
            />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Document History</h3>
              {versions.length === 0 ? (
                <p className="text-muted-foreground">No versions available</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((version, index) => {
                    const isExpanded = expandedVersionId === version.id;
                    const previousVersion = versions[index + 1];
                    const oldContent = previousVersion ? previousVersion.content : '';

                    return (
                      <div key={version.id} className="border rounded-lg overflow-hidden bg-card">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => setExpandedVersionId(isExpanded ? null : version.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            <span className={cn(
                              "px-2 py-1 text-xs font-medium rounded",
                              CHANGE_TYPE_STYLES[version.changeType]
                            )}>
                              {CHANGE_TYPE_LABELS[version.changeType]}
                            </span>
                            <div>
                              <p className="font-medium">{version.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {version.createdAt.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreVersion(version, editor);
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </Button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t p-4 bg-muted/10">
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Changes from previous version:</h4>
                            <DiffViewer
                              oldContent={oldContent}
                              newContent={version.content}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <>
            <EditorMenuTabs
              activeTab={activeTab}
              setActiveTab={changeTab}
              onLoadVersions={loadVersions}
              menuVersion={menuVersion}
            />
            <EditorTitle document={document} />
            <ImagePanel
              documentId={document.id}
              document={document}
            />
          </>
        )}

        {activeTab === 'seo' && (
          <>
            <EditorMenuTabs
              activeTab={activeTab}
              setActiveTab={changeTab}
              onLoadVersions={loadVersions}
              menuVersion={menuVersion}
            />
            <SeoMetadataPanel
              documentId={document.id}
              document={document}
            />
          </>
        )}
      </div>

      {/* Floating link navigator button and hover menu */}
      {(activeTab === 'editor' || activeTab === 'images') && (
        <>
          <LinkNavigator editor={editor} />
          <LinkHoverMenu editor={editor} />
        </>
      )}
    </div>
  );
}

// src/components/editor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useCallback, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDebounce } from 'use-debounce';
import { ArticleDocument } from '@/types/document';
import { toast } from 'sonner';
import './editor-styles.css';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface EditorProps {
  document: ArticleDocument;
}

type SavingStatus = 'idle' | 'saving' | 'success' | 'error';

// Status Indicator Component
function StatusIndicator({ status }: { status: SavingStatus }) {
    if (status === 'idle') return null;

    const statusConfig = {
        saving: { text: 'Saving...', icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'text-muted-foreground' },
        success: { text: 'All changes saved', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-500' },
        error: { text: 'Could not save', icon: <AlertCircle className="h-4 w-4" />, color: 'text-destructive' },
    };

    const { text, icon, color } = statusConfig[status];

    return (
        <div className={`flex items-center gap-2 text-sm ${color}`}>
            {icon}
            <span>{text}</span>
        </div>
    );
}


export default function Editor({ document }: EditorProps) {
  const [savingStatus, setSavingStatus] = useState<SavingStatus>('idle');

  const editor = useEditor({
    extensions: [StarterKit],
    content: document.content,
    immediatelyRender: false, // Fix for SSR hydration mismatch in Next.js
    editorProps: {
      attributes: { class: 'prose dark:prose-invert focus:outline-none max-w-full' },
    },
  });

  const [debouncedEditorState] = useDebounce(editor?.getHTML(), 1500);

  const saveContent = useCallback(async (html: string) => {
    if (!html || !document.id || html === document.content) {
      return;
    }

    setSavingStatus('saving');
    const docRef = doc(db, 'documents', document.id);

    try {
      await updateDoc(docRef, {
        content: html,
        snippet: editor?.getText().substring(0, 150).replace(/[^a-zA-Z0-9 ]/g, " ") || '',
        lastEdited: serverTimestamp(),
      });
      setSavingStatus('success');
    } catch (error) {
      console.error("Error auto-saving document:", error);
      toast.error("Failed to save changes.");
      setSavingStatus('error');
    }
  }, [document.id, document.content, editor]);

  useEffect(() => {
    // This effect triggers when the debounced state changes
    if (debouncedEditorState && editor?.isEditable) {
        saveContent(debouncedEditorState);
    }
  }, [debouncedEditorState, saveContent, editor?.isEditable]);

  // Ensure editor content is updated if the document prop changes
  useEffect(() => {
    if (editor && document.content !== editor.getHTML()) {
      editor.commands.setContent(document.content, { emitUpdate: false }); // prevent firing update event
    }
  }, [document, editor]);

  // Reset status to idle after a successful save to hide the message
  useEffect(() => {
    if (savingStatus === 'success') {
      const timer = setTimeout(() => setSavingStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [savingStatus]);

  return (
    <div className="p-4 sm:p-8 rounded-lg border bg-card text-card-foreground shadow-sm min-h-[500px] relative">
      <div className="absolute top-2 right-4">
        <StatusIndicator status={savingStatus} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

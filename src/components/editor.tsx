'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useCallback, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { ArticleDocument } from '@/types/document';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import './editor-styles.css';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface EditorProps {
  document: ArticleDocument;
}

type SavingStatus = 'idle' | 'saving' | 'success' | 'error';

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
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'prose dark:prose-invert focus:outline-none max-w-full' },
    },
  });

  const [debouncedEditorState] = useDebounce(editor?.getHTML(), 1500);

  const saveContent = useCallback(async (html: string) => {
    if (!html || !document.id || html === document.content) return;

    setSavingStatus('saving');
    try {
      await api.patch(`/api/seo/documents/${document.id}`, {
        content: html,
        snippet: editor?.getText().substring(0, 150).replace(/[^a-zA-Z0-9 ]/g, ' ') ?? '',
      });
      setSavingStatus('success');
    } catch (error) {
      console.error('Error auto-saving document:', error);
      toast.error('Failed to save changes.');
      setSavingStatus('error');
    }
  }, [document.id, document.content, editor]);

  useEffect(() => {
    if (debouncedEditorState && editor?.isEditable) {
      saveContent(debouncedEditorState);
    }
  }, [debouncedEditorState, saveContent, editor?.isEditable]);

  useEffect(() => {
    if (editor && document.content !== editor.getHTML()) {
      editor.commands.setContent(document.content, { emitUpdate: false });
    }
  }, [document, editor]);

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

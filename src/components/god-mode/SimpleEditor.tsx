// src/components/god-mode/SimpleEditor.tsx
// A simplified version of the Editor component that works with local state instead of a Firestore document.
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface SimpleEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function SimpleEditor({ content, onChange }: SimpleEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    immediatelyRender: false, // Fix for SSR hydration mismatch in Next.js
    editorProps: {
      attributes: { class: 'prose dark:prose-invert focus:outline-none max-w-full min-h-full' },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Ensure editor content is updated if the content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false }); // prevent firing update event
    }
 }, [content, editor]);

  return (
    <div className="p-4 sm:p-8 rounded-lg border bg-card text-card-foreground shadow-sm min-h-[500px]">
      <EditorContent editor={editor} className="min-h-full" />
    </div>
 );
}
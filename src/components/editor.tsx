// src/components/editor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './editor-styles.css'; // We will create this file next

interface EditorProps {
  content: string;
}

export default function Editor({ content }: EditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: true,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert focus:outline-none max-w-full',
      },
    },
  });

  return (
    <div className="p-8 rounded-lg border bg-card text-card-foreground shadow-sm min-h-[500px]">
      <EditorContent editor={editor} />
    </div>
  );
}

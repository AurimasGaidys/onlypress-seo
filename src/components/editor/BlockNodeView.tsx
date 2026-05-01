// src/components/editor/BlockNodeView.tsx
import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { GripVertical } from 'lucide-react';

export const BlockNodeView: React.FC = () => {
  return (
    <NodeViewWrapper className="group relative">
      {/* Tempimo rankenėlė, matoma tik užvedus pelę */}
      <div
        className="absolute -left-8 top-1 flex h-full cursor-grab items-start opacity-0 transition-opacity group-hover:opacity-100"
        contentEditable={false}
        data-drag-handle
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Originalus bloko turinys (pvz., <p>, <h1>) */}
      <NodeViewContent className="min-w-0" />
    </NodeViewWrapper>
  );
};

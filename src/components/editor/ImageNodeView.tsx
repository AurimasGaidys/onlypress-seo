// src/components/editor/ImageNodeView.tsx
import React, { useRef, useCallback, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { cn } from '../../lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export const ImageNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [altText, setAltText] = useState(node.attrs.alt || '');

  const handleResize = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!imgRef.current) return;

    const startX = event.clientX;
    const startWidth = imgRef.current.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX)); // Minimum width of 50px
      updateAttributes({ width: newWidth, height: 'auto' }); // Išlaikome proporcijas
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [updateAttributes]);

  const handleAltTextSave = useCallback(() => {
    updateAttributes({ alt: altText });
    setIsEditing(false);
  }, [altText, updateAttributes]);

  const handleAltTextKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAltTextSave();
    } else if (event.key === 'Escape') {
      setAltText(node.attrs.alt || '');
      setIsEditing(false);
    }
  }, [handleAltTextSave, node.attrs.alt]);

  const getAlignmentClasses = () => {
    const align = node.attrs.textAlign || 'center';
    switch (align) {
      case 'left':
        return 'justify-start';
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-center';
    }
  };

  return (
    <NodeViewWrapper className={cn("relative flex flex-col my-4", getAlignmentClasses())} data-drag-handle>
      <div className="relative inline-block">
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          title={node.attrs.title}
          width={node.attrs.width}
          height={node.attrs.height}
          className={cn(
              'rounded-md',
              selected && 'ring-2 ring-primary'
          )}
        />
        {/* Resizing Handle */}
        <div
          className="absolute bottom-1 right-1 w-4 h-4 bg-primary rounded-full cursor-nwse-resize border-2 border-white"
          onMouseDown={handleResize}
        />
      </div>

      {/* Alt Text Input - Show when image is selected */}
      {selected && (
        <div className="mt-2 p-3 bg-card border rounded-md shadow-sm w-full max-w-md">
          <div className="flex flex-col gap-2">
            <Label htmlFor="alt-text" className="text-sm font-medium">
              Alt Text (Image Description)
            </Label>
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  id="alt-text"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  onKeyDown={handleAltTextKeyDown}
                  onBlur={handleAltTextSave}
                  placeholder="Describe this image..."
                  className="flex-1"
                  autoFocus
                />
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent/50 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                <span className="text-sm text-muted-foreground flex-1">
                  {node.attrs.alt || 'Click to add alt text...'}
                </span>
                <span className="text-xs text-muted-foreground">Edit</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Alt text helps with accessibility and SEO. Press Enter to save, Esc to cancel.
            </p>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

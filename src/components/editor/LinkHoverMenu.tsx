'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { Editor as EditorInstance } from '@tiptap/react';
import { ExternalLink, Unlink } from 'lucide-react';

interface LinkHoverMenuProps {
  editor: EditorInstance;
}

interface HoverState {
  url: string;
  top: number;
  left: number;
}

export default function LinkHoverMenu({ editor }: LinkHoverMenuProps) {
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentLinkRef = useRef<HTMLAnchorElement | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      if (!isMenuHovered) {
        setHoverState(null);
        currentLinkRef.current = null;
      }
    }, 200);
  }, [clearHideTimeout, isMenuHovered]);

  const handleOpenLink = useCallback(() => {
    if (hoverState?.url) {
      window.open(hoverState.url, '_blank', 'noopener,noreferrer');
    }
    setHoverState(null);
    currentLinkRef.current = null;
  }, [hoverState]);

  const handleRemoveLink = useCallback(() => {
    if (!editor || !currentLinkRef.current) return;

    try {
      const linkElement = currentLinkRef.current;
      const pos = editor.view.posAtDOM(linkElement, 0);

      // Place cursor inside the link, extend to full link range, then unset
      editor
        .chain()
        .focus()
        .setTextSelection(pos)
        .extendMarkRange('link')
        .unsetLink()
        .run();
    } catch (e) {
      console.error('Failed to remove link:', e);
    }

    setHoverState(null);
    currentLinkRef.current = null;
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const linkElement = target.closest('a') as HTMLAnchorElement | null;

      if (linkElement && editorElement.contains(linkElement)) {
        const href = linkElement.getAttribute('href');
        if (!href) return;

        clearHideTimeout();
        currentLinkRef.current = linkElement;

        const rect = linkElement.getBoundingClientRect();
        setHoverState({
          url: href,
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      const linkElement = target.closest('a');

      if (linkElement && editorElement.contains(linkElement)) {
        // Check if we're moving to the menu
        if (relatedTarget && menuRef.current?.contains(relatedTarget)) {
          return;
        }
        scheduleHide();
      }
    };

    editorElement.addEventListener('mouseover', handleMouseOver);
    editorElement.addEventListener('mouseout', handleMouseOut);

    return () => {
      editorElement.removeEventListener('mouseover', handleMouseOver);
      editorElement.removeEventListener('mouseout', handleMouseOut);
      clearHideTimeout();
    };
  }, [editor, clearHideTimeout, scheduleHide]);

  // Also hide when editor content changes (link might be removed)
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setHoverState(null);
      currentLinkRef.current = null;
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  if (!hoverState) return null;

  // Truncate URL for display
  const displayUrl = hoverState.url.length > 40
    ? hoverState.url.substring(0, 37) + '...'
    : hoverState.url;

  return (
    <div
      ref={menuRef}
      className="fixed z-[60] flex items-center gap-1 bg-popover border border-border rounded-lg shadow-lg px-2 py-1.5 text-sm animate-in fade-in-0 zoom-in-95 duration-100"
      style={{
        top: hoverState.top,
        left: hoverState.left,
      }}
      onMouseEnter={() => {
        setIsMenuHovered(true);
        clearHideTimeout();
      }}
      onMouseLeave={() => {
        setIsMenuHovered(false);
        scheduleHide();
      }}
    >
      <span className="text-muted-foreground text-xs truncate max-w-[200px] px-1" title={hoverState.url}>
        {displayUrl}
      </span>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        onClick={handleOpenLink}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent text-foreground text-xs font-medium transition-colors"
        title="Open in new tab"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={handleRemoveLink}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-destructive/10 text-destructive text-xs font-medium transition-colors"
        title="Remove link"
      >
        <Unlink className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

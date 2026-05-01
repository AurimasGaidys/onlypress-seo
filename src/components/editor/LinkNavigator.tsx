'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Editor as EditorInstance } from '@tiptap/react';
import { Link2 } from 'lucide-react';

interface LinkNavigatorProps {
  editor: EditorInstance;
}

export default function LinkNavigator({ editor }: LinkNavigatorProps) {
  const [linkCount, setLinkCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Count links in the editor content
  const countLinks = useCallback(() => {
    if (!editor) return 0;
    const editorElement = editor.view.dom;
    const links = editorElement.querySelectorAll('a[href]');
    return links.length;
  }, [editor]);

  // Update link count whenever editor content changes
  useEffect(() => {
    if (!editor) return;

    const updateCount = () => {
      setLinkCount(countLinks());
    };

    // Initial count
    updateCount();

    // Listen for content changes
    editor.on('update', updateCount);
    editor.on('create', updateCount);

    return () => {
      editor.off('update', updateCount);
      editor.off('create', updateCount);
    };
  }, [editor, countLinks]);

  // Reset index when link count changes
  useEffect(() => {
    setCurrentIndex(-1);
  }, [linkCount]);

  const scrollToLink = useCallback(() => {
    if (!editor || linkCount === 0) return;

    const editorElement = editor.view.dom;
    const links = editorElement.querySelectorAll('a[href]');

    if (links.length === 0) return;

    // Calculate next index (cycle through: 0, 1, 2, ..., n-1, 0, 1, ...)
    const nextIndex = (currentIndex + 1) % links.length;
    setCurrentIndex(nextIndex);

    const targetLink = links[nextIndex] as HTMLElement;

    // Remove previous highlights
    links.forEach((link) => link.classList.remove('link-highlight'));

    // Clear any existing highlight timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    // Add highlight to current link
    targetLink.classList.add('link-highlight');

    // Scroll to the link
    targetLink.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // Remove highlight after 2 seconds
    highlightTimeoutRef.current = setTimeout(() => {
      targetLink.classList.remove('link-highlight');
    }, 2000);
  }, [editor, linkCount, currentIndex]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  if (linkCount === 0) return null;

  return (
    <button
      onClick={scrollToLink}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
      title={`${linkCount} link${linkCount !== 1 ? 's' : ''} in document — click to navigate (${currentIndex + 2 > linkCount ? 1 : currentIndex + 2}/${linkCount})`}
    >
      <Link2 className="h-5 w-5" />
      <span className="font-semibold text-sm">
        {currentIndex >= 0
          ? `${currentIndex + 1}/${linkCount}`
          : linkCount}
      </span>
    </button>
  );
}

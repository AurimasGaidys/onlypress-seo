// src/components/header.tsx
'use client';

import { Button } from './ui/button';
import { Menu, PenSquare } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * A responsive header component specifically for mobile view.
 * It is hidden on medium screens and larger.
 * Contains a menu toggle button and the application logo/title.
 */
export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex md:hidden items-center justify-between p-4 border-b bg-card sticky top-0 z-30">
      <Link href="/" className="flex items-center gap-2">
        <PenSquare className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold">Article Master AI</h1>
      </Link>
      <Button variant="ghost" size="icon" onClick={onMenuClick}>
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open menu</span>
      </Button>
    </header>
  );
}

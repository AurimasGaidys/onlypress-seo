// src/components/sidebar.tsx
'use client';

import { FileText, LifeBuoy, PenSquare, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Docs', icon: FileText },
    { href: '/account', label: 'Account', icon: Settings },
    { href: '/support', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <aside className="flex h-full flex-col p-4 border-r">
      <div className="flex-grow space-y-2">
        <Link href="/" className="flex items-center gap-2 px-3 mb-4">
          <PenSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Article Master</h1>
        </Link>

        <Link href="/new" className="w-full">
          <Button className="w-full justify-center mb-4">
            New Doc
          </Button>
        </Link>

        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
          return (
            <Link key={item.label} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start ${isActive ? 'bg-primary/10 text-primary' : ''}`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
      <div className="flex items-center justify-center p-2">
        <ThemeToggle />
      </div>
    </aside>
  );
}

// src/components/sidebar.tsx
'use client';

import { FileText, PenSquare, X, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ isMobile, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Docs', icon: FileText },
    // { href: '/account', label: 'Account', icon: Settings }, // Hidden for now
    // { href: '/support', label: 'Support', icon: LifeBuoy },  // Hidden for now
  ];

  const handleLogout = async () => {
    try {
        await signOut(auth);
        toast.success("You have been logged out.");
        router.push('/login');
    } catch (error) {
        console.error("Logout error:", error);
        toast.error("Failed to log out.");
    }
  };

  const handleLinkClick = () => {
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex-grow space-y-2">
        <Link href="/" className="flex items-center gap-2 px-3 mb-4" onClick={handleLinkClick}>
          <PenSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Article Master AI</h1>
        </Link>

        <Link href="/new" className="w-full" onClick={handleLinkClick}>
          <Button className="w-full justify-center mb-4">
            New Doc
          </Button>
        </Link>

        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
          return (
            <Link key={item.label} href={item.href} onClick={handleLinkClick}>
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
      <div className="flex flex-col gap-2 p-2">
        <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
        <ThemeToggle />
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={() => setIsOpen?.(false)}
          className={cn(
            'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        />
        {/* Mobile Drawer */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-50 flex h-full w-72 flex-col border-r bg-background p-4 transition-transform duration-300 ease-in-out md:hidden',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
            <div className="flex items-center justify-end mb-2">
                <Button variant="ghost" size="icon" onClick={() => setIsOpen?.(false)}>
                    <X className="h-5 w-5" />
                </Button>
            </div>
            {/* We must wrap the content in a flex container to make it work */}
            <div className="flex flex-col h-full">
              <SidebarContent />
            </div>
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className="flex h-full flex-col p-4 border-r">
      <SidebarContent />
    </aside>
  );
}

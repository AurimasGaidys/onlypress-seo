// src/components/sidebar.tsx
'use client';

import { X, Calendar, Files, Globe, ChevronDown, ChevronRight, Plus, FolderOpen, LucideIcon, LayoutDashboard, Zap } from 'lucide-react'; // Importuotas LayoutDashboard
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useWorkspace, type Workspace } from '@/context/WorkspaceContext';
import { WorkspaceSwitcher } from './workspace-switcher';
import { useState } from 'react';

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

interface NavCategory {
  title: string;
  icon: LucideIcon;
  items: Array<{
    href?: string;
    label: string;
    icon: LucideIcon;
    agencyOnly: boolean;
    badge?: string;
    getHref?: (workspace: Workspace) => string;
  }>;
}

// PAGALBINĖ FUNKCIJA, KURI SUKURS DINAMINĮ KELIĄ
const getWorkspacePath = (workspace: Workspace, path: string) => {
  // Myspace deprecated – only agency routes are used now
  const basePath = `/agency/${workspace.id}`;
  const finalPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${finalPath}`;
};

export default function Sidebar({ isMobile, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Workspace', 'Content Tools']);

  // PAKEITIMAS: dabar href nurodo TIK RELIATYVŲ kelią
  const navCategories: NavCategory[] = [
    {
      title: 'Workspace',
      icon: FolderOpen,
      items: [
        // PAKEITIMAS: Pervadiname "Agency Dashboard" į "Dashboard" ir pakeičiame ikoną
        { href: '', label: 'Dashboard', icon: LayoutDashboard, agencyOnly: true, getHref: (ws) => `/agency/${ws.id}` },
        { href: '/documents', label: 'Documents', icon: Files, agencyOnly: false },
        { href: '/scheduler', label: 'Scheduler (Coming soon)', icon: Calendar, agencyOnly: false },
          { href: '/portals', label: 'Portals', icon: Globe, agencyOnly: false },
          { href: '/transactions', label: 'Orders', icon: Zap, agencyOnly: false },
      ]
    },
    // {
    //   title: 'Content Tools',
    //   icon: Sparkles,
    //   items: [
    //     { href: '/agentic-generation', label: 'AI Generation', icon: Brain, agencyOnly: false },
    //     // { href: '/public-releases', label: 'Public Releases', icon: Rss, agencyOnly: false },
      
    //   ]
    // },
    // {
    //   title: 'Advanced (BETA)',
    //   icon: Zap,
    //   items: [
    //     { href: '/god-mode', label: 'God Mode', icon: Zap, agencyOnly: true },
    //     { href: '/journalist-chat', label: 'Journalist Chat', icon: MessageSquareText, agencyOnly: true },
    //   ]
    // },
    // {
    //   title: 'SEO & Marketing (Comming soon)',
    //   icon: BarChart3,
    //   items: [
    //     { href: '/reddit-seo', label: 'Reddit SEO', icon: MessageCircle, agencyOnly: true },
    //     { href: '/backlinks', label: 'Backlinks', icon: LinkIcon, agencyOnly: true },
    //   ]
    // }
  ];

  // FILTRAVIMO IR KELIŲ GENERAVIMO LOGIKA
  const filteredCategories = navCategories
    .map(category => ({
      ...category,
      items: category.items
        .filter(item => !(item.agencyOnly && activeWorkspace.type !== 'agency'))
        .map(item => ({
          ...item,
          // ČIA VYSTA MAGIJA: Sukuriame pilną kelią pagal aktyvią aplinką
          href: item.getHref ? item.getHref(activeWorkspace) : getWorkspacePath(activeWorkspace, item.href || ''),
        })),
    }))
    .filter(category => category.items.length > 0);

  const handleLinkClick = () => { if (setIsOpen) setIsOpen(false); };
  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryTitle)
        ? prev.filter(c => c !== categoryTitle)
        : [...prev, categoryTitle]
    );
  };

  const SidebarContent = () => (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div className="px-3 mb-4"><WorkspaceSwitcher /></div>
        <div className="px-3 mb-4">
          {/* PAKEITIMAS: Quick Create mygtukas taip pat naudoja dinaminį kelią */}
          <Link href={getWorkspacePath(activeWorkspace, '/new')} onClick={handleLinkClick}>
            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-primary/20">
              <Plus className="mr-2 h-3 w-3" /> Create new article and publish
            </Button>
          </Link>
        </div>
        <Separator className="my-2" />
        <nav className="space-y-1 px-2">
          {filteredCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.title);
            const Icon = category.icon;
            return (
              <div key={category.title} className="space-y-1">
                <Button variant="ghost" size="sm" onClick={() => toggleCategory(category.title)} className="w-full justify-between px-3 py-2 h-auto text-muted-foreground hover:text-foreground hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">{category.title}</span>
                  </div>
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
                {isExpanded && (
                  <div className="space-y-0.5 pl-6">
                    {category.items.map((item) => {
                      // PAKEITIMAS: Griežtesnė 'isActive' logika, kad išvengtume kelių aktyvių nuorodų vienu metu.
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.label} href={item.href} onClick={handleLinkClick}>
                          <Button variant="ghost" className={cn('w-full justify-start relative h-9 px-3 group transition-all duration-200', isActive ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground')}>
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-primary to-primary/60 rounded-r-full" />}
                            <item.icon className={cn('mr-3 h-4 w-4 transition-transform duration-200', isActive && 'scale-110')} />
                            <span className="flex-1 text-sm">{item.label}</span>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-3 space-y-2"></div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={() => setIsOpen?.(false)} className={cn('fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden', isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')} />
        <aside className={cn('fixed top-0 left-0 z-50 flex h-full w-80 flex-col border-r bg-background p-4 transition-all duration-300 ease-in-out md:hidden', isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen?.(false)}><X className="h-5 w-5" /></Button>
          </div>
          <div className="flex flex-col h-full"><SidebarContent /></div>
        </aside>
      </>
    );
  }

  return (
    <aside className="flex h-full flex-col border-r bg-gradient-to-b from-background to-muted/20">
      <SidebarContent />
    </aside>
  );
}

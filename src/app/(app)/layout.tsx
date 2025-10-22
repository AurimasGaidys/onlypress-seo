// src/app/(app)/layout.tsx
'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header'; // Imported new Header component
import withAuth from '@/components/auth/withAuth';
import { useState } from 'react';

function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <>
      {/* Desktop Layout: Uses ResizablePanelGroup, hidden on mobile */}
      <div className="hidden md:flex h-screen w-full">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
            <Sidebar />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80}>
            <main className="h-full overflow-y-auto p-8">{children}</main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile Layout: Uses Header and a slide-out sidebar, hidden on desktop */}
      <div className="md:hidden flex h-screen flex-col">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
        <Sidebar isMobile={true} isOpen={mobileSidebarOpen} setIsOpen={setMobileSidebarOpen} />
      </div>
    </>
  );
}

export default withAuth(AppLayout);

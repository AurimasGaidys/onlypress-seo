// src/app/(authed)/layout.tsx
'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import Sidebar from '@/components/sidebar';
import withAuth from '@/components/auth/withAuth';
import { Toaster } from '@/components/ui/sonner';

function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen w-full">
      <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
        <Sidebar />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={80}>
        <main className="h-full overflow-y-auto p-8">
          {children}
          <Toaster richColors />
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default withAuth(AuthedLayout); // Protect this layout

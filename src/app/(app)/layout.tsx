// src/app/(app)/layout.tsx
'use client';

import React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header'; // Imported new Header component
import withAuth from '@/components/auth/withAuth';
import { MeProvider } from '@/context/MeContext/MeContext'; // Add this import
import { UIProvider } from '@/context/UIContext'; // Import UIProvider
import { useUI } from '@/context/UIContext'; // Import useUI hook
import { useState } from 'react';
import NewOrderProvider from '@/context/newOrderContext';
import PortalProvider from '@/context/portalContext/context';
import UsersProvider from '@/context/usersContext/UsersContext';
import TextIndustryProvider from '@/context/portalCategoryContext/TextIndustryContext';
import { CustomPriceProvider } from '@/context/customPriceContext/CustomPriceContext';
import OrderProvider from '@/context/orders/orderContext';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { isFocusMode } = useUI(); // Get focus mode state from context
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Apply focus mode class to body element
  React.useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode');
    } else {
      document.body.classList.remove('focus-mode');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('focus-mode');
    };
  }, [isFocusMode]);

  // If focus mode is enabled, return simplified layout
  if (isFocusMode) {
    return (
      <div className="min-h-screen">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="focus-content mt-16 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Desktop Layout: Header + ResizablePanelGroup with sidebar, hidden on mobile */}
      <div className="hidden md:flex h-screen w-full flex-col">
        <div className="header">
          <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        </div>
        <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
            <div className="sidebar h-full">
              <Sidebar />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80}>
            <main className="main-content h-full overflow-y-auto">{children}</main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile Layout: Header and a slide-out sidebar, hidden on desktop */}
      <div className="md:hidden flex h-screen flex-col">
        <div className="header">
          <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        </div>
        <main className="main-content flex-1 overflow-y-auto p-4">{children}</main>
        <div className="sidebar">
          <Sidebar isMobile={true} isOpen={mobileSidebarOpen} setIsOpen={setMobileSidebarOpen} />
        </div>
      </div>
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <MeProvider>
        <NewOrderProvider>
          <CustomPriceProvider>
            <PortalProvider>
              <UsersProvider>
                <OrderProvider>
                  <TextIndustryProvider>
                    <AppLayoutContent>{children}</AppLayoutContent>
                  </TextIndustryProvider>
                </OrderProvider>
              </UsersProvider>
            </PortalProvider>
          </CustomPriceProvider>
        </NewOrderProvider>
      </MeProvider>
    </UIProvider>
  );
}

export default withAuth(AppLayout);

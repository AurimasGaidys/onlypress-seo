// src/app/layout.tsx
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { AuthProvider } from '@/context/AuthContext'; // Import the provider
import Sidebar from '@/components/sidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Article Master AI',
  description: 'AI-powered document platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider> {/* Wrap with AuthProvider */}
            <ResizablePanelGroup direction="horizontal" className="min-h-screen w-full">
              <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                <Sidebar />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={80}>
                <main className="h-full overflow-y-auto p-8">
                  {children}
                </main>
              </ResizablePanel>
            </ResizablePanelGroup>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// src/app/(app)/journalist-chat/page.tsx
'use client';

import StandaloneChat from '@/components/journalist-chat/StandaloneChat';

export default function JournalistChatPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Chat with Journalist AI</h1>
      </div>
      <p className="text-muted-foreground">
        This is a standalone chat environment for testing and experimentation.
        Conversations here are not saved and do not affect any of your documents.
      </p>
      <div className="pt-4">
        {/* Įkeliame naują, nepriklausomą pokalbių komponentą */}
        <StandaloneChat />
      </div>
    </div>
  );
}

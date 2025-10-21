// src/app/docs/[documentId]/page.tsx
'use client';

import Editor from '@/components/editor';
import AIAssistantSidebar from '@/components/ai-assistant-sidebar'; // Import the new sidebar

// Mock database lookup
const mockDocumentContent: { [key: string]: string } = {
  '1': '<h1>The Future of AI</h1><p>Exploring the rapid advancements in artificial intelligence and its potential impact on society...</p>',
  '2': '<h1>Marketing Strategy Q3</h1><p>A comprehensive plan for the third quarter, focusing on digital outreach and brand awareness...</p>',
  '3': '<h1>Untitled doc</h1><p>We have a mobile application created using React...</p>',
  // Add more mock content for other IDs as needed
};

// A simple function to get content, which handles the dynamic new doc ID
const getMockContent = (id: string) => {
  if (mockDocumentContent[id]) {
    return mockDocumentContent[id];
  }
  // If the ID is not in our static list, assume it's a new document
  return `<h1>New Document: ${id}</h1><p>This is a newly generated document. Start editing!</p>`;
}

export default function DocumentPage({ params }: { params: { documentId: string } }) {
  const content = getMockContent(params.documentId);

  return (
    <div className="flex gap-8 items-start">
      {/* Main Editor Area */}
      <div className="flex-grow">
        <Editor content={content} />
      </div>

      {/* AI Assistant Sidebar */}
      <div className="w-full max-w-xs sticky top-8">
        <AIAssistantSidebar />
      </div>
    </div>
  );
}

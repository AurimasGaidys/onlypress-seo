'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface GenerationLoaderProps {
  messages: string[];
}

export default function GenerationLoader({ messages }: GenerationLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="text-lg font-medium">{messages[currentMessageIndex]}</p>
      </div>
    </div>
  );
}

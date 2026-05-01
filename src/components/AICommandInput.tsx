// src/components/AICommandInput.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Bot } from 'lucide-react';

interface AICommandInputProps {
  onSubmit: (command: string) => void;
  isLoading: boolean;
  onCancel?: () => void;
}

export default function AICommandInput({ onSubmit, isLoading, onCancel }: AICommandInputProps) {
  const [command, setCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isLoading) {
      onSubmit(command.trim());
      setCommand('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 bg-background border rounded-lg shadow-xl p-2 min-w-[400px]">
      <Bot className="h-4 w-4 text-primary flex-shrink-0 ml-1" />
      <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
        <Input
          ref={inputRef}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ką nori, kad AI padarytų su pasirinktu tekstu?"
          className="flex-1 border-0 shadow-none focus:ring-0 focus:outline-none h-8 px-0 text-sm"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!command.trim() || isLoading}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4">⏳</div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      {onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0 flex-shrink-0"
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

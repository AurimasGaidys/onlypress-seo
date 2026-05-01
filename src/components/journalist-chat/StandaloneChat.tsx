// src/components/journalist-chat/StandaloneChat.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Bot, MessageSquareDashed } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { ConversationMessage } from '@/types/conversation';
import { formatMessageTimestamp } from '@/lib/conversation/message-utils';

// Tipas apibrėžti tik tai, ko reikia šiam komponentui
interface SimpleMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const INITIAL_ASSISTANT_MESSAGE: SimpleMessage = {
  role: 'assistant',
  content: 'Sveiki! Aš esu jūsų AI asistentas. Klauskite manęs bet ko arba duokite užduotį. Šis pokalbis yra skirtas testavimui ir nebus išsaugotas.',
  timestamp: new Date(),
};

export default function StandaloneChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SimpleMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const userInput = input.trim();
    if (!userInput || isLoading) return;

    setInput('');

    // Optimistinis atnaujinimas: iškart parodome vartotojo žinutę
    const userMessage: SimpleMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error('User not authenticated.');
      }
      const idToken = await user.getIdToken();

      // Naudosime 'god-mode' API logiką, nes ji skirta pokalbiams "atmintyje"
      // ir nereikalauja documentId.
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          lastUserMessage: userInput,
          messages: messages, // Siunčiame visą istoriją
          mode: 'god-mode', // Svarbu nurodyti šį režimą
          metadata: { chatPhase: 'INTERACTIVE_REFINEMENT', blueprint: { isJournalistChat: true } }, // Baziniai metaduomenys - įgaliname general conversational mode
          documentContent: '', // Nėra susieto dokumento
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get response from AI.');
      }

      // Patikriname ar atsakymas yra streaming (NDJSON)
      const contentType = response.headers.get('content-type');
      const isStreaming = contentType === 'application/x-ndjson';

      if (isStreaming) {
        // Handle streaming response
        await handleStreamingResponse(response);
      } else {
        // Handle regular JSON response (fallback)
        const data = await response.json();
        const assistantMessage: SimpleMessage = {
          role: 'assistant',
          content: data.response || "Atsiprašau, įvyko klaida.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      toast.error("API Error", { description: error instanceof Error ? error.message : "An unknown error occurred." });
      // Klaidos atveju pašaliname optimistiskai pridėtą vartotojo žinutę
      setMessages(prev => prev.filter(m => m !== userMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamingResponse = async (response: Response) => {
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessage = '';

    // Create a placeholder message that will be updated in real-time
    const assistantMessage: SimpleMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const chunk = JSON.parse(line);

            if (chunk.type === 'text' && chunk.data) {
              // Accumulate streaming text
              currentMessage += chunk.data;

              // Update the last message (assistant message) in real-time
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  lastMsg.content = currentMessage;
                }
                return newMessages;
              });
            }
            // For god-mode, we ignore messageStart and metadata chunks for now
            // They can be used for more advanced features later
          } catch (parseError) {
            console.warn('Failed to parse streaming chunk:', line, parseError);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative flex min-h-[60vh] flex-col overflow-hidden rounded-lg">
          {/* Žinučių konteineris */}
          <div className="flex-grow overflow-y-auto p-4 space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const messageContent = !isUser ? DOMPurify.sanitize(marked.parse(msg.content) as string) : msg.content;
              const timestampLabel = formatMessageTimestamp(msg.timestamp);

              return (
                <div key={index} className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
                  <div className="flex items-center gap-2">
                    {!isUser && ( <Avatar className="h-6 w-6"><AvatarImage src="/icon/gemini.png" alt="Gemini" /><AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-3 w-3" /></AvatarFallback></Avatar> )}
                    {isUser && user && ( <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{user.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback></Avatar> )}
                    <span className="text-sm font-medium">{isUser ? "You" : "Journalist AI"}</span>
                  </div>
                  <div className={cn("flex flex-col gap-1", !isUser && "pl-8", isUser && "pr-8")}>
                    <Card className={`max-w-xl p-3 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                      {!isUser ? <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: messageContent }} /> : <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                    </Card>
                    {timestampLabel && <span className="text-xs text-muted-foreground/80">{timestampLabel}</span>}
                  </div>
                </div>
              );
            })}

            {/* Krovimo indikatorius */}
            {isLoading && (
              <div className="flex items-start gap-3 pl-8">
                <Avatar className="h-6 w-6"><AvatarImage src="/icon/gemini.png" alt="Gemini" /></Avatar>
                <Card className="max-w-md p-3 bg-muted text-foreground">
                  <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /><span>AI is thinking...</span></div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Įvesties forma */}
          <div className="p-4 border-t bg-card sticky bottom-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

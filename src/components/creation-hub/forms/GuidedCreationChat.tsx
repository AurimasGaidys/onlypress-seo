// src/components/creation-hub/forms/GuidedCreationChat.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { ConversationMessage, ConversationPhase } from '@/types/conversation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PenTool } from 'lucide-react';
import GenerationLoader from '../GenerationLoader';

interface GuidedCreationChatProps {
  initialTopic: string;
  initialFileUrl?: string;
  onBack?: () => void; // <-- Pakeitimas: Pridedame onBack prop'są
}

export default function GuidedCreationChat({ initialTopic, initialFileUrl, onBack }: GuidedCreationChatProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [chatPhase, setChatPhase] = useState<ConversationPhase>('GREETING');

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create ref to ensure one-time execution in StrictMode
  const initialLoad = useRef(true);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      const startConversation = async () => {
        const initialSystemInput = `Pradedame straipsnio kūrimą tema: "${initialTopic}".`;
        await sendMessageToServer(initialSystemInput, initialFileUrl, true);
      };
      startConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const userInput = input.trim();
    if (!userInput || isLoading || isGeneratingArticle) return;
    setInput('');
    await sendMessageToServer(userInput);
  };

  const handleActionClick = async (actionLabel: string) => {
    if (isLoading || isGeneratingArticle) return;
    await sendMessageToServer(actionLabel);
  };

  const sendMessageToServer = async (userInput: string, fileUrl?: string, isInitialMessage = false) => {
    if (!user) return;

    if (chatPhase === 'STRUCTURE_PROPOSAL' && /patvirtinu|taip|generuok/i.test(userInput)) {
        setIsGeneratingArticle(true);
    } else {
        setIsLoading(true);
    }

    // 1. Pridedame vartotojo žinutę į būseną (jei tai ne pirmoji, sisteminė žinutė)
    if (!isInitialMessage) {
        const userMessage: ConversationMessage = {
            role: 'user',
            content: userInput,
            timestamp: new Date()
        };
        setMessages(prevMessages => [...prevMessages, userMessage]);
    }

    try {
        const idToken = await user.getIdToken();

        // 2. Siunčiame užklausą su dabartine žinučių būsena
        const response = await fetch('/api/guided-creation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idToken,
                chatPhase,
                lastUserMessage: userInput,
                // Siunčiame dabartinę būseną (su ką tik pridėta vartotojo žinute)
                messages: isInitialMessage ? [] : [...messages, { role: 'user', content: userInput }],
                fileUrl,
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'API request failed');

        if (data.type === 'creationSuccess') {
            toast.success("Article created! Redirecting to the editor...");
            setTimeout(() => router.push(`/docs/${data.newDocumentId}`), 1500);
            return; // Svarbu išeiti iš funkcijos čia
        }
        
        // 3. Pataisytas atsakymo apdorojimas
        if (data.assistantMessage) {
            setMessages(prevMessages => [...prevMessages, data.assistantMessage]);
        }
        
        setChatPhase(data.newChatPhase || 'INFORMATION_GATHERING');

    } catch (error) {
        toast.error('Failed to get a response from the AI.');
        // Klaidos atveju pašaliname paskutinę (vartotojo) žinutę
        if (!isInitialMessage) {
            setMessages(prev => prev.slice(0, -1));
        }
    } finally {
        setIsLoading(false);
        setIsGeneratingArticle(false); // Užtikriname, kad abu išsijungtų
    }
};

  return (
    <>
      {isGeneratingArticle && <GenerationLoader messages={["Finalizing...", "Writing draft...", "Preparing editor..."]} />}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
                {/* PAKEITIMAS: Naudojame onBack funkciją */}
                <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <PenTool className="h-5 w-5" /> Journalist Co-pilot
                </CardTitle>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="relative flex min-h-[520px] flex-col overflow-hidden rounded-b-lg bg-card">
                <div className="flex-grow overflow-y-auto p-4 space-y-6">
                    {/* ... (žinučių atvaizdavimo logika lieka nepakitusi) ... */}
                    {isLoading && messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isUser = msg.role === 'user';
                            const messageContent = !isUser ? DOMPurify.sanitize(marked.parse(msg.content) as string) : msg.content;
                            return (
                                <div key={`${index}-${msg.content.slice(0, 10)}`} className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
                                    <div className="flex items-center gap-2">
                                        {!isUser && ( <Avatar className="h-8 w-8"><AvatarImage src="/icon/gemini.png" alt="Gemini" /><AvatarFallback className="bg-primary/10 text-primary"><PenTool className="h-4 w-4" /></AvatarFallback></Avatar> )}
                                        {isUser && user && ( <Avatar className="h-8 w-8"><AvatarFallback>{user.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback></Avatar> )}
                                        <span className="font-medium">{isUser ? "You" : "Co-pilot"}</span>
                                    </div>
                                    <div className={cn("flex flex-col gap-1", !isUser && "pl-10", isUser && "pr-10")}>
                                        <Card className={`max-w-md p-3 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                            {!isUser ? <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: messageContent }} /> : <p className="whitespace-pre-wrap">{msg.content}</p>}
                                        </Card>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {isLoading && messages.length > 0 && (
                        <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8"><AvatarImage src="/icon/gemini.png" alt="Gemini" /><AvatarFallback className="bg-primary/10 text-primary"><PenTool className="h-4 w-4" /></AvatarFallback></Avatar>
                            <div className="flex flex-col gap-1 items-start">
                                <span className="font-medium">Co-pilot</span>
                                <Card className="p-3 bg-muted"><Loader2 className="h-5 w-5 animate-spin" /></Card>
                            </div>
                        </div>
                    )}

                    {messages.length > 0 && messages[messages.length - 1].actions && !isLoading && (
                        <div className="flex flex-wrap gap-2 pl-12">
                            {messages[messages.length - 1].actions?.map((action, i) => (<Button key={i} variant="outline" size="sm" onClick={() => handleActionClick(action.label)}>{action.label}</Button>))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t bg-card">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter your response..." disabled={isLoading || isGeneratingArticle} />
                        <Button type="submit" disabled={isLoading || isGeneratingArticle || !input.trim()}><Send className="h-4 w-4" /></Button>
                    </form>
                </div>
            </div>
        </CardContent>
      </Card>
    </>
  );
}

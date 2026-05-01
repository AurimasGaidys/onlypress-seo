// src/components/chat/ChatInterface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArticleDocument } from '../../types/document';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Loader2, Send, Paperclip, ExternalLink, Undo2, PenTool, MessageSquareDashed, Square, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { ConversationMessage } from '../../types/conversation';
import { formatMessageTimestamp } from '../../lib/conversation/message-utils';
import FileUploadPreview from './FileUploadPreview';

interface ChatInterfaceProps {
  document: ArticleDocument;
  messages: ConversationMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  isAiActionLoading: boolean;
  selectedFile: File | null;
  uploadProgress: number | null;
  onSendMessage: (userInput: string) => void;
  onFileSelect: (file: File | null) => void;
  onCancelStreaming: () => void;
  onUndo: () => void;
  onClearChat: () => void;
}

export default function ChatInterface({
  document: doc,
  messages,
  isLoading,
  isStreaming,
  isAiActionLoading,
  selectedFile,
  uploadProgress,
  onSendMessage,
  onFileSelect,
  onCancelStreaming,
  onUndo,
  onClearChat
}: ChatInterfaceProps) {
    const { user } = useAuth();
    const [input, setInput] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- PRADĖTI PAKEITIMUS ČIA ---
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAiActionLoading]);

    useEffect(() => {
        // Grąžiname fokusą į įvesties lauką, kai baigiasi krovimas arba atsiranda nauja žinutė.
        // Mažas timeout'as užtikrina, kad DOM spėja atsinaujinti prieš fokusuojant.
        if (!isLoading && !isAiActionLoading) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [messages, isLoading, isAiActionLoading]); // Efektas veiks pasikeitus žinutėms arba krovimo būsenai
    // --- PAKEITIMŲ PABAIGA ---

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const userInput = input.trim();
        if (!userInput || isStreaming || isAiActionLoading) return;

        setInput('');
        onSendMessage(userInput);
    };

    const handleActionClick = (actionLabel: string) => {
        if (isStreaming || isAiActionLoading) return;
        onSendMessage(actionLabel);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) onFileSelect(file); }}
            className={cn(
            "relative flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-card",
            isDragOver && "outline-dashed outline-2 outline-primary"
        )}
        >
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isAiActionLoading ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                        <MessageSquareDashed className="h-10 w-10 mb-4" />
                        <p className="font-medium">Editor</p>
                        <p className="text-sm">Jūsų pokalbis atsiras čia.</p>
                    </div>
                ) : (
                    messages.map((msg: ConversationMessage, index: number) => {
                        const isAssistant = msg.role === 'assistant';
                        const messageContent = isAssistant ? DOMPurify.sanitize(marked.parse(msg.content) as string) : msg.content;
                        const timestampLabel = formatMessageTimestamp(msg.timestamp);

                        return (
                            <div
                                key={msg.id ?? `message-${index}`}
                                className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-end" : "items-start")}
                            >
                                <div className="flex items-center gap-2">
                                    {isAssistant && (
                                        <Avatar className="h-6 w-6"><AvatarImage src="/icon/gemini.png" alt="Gemini" /><AvatarFallback className="bg-primary/10 text-primary"><PenTool className="h-3 w-3" /></AvatarFallback></Avatar>
                                    )}
                                    {msg.role === 'user' && user && (
                                        <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{user.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback></Avatar>
                                    )}
                                    <span className="text-sm font-medium">{msg.role === 'user' ? (user?.displayName || "You") : "Editor"}</span>
                                </div>
                                <div className={cn("flex flex-col gap-1", !isAssistant && "pl-8", isAssistant && "items-start")}>
                                    <Card className={`max-w-md p-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                        {isAssistant ? (
                                            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: messageContent }} />
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                        {isStreaming && msg.id === messages[messages.length - 1].id && <span className="inline-block ml-1 animate-pulse">|</span>}
                                    </Card>
                                    {timestampLabel && <span className="text-xs text-muted-foreground/80">{timestampLabel}</span>}
                                </div>
                            </div>
                        );
                    })
                )}

                {isAiActionLoading && !isStreaming && (
                    <div className="flex flex-col gap-2 items-start">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6"><AvatarImage src="/icon/gemini.png" alt="Gemini" /><AvatarFallback className="bg-primary/10 text-primary"><PenTool className="h-3 w-3" /></AvatarFallback></Avatar>
                            <span className="text-sm font-medium">Editor</span>
                        </div>
                        <div className="pl-8">
                             <Card className="max-w-md p-3 bg-muted text-foreground">
                                <div className="flex items-center gap-2 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Processing your edit request...</span>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].actions && !isAiActionLoading && (
                    <div className="flex flex-wrap gap-2 pl-8">
                        {messages[messages.length - 1].actions?.map((action, i: number) => (
                            <Button key={i} variant="outline" size="sm" onClick={() => handleActionClick((action as { label: string }).label)}>
                                {(action as { label: string }).label}
                            </Button>
                        ))}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center justify-between gap-2 px-4 pt-2">
                <Button variant="outline" size="sm" onClick={onUndo} disabled={isAiActionLoading} title="Atšaukti paskutinį pakeitimą">
                    <Undo2 className="mr-2 h-4 w-4" /> Atšaukti pakeitimą
                </Button>
            </div>

            <div className="p-4 border-t bg-card">
                {selectedFile && (
                    <div className="mb-2">
                        <FileUploadPreview file={selectedFile} onRemove={() => onFileSelect(null)} uploadProgress={uploadProgress} />
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isAiActionLoading}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={onClearChat} disabled={isAiActionLoading} title="Išvalyti pokalbio istoriją">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFileSelect(e.target.files?.[0] || null)} className="hidden" />
                    {/* --- PRADĖTI PAKEITIMUS ČIA --- */}
                    <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Įveskite komandą arba įkelkite failą..." disabled={isAiActionLoading} />
                    {/* --- PAKEITIMŲ PABAIGA --- */}
                    {isAiActionLoading ? (
                        <Button type="button" variant="destructive" size="icon" onClick={onCancelStreaming} title="Sustabdyti">
                            <Square className="h-4 w-4" fill="currentColor" />
                        </Button>
                    ) : (
                        <Button type="submit" disabled={(!input.trim() && !selectedFile)}>
                            <Send className="h-4 w-4" />
                        </Button>
                    )}
                </form>
            </div>
        </div>
    );
}

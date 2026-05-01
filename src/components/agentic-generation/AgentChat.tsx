'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgenticSession, AgentMessage } from '@/types/agentic-generation';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { cn } from '@/lib/utils';
import { useTypingEffect } from '@/hooks/useTypingEffect';

// Pašaliname mygtukus iš šio komponento

interface AgentChatProps {
  session: AgenticSession | null;
}

const TypingMessage = ({ content }: { content: string }) => {
  const displayedText = useTypingEffect(content, 10); // Greitis (ms per simbolį)

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(displayedText) as string) }}
    />
  );
};

export default function AgentChat({ session }: AgentChatProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [fullyRenderedMessages, setFullyRenderedMessages] = useState<Set<string>>(new Set());

  const chatHistory = useMemo(() => session?.chatHistory || [], [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, fullyRenderedMessages]); // Atnaujiname ir kai baigiasi rašymo efektas

  const formatTimestamp = (timestamp: { toDate?: () => Date } | Date) => {
    const date = 'toDate' in timestamp && timestamp.toDate ? timestamp.toDate() : new Date(timestamp as Date);
    return date.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' });
  };

  const isThinkingMessage = (message: AgentMessage) => {
    return message.agent === 'System' && message.content === 'Thinking...';
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'Strategos': return 'text-blue-600';
      case 'Scriptor': return 'text-green-600';
      case 'System': return 'text-gray-600';
      case 'User': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getAgentBgColor = (agent: string) => {
    switch (agent) {
      case 'Strategos': return 'bg-blue-50 border-blue-200';
      case 'Scriptor': return 'bg-green-50 border-green-200';
      case 'System': return 'bg-gray-50 border-gray-200';
      case 'User': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (!session) {
    return (
      <div className="p-4 h-full flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Agent Chat</h2>
        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
            <p>Start by entering a topic on the right panel to begin the agent conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
      <h2 className="text-lg font-semibold mb-4 pl-2">Agent Conversation</h2>
      
      <ScrollArea className="flex-1 mb-4 pr-4">
        <div className="space-y-4">
          <AnimatePresence>
            {chatHistory.map((message: AgentMessage, index: number) => {
              const messageId = `${message.agent}-${index}`;
              const isLastMessage = index === chatHistory.length - 1;
              const isAssistantMessage = message.agent !== 'User' && message.agent !== 'System';
              
              return (
                <motion.div
                  key={messageId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={cn("p-3 rounded-lg border", getAgentBgColor(message.agent))}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("font-medium", getAgentColor(message.agent))}>
                      {message.agent}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  {isThinkingMessage(message) ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      </div>
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  ) : (
                    isLastMessage && isAssistantMessage && !fullyRenderedMessages.has(messageId) ? (
                      <TypingMessage content={message.content} />
                    ) : (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(message.content) as string) }}
                      />
                    )
                  )}
                  {message.thinkingTime && !isThinkingMessage(message) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Thinking time: {(message.thinkingTime / 1000).toFixed(1)}s
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

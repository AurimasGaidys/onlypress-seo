"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sparkles, Bot, Pilcrow, Type, Languages, SpellCheck, ListTree, Search, FileSignature
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Įrankių aprašymai
const contextualTools = [
  { icon: Type, label: "Shorten", action: "shorten" },
  { icon: Pilcrow, label: "Expand", action: "expand" },
  { icon: Languages, label: "Rephrase", action: "rephrase" },
  { icon: SpellCheck, label: "Fix Grammar", action: "fix_grammar" },
];

const globalTools = [
  { icon: FileSignature, label: "Generate Summary", action: "summarize_document" },
  { icon: Sparkles, label: "Suggest Titles", action: "suggest_titles" },
  { icon: ListTree, label: "Propose Structure", action: "propose_structure" },
  { icon: Search, label: "Run SEO Check", action: "run_seo_analysis" },
];

interface AIToolbarProps {
  hasSelection: boolean;
  onAction: (action: string) => void;
  isLoading: boolean; // Ar vyksta koks nors AI veiksmas
}

export default function AIToolbar({ hasSelection, onAction, isLoading }: AIToolbarProps) {
  const tools = hasSelection ? contextualTools : globalTools;
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Nustojame rodyti 'loading' būseną mygtukui, kai pagrindinis 'isLoading' tampa 'false'
  useEffect(() => {
    if (!isLoading) {
      setActiveAction(null);
    }
  }, [isLoading]);

  const handleActionClick = (action: string) => {
    setActiveAction(action);
    onAction(action);
    // Kai veiksmas baigsis, `isLoading` taps `false`, ir mes tai pagausime su `useEffect`.
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-2 border-l bg-muted/30 p-2">
        <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-primary transition-colors",
            hasSelection ? "bg-primary/20" : "bg-muted"
          )}>
          <Bot className="h-5 w-5" />
        </div>

        {tools.map(({ icon: Icon, label, action }) => (
          <Tooltip key={action}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleActionClick(action)}
                disabled={isLoading}
                className={cn(
                  "h-8 w-8",
                  activeAction === action && "animate-pulse"
                )}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

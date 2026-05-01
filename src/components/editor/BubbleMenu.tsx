// src/components/editor/BubbleMenu.tsx
import { Editor } from '@tiptap/core';
import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Languages, Pilcrow, Type, SpellCheck, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type BubbleAction = 'rephrase' | 'shorten' | 'expand' | 'fix_grammar' | 'improve';

interface BubbleMenuProps {
  editor: Editor;
  onAction: (action: BubbleAction) => void;
  onAskAI: () => void;
}

const tools = [
  { action: 'rephrase' as BubbleAction, icon: Languages, label: 'Perrašyti' },
  { action: 'shorten' as BubbleAction, icon: Type, label: 'Sutrumpinti' },
  { action: 'expand' as BubbleAction, icon: Pilcrow, label: 'Išplėsti' },
  { action: 'fix_grammar' as BubbleAction, icon: SpellCheck, label: 'Taisyti gramatiką' },
  { action: 'improve' as BubbleAction, icon: ThumbsUp, label: 'Pagerinti' },
];

const BubbleMenu = forwardRef<HTMLDivElement, BubbleMenuProps>(({ editor, onAction, onAskAI }, ref) => {
  return (
    <TooltipProvider delayDuration={100}>
      <div
        ref={ref}
        className={cn('flex items-center gap-1 p-1 bg-background border rounded-lg shadow-lg')}
        onMouseDown={(e) => e.preventDefault()}
      >
        {tools.map((tool) => (
          <Tooltip key={tool.action}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction(tool.action)}>
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <div className="border-l h-6 mx-1"></div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAskAI}>
              <Bot className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pradėti pokalbį (Ask AI)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
});

BubbleMenu.displayName = 'BubbleMenu';

export default BubbleMenu;

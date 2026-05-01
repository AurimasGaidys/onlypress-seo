// src/components/AIContextMenu.tsx
'use client';

import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bot, Text, AlignLeft, Languages, Smile, Briefcase } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface AIContextMenuProps {
  onAction: (action: string) => void;
  isLoading: boolean;
}

export default function AIContextMenu({ onAction, isLoading }: AIContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading} className="px-2">
          <Bot className="h-4 w-4" />
          <span className="ml-1">AI...</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onAction('shorten')}>
          <AlignLeft className="h-4 w-4 mr-2" /> Trumpinti
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('expand')}>
          <Text className="h-4 w-4 mr-2" /> Išplėsti
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('rephrase')}>
          <Languages className="h-4 w-4 mr-2" /> Perfrazuoti
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('fix_grammar')}>
          Ištaisyti gramatiką
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Keisti toną</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onAction('tone_professional')}>
              <Briefcase className="h-4 w-4 mr-2" /> Profesionalus
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('tone_casual')}>
              <Bot className="h-4 w-4 mr-2" /> Kasdienis
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('tone_friendly')}>
              <Smile className="h-4 w-4 mr-2" /> Draugiškas
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

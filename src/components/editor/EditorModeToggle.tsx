// src/components/editor/EditorModeToggle.tsx
import { Bot, Image as ImageIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type EditorAssistantMode = 'editor' | 'artist';

interface EditorModeToggleProps {
  currentMode: EditorAssistantMode;
  onModeChange: (mode: EditorAssistantMode) => void;
}

export function EditorModeToggle({ currentMode, onModeChange }: EditorModeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={currentMode}
      onValueChange={(value: EditorAssistantMode) => {
        if (value) onModeChange(value);
      }}
      className="w-full grid grid-cols-2"
    >
      <ToggleGroupItem value="editor" aria-label="Editor Mode" className="flex-1">
        <Bot className="h-4 w-4 mr-2" />
        Editor
      </ToggleGroupItem>
      <ToggleGroupItem value="artist" aria-label="Artist Mode" className="flex-1">
        <ImageIcon className="h-4 w-4 mr-2" />
        Artist
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

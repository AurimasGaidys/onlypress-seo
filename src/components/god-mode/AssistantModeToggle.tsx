import { Bot, PenTool } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type AssistantMode = 'creator' | 'editor';

interface AssistantModeToggleProps {
  currentMode: AssistantMode;
  onModeChange: (mode: AssistantMode) => void;
  isEditorDisabled?: boolean;
}

export function AssistantModeToggle({ currentMode, onModeChange, isEditorDisabled = false }: AssistantModeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={currentMode}
      onValueChange={(value: AssistantMode) => {
        if (value) onModeChange(value);
      }}
      className="w-full grid grid-cols-2"
    >
      <ToggleGroupItem value="creator" aria-label="Creator Mode" className="flex-1">
        <Bot className="h-4 w-4 mr-2" />
        Creator
      </ToggleGroupItem>
      <ToggleGroupItem value="editor" aria-label="Editor Mode" disabled={isEditorDisabled} className="flex-1">
        <PenTool className="h-4 w-4 mr-2" />
        Editor
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

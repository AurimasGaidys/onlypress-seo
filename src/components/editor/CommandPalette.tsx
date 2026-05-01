// src/components/editor/CommandPalette.tsx
import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { editingToolsRegistry } from '@/lib/conversation/tools/editing/registry';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sendMessage: (command: string) => void;
  isStreaming: boolean;
}

export function CommandPalette({ isOpen, setIsOpen, sendMessage, isStreaming }: CommandPaletteProps) {
  const runCommand = (command: string) => {
    sendMessage(command);
    setIsOpen(false);
  };

  // Šis efektas leidžia atidaryti paletę, kai ji buvo uždaryta, ir vėl paspaudžiama `Cmd+K`
  useEffect(() => {
    if (!isOpen) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [isOpen, setIsOpen]);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Įveskite komandą arba ieškokite..." />
      <CommandList>
        <CommandEmpty>Tokia komanda nerasta.</CommandEmpty>
        <CommandGroup heading="Dažniausiai naudojami įrankiai">
          {editingToolsRegistry.slice(0, 4).map((tool) => (
            <CommandItem
              key={tool.intent}
              onSelect={() => runCommand(tool.commandExample)}
              disabled={isStreaming}
            >
              <tool.icon className="mr-2 h-4 w-4" />
              <span>{tool.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Visi redagavimo įrankiai">
          {editingToolsRegistry.slice(4).map((tool) => (
            <CommandItem
              key={tool.intent}
              onSelect={() => runCommand(tool.commandExample)}
              disabled={isStreaming}
            >
              <tool.icon className="mr-2 h-4 w-4" />
              <span>{tool.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Turinio organizavimas">
          <CommandItem onSelect={() => runCommand('Sukurk straipsnio struktūrą')} disabled={isStreaming}>
            🏗️ Struktūra
          </CommandItem>
          <CommandItem onSelect={() => runCommand('Pertvarkyk skilties tvarką')} disabled={isStreaming}>
            🔄 Pertvarka
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// src/lib/conversation/tools/editing/registry.ts
import { EditorIntent } from '@/types/conversation';
import { Type, Pilcrow, Languages, SpellCheck, Briefcase, Bot, Smile, PlusSquare, Trash2, Search, Link as LinkIcon, ListTree, LucideIcon } from 'lucide-react';

export interface EditingToolRegistryItem {
  intent: EditorIntent;
  label: string;
  commandExample: string; // Komanda, kurią siųsime į `sendMessage`
  icon: LucideIcon;
}

export const editingToolsRegistry: EditingToolRegistryItem[] = [
  { intent: 'SHORTEN_SECTION', label: 'Sutrumpinti tekstą', commandExample: 'Sutrumpink pažymėtą tekstą', icon: Type },
  { intent: 'EXPAND_SECTION', label: 'Išplėsti tekstą', commandExample: 'Išplėsk pažymėtą tekstą', icon: Pilcrow },
  { intent: 'FIX_GRAMMAR', label: 'Taisyti gramatiką', commandExample: 'Ištaisyk gramatikos klaidas', icon: SpellCheck },
  { intent: 'CHANGE_TONE', label: 'Keisti toną (į profesionalų)', commandExample: 'Pakeisk toną į profesionalų', icon: Briefcase },
  { intent: 'ADD_SECTION', label: 'Pridėti naują skiltį', commandExample: 'Pridėk skiltį apie...', icon: PlusSquare },
  { intent: 'REMOVE_SECTION', label: 'Pašalinti skiltį', commandExample: 'Pašalink skiltį apie...', icon: Trash2 },
  { intent: 'RUN_SEO_ANALYSIS', label: 'Atlikti SEO analizę', commandExample: 'Atlik SEO analizę', icon: Search },
  { intent: 'CREATE_TABLE_OF_CONTENTS', label: 'Sukurti turinį', commandExample: 'Sukurk turinio lentelę', icon: ListTree },
  { intent: 'FIND_AND_REPLACE', label: 'Rasti ir pakeisti', commandExample: 'Rask "sena" ir pakeisk į "nauja"', icon: Search },
  { intent: 'REWRITE_SECTION', label: 'Perrašyti tekstą', commandExample: 'Perrašyk pažymėtą tekstą paprasčiau', icon: Bot },
  // Add more as needed
];

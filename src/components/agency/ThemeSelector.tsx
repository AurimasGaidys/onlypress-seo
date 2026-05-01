// src/components/agency/ThemeSelector.tsx
'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DatabaseTables } from '@/lib/constants/databaseTables';

// Apibrėžiame temas su pavadinimais ir gradientų spalvomis
const themes = [
  { name: 'default', color: 'hsl(262.1, 83.3%, 57.8%)', label: 'Purple', description: 'Creative' }, // Violet
  { name: 'rose', color: 'hsl(346.8, 77.2%, 49.8%)', label: 'Rose', description: 'Premium' },
  { name: 'emerald', color: 'hsl(142.1, 76.2%, 36.3%)', label: 'Emerald', description: 'Fresh' },
  { name: 'sky', color: 'hsl(199.2, 89.7%, 48.4%)', label: 'Sky', description: 'Professional' },
  { name: 'orange', color: 'hsl(24.6, 95%, 53.1%)', label: 'Orange', description: 'Energetic' },
  { name: 'purple', color: 'hsl(262.1, 83.3%, 57.8%)', label: 'Purple', description: 'Creative' },
  { name: 'red', color: 'hsl(0, 84.2%, 60.2%)', label: 'Red', description: 'Bold' },
  { name: 'cyan', color: 'hsl(188, 94%, 43%)', label: 'Cyan', description: 'Tech' },
];

interface ThemeSelectorProps {
  agencyId: string;
}

export default function ThemeSelector({ agencyId }: ThemeSelectorProps) {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleThemeChange = async (themeName: string) => {
    if (!user) return toast.error("Authentication required.");
    setIsUpdating(true);
    try {
      // TODO: Patikrinti, ar vartotojas yra agentūros adminas
      const agencyRef = doc(db, DatabaseTables.agency, agencyId);
      await updateDoc(agencyRef, { theme: themeName });
      
      // NESIRAŠOME setActiveWorkspace - leidžiame WorkspaceContext susirūpinti per useEffect sinchronizaciją
      // Tai išvengs konflikto tarp rankinio pakeitimo ir auto-sinchronizacijos
      
      toast.success("Theme updated!");
    } catch {
      toast.error("Failed to update theme.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Theme & Colors</h4>
        <span className="text-xs text-muted-foreground">8 themes available</span>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            disabled={isUpdating}
            className={cn(
              "group relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105",
              activeWorkspace.theme === theme.name 
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            {/* Color circle with gradient effect */}
            <div className="relative">
              <div 
                className="h-8 w-8 rounded-full border-2 border-white shadow-md group-hover:shadow-lg transition-shadow"
                style={{ 
                  backgroundColor: theme.color,
                  background: `linear-gradient(135deg, ${theme.color}, ${theme.color}dd)`
                }}
              />
              {/* Check or loading indicator */}
              {isUpdating && activeWorkspace.theme === theme.name && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-white drop-shadow" />
                </div>
              )}
              {!isUpdating && activeWorkspace.theme === theme.name && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-white/90 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary drop-shadow" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Theme name and description */}
            <div className="text-center">
              <p className="text-xs font-medium">{theme.label}</p>
              <p className="text-[10px] text-muted-foreground">{theme.description}</p>
            </div>
          </button>
        ))}
      </div>
      
      {/* Current theme info */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
        <p className="text-xs text-muted-foreground">
          Current theme: <span className="font-medium text-foreground">
            {themes.find(t => t.name === activeWorkspace.theme)?.label || 'Default'}
          </span>
        </p>
      </div>
    </div>
  );
}

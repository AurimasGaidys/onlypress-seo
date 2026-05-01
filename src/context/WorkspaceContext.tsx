// src/context/WorkspaceContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useUserAgencies } from '@/hooks/useUserAgencies';
import { usePersonalAgency } from '@/hooks/usePersonalAgency';

export type Workspace = {
  id: string | null;
  type: 'user' | 'agency';
  name: string;
  theme?: string;
  pendingInvite?: boolean;
  inviteDate?: string;
};

interface WorkspaceContextType {
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspace: Workspace) => void;
  availableWorkspaces: Workspace[];
  isLoading: boolean;
  activeClientId: string | null;
  activeProjectId: string | null;
  setActiveClientId: (clientId: string | null) => void;
  setActiveProjectId: (projectId: string | null) => void;
  isAgencyWorkspace: boolean;

}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Myspace deprecated – this is only used as a fallback before user selects an agency
const PERSONAL_WORKSPACE: Workspace = { id: null, type: 'user', name: 'Select Agency', theme: 'default' };

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { agencies, loading: agenciesLoading } = useUserAgencies();
  const { personalClientId, personalProjectId, isSetupComplete } = usePersonalAgency();

  // Funkcija gauti išsaugotą workspace'ą iš localStorage
  const getStoredWorkspace = (): Workspace => {
    if (typeof window === 'undefined') return PERSONAL_WORKSPACE;
    try {
      const stored = localStorage.getItem('activeWorkspace');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Tikriname ar validi struktūra
        if (parsed && (parsed.type === 'user' || parsed.type === 'agency')) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading workspace from localStorage:', error);
    }
    return PERSONAL_WORKSPACE;
  };

  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace>(getStoredWorkspace());
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Wrapper funkcija kuri atnaujina state ir localStorage
  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('activeWorkspace', JSON.stringify(workspace));
      } catch (error) {
        console.error('Error saving workspace to localStorage:', error);
      }
    }
  };

  const availableWorkspaces: Workspace[] = [
    PERSONAL_WORKSPACE,
    ...agencies.map(a => ({
      id: a.id,
      type: 'agency' as const,
      name: a.name,
      theme: a.theme || 'default',
    }))
  ];

  // Auto-set personal client/project when in personal workspace
  useEffect(() => {
    if (activeWorkspace.type === 'user' && isSetupComplete) {
      setActiveClientId(personalClientId);
      setActiveProjectId(personalProjectId);
    } else if (activeWorkspace.type === 'agency') {
      // Clear personal IDs when switching to agency
      setActiveClientId(null);
      setActiveProjectId(null);
    }
  }, [activeWorkspace.type, isSetupComplete, personalClientId, personalProjectId]);

  // --- PRADĖTI PAKEITIMĄ ČIA ---
  // ŠIS useEffect BLOKAS YRA SPRENDIMAS
  useEffect(() => {
    // 1. Jei aktyvi aplinka yra agentūra...
    if (activeWorkspace.type === 'agency' && activeWorkspace.id) {
      // 2. Surandame atnaujintą tos agentūros versiją `availableWorkspaces` sąraše
      //    (kuris gauna naujausius duomenis iš `useUserAgencies`)
      const updatedWorkspaceData = availableWorkspaces.find(ws => ws.id === activeWorkspace.id);

      // 3. Jei radome ir jos duomenys (pvz., tema) skiriasi nuo dabartinių...
      if (updatedWorkspaceData && updatedWorkspaceData.theme !== activeWorkspace.theme) {
        // 4. Atnaujiname `activeWorkspace` būseną su naujausiais duomenimis!
        console.log('Updating workspace theme from', activeWorkspace.theme, 'to', updatedWorkspaceData.theme);
        setActiveWorkspace(updatedWorkspaceData);
      }
    }
  }, [agencies]); // Tik priklausome nuo `agencies` - kai jie pasikeičia, tikriname ar reikia atnaujinti
  // --- PAKEITIMO PABAIGA ---

  // NAUJAS EFFECT: Tikrina ar išsaugota agentūra dar egzistuoja
  useEffect(() => {
    if (activeWorkspace.type === 'agency' && activeWorkspace.id && !agenciesLoading) {
      const workspaceExists = availableWorkspaces.some(ws => ws.id === activeWorkspace.id);

      // Jei agentūra nebeegzistuoja (buvo ištrinta), grįžtame į personal space
      if (!workspaceExists) {
        console.log('Selected agency no longer exists, switching to personal space');
        setActiveWorkspace(PERSONAL_WORKSPACE);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('activeWorkspace');
        }
      }
    }
  }, [activeWorkspace.id, availableWorkspaces, agenciesLoading]);

  // Šis efektas, pritaikantis temą, jau yra teisingas, bet jis veikė su pasenusiais duomenimis.
  // Dabar jis veiks teisingai, nes `activeWorkspace.theme` bus atnaujintas.
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.forEach(className => {
      if (className.startsWith('theme-')) {
        root.classList.remove(className);
      }
    });

    const themeToApply = activeWorkspace.theme;
    if (themeToApply && themeToApply !== 'default') {
      root.classList.add(`theme-${themeToApply}`);
    }
  }, [activeWorkspace.theme]);

  const isAgencyWorkspace = activeWorkspace.type === 'agency';

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspace,
      setActiveWorkspace,
      availableWorkspaces,
      isLoading: agenciesLoading,
      activeClientId,
      activeProjectId,
      setActiveClientId,
      setActiveProjectId,
      isAgencyWorkspace
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

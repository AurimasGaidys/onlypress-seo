// src/context/MeContext/MeContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserPublic, UserPrivate } from '@/types/user';
import { useDocumentData } from '@/hooks/useDocumentData';

interface MeContextType {
  userPublic: UserPublic | null;
  userPrivate: UserPrivate | null;
  loading: boolean;
}

const MeContext = createContext<MeContextType | undefined>(undefined);

export function MeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const { data: userPublic, loading: publicLoading } = useDocumentData<UserPublic>('users', user?.uid);
  const { data: userPrivate, loading: privateLoading } = useDocumentData<UserPrivate>('users-private', user?.uid);

  const value = {
    userPublic,
    userPrivate,
    loading: publicLoading || privateLoading,
  };

  return (
    <MeContext.Provider value={value}>
      {children}
    </MeContext.Provider>
  );
}

export const useMe = () => {
  const context = useContext(MeContext);
  if (context === undefined) {
    throw new Error('useMe must be used within a MeProvider');
  }
  return context;
};

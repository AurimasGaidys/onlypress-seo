'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  isFocusMode: boolean;
  setFocusMode: (isFocused: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isFocusMode, setFocusMode] = useState(false);

  return (
    <UIContext.Provider value={{ isFocusMode, setFocusMode }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type EditorTab = 'editor' | 'image' | 'images' | 'publish' | 'history' | 'seo';

interface EditorTabContextType {
    activeTab: EditorTab;
    setActiveTab: (tab: EditorTab) => void;
}

const EditorTabContext = createContext<EditorTabContextType | undefined>(undefined);

export function EditorTabProvider({ children }: { children: ReactNode }) {
    const [activeTab, setActiveTab] = useState<EditorTab>('editor');

    return (
        <EditorTabContext.Provider value={{ activeTab, setActiveTab }}>
            {children}
        </EditorTabContext.Provider>
    );
}

export function useEditorTab() {
    const context = useContext(EditorTabContext);
    if (context === undefined) {
        throw new Error('useEditorTab must be used within an EditorTabProvider');
    }
    return context;
}

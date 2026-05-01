'use client';

import { Zap, Globe, History, Upload, Settings } from 'lucide-react';
import EditorMenuTabsWizard from './tabMenu/tabWizard';

interface EditorMenuTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLoadVersions: () => void;
    menuVersion: 'menu0' | 'menu1' | 'menu2';
}

export default function EditorMenuTabs({ activeTab, setActiveTab, onLoadVersions, menuVersion }: EditorMenuTabsProps) {

    const handleHistoryClick = () => {
        setActiveTab('history');
        onLoadVersions();
    };

    if (menuVersion === 'menu1') {
        // Menu2 version - different styling and layout
        return <EditorMenuTabsWizard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLoadVersions={onLoadVersions}
            menuVersion={'menu0'}
        />;
    }

    if (menuVersion === 'menu2') {
        // Menu2 version - different styling and layout
        return (
            <div className="flex border-b bg-gradient-to-r from-background to-muted/20">
                <button
                    onClick={() => setActiveTab('editor')}
                    className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'editor'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                >
                    <Zap className="h-5 w-5" />
                    <span>Editor</span>
                </button>

                <button
                    onClick={() => setActiveTab('image')}
                    className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'image'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                >
                    <Upload className="h-5 w-5" />
                    <span>Image</span>
                </button>

                <button
                    onClick={() => setActiveTab('seo')}
                    className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'seo'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                >
                    <Settings className="h-5 w-5" />
                    <span>SEO & Metadata</span>
                </button>

                <button
                    onClick={() => setActiveTab('publish')}
                    className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'publish'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                >
                    <Globe className="h-5 w-5" />
                    <span>Publish</span>
                </button>

                <button
                    onClick={handleHistoryClick}
                    className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'history'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                >
                    <History className="h-5 w-5" />
                    <span>History</span>
                </button>
            </div>
        );
    }

    // Menu1 version - original styling (default)
    return (
        <div className="flex border-b bg-background">
            <button
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'editor'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <Zap className="h-4 w-4" /> Editor
            </button>

            <button
                onClick={() => setActiveTab('image')}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'image'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <Upload className="h-4 w-4" /> Image
            </button>

            <button
                onClick={() => setActiveTab('seo')}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'seo'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <Settings className="h-4 w-4" /> SEO & Metadata
            </button>

            <button
                onClick={() => setActiveTab('publish')}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'publish'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <Globe className="h-4 w-4" /> Publish
            </button>

            <button
                onClick={handleHistoryClick}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'history'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <History className="h-4 w-4" /> History
            </button>
        </div>
    );
}

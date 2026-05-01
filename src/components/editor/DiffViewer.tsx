import React, { useMemo } from 'react';
import * as Diff from 'diff';
import { cn } from '@/lib/utils';

interface DiffViewerProps {
    oldContent: string;
    newContent: string;
    className?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldContent, newContent, className }) => {
    const diff = useMemo(() => {
        // Strip HTML tags for cleaner text diff
        const stripHtml = (html: string) => {
            const tmp = document.createElement('DIV');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        };

        const oldText = stripHtml(oldContent);
        const newText = stripHtml(newContent);

        return Diff.diffWords(oldText, newText);
    }, [oldContent, newContent]);

    return (
        <div className={cn("font-mono text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded-md border", className)}>
            {diff.map((part, index) => {
                const color = part.added ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    part.removed ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 line-through decoration-red-500' :
                        'text-muted-foreground';

                return (
                    <span key={index} className={cn("px-0.5 rounded-sm", color)}>
                        {part.value}
                    </span>
                );
            })}
        </div>
    );
};

export default DiffViewer;

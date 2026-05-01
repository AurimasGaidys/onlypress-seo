import { FileText } from 'lucide-react';
import { useState, useRef, KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArticleDocument } from '@/types/document';

export const EditorTitle: React.FC<{
    document: ArticleDocument;
    // title: string;
    // onTitleChange: (newTitle: string) => void;
}> = ({ document }) => {

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editableTitle, setEditableTitle] = useState(document.title);

    const handleTitleSave = async () => {
        setIsEditingTitle(false);
        if (!document || !editableTitle.trim() || editableTitle === document.title) {
            return;
        }
        try {
            const docRef = doc(db, 'documents', document.id);
            await updateDoc(docRef, {
                title: editableTitle.trim(),
                lastEdited: serverTimestamp(),
            });
            toast.success("Document title updated.");
        } catch {
            toast.error("Failed to update title.");
            setEditableTitle(document.title);
        }
    };

    const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleTitleSave();
        else if (e.key === 'Escape') {
            setEditableTitle(document?.title || '');
            setIsEditingTitle(false);
        }
    };

    return (<div className="flex-shrink-0 p-4 border-b">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-6 w-6 text-muted-foreground" />
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={editableTitle}
                        onChange={(e) => setEditableTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={handleTitleKeyDown}
                        className="text-2xl font-bold bg-transparent border-0 ring-0 focus:ring-0 outline-none w-full"
                        autoFocus
                    />
                ) : (
                    <h1
                        className="text-2xl font-bold truncate cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2"
                        title="Click to edit title"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        {document.title}
                    </h1>
                )}
            </div>
            {/* <div className="flex-shrink-0 flex items-center gap-2">
                    <DocumentActions
                      document={document}
                      scheduleInfo={scheduleInfo}
                      isScheduleLoading={isScheduleLoading}
                    />
                  </div> */}
        </div>
    </div>);
}

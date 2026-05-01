'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArticleDocument } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface SeoMetadataPanelProps {
    documentId: string;
    document: ArticleDocument;
}

export default function SeoMetadataPanel({ documentId, document }: SeoMetadataPanelProps) {
    const [seoTitle, setSeoTitle] = useState(document.metadata?.seoTitle || '');
    const [seoDescription, setSeoDescription] = useState(document.metadata?.seoDescription || '');
    const [isSaving, setIsSaving] = useState(false);

    // Update local state when document changes (e.g. initial load)
    useEffect(() => {
        if (document.metadata) {
            setSeoTitle(document.metadata.seoTitle || '');
            setSeoDescription(document.metadata.seoDescription || '');
        }
    }, [document.metadata]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const docRef = doc(db, 'documents', documentId);
            await updateDoc(docRef, {
                'metadata.seoTitle': seoTitle,
                'metadata.seoDescription': seoDescription,
            });
            toast.success('SEO metadata saved successfully');
        } catch (error) {
            console.error('Error saving metadata:', error);
            toast.error('Failed to save metadata');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 w-full space-y-8 h-full overflow-y-auto">
            <div>
                <h3 className="text-lg font-semibold mb-1">SEO & Metadata</h3>
                <p className="text-sm text-muted-foreground">
                    Configure how your article appears in search results and social media.
                </p>
            </div>

            <div className="space-y-6">
                {/* Meta Title */}
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <Label htmlFor="seoTitle">Meta Title</Label>
                        <span className={`text-xs ${seoTitle.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {seoTitle.length}/60
                        </span>
                    </div>
                    <Input
                        id="seoTitle"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder="Enter meta title..."
                    />
                    <p className="text-xs text-muted-foreground">
                        Recommended length: 50-60 characters.
                    </p>
                </div>

                {/* Meta Description */}
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <Label htmlFor="seoDescription">Meta Description</Label>
                        <span className={`text-xs ${seoDescription.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {seoDescription.length}/160
                        </span>
                    </div>
                    <Textarea
                        id="seoDescription"
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder="Enter meta description..."
                        rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                        Recommended length: 150-160 characters.
                    </p>
                </div>

                <div className="pt-4">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

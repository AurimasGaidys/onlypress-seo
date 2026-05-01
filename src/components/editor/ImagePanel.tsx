'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArticleDocument } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { ImagePicker } from '../ui/imagePicker';
import { useAuth } from '@/context/AuthContext';

interface ImagePanelProps {
    documentId: string;
    document: ArticleDocument;
}

export default function ImagePanel({ documentId, document }: ImagePanelProps) {
    const [featuredImage, setFeaturedImage] = useState(document.metadata?.featuredImage || '');
    const [customInstructions, setCustomInstructions] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const { user } = useAuth();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMount = useRef(true);

    // Update local state when document changes (e.g. initial load)
    useEffect(() => {
        if (document.metadata) {
            setFeaturedImage(document.metadata.featuredImage || '');
        }
    }, [document.metadata]);

    // Auto-save when featuredImage changes (with debouncing)
    useEffect(() => {
        // Skip auto-save on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set a new timeout for auto-saving (debounce for 1 second)
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const docRef = doc(db, 'documents', documentId);
                await updateDoc(docRef, {
                    'metadata.featuredImage': featuredImage,
                });
                toast.success('Featured image saved automatically');
            } catch (error) {
                console.error('Error auto-saving featured image:', error);
                toast.error('Failed to auto-save featured image');
            }
        }, 1000);

        // Cleanup timeout on unmount
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [featuredImage, documentId]);

    interface handleGenetateImageProps {
        customInstructions: string;
    }

    const handleGenetateImage = async ({ customInstructions }: handleGenetateImageProps) => {
        setIsSaving(true);
        console.log('handleGenerateImages called with:', customInstructions);

        if (!user) {
            toast.error("You must be logged in to generate images.");
            setIsSaving(false);
            return;
        }

        try {
            const idToken = await user.getIdToken();
            toast.info("Generating prompts for images...");

            // 1. Generate prompts
            const promptsResponse = await fetch('/api/god-mode/generate-prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken,
                    headings: [{ id: "featuredImage", text: document.title }],
                    content: document.content,
                    customInstructions,
                }),
            });
            const promptsData = await promptsResponse.json();
            if (!promptsResponse.ok) throw new Error(promptsData.error || "Failed to generate prompts.");

            toast.info("Prompts generated. Now creating images...");
            console.log('Generated prompts:', promptsData);

            // 2. Generate images
            const imagesResponse = await fetch('/api/god-mode/generate-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, prompts: promptsData }),
            });
            const imagesData = await imagesResponse.json();

            if (!imagesResponse.ok && imagesResponse.status !== 207) { // 207 is Multi-Status for partial success
                console.error('Images generation error data:', imagesData);
                throw new Error(imagesData.error || "Failed to generate images.");
            }

            //3. Insert images
            console.error('+++++ Images generated and inserted:', imagesData);
            setFeaturedImage(imagesData?.["featuredImage"].imageUrl);


            toast.success("Images generated successfully!");
        } catch (error) {
            toast.error("Image generation failed", { description: error instanceof Error ? error.message : "Unknown error" });
        } finally {
            setIsSaving(false);
        }

    };

    return (
        <div className="p-6 w-full space-y-8 h-full overflow-y-auto">
            {featuredImage && (
                <div 
                    className={`rounded-lg border bg-muted overflow-hidden flex-shrink-0 relative cursor-pointer transition-all group ${
                        isImageExpanded ? 'w-full' : 'w-[200px]'
                    }`}
                    onClick={() => setIsImageExpanded(!isImageExpanded)}
                    title="Click to toggle size"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={featuredImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    {!isImageExpanded && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                            <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn className="h-6 w-6 text-gray-800" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div>
                <h3 className="text-lg font-semibold mb-1">Upload Featured Image</h3>
                <p className="text-sm text-muted-foreground">
                    Set the main image for your article. This image will be used in previews and when sharing.
                </p>
            </div>

            <div className="space-y-6">
                {/* Featured Image */}
                <div className="space-y-3">
                    <Label htmlFor="featuredImage">Featured Image URL</Label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1">
                            <div className="relative">
                                {featuredImage ?
                                    <div className="w-full h-4" style={{ height: '2rem' }} />
                                    :
                                    <div />
                                }

                                <ImagePicker
                                    uploadLocation="public-releases"
                                    value={featuredImage}
                                    onChange={(url: string) => setFeaturedImage(url)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Enter the URL of the image you want to feature, or upload a new image.
                            </p>
                        </div>
                    </div>
                </div>



                <div>
                    <h3 className="text-lg font-semibold mb-1">Generate Featured Image with AI</h3>
                    <p className="text-sm text-muted-foreground">
                        Use AI to generate a unique featured image based on your article content.
                    </p>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="customInstructions">Additional Instructions (Optional)</Label>
                    <Textarea
                        id="customInstructions"
                        placeholder="Add any specific instructions for the image generation, e.g., 'Include a modern office setting' or 'Use blue and green colors'..."
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        rows={3}
                        className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        Provide additional context or style preferences to guide the AI image generation.
                    </p>
                </div>

                <Button onClick={() => { handleGenetateImage({ customInstructions }) }} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Working...
                        </>
                    ) : (
                        <>
                            Generate Image
                        </>
                    )}
                </Button>

            </div>
        </div >
    );
}

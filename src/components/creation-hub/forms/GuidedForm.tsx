// src/components/creation-hub/forms/GuidedForm.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function GuidedForm() {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    const handleStart = async () => {
        if (!user) return toast.error("You must be logged in.");
        if (!topic.trim()) return toast.error("Please enter a topic.");

        setIsLoading(true);
        try {
            const batch = writeBatch(db);

            // 1. Sukuriamas pagrindinis dokumentas
            const newDocRef = doc(collection(db, 'documents'));
            batch.set(newDocRef, {
                title: topic.trim(),
                content: '', // Pradžioje turinys tuščias
                snippet: 'New document created with AI assistant...',
                userId: user.uid,
                folderId: null,
                createdAt: serverTimestamp(),
                lastEdited: serverTimestamp(),
                status: 'draft',
            });

            // 2. Sukuriamas pokalbio metaduomenų įrašas
            const metaRef = doc(db, `documents/${newDocRef.id}/conversation/metadata`);
            batch.set(metaRef, {
                chatPhase: 'GREETING', // Pradedame nuo pasisveikinimo
                blueprint: { topic: topic.trim() },
                lastUpdatedAt: serverTimestamp(),
            });

            // 3. Įrašoma pirmoji AI žinutė
            const messagesCollectionRef = collection(metaRef, 'messages');
            const initialMessageRef = doc(messagesCollectionRef);
            batch.set(initialMessageRef, {
                role: 'assistant',
                content: 'Sveiki! Aš – jūsų Co-pilot. Pasirinkote temą. Dabar pasiūlysiu straipsnio tipus.', // Atnaujinta pirmoji žinutė
                timestamp: serverTimestamp(),
            });

            // 4. Vykdoma transakcija
            await batch.commit();

            // 5. Nukreipiamas vartotojas
            router.push(`/docs/${newDocRef.id}`);

        } catch (error) {
            toast.error("Failed to create new document session.");
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <div className="text-center">
                <h3 className="text-xl font-semibold">Start with a Topic</h3>
                <p className="text-muted-foreground">The AI assistant will help you build the article from here.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="guided-topic">Article Topic</Label>
                <Input id="guided-topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., The Future of Space Exploration" />
            </div>
            {/* Čia ateityje galima pridėti failo įkėlimą */}
            <Button onClick={handleStart} disabled={isLoading || !topic.trim()} className="w-full">
                {isLoading ? "Creating..." : "Start Writing"}
            </Button>
        </div>
    );
}

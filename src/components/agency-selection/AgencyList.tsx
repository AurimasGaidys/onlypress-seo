'use client';

import { Workspace } from '@/context/WorkspaceContext';
import { AgencyItem } from './AgencyItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AgencyListProps {
    agencies: Workspace[];
    onSelect: (agency: Workspace) => void;
}

export function AgencyList({ agencies, onSelect }: AgencyListProps) {
    const { user } = useAuth();
      const router = useRouter();
    const [accepting, setIsAccepting] = useState(false);

    if (agencies.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No agencies found.
            </div>
        );
    }

    const handleAcceptInvite = async (agencyId: string) => {
        if (!user) return;

        setIsAccepting(true);

        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/agency/accept-existing-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken,
                    agencyId,
                    email: user.email
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                if (response.status === 404) {
                    toast.error("Invitation not found or has expired");
                } else if (response.status === 409) {
                    toast.error("You're already a member of this agency");
                } else {
                    throw new Error(data.error);
                }
                return;
            }

            toast.success("You have successfully joined the agency! Redirecting...");

            // Nukreipiame į agency puslapį po sėkmingo priėmimo
            setTimeout(() => {
                router.push(`/agency/${agencyId}`);
            }, 2000);

        } catch (error) {
            toast.error("Failed to accept invitation", {
                description: error instanceof Error ? error.message : "Unknown error"
            });
        } finally {
            setIsAccepting(false);
        }
    };

    const handleInvite = (agency: Workspace) => {
        // Handle invite logic here
        console.log('Handle invite for agency:', agency.name);
        handleAcceptInvite(agency.id || '');
    }

    return (
        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
                {agencies.map((agency) => (
                    <AgencyItem
                        key={agency.id}
                        agency={agency}
                        onClick={agency.pendingInvite ? handleInvite : onSelect}
                        disabled={accepting}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}

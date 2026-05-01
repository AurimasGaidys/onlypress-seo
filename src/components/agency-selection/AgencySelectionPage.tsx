'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace, Workspace } from '@/context/WorkspaceContext';
import { useUserAgencies } from '@/hooks/useUserAgencies';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { AgencySelectionHeader } from './AgencySelectionHeader';
import { AgencyList } from './AgencyList';
import CreateAgencyDialog from '@/components/agency/CreateAgencyDialog';
import { useMe } from '@/context/MeContext/MeContext';
import { PendingInvite } from '@/types/user';
import moment from 'moment';

export function AgencySelectionPage() {
    const router = useRouter();
    const { setActiveWorkspace } = useWorkspace();
    const { userPrivate } = useMe();
    const { agencies, loading } = useUserAgencies();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Define Personal Workspace
    // const personalWorkspace: Workspace = {
    //     id: 'personal',
    //     type: 'user',
    //     name: 'My Space',
    //     theme: 'default'
    // };

    //todoaaa
    // userPrivate.
    console.log('User Private Data:', userPrivate);
    const pendingInvites: PendingInvite[] = userPrivate?.pendingInvites || [];

    // Combine personal workspace with agencies
    const allWorkspaces: Workspace[] = [
        ...agencies.map(agency => ({
            id: agency.id,
            type: 'agency' as const,
            name: agency.name,
            theme: agency.theme || 'default',
            pendingInvite: false,
        })),
        ...pendingInvites.map(invite => ({
            id: invite.agencyId,
            type: 'agency' as const,
            name: "Invited to " + invite.name,
            theme: 'default',
            pendingInvite: true,
            inviteDate: moment(invite.invitedAt).toISOString(),
        }))
    ];

    const handleSelectAgency = (agency: Workspace) => {
        setActiveWorkspace(agency);
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzkzOTZiNSIgZmlsbC1vcGFjaXR5PSIwLjAzIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPgo8L2c+CjwvZz4KPHN2Zz4K')] opacity-40 pointer-events-none" />

            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl relative z-10">
                <CardContent className="p-8">
                    <AgencySelectionHeader />

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <AgencyList
                                agencies={allWorkspaces}
                                onSelect={handleSelectAgency}
                            />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white/50 dark:bg-slate-800/50 px-3 text-muted-foreground backdrop-blur-sm">
                                        Or
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full border-dashed border-2 h-12 hover:border-primary hover:text-primary transition-colors"
                                onClick={() => setIsCreateDialogOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Agency
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateAgencyDialog
                isOpen={isCreateDialogOpen}
                setIsOpen={setIsCreateDialogOpen}
            />
        </div>
    );
}

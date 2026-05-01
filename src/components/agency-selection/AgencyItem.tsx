'use client';

import { Building2, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Workspace } from '@/context/WorkspaceContext';
import { useState } from 'react';

interface AgencyItemProps {
    agency: Workspace;
    onClick: (agency: Workspace) => void;
    pendingInvite?: boolean;
    disabled?: boolean;
}

export function AgencyItem({ agency, onClick, disabled }: AgencyItemProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isInvite = agency.pendingInvite == true;
    
    const handleClick = () => {
        setIsLoading(true);
        onClick(agency);
    };
    
    return (
        <button
            disabled={disabled || isLoading}
            onClick={handleClick}
            className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl",
                "bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80",
                "border border-slate-200 dark:border-slate-700",
                "transition-all duration-200 group",
                "hover:shadow-md hover:scale-[1.01]",
                (disabled || isLoading) && "opacity-50 cursor-not-allowed"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
                    "transition-colors duration-200"
                )}>
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isInvite ? (
                        <AlertTriangle className="w-5 h-5" />
                    ) : (
                        <Building2 className="w-5 h-5" />
                    )}
                </div>
                <div className="text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {agency.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isInvite ? "Pending INVITE, press here to accept" : "ID: " + agency.id}
                    </p>
                </div>
            </div>
            {isLoading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
            )}
        </button>
    );
}

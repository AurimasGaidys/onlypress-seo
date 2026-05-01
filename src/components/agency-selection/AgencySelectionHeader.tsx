'use client';

import { Building2 } from 'lucide-react';

export function AgencySelectionHeader() {
    return (
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Select Agency
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
                Choose an agency to continue to your dashboard
            </p>
        </div>
    );
}

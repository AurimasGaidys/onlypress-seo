// src/app/(app)/layout.tsx
'use client';

import React from 'react';
import withAuth from '@/components/auth/withAuth';
import { MeProvider } from '@/context/MeContext/MeContext'; // Add this import

function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <MeProvider>
            {children}
        </MeProvider>
    );
}

export default withAuth(AppLayout);
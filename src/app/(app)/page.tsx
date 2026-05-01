// src/app/(app)/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function HomePage() {
  const { activeWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    // Laukiame, kol pasikraus workspace informacija
    if (workspaceLoading) return;

    // Redirect to the correct home page based on workspace type
    // console.log("++++++++> aaaa", isAgencyWorkspace, activeWorkspace.type)

    if (activeWorkspace.type === 'user') {
      // Myspace deprecated – redirect to agency selection
      router.replace('/agency-select');
    } else if (activeWorkspace.type === 'agency' && activeWorkspace.id) {
      // PAKEITIMAS: Nukreipiame į konkrečios agentūros dashboard, kaip prašyta.
      router.replace(`/agency/${activeWorkspace.id}`);
    }
  }, [activeWorkspace, workspaceLoading, router]);

  // Kol kraunasi informacija arba vyksta nukreipimas, rodome krovimo indikatorių
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

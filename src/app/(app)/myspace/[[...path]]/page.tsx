// Catch-all redirect: myspace is deprecated, redirect to agency-select
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MySpaceCatchAllRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/agency-select');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

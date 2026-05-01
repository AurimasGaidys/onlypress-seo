// src/components/shared-pages/PortalsPage.tsx
import PortalsBrowser from '@/components/portals/PortalsBrowser';
import { Globe } from 'lucide-react';

export default function PortalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-muted rounded-lg">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Portals</h1>
          <p className="text-muted-foreground">Browse and discover partner portals for publication.</p>
        </div>
      </div>
      <PortalsBrowser />
    </div>
  );
}

// src/components/portals/PortalsBrowser.tsx
'use client';

import { useState, useMemo } from 'react';
import { usePortals } from '@/hooks/usePortals';
import { Loader2, AlertCircle, Search, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PortalCard from './PortalCard';

export default function PortalsBrowser() {
  const { portals, userCredit, loading, error } = usePortals();
  const [searchTerm, setSearchTerm] = useState('');

  // Debug logging to help identify data issues
  console.log('PortalsBrowser - portals data:', portals);
  console.log('PortalsBrowser - userCredit:', userCredit);
  console.log('PortalsBrowser - loading:', loading);
  console.log('PortalsBrowser - error:', error);

  const filteredPortals = useMemo(() => {
    if (!searchTerm) {
      return portals;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return portals.filter(portal => 
      portal.title?.toLowerCase().includes(lowercasedTerm) ||
      portal.description?.toLowerCase().includes(lowercasedTerm)
    );
  }, [portals, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="font-semibold text-destructive">Failed to load portals</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Credit Display */}
      <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Available Credit</p>
            <p className="text-xs text-muted-foreground">Use this balance to publish content</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {userCredit} EUR
        </Badge>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search portals by name, description, or category..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPortals.map(portal => (
          <PortalCard key={portal.id} portal={portal} />
        ))}
      </div>

      {/* No Results State */}
      {filteredPortals.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-medium">No portals found</p>
          <p className="text-sm">Try adjusting your search term.</p>
        </div>
      )}

      {/* Results Count */}
      {filteredPortals.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredPortals.length} of {portals.length} portals
        </div>
      )}
    </div>
  );
}

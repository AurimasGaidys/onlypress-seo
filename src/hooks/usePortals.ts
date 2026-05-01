// src/hooks/usePortals.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { PortalPublic } from '@/types/portalPublic';

interface PortalsResponse {
  success: boolean;
  portals: PortalPublic[];
  userCredit: number;
  error?: string;
}

export const usePortals = () => {
  const { user } = useAuth();
  const [portals, setPortals] = useState<PortalPublic[]>([]);
  const [userCredit, setUserCredit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortals = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/portals/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data: PortalsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch portals.');
      }

      setPortals(data.portals);
      setUserCredit(data.userCredit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error('Error fetching portals', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPortals();
  }, [fetchPortals]);

  return { portals, userCredit, loading, error, refetch: fetchPortals };
};

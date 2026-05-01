'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface PersonalAgencyInfo {
  personalAgencyId: string;
  personalClientId: string;
  personalProjectId: string;
  isSetupComplete: boolean;
  isLoading: boolean;
  setupPersonalAgency: () => Promise<void>;
  checkPersonalAgency: () => Promise<void>;
}

export function usePersonalAgency(): PersonalAgencyInfo {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<{
    personalAgencyId: string;
    personalClientId: string;
    personalProjectId: string;
    isSetupComplete: boolean;
  } | null>(null);

  const userId = user?.uid;
  const personalAgencyId = userId ? `personal_${userId}` : null;
  const personalClientId = personalAgencyId ? `${personalAgencyId}_default_client` : null;
  const personalProjectId = personalAgencyId ? `${personalAgencyId}_default_project` : null;

  // Check if personal agency exists
  const checkPersonalAgency = async () => {
    if (!userId || !personalAgencyId) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/personal-setup', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalInfo(data);
      }
    } catch (error) {
      console.error('Error checking personal agency:', error);
    }
  };

  // Setup personal agency
  const setupPersonalAgency = async () => {
    if (!userId || !personalAgencyId) return;

    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/personal-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalInfo({
          personalAgencyId: data.personalAgencyId,
          personalClientId: data.personalClientId,
          personalProjectId: data.personalProjectId,
          isSetupComplete: true,
        });
        console.log('Personal agency setup completed:', data);
      } else {
        throw new Error('Failed to setup personal agency');
      }
    } catch (error) {
      console.error('Error setting up personal agency:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-check personal agency when user loads
  useEffect(() => {
    if (userId) {
      checkPersonalAgency();
    }
  }, [userId]);

  // Auto-setup if personal agency exists but not complete
  useEffect(() => {
    if (userId && personalInfo && !personalInfo.isSetupComplete) {
      setupPersonalAgency();
    }
  }, [userId, personalInfo]);

  return {
    personalAgencyId: personalInfo?.personalAgencyId || personalAgencyId || '',
    personalClientId: personalInfo?.personalClientId || personalClientId || '',
    personalProjectId: personalInfo?.personalProjectId || personalProjectId || '',
    isSetupComplete: personalInfo?.isSetupComplete || false,
    isLoading,
    setupPersonalAgency,
    checkPersonalAgency,
  };
}

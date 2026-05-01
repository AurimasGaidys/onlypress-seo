// src/context/customPriceContext/CustomPriceContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CustomPrice, CustomPriceInput, AuditLogEntry } from '@/types/customPrice';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { usePortalsContext } from '../portalContext/usePortalsContext';

interface CustomPriceContextType {
  customPrices: CustomPrice[];
  loading: boolean;
  error: string | null;
  getCustomPrice: (portalId: string) => CustomPrice | undefined;
  setCustomPrice: (input: CustomPriceInput) => Promise<void>;
  deleteCustomPrice: (portalId: string) => Promise<void>;
  refreshPrices: () => void;
}

const CustomPriceContext = createContext<CustomPriceContextType | undefined>(undefined);

export function CustomPriceProvider({ children }: { children: ReactNode }) {
  const [customPrices, setCustomPrices] = useState<CustomPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { portals } = usePortalsContext();

  // Reload prices when workspace changes
  useEffect(() => {
    if (!activeWorkspace.id) {
      setCustomPrices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const customPricesRef = collection(db, 'portal-custom-prices');
    const q = query(customPricesRef, where('workspaceId', '==', activeWorkspace.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const prices: CustomPrice[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          prices.push({
            id: doc.id,
            portalId: data.portalId,
            workspaceId: data.workspaceId,
            price: data.price,
            approvedByPortal: data.approvedByPortal ?? false,
            newPrice: data.newPrice || 9999,
            auditLog: data.auditLog || [],
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        });
        setCustomPrices(prices);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching custom prices:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeWorkspace.id]);

  const getCustomPrice = (portalId: string): CustomPrice | undefined => {
    return customPrices.find((price) => price.portalId === portalId);
  };

  const setCustomPrice = async (input: CustomPriceInput): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to set custom prices');
    }

    const existingPrice = customPrices.find((p) => p.portalId === input.portalId);
    const portal = portals.find(p => p.id === input.portalId);

    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId: user.uid,
      userName: user.displayName || user.email || 'Unknown',
      action: existingPrice ? 'updated' : 'created',
      oldValue: portal ? portal.price : 999,
      newValue: input.price,
      note: input.note || 'Price updated',
    };

    try {
      if (existingPrice) {
        // Update existing price - set as pending approval
        const priceRef = doc(db, 'portal-custom-prices', existingPrice.id);
        await updateDoc(priceRef, {
          newPrice: input.price || 999,
          approvedByPortal: false,
          auditLog: [...existingPrice.auditLog, auditEntry],
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new price - pending approval
        const customPricesRef = collection(db, 'portal-custom-prices');
        await addDoc(customPricesRef, {
          portalId: input.portalId,
          workspaceId: input.workspaceId,
          price: portal?.price || 0, // Keep original price
          newPrice: input.price, // Store new price pending approval
          approvedByPortal: false,
          auditLog: [auditEntry],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (err) {
      console.error('Error setting custom price:', err);
      throw err;
    }
  };

  const deleteCustomPrice = async (portalId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to delete custom prices');
    }

    const existingPrice = customPrices.find((p) => p.portalId === portalId);
    if (!existingPrice) {
      throw new Error('Custom price not found');
    }

    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId: user.uid,
      userName: user.displayName || user.email || 'Unknown',
      action: 'deleted',
      oldValue: existingPrice.price,
    };

    try {
      const priceRef = doc(db, 'portal-custom-prices', existingPrice.id);
      await updateDoc(priceRef, {
        auditLog: [...existingPrice.auditLog, auditEntry],
        deletedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error deleting custom price:', err);
      throw err;
    }
  };

  const refreshPrices = () => {
    // Firestore listener handles this automatically, but we can force a re-fetch if needed
    setLoading(true);
  };

  return (
    <CustomPriceContext.Provider
      value={{
        customPrices,
        loading,
        error,
        getCustomPrice,
        setCustomPrice,
        deleteCustomPrice,
        refreshPrices,
      }}
    >
      {children}
    </CustomPriceContext.Provider>
  );
}

export function useCustomPricesContext() {
  const context = useContext(CustomPriceContext);
  if (context === undefined) {
    throw new Error('useCustomPrices must be used within a CustomPriceProvider');
  }
  return context;
}

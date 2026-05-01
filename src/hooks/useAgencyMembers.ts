// src/hooks/useAgencyMembers.ts
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { DatabaseTables } from '@/lib/constants/databaseTables';
import { AgencyPrivate } from '@/types/agencyPrivate';

interface Member { 
  uid: string; 
  email: string; 
  displayName: string;
  role: 'admin' | 'member'; 
}

interface PendingInvite {
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  invitedAt: string;
  existingUser?: boolean;
  tempUserId?: string;
}

export const useAgencyMembers = (agencyId: string) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !agencyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const agencyRef = doc(db, DatabaseTables.agencyPrivate, agencyId);
    let unsubscribeUsers: (() => void) | null = null;

    const unsubscribeAgency = onSnapshot(agencyRef, async (docSnap) => {
      if (docSnap.exists()) {
        const agencyData = { id: docSnap.id, ...docSnap.data() } as AgencyPrivate;
        
        // Saugumo patikra: ar vartotojas priklauso šiai agentūrai?
        if (!agencyData.members || !agencyData.members[user.uid]) {
          setError("You do not have permission to view this agency.");
          setMembers([]);
          setPendingInvites([]);
          setLoading(false);
          return;
        }

        // Extract pending invites
        const invites: PendingInvite[] = [];
        if (agencyData.pendingInvites) {
          Object.values(agencyData.pendingInvites).forEach(invite => {
            console.log("Found pending invite:", Object.values(invite)?.[0] );
            invites.push(invite);
          });
        }
        setPendingInvites(invites);
        
        // Gauname narių informaciją su real-time atnaujinimais
        const memberIds = Object.keys(agencyData.members);
        if (memberIds.length > 0) {
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where(documentId(), 'in', memberIds));
            unsubscribeUsers = onSnapshot(q, (usersSnap) => {
              const memberDetails = usersSnap.docs.map(userDoc => {
                const userData = userDoc.data();
                return {
                  uid: userDoc.id,
                  email: userData.email || 'No email',
                  displayName: userData.displayName || '',
                  role: agencyData.members[userDoc.id],
                };
              });
              setMembers(memberDetails);
              setLoading(false);
            }, (err) => {
              console.error('Error listening to members:', err);
              setError('Failed to load members');
              setLoading(false);
            });
          } catch (error) {
            console.error('Error setting up members listener:', error);
            setError('Failed to load members');
            setMembers([]);
            setLoading(false);
            unsubscribeUsers = null;
          }
        } else {
          setMembers([]);
          setLoading(false);
          unsubscribeUsers = null;
        }
      } else {
        setError("Agency not found.4123");
        setMembers([]);
        setPendingInvites([]);
        setLoading(false);
      }
    }, (err) => {
      setError("Failed to load agency data.");
      console.error(err);
      setLoading(false);
    });

    return () => {
      unsubscribeAgency();
      if (unsubscribeUsers) {
        unsubscribeUsers();
      }
    };
  }, [agencyId, user?.uid]);

  return { members, pendingInvites, loading, error };
};

// src/hooks/useAgencyData.ts
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, documentId, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ArticleDocument } from '@/types/document';
import { AgencyMember } from '@/types/agencyMember';
import { DatabaseTables } from '@/lib/constants/databaseTables';
import { AgencyPrivate } from '@/types/agencyPrivate';

// Tipai duomenims apibrėžti

interface Client { 
  id: string; 
  name: string; 
}

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  clientId: string;
  agencyId: string;
  createdAt: Date;
}

export const useAgencyData = (agencyId: string) => {
  const { user } = useAuth();
  const [agency, setAgency] = useState<AgencyPrivate | null>(null);
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<ArticleDocument[]>([]);
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
          setAgency(null);
          setMembers([]);
          setDocuments([]);
          setLoading(false);
          return;
        }
        
        setAgency(agencyData);

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
            }, (err) => {
              console.error('Error listening to members:', err);
            });
          } catch (error) {
            console.error('Error setting up members listener:', error);
            setMembers([]);
            unsubscribeUsers = null;
          }
        } else {
          setMembers([]);
          unsubscribeUsers = null;
        }
      } else {
        setError("Agency not found.532");
        setAgency(null);
        setMembers([]);
        setDocuments([]);
      }
      setLoading(false);
    }, (err) => {
      setError("Failed to load agency data.");
      console.error(err);
      setLoading(false);
    });

    // Gauname klientų informaciją
    const clientsQuery = query(collection(db, 'clients'), where('agencyId', '==', agencyId));
    const unsubscribeClients = onSnapshot(clientsQuery, (querySnap) => {
      const clientData = querySnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Client));
      setClients(clientData);
    }, (err) => {
      console.error('Error fetching clients:', err);
    });

    // Gauname visų agency projektų informaciją
    const projectsQuery = query(collection(db, 'projects'), where('agencyId', '==', agencyId));
    const unsubscribeProjects = onSnapshot(projectsQuery, (querySnap) => {
      const projectData = querySnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Project));
      setProjects(projectData);
    }, (err) => {
      console.error('Error fetching projects:', err);
    });

    // Gauname visų agency dokumentų informaciją
    const documentsQuery = query(
      collection(db, 'documents'), 
      where('agencyId', '==', agencyId),
      orderBy('lastEdited', 'desc')
    );
    const unsubscribeDocuments = onSnapshot(documentsQuery, (querySnap) => {
      const documentData = querySnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ArticleDocument));
      setDocuments(documentData);
    }, (err) => {
      console.error('Error fetching documents:', err);
    });

    return () => {
      unsubscribeAgency();
      unsubscribeClients();
      unsubscribeProjects();
      unsubscribeDocuments();
      if (unsubscribeUsers) {
        unsubscribeUsers();
      }
    };
  }, [agencyId, user?.uid]);

  return { agency, members, clients, projects, documents, loading, error };
};

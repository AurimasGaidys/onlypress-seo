import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AgenticSession, AgentMessage } from '@/types/agentic-generation';
import { toast } from 'sonner';

export function useAgenticGeneration() {
  const [session, setSession] = useState<AgenticSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [user] = useAuthState(auth);

  // Start a new agentic generation session
  const startGeneration = async (topic: string, context?: { agencyId?: string }) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/agentic-generation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          topic,
          context: context || {}
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start generation');
      }

      // Start polling for session updates
      if (data.sessionId) {
        subscribeToSession(data.sessionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Update session with user actions
  const updateSession = async (payload: Partial<AgenticSession>) => {
    if (!user || !session) {
      setError('User not authenticated or no active session');
      return;
    }

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/agentic-generation/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          sessionId: session.id,
          payload
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const saveDocument = async () => {
    if (!user || !session?.id) return toast.error("Session not found or user not authenticated.");
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agentic-generation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, sessionId: session.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("Document saved successfully! Redirecting...");
      router.push(`/docs/${data.newDocumentId}`);

    } catch (error) {
      toast.error("Failed to save document", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to session updates
  const subscribeToSession = (sessionId: string) => {
    const sessionRef = doc(db, 'agentic_sessions', sessionId);

    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const sessionData = docSnap.data();

        // Convert Firestore Timestamps to Dates
        const convertedSession: AgenticSession = {
          ...sessionData,
          id: docSnap.id,
          createdAt: sessionData.createdAt?.toDate() || new Date(),
          updatedAt: sessionData.updatedAt?.toDate() || new Date(),
          chatHistory: sessionData.chatHistory?.map((msg: AgentMessage) => ({
            ...msg,
            timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : (msg.timestamp || new Date())
          })) || []
        } as AgenticSession;

        setSession(convertedSession);
      } else {
        setError('Session not found');
        setSession(null);
      }
    }, (err) => {
      console.error('Session subscription error:', err);
      setError('Failed to load session');
    });

    return unsubscribe;
  };

  // Grąžinkite naują funkciją
  return { session, isLoading, startGeneration, updateSession, saveDocument };
}

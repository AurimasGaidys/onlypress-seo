// src/hooks/useConversation.ts
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  ConversationMessage,
  ConversationMetadata,
  DEFAULT_CONVERSATION_METADATA,
} from '@/types/conversation';

export const useConversation = (documentId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [metadata, setMetadata] = useState<ConversationMetadata>(DEFAULT_CONVERSATION_METADATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !documentId) {
      setLoading(false);
      return;
    }

    // Klausomės metaduomenų
    const metaRef = doc(db, `documents/${documentId}/conversation/metadata`);
    const unsubscribeMeta = onSnapshot(metaRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<ConversationMetadata>;
        setMetadata({ ...DEFAULT_CONVERSATION_METADATA, ...data });
      } else {
        setMetadata(DEFAULT_CONVERSATION_METADATA);
      }
    });

    // Klausomės žinučių
    const messagesRef = collection(db, `documents/${documentId}/conversation/metadata/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as ConversationMessage[];

      setMessages(msgs);
      setLoading(false);
    });

    return () => {
      unsubscribeMeta();
      unsubscribeMessages();
    };
  }, [documentId, user]);

  return { messages, metadata, loading };
};

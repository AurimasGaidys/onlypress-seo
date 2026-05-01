import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DEFAULT_CONVERSATION_METADATA } from '@/types/conversation';
import { withErrorLogging } from '@/lib/errorLogger';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { MESSAGES } from '@/lib/constants/messages';

const clearChatSchema = z.object({
  idToken: z.string(),
  documentId: z.string(),
});

export const POST = withErrorLogging(async (req: NextRequest): Promise<NextResponse> => {
  // Rate limiting check
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('clearChat', clientIp);
  
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse() as NextResponse;
  }

  const body = await req.json();
  const validationResult = clearChatSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json({ error: MESSAGES.errors.validationError, details: validationResult.error.format() }, { status: 400 });
  }

  const { idToken, documentId } = validationResult.data;
  let uid: string;

  // 1. Patvirtiname vartotojo tapatybę
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    uid = decodedToken.uid;
  } catch (error) {
    return NextResponse.json({ error: MESSAGES.errors.authenticationFailed }, { status: 401 });
  }

  // 2. Saugumo patikra: ar vartotojas yra dokumento savininkas?
  const documentRef = adminDb.doc(`documents/${documentId}`);
  const documentSnap = await documentRef.get();

  const docData = documentSnap.data();
  if (!documentSnap.exists || !docData || docData.userId !== uid) {
    return NextResponse.json({ error: MESSAGES.errors.permissionDenied }, { status: 403 });
  }

  // 3. Ištriname visas žinutes ir atstatome metaduomenis
  const messagesRef = documentRef.collection('conversation').doc('metadata').collection('messages');
  const metadataRef = documentRef.collection('conversation').doc('metadata');

  // Gauname visas žinutes, kurias reikia ištrinti
  const messagesSnapshot = await messagesRef.get();

  const batch = adminDb.batch();

  // Pridedame kiekvienos žinutės ištrynimą į batch'ą
  messagesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Atstatome pokalbio būseną į pradinę
  batch.set(metadataRef, {
      ...DEFAULT_CONVERSATION_METADATA,
      chatPhase: 'GREETING',
      blueprint: { ...DEFAULT_CONVERSATION_METADATA.blueprint },
      lastUpdatedAt: FieldValue.serverTimestamp(),
  });

  // Pridedame pradinę pasisveikinimo žinutę po išvalymo
  const initialMessageRef = messagesRef.doc();
  batch.set(initialMessageRef, {
      role: 'assistant',
      content: 'Sveiki! Aš – jūsų Co-pilot. Įveskite temą, kad pradėtume iš naujo.',
      timestamp: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return NextResponse.json({ success: true, message: MESSAGES.success.contentUpdated });
}, { endpoint: 'clear-chat', operation: 'POST' });

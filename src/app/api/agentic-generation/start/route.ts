import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { runAgenticProcess } from '@/lib/agentic-process';

export async function POST(req: NextRequest) {
  try {
    const { idToken, topic, context } = await req.json();
    const user = await adminAuth.verifyIdToken(idToken);

    const newSessionRef = adminDb.collection('agentic_sessions').doc();
    const sessionData = {
      userId: user.uid,
      agencyId: context?.agencyId || null,
      topic,
      status: 'initializing',
      chatHistory: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await newSessionRef.set(sessionData);

    // Paleidžiame pagrindinį procesą fone ir iškart grąžiname atsakymą.
    // Nenaudojame `await`, kad vartotojui nereikėtų laukti.
    runAgenticProcess(newSessionRef.id).catch(console.error);

    return NextResponse.json({ success: true, sessionId: newSessionRef.id });
  } catch (error) {
    console.error("Agentic start error:", error);
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 });
  }
}

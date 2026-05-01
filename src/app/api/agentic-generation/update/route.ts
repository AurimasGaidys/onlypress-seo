import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { runAgenticProcess } from '@/lib/agentic-process';

export async function POST(req: NextRequest) {
  try {
    const { idToken, sessionId, payload } = await req.json();
    await adminAuth.verifyIdToken(idToken); // Saugumo patikra

    const sessionRef = adminDb.doc(`agentic_sessions/${sessionId}`);
    await sessionRef.update({
      ...payload,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Gavus vartotojo veiksmą (pvz., pasirinkus pavadinimą), pratęsiame procesą.
    runAgenticProcess(sessionId).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Agentic update error:", error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

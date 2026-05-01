// src/app/api/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth } from '@/lib/firebase-admin';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { MESSAGES } from '@/lib/constants/messages';

const publishSchema = z.object({
  idToken: z.string(),
  documentId: z.string(),
  portalIds: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = checkRateLimit('publish', clientIp);
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse();
    }

    const body = await req.json();
    const validationResult = publishSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: MESSAGES.errors.validationError, details: validationResult.error.format() }, { status: 400 });
    }

    const { idToken, documentId, portalIds } = validationResult.data;

    // 1. Vartotojo autentifikacija
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: MESSAGES.errors.authenticationFailed }, { status: 401 });
    }

    // TODO: Ateityje čia bus sudėtinga logika:
    // 1. Gauti dokumento turinį iš Firestore pagal `documentId`.
    // 2. Kiekvienam `portalId` iš `portalIds`:
    //    a. Gauti portalo prisijungimo duomenis (API raktus).
    //    b. Prisijungti prie WordPress per REST API.
    //    c. Sukurti naują post'ą su dokumento turiniu.
    // 3. Atnaujinti dokumento statusą Firestore (pvz., į 'published').

    console.log(`Publishing document ${documentId} to portals: ${portalIds.join(', ')}`);

    // Dabar tiesiog simuliuojame sėkmę
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simuliuojame tinklo delsą

    return NextResponse.json({ success: true, message: MESSAGES.success.published });

  } catch (error) {
    const message = error instanceof Error ? error.message : MESSAGES.errors.operationFailed;
    return NextResponse.json({ error: MESSAGES.errors.publishFailed + ". " + message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { GoogleGenAI } from '@google/genai';
import { logAIResult } from '@/lib/api/ai-usage-logger';

// PATAISYMAS: Nebekuriame kliento čia, modulio viršuje.

/**
 * POST /api/documents/rewrite-for-portal
 * Pergeneruoja straipsnį konkretčiam portalui naudojant AI.
 */
export async function POST(request: NextRequest) {
  try {
    // PATAISYMAS PRASIDEDA ČIA: Saugus API rakto patikrinimas ir kliento inicializavimas funkcijos viduje
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_API_KEY environment variable is not set.');
      return NextResponse.json(
        { success: false, error: 'AI service is not configured on the server.' },
        { status: 500 }
      );
    }
    const genAI = new GoogleGenAI({ apiKey });
    // PATAISYMO PABAIGA

    const body = await request.json();
    const { idToken, documentId, portalId } = body;

    // ========== 1. AUTHENTICATION ==========
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // ========== 2. VALIDATION ==========
    if (!documentId || !portalId) {
      return NextResponse.json(
        { success: false, error: 'Missing documentId or portalId' },
        { status: 400 }
      );
    }

    // ========== 3. GET DOCUMENT ==========
    const docRef = adminDb.collection('documents').doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    const document = docSnap.data();

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document data is missing' },
        { status: 404 }
      );
    }

    if (document.userId !== userId && document.agencyId) {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.agencies?.[document.agencyId]) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    const originalContent = document.content || '';
    const originalTitle = document.title || '';

    // ========== 4. GET PORTAL INFO ==========
    const portalRef = adminDb.collection('portals').doc(portalId);
    const portalSnap = await portalRef.get();

    if (!portalSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Portal not found' },
        { status: 404 }
      );
    }

    const portal = portalSnap.data();

    if (!portal) {
      return NextResponse.json(
        { success: false, error: 'Portal data is missing' },
        { status: 404 }
      );
    }

    const portalTitle = portal.title || portal.name || 'Unknown Portal';
    const portalDomain = portal.domain || portal.url || '';
    const portalPrice = portal.price || 0;

    // ========== 5. UPDATE STATUS TO "GENERATING" ==========
    await docRef.update({
      [`publishVariants.${portalId}.status`]: 'generating',
      [`publishVariants.${portalId}.portalId`]: portalId,
      [`publishVariants.${portalId}.portalTitle`]: portalTitle,
      [`publishVariants.${portalId}.portalDomain`]: portalDomain,
      [`publishVariants.${portalId}.price`]: portalPrice,
      updatedAt: Date.now(),
    });

    // ========== 6. BUILD AI PROMPT ==========
    const weDoNotPublish = portal.weDoNotPublishThemes || 'Nėra apribojimų';
    const allowedTopics = portal.possiblePublicationsInTopics?.join(', ') || 'Visos temos';

    const systemPrompt = `Tu esi profesionalus SEO turinio kūrėjas ir redaktorius, kuris pritaiko straipsnius skirtingiems Lietuvos naujienų portalams.

**PORTALO INFORMACIJA:**
- Pavadinimas: ${portalTitle}
- Domain: ${portalDomain}
- Kategorijos: ${portal.categories?.join(', ') || 'Bendros naujienos'}
- Negalimos temos: ${weDoNotPublish}
- Leidžiamos temos: ${allowedTopics}

**TAVO UŽDUOTIS:**
Perrašyti žemiau pateiktą straipsnį taip, kad jis būtų **optimaliai pritaikytas ${portalTitle} portalui**.

**KRITINĖS TAISYKLĖS:**
1. **Išlaikyk pagrindinę temą** - turinys turi būti apie tą patį dalyką
2. **Pritaikyk toną ir stilių** - ${portalTitle} auditorija ir kalbos stilius
3. **Išlaikyk HTML struktūrą** - visus <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong> tagus
4. **SEO optimizacija** - išlaikyk raktažodžius, meta informaciją
5. **Unikialumas** - tekstas turi būti kitoks nei originalas, bet ta pačia tema
6. **Vengkite plagijavimo** - parašyk savo žodžiais, nepamirškite temų
7. **Žodžių kiekis** - panašus kaip originalas (±10%)
8. **Nepamiršk pradinės prasmės** - visa svarbi informacija turi išlikti

**LIETUVIŠKOS KALBOS TAISYKLĖS:**
- Rašyk taisyklingai lietuvių kalba
- Vengkite tiesioginių anglicizmų
- Laikykis lietuviškų žurnalistinių standartų

ORIGINALUS STRAIPSNIS:
Pavadinimas: ${originalTitle}

Turinys:
${originalContent}

**ATSAKYMAS:**
Grąžink tik pergeneruotą HTML turinį. NEREIKIA jokių papildomų paaiškinimų, tik HTML.`;

    // ========== 7. CALL GOOGLE GEMINI API ==========
    // const model = genAI.getGenerativeModel({ 
    //   model: process.env.GEMINI_MODEL || "gemini-flash-latest",
    //   safetySettings: [
    //     { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    //     { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    //     { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    //     { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    //   ],
    // });

    const portalModelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
    const result = await genAI.models.generateContent({
      model: portalModelName,
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
    });
    await logAIResult({ userId: userId, endpoint: 'rewrite-for-portal/content', model: portalModelName, result });

    const rewrittenContent = result?.text || '';

    // ========== 8. GENERATE NEW TITLE (optional) ==========
    const titleResult = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      contents: [{
        role: "user",
        parts: [{ text: `Sugeneruok naują, patrauklų straipsnio pavadinimą portalui "${portalTitle}", kuris atitiktų šį turinį:\n\n${rewrittenContent.substring(0, 500)}...\n\nTAISYKLĖS:\n- Pavadinimas turi būti lietuvių kalba\n- Maksimalus ilgis: 80 simbolių\n- Turi būti patrauklus ir SEO optimizuotas\n- Grąžink TIK pavadinimą, be jokių papildomų žodžių\n\nOriginalus pavadinimas buvo: "${originalTitle}"` }]
      }]
    });


    await logAIResult({ userId: userId, endpoint: 'rewrite-for-portal/title', model: portalModelName, result: titleResult });
    const rewrittenTitle = titleResult?.text?.trim() || originalTitle;

    // ========== 9. SAVE TO FIRESTORE ==========
    await docRef.update({
      [`publishVariants.${portalId}.content`]: rewrittenContent,
      [`publishVariants.${portalId}.title`]: rewrittenTitle,
      [`publishVariants.${portalId}.status`]: 'generated',
      [`publishVariants.${portalId}.generatedAt`]: Date.now(),
      updatedAt: Date.now(),
    });

    // ========== 10. RETURN SUCCESS ==========
    return NextResponse.json({
      success: true,
      rewrittenContent,
      rewrittenTitle,
      portalTitle,
      portalDomain,
    });

  } catch (error) {
    // PATAISYMAS: Išsamės klaidų registravimas
    console.error('Full error object in /api/documents/rewrite-for-portal:', error);

    try {
      const body = await request.json().catch(() => ({}));
      if (body.documentId && body.portalId) {
        await adminDb.collection('documents').doc(body.documentId).update({
          [`publishVariants.${body.portalId}.status`]: 'failed',
          [`publishVariants.${body.portalId}.error`]: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: Date.now(),
        });
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to rewrite article',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

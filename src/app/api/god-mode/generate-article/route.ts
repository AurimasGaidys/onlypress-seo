// src/app/api/god-mode/generate-article/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { welcomeMessageContent } from '@/lib/constants/messages';
import { AdvancedFormData } from '../../../../types/god-mode';
import { checkRateLimit, createRateLimitResponse } from '../../../../lib/rateLimiter';
import { sanitizeJsonOutput } from '@/lib/conversation/utils';
import { genAI } from '@/lib/api/genAI';
import { logAIResult } from '@/lib/api/ai-usage-logger';

const godModeSchema = z.object({
  idToken: z.string(),
  formData: z.any(),
  agencyId: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  scheduledDate: z.string().optional(),
});

// Pagalbinės funkcijos, nukopijuotos iš veikiančio /api/generate-article
function generateSnippet(htmlContent: string): string {
  const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
}

function countWords(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]*>/g, ' ').trim();
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function buildUnifiedPrompt(payload: AdvancedFormData): string {
  const backlinkInstruction = payload.backlinks && payload.backlinks.length > 0 ?
    `NATURALLY INTEGRATE LINKS: Include natural links to ${payload.backlinks.join(', ')} in the article content where it makes contextual sense.` :
    '';

  const faqInstruction = payload.addFAQ ? 'At the end of the article, add a concise FAQ section with 3-4 relevant questions and answers, formatted with <h2> for the "FAQ" title and <h3> for each question.' : '';

  return `
    You are an elite SEO content writer. Your task is to write an advanced, high-quality, SEO-optimized article in HTML format based on the user's precise specifications.

    USER SPECIFICATIONS:
    - TOPIC: "${payload.topic}"
    - ARTICLE TITLE: "${payload.seoTitle}"
    - TARGET KEYWORDS: ${payload.targetKeywords.join(', ')}
    - WORD COUNT: Approximately ${payload.wordCount} words
    - TONE: ${payload.tone}
    - STRUCTURE: ${payload.articleStructure}
    - CUSTOM INSTRUCTIONS: ${payload.customInstructions || 'None'}
    - ${faqInstruction}
    - ${backlinkInstruction}

    CRITICAL REQUIREMENTS:
    1.  Adhere strictly to all user specifications.
    2.  The final output must be ONLY the raw HTML content of the article body.
    3.  DO NOT include an <h1> tag for the main title; the system will add it. Start with the first paragraph or an <h2> tag.
    4.  Use proper heading hierarchy (<h2>, <h3>, etc.) based on the 'STRUCTURE' parameter.
    5.  Integrate keywords naturally.
    6.  The content must be authoritative and engaging.
    7.  Do NOT include \`\`\`html, <html>, or <body> tags. Your response must be pure HTML content.

    GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.
  `;
}

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('godMode', clientIp);

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse();
  }

  try {
    const body = await req.json();
    const { idToken, formData, agencyId, clientId, projectId, scheduledDate } = godModeSchema.parse(body);

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const generationData = formData as AdvancedFormData;

    // === UNIFIKUOTA LOGIKA: GENERAVIMAS IR IŠSAUGOJIMAS VIENAME ŽINGSNYJE ===

    // 1. Sukonstruojame vieną didelį prompt'ą
    const prompt = buildUnifiedPrompt(generationData);

    // 2. Atliekame VIENĄ API iškvietimą
      const result = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      });
    
      await logAIResult({ userId: uid, endpoint: 'god-mode/generate-article', model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp", result });
      const generatedHtml = sanitizeJsonOutput(result.text || '');

    if (!generatedHtml || generatedHtml.length < 100) {
      throw new Error("AI returned invalid or too short article content.");
    }

    const documentTitle = generationData.seoTitle || generationData.topic;
    const fullHtmlWithTitle = `${generatedHtml}`;

    // 3. IŠKART IŠSAUGOME DOKUMENTĄ DUOMENŲ BAZĖJE
    const docData = {
      title: documentTitle,
      content: fullHtmlWithTitle,
      metaTitle: generationData.metaTitle || documentTitle,
      metaDescription: generationData.seoDescription || generateSnippet(fullHtmlWithTitle),
      snippet: generateSnippet(fullHtmlWithTitle),
      wordCount: countWords(fullHtmlWithTitle),
      userId: uid,
      agencyId: agencyId || null,
      clientId: clientId || null,
      projectId: projectId || null,
      folderId: null,
      createdAt: FieldValue.serverTimestamp(),
      lastEdited: FieldValue.serverTimestamp(),
      status: 'draft',
    };

    const newDocRef = adminDb.collection('documents').doc();
    await newDocRef.set(docData);

    // ŠABLONAS: Naudok šį kodą po to, kai gauni 'newDocRef'
    const conversationMetaRef = newDocRef.collection('conversation').doc('metadata');
    const messagesRef = conversationMetaRef.collection('messages');

    const initialMessage = {
        role: 'assistant',
        content: welcomeMessageContent, // Naudojame tekstą iš 1 žingsnio
        timestamp: FieldValue.serverTimestamp(),
        withTypingEffect: true
    };

    // Įrašome pradinę pokalbio būseną ir pačią žinutę
    await adminDb.batch()
        .set(conversationMetaRef, { chatPhase: 'INTERACTIVE_REFINEMENT', lastUpdatedAt: FieldValue.serverTimestamp() })
        .set(messagesRef.doc(), initialMessage)
        .commit();

    const newDocumentId = newDocRef.id;

    // --- AUTOMATINIO PLANAVIMO LOGIKA ---
    if (scheduledDate && agencyId && clientId && projectId) {
      try {
        // Nukopijuojame "Smart Time-Slotting" logiką iš /api/agency/schedule-document
        const [year, month, day] = scheduledDate.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        
        const query = adminDb.collection('schedules')
            .where('agencyId', '==', agencyId)
            .where('scheduledAt', '>=', Timestamp.fromDate(startOfDay))
            .where('scheduledAt', '<=', Timestamp.fromDate(endOfDay));

        const snapshot = await query.orderBy('scheduledAt', 'desc').get();
        
        const projectSchedules = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.projectId === projectId;
        });

        let newScheduledTime: Date;
        if (projectSchedules.length === 0) {
            newScheduledTime = new Date(startOfDay);
            newScheduledTime.setUTCHours(8, 0, 0, 0);
        } else {
            const latestScheduleData = projectSchedules[0].data();
            const latestTime = latestScheduleData.scheduledAt.toDate();
            newScheduledTime = new Date(latestTime.getTime() + 4 * 60 * 60 * 1000); // Numatytasis intervalas
        }

        const newScheduleRef = adminDb.collection('schedules').doc();
        await newScheduleRef.set({
            documentId: newDocumentId,
            agencyId: agencyId,
            clientId: clientId,
            projectId: projectId,
            scheduledAt: Timestamp.fromDate(newScheduledTime),
            status: 'scheduled',
            createdAt: FieldValue.serverTimestamp(),
            createdBy: uid,
        });

        // Atnaujiname ir patį dokumentą, kad būtų 'scheduled'
        await newDocRef.update({ status: 'scheduled' });
        console.log(`Document ${newDocumentId} automatically scheduled for ${scheduledDate}`);

      } catch (scheduleError) {
        // Jei planavimas nepavyksta, tęsiame toliau, bet išvedame klaidą
        console.error(`Automatic scheduling failed for document ${newDocumentId}:`, scheduleError);
      }
    }
    // --- PABAIGA ---

    // 4. GRĄŽINAME SĖKMĖS ATSAKYMĄ SU NAUJO DOKUMENTO ID
    return NextResponse.json({
      success: true,
      newDocumentId: newDocumentId,
      // Grąžiname ir HTML, kad frontend'as galėtų iškart atnaujinti vaizdą
      generatedHtml: fullHtmlWithTitle
    });

  } catch (error) {
    console.error("God Mode article generation error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: `Failed to generate article. ${message}` }, { status: 500 });
  }
}

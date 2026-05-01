// src/app/api/regenerate-article/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from "@google/genai";
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore'; // <-- PRIDĖTI
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { logAIResult } from '@/lib/api/ai-usage-logger';

// Zod schema for regeneration payload
const advancedModeSchema = z.object({
  topic: z.string().min(1),
  targetKeywords: z.array(z.string()),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  backlinkUrl: z.string().optional(), // Nors UI jo nenaudosime, palikime suderinamumui
  tone: z.string().min(1),
  wordCount: z.number().min(100).max(2000),
  structure: z.object({ // Taip pat paliekame, kad atitiktų seną API
    introduction: z.boolean(),
    conclusion: z.boolean(),
    bulletPoints: z.boolean(),
  }),
  customInstructions: z.string().optional(),
});

const regenerateSchema = z.object({
  idToken: z.string(),
  documentId: z.string(),
  payload: advancedModeSchema,
});

// Helper functions (copy from generate-article/route.ts)
function buildAdvancedPrompt(payload: z.infer<typeof advancedModeSchema>): string {
  const structureText = [];
  if (payload.structure.introduction) structureText.push('introduction');
  if (payload.structure.bulletPoints) structureText.push('bullet points/lists');
  if (payload.structure.conclusion) structureText.push('conclusion');

  const backlinkInstruction = payload.backlinkUrl ?
    `NATURALLY INTEGRATE A LINK: Include one natural link to ${payload.backlinkUrl} in article content where it makes contextual sense. Make it flow naturally with content.` :
    '';

  return `
        Write an advanced SEO-optimized article in HTML format with following specifications:

        TOPIC: "${payload.topic}"
        TITLE: "${payload.seoTitle || payload.topic}"
        KEYWORDS: ${payload.targetKeywords.join(', ')}
        WORD COUNT: ${payload.wordCount}
        TONE: ${payload.tone}
        STRUCTURE REQUIREMENTS: ${structureText.join(', ')}
        ${backlinkInstruction}
        CUSTOM INSTRUCTIONS: ${payload.customInstructions || 'None'}

        REQUIREMENTS:
        - High-quality, authoritative content
        - Natural keyword integration throughout
        - Strategic internal linking structure.
        - Start immediately with HTML content. Do NOT include <h1> or <h2> tags for main title, as it's already displayed on the page. Use <h2> and <h3> for article's subheadings.

        GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.

        FORMAT: Pure HTML content only, starting with a paragraph or <h2> tag.
    `;
}

function generateSnippet(htmlContent: string): string {
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
}

function countWords(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('regenerateArticle', clientIp);

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse();
  }

  try {
    const body = await req.json();
    // Išskiriame tokeną iš likusio body
    const { idToken } = body; // , ...payload 

    // Patikriname, ar tokenas egzistuoja
    if (!idToken) {
      return NextResponse.json({ error: 'Authentication token is required' }, { status: 401 });
    }

    // Verifikuojame tokeną
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const uid = decodedToken.uid; // Gauname patvirtinto vartotojo ID

    const validationResult = regenerateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.format() }, { status: 400 });
    }

    const { documentId, payload: regenPayload } = validationResult.data;

    // Initialize Gemini AI
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("API key not configured");
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Generate new content
    const prompt = buildAdvancedPrompt(regenPayload);
    const result = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    await logAIResult({ userId: uid, endpoint: 'regenerate-article', model: modelName, result });
    const newHtmlContent = result.text ?? '';

    if (!newHtmlContent || newHtmlContent.length < 100) {
      throw new Error("AI returned invalid or too short content.");
    }

    // Update existing document in Firestore
    const docRef = adminDb.collection('documents').doc(documentId);

    // Security check: ensure user owns document they are trying to update
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists || docSnapshot.data()?.userId !== uid) {
      return NextResponse.json({ error: "Permission denied or document not found." }, { status: 403 });
    }

    await docRef.update({
      title: regenPayload.seoTitle || regenPayload.topic,
      content: newHtmlContent,
      snippet: generateSnippet(newHtmlContent),
      wordCount: countWords(newHtmlContent),
      lastEdited: FieldValue.serverTimestamp(), // <-- PAKEITIMAS ČIA
    });

    return NextResponse.json({ success: true, message: 'Article regenerated successfully' });

  } catch (error) {
    console.error("Article regeneration error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to regenerate article. " + message }, { status: 500 });
  }
}

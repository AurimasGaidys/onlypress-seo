// src/app/api/generate-titles/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from '@/lib/firebase-admin';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { MESSAGES } from '@/lib/constants/messages';
import { logAIResult } from '@/lib/api/ai-usage-logger';

// Zod schema for input validation
const generateTitlesSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters").max(200, "Topic must be less than 200 characters"),
  idToken: z.string(),
});

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('generateTitles', clientIp);
  
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse() as NextResponse;
  }

  try {
    const body = await req.json();
    const validationResult = generateTitlesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: MESSAGES.errors.validationError, details: validationResult.error.format() }, { status: 400 });
    }

    const { idToken, ...payload } = validationResult.data;

    // Patikriname, ar tokenas egzistuoja
    if (!idToken) {
      return NextResponse.json({ error: MESSAGES.errors.authenticationRequired }, { status: 401 });
    }

    // Verifikuojame tokeną
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json({ error: MESSAGES.errors.authenticationFailed }, { status: 401 });
    }

    const uid = decodedToken.uid; // Gauname patvirtinto vartotojo ID

    const { topic } = payload;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: MESSAGES.errors.serverError }, { status: 500 });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    const prompt = `Generate 5 creative, engaging, and SEO-friendly article titles for topic: "${topic}". Return them as a valid JSON object with a single key "titles" which is an array of strings.

GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.

Example: {"titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]}`;

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    await logAIResult({ userId: uid, endpoint: 'generate-titles', model: modelName, result });
    const responseText = result.text || '';

    // --- START: Error resilience improvement ---
    try {
      const jsonString = responseText.replace(/```json|```/g, '').trim();
      const parsedResponse = JSON.parse(jsonString);

      // Additional check if response structure is correct
      if (!parsedResponse.titles || !Array.isArray(parsedResponse.titles)) {
        throw new Error("AI returned an invalid data structure, 'titles' array is missing.");
      }

      return NextResponse.json(parsedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText, parseError);
      return NextResponse.json({
        error: MESSAGES.errors.generationFailed
      }, { status: 500 });
    }
    // --- END: Error resilience improvement ---

  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json({ error: MESSAGES.errors.generationFailed }, { status: 500 });
  }
}

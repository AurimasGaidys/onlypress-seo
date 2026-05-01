import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from '@/lib/firebase-admin';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { MESSAGES } from '@/lib/constants/messages';
import { sanitizeJsonOutput } from "@/lib/conversation/utils";
import { genAI } from "@/lib/api/genAI";
import { logAIResult } from '@/lib/api/ai-usage-logger';

// Zod schema for input validation
const generateKeywordsSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters").max(200, "Topic must be less than 200 characters"),
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be less than 150 characters"),
  idToken: z.string(),
});

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('generateKeywords', clientIp);

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse() as NextResponse;
  }

  try {
    const body = await req.json();
    // Išskiriame tokeną iš likusio body
    const { idToken, ...payload } = body;

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

    console.log(`Reiks istrinti User ${uid} is generating keywords.`);
    const validationResult = generateKeywordsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: MESSAGES.errors.validationError, details: validationResult.error.format() }, { status: 400 });
    }

    const { topic, title } = payload;


    const prompt = `Generate exactly 10 of the best, most relevant and high-quality SEO keywords for an article with the topic "${topic}" and title "${title}". Keywords should be specific and SEO-optimized, including a mix of short-tail and long-tail phrases. Focus on keywords that have high search volume and are most relevant to the content. Return them as a valid JSON object with a single key "keywords" which is an array of exactly 10 strings. Example: {"keywords": ["Keyword 1", "Keyword 2", "Long tail keyword phrase", "Another keyword", "5th keyword", "6th keyword", "7th keyword", "8th keyword", "9th keyword", "10th keyword"]}`;

    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    await logAIResult({ userId: uid, endpoint: 'generate-keywords', model: modelName, result });

    const correctedText = sanitizeJsonOutput(result.text || '');

    try {
      const jsonString = correctedText.replace(/```json|```/g, '').trim();
      const parsedResponse = JSON.parse(jsonString);

      if (!parsedResponse.keywords || !Array.isArray(parsedResponse.keywords)) {
        throw new Error("AI returned an invalid data structure, 'keywords' array is missing.");
      }

      return NextResponse.json(parsedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", result.text, parseError);
      return NextResponse.json({
        error: MESSAGES.errors.generationFailed
      }, { status: 500 });
    }

  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json({ error: MESSAGES.errors.generationFailed }, { status: 500 });
  }
}

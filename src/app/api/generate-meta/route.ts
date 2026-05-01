import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from '@/lib/firebase-admin';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { MESSAGES } from '@/lib/constants/messages';
import { sanitizeJsonOutput } from "@/lib/conversation/utils";
import { genAI } from "@/lib/api/genAI";
import { logAIResult } from '@/lib/api/ai-usage-logger';

// Zod schema for input validation
const generateMetaSchema = z.object({
  topic: z.string().min(3, "Topic must be at least3 characters").max(200, "Topic must be less than 200 characters"),
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be less than 150 characters"),
  keywords: z.array(z.string()).min(1, "At least one keyword is required").max(10, "Too many keywords"),
  idToken: z.string(),
});

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('generateMeta', clientIp);

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
    console.log(`Generating meta for user: ${uid}`);

    const validationResult = generateMetaSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: MESSAGES.errors.validationError, details: validationResult.error.format() }, { status: 400 });
    }

    const { topic, title, keywords } = payload;



    const prompt = `Generate SEO-optimized meta title (maximum 60 characters) and meta description (around 145-155 characters) for an article with:
Topic: "${topic}"
Title: "${title}"
Keywords: ${keywords.join(', ')}

The meta title should be compelling and include primary keywords.
The meta title must be 60 characters or less.
The meta description should incorporate some keywords naturally, be compelling, and encourage clicks.
The meta description must be under 155 characters total.

GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.

Return a valid JSON object with "metaTitle" and "metaDescription" keys. Example: {"metaTitle": "Best Title Here", "metaDescription": "Compelling description..."}`;

    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    await logAIResult({ userId: uid, endpoint: 'generate-meta', model: modelName, result });

    const correctedText = sanitizeJsonOutput(result.text || '');

    try {
      const jsonString = correctedText.replace(/```json|```/g, '').trim();
      const parsedResponse = JSON.parse(jsonString);

      if (!parsedResponse.metaTitle || !parsedResponse.metaDescription) {
        throw new Error("AI returned invalid data structure, missing metaTitle or metaDescription.");
      }

      // Ensure description is within limits
      let metaDescription = parsedResponse.metaDescription.trim();
      if (metaDescription.length > 155) {
        metaDescription = metaDescription.substring(0, 152) + "...";
      }

      return NextResponse.json({
        metaTitle: parsedResponse.metaTitle.replace(/[#\[\]*`]/g, '').substring(0, 60),
        metaDescription: metaDescription.replace(/[#\[\]*`]/g, '')
      });
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

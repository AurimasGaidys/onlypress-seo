import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { genAI } from '@/lib/api/genAI';
import { logAIUsage } from '@/lib/api/ai-usage-logger';

// Updated schema to match editor component expectations
const contextualEditSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  instruction: z.string().min(1, 'Instruction is required'),
  context: z.string(),
});

// Character-by-character streaming function for precise editing
async function streamPreciseEdit(
  controller: ReadableStreamDefaultController,
  text: string,
  instruction: string,
  context: string,
) {
  const encoder = new TextEncoder();

  try {
    // Enhanced prompt for surgical precision with context awareness
    const editPrompt = `JŪS - chirurgo lygio tekstoredaktorius su kraujagyslių tikslumu.

KONTEKSTAS VISAS TEKSTAS:
${context}

INSTRUKCIJA: ${instruction}
PAŽYMĖTAS TEKSTAS MODIFIKAVIMO TIKSLAI: ${text}

DUKLIOS INSTRUKCIJOS:
- MODIFIKUOTI TIK PAŽYMĖTĄ TEKSTĄ
- PALIKTI VISĄ KITĄ TEKSTĄ NEPAKEISTĄ
- ATSIŽVELGTI Į VISĄ TEKSTĄ KAIP KONTEKSTĄ
- IŠLAIKYTI ORIGINALŲ STILIŲ IR TONĄ
- GRĄŽINTI TIK MODIFIKUOTĄ TEKSTĄ BE KOMENTARŲ

GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.`;



    const result = await genAI.models.generateContentStream({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
      contents: [{
        role: 'user',
        parts: [{ text: editPrompt }]
      }]
    });

    let accumulatedText = '';

    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        // Send each character individually for smooth streaming
        const characters = chunkText.split('');
        for (const char of characters) {
          if (char.trim() || [' ', '\n'].includes(char)) { // Skip completely empty chunks but preserve whitespace
            accumulatedText += char;
            // STREAM EACH CHARACTER in real-time
            controller.enqueue(encoder.encode(JSON.stringify({
              type: "text",
              data: char,
              accumulated: accumulatedText
            }) + '\n'));
          }
        }
      }
    }

    // Log AI usage for streaming contextual edit
    const modelUsed = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
    await logAIUsage({
      userId: 'anonymous', // contextual-edit doesn't require auth
      endpoint: 'contextual-edit',
      model: modelUsed,
      outputTokens: Math.ceil(accumulatedText.length / 4),
    });

    // FINAL completion metadata
    controller.enqueue(encoder.encode(JSON.stringify({
      type: "complete",
      data: {
        finalText: accumulatedText.trim(),
        originalLength: text.length,
        newLength: accumulatedText.trim().length,
        surgerySuccess: true
      }
    }) + '\n'));

  } catch (error) {
    console.error("Surgical streaming edit error:", error);
    controller.enqueue(encoder.encode(JSON.stringify({
      type: "error",
      data: "Nepavyko atlikti chirurginio teksto redagavimo."
    }) + '\n'));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = contextualEditSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid request format',
        details: validationResult.error.format()
      }, { status: 400 });
    }

    const { text, instruction, context } = validationResult.data;

    // Get client IP for rate limiting (fallback to a default for server-side)
    const clientIp = req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      'anonymous';
    const rateLimitResult = checkRateLimit('contextualEdit', clientIp);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse();
    }

    // Initialize AI model
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    // SETUP STREAMING RESPONSE for character-by-character precision
    const stream = new ReadableStream({
      start(controller) {
        streamPreciseEdit(controller, text, instruction, context).finally(() => {
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });

  } catch (error) {
    console.error('API Surgical Edit error:', error);
    return NextResponse.json({
      error: `Chirurginis redagavimas nepavyko: ${error instanceof Error ? error.message : 'Nežinoma klaida'}`,
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { adminAuth } from '@/lib/firebase-admin';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { logAIResult } from '@/lib/api/ai-usage-logger';
import { z } from 'zod';

// Atnaujiname schemą, kad priimtų naują formatą
const generatePromptsSchema = z.object({
  idToken: z.string(),
  headings: z.array(z.object({ id: z.string(), text: z.string() })),
  content: z.string(),
  customInstructions: z.string().optional(), // <-- PRIDĖK ŠIĄ EILUTĘ
});

/**
 * Ištraukia tekstinį turinį iš skilties, esančios po nurodyta antrašte.
 * @param heading - Antraštės tekstas.
 * @param content - Visas HTML dokumento turinys.
 * @returns Iki 500 simbolių tekstinio turinio iš po antraštės.
 */
function extractSectionContent(heading: string, content: string): string {
  // Regex, kuris suranda turinį tarp <h2>...</h2> ir kito <h2> arba dokumento pabaigos.
  // `s` flag'as leidžia `.` atitikti naujos eilutės simbolius.
  const headingRegex = new RegExp(`<h2[^>]*>\\s*${heading.trim()}\\s*</h2>(.*?)(?=<h2|$)`, 'is');

  const match = content.match(headingRegex);

  if (match && match[1]) {
    // Išvalome HTML tag'us ir sutrumpiname
    return match[1].replace(/<[^>]*>/g, ' ').trim().substring(0, 500);
  }
  return '';
}

/**
 * Sukuria optimizuotą prompt'ą paveikslėlio generavimui pagal šabloną.
 * @param heading - Skilties antraštė.
 * @param sectionContent - Skilties tekstinis turinys.
 * @param articleTopic - Bendra straipsnio tema kontekstui.
 * @param customInstructions - Papildomi vartotojo nurodymai.
 * @returns Optimizuotas, trumpas prompt'as.
 */
function buildOptimizedPrompt(heading: string, sectionContent: string, articleTopic: string, customInstructions?: string): string {
  const instructions = customInstructions ? `\n\nAditional instructions : ${customInstructions}` : '';

  // Šablonas paimtas iš geriausių praktikų, pritaikytas naujienų stiliui
  const template = `
You are an expert Visual Director and AI Prompt Engineer specializing in photorealistic news imagery. Your task is to convert article context into a single, high-fidelity image prompt optimized for Google's Gemini model.

INPUT CONTEXT:
- Article Topic: "${articleTopic}"
- Section Heading: "${heading}"
- Section Content: "${sectionContent}"${instructions}

GUIDELINES FOR IMAGEN 4:
1.  **Subject Specificity**: Do not say "people" or "a worker." Be specific: "a middle-aged civil engineer in a high-vis vest" or "a tired nurse in blue scrubs."
2.  **Candid vs. Posed**: The image must look like a **candid news capture**, not a staged stock photo. The subject should not be looking directly at the camera unless specified.
3.  **Lighting & Atmosphere**: This is the most important part. Define the light source (e.g., "soft morning window light," "harsh fluorescent office overheads," "golden hour sun").
4.  **Technical Aesthetics**: Include camera keywords to force realism: "4k," "highly detailed," "shallow depth of field," "f/2.8 aperture," "raw photo style."

PROMPT FORMULA (Follow this structure):
[Detailed Subject] + [Engaging in specific action] + [Detailed Environment] + [Lighting Condition] + [Camera/Style specific].

CONSTRAINTS:
-   **No text** inside the image.
-   **No abstract metaphors** (e.g., do not describe "a graph growing on a tree"). Visualize the *real-world consequence* of the topic.
-   Keep the output under 60 words.

OUTPUT:
Return **only** the final English prompt. Do not write "Here is the prompt" or use quotation marks.
`;

  return template;
}

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('godMode', clientIp);

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse();
  }

  try {
    const body = await req.json();
    // Naudojame Zod validaciją
    const { idToken, headings, content, customInstructions } = generatePromptsSchema.parse(body);

    await adminAuth.verifyIdToken(idToken);

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("API key is not configured");

    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Ištraukiame straipsnio temą iš pirmos H1 antraštės (fallback)
    const topicMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const articleTopic = topicMatch ? topicMatch[1].replace(/<[^>]*>/g, '').trim() : "General News";

    // === PRASIDEDA PAGRINDINIS PAKEITIMAS ===
    const promptResults: Record<string, string> = {}; // Rezultatas bus { "block-id": "prompt" }

    for (const heading of headings) {
      try {
        const sectionContent = extractSectionContent(heading.text, content);
        // Perduok `customInstructions` į prompt'o kūrimo funkciją
        const generationRequest = buildOptimizedPrompt(heading.text, sectionContent, articleTopic, customInstructions);

        console.warn("Generation request: Naujas promptas", generationRequest);

        const result = await ai.models.generateContent({
          model: modelName,
          contents: generationRequest,
        });
        await logAIResult({ userId: 'system', endpoint: 'god-mode/generate-prompts', model: modelName, result });
        const generatedPrompt = (result.text ?? '').trim();

        // ... (prompt'o valymas)

        // Naudojame bloko ID kaip raktą
        promptResults[heading.id] = generatedPrompt;
      } catch (error) {
        console.error(`Error generating prompt for heading ID "${heading.id}":`, error);
        promptResults[heading.id] = `Fotorealistiška nuotrauka, vaizduojanti temą: "${heading.text}"`;
      }
    }
    // === PAKEITIMO PABAIGA ===

    return NextResponse.json(promptResults);

  } catch (error) {
    console.error("God Mode prompt generation error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.format() }, { status: 400 });
    }
    return NextResponse.json({ error: `Failed to generate prompts. ${message}` }, { status: 500 });
  }
}

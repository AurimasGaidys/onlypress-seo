import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Zod schema for input validation
const generateArticleSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(200, "Topic must be less than 200 characters"),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  config: z.object({
    length: z.enum(["short", "medium", "long"]),
    tone: z.enum(["formal", "casual", "professional"]),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = generateArticleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.format() }, { status: 400 });
    }

    const { topic, title, config } = validationResult.data;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key is not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Fixed word count logic
    const wordCountMap = {
      short: 500,
      medium: 800,
      long: 1200,
    };

    const targetWordCount = wordCountMap[config.length];

    // Keywords can be extracted from the title/topic or use defaults
    const keywords = ["dirbtinis intelektas", "mašininis mokymasis", "neuroniniai tinklai", "duomenų analizė"];
    const domain = "example.com";

    const prompt = `
          Įsivaizduok, kad esi pasaulinio lygio SEO tekstų rašytojas ir turinio strategas, kurio supergalia - paversti sudėtingas temas įtraukiančiais, lengvai skaitomais ir skaitytojui vertę kuriančiais straipsniais. Tavo stilius yra "${config.tone}" - rašai kaip ekspertas, bet kalbi kaip draugas.

          TAVO UŽDUOTIS: Parašyti tobulą SEO straipsnį "${title}" HTML formatu apie temą "${topic}".

          PARAMETERAI:
          - STRAIPSNIO ILGIS: ${targetWordCount} žodžių (kritiškai svarbus reikalavimas)
          - TONAS: ${config.tone}

          INSTRUKCIJOS TOBULAM STRAIPSNIUI:

          1. **ĮŽANGA (KABLIUKAS):**
             * Pradėk nuo klausimo ar netikėto fakto
             * Pristatyk problemą, kurią straipsnis padės išspręsti
             * Pažadėk aiškią vertę, kurią skaitytojas gaus

          2. **DĖSTYMAS (VERTYBĖ IR SKAITOMUMAS):**
             * Struktūra: Naudok H2 ir H3 antraštes kaip pavyzdyje
             * Jokios teksto sienos - trumpas pastraipos
             * Praktiniai pavyzdžiai kiekvienoje sekcijoje
             * Bent vienas sąrašas (<ul><li>...</li></ul>)
             * Paryškink (<strong>) 3-4 svarbiausias mintis

          3. **SEO INTEGRACIJA:**
             * Natūraliai integruok raktinius žodžius: ${keywords.join(', ')}
             * Integruok nuorodą į ${domain}
             * Svarbiausią žodį paminėk įžangoje ir išvadoje

          4. **IŠVADA (VEIKSMAS):**
             * Apibendrink pagrindines mintis
             * Užbaik kvietimu veiksmui ar įsimintina mintimi

          FORMATAS: Pateik TIK HTML turinį. Pradėk nuo <p> žymės. NENAUDOK H1, <html>, <head>, ar <body> žymių.`;

    const result = await model.generateContent(prompt);
    const htmlContent = result.response.text();

    // Validate the HTML response (basic check)
    if (!htmlContent || htmlContent.length < 100) {
      throw new Error("AI returned invalid or too short article content.");
    }

    return NextResponse.json({ article: htmlContent });

  } catch (error) {
    console.error("Article generation error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to generate article. " + message }, { status: 500 });
  }
}

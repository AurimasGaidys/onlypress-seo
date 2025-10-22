// src/app/api/generate-titles/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for input validation
const generateTitlesSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters").max(200, "Topic must be less than 200 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = generateTitlesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.format() }, { status: 400 });
    }

    const { topic } = validationResult.data;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key is not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Generate 5 creative, engaging, and SEO-friendly article titles for the topic: "${topic}". Return them as a valid JSON object with a single key "titles" which is an array of strings. Example: {"titles": ["Title 1", "Title 2"]}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // --- PRADŽIA: Atsparumo klaidoms patobulinimas ---
    try {
      const jsonString = responseText.replace(/```json|```/g, '').trim();
      const parsedResponse = JSON.parse(jsonString);

      // Papildomas patikrinimas, ar atsakymo struktūra teisinga
      if (!parsedResponse.titles || !Array.isArray(parsedResponse.titles)) {
        throw new Error("AI returned an invalid data structure, 'titles' array is missing.");
      }

      return NextResponse.json(parsedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText, parseError);
      return NextResponse.json({
        error: "The AI returned a response in an unexpected format."
      }, { status: 500 });
    }
    // --- PABAIGA: Atsparumo klaidoms patobulinimas ---

  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json({ error: "Failed to generate titles from AI. Please check the server logs." }, { status: 500 });
  }
}

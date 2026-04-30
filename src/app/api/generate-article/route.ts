import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuthToken } from '@/lib/firebase-admin';

const generateArticleSchema = z.object({
    topic: z.string().min(1).max(200),
    title: z.string().min(1).max(200),
    keywords: z.array(z.string()).optional(),
    config: z.object({
        length: z.enum(["short", "medium", "long"]),
        tone: z.enum(["formal", "casual", "professional"]),
    }),
});

const wordCountMap = { short: 500, medium: 800, long: 1200 };

export async function POST(req: NextRequest) {
    try {
        await verifyAuthToken(req);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsed = generateArticleSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
        }

        const { topic, title, keywords = [], config } = parsed.data;

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key is not configured" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

        const targetWordCount = wordCountMap[config.length];
        const keywordLine = keywords.length > 0
            ? `Naturally integrate these keywords: ${keywords.join(', ')}.`
            : 'Naturally integrate relevant keywords for the topic.';

        const prompt = `You are a world-class SEO content writer. Write a complete SEO article in HTML format.

Title: "${title}"
Topic: "${topic}"
Tone: ${config.tone}
Target length: ~${targetWordCount} words

Requirements:
- Start with a hook (question or surprising fact)
- Use H2 and H3 headings for structure
- Short paragraphs, no walls of text
- At least one <ul> list
- Bold (<strong>) 3-4 key points
- ${keywordLine}
- End with a clear call to action

Format: Return ONLY the HTML body content. Start with a <p> tag. Do NOT include H1, <html>, <head>, or <body> tags.`;

        const result = await model.generateContent(prompt);
        const htmlContent = result.response.text();

        if (!htmlContent || htmlContent.length < 100) {
            throw new Error("AI returned invalid or too short content.");
        }

        return NextResponse.json({ article: htmlContent });

    } catch (error) {
        console.error("Article generation error:", error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        return NextResponse.json({ error: "Failed to generate article. " + message }, { status: 500 });
    }
}

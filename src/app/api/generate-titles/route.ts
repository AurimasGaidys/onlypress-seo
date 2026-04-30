import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuthToken } from "@/lib/firebase-admin";

const generateTitlesSchema = z.object({
    topic: z.string().min(3).max(200),
});

export async function POST(req: NextRequest) {
    try {
        await verifyAuthToken(req);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsed = generateTitlesSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
        }

        const { topic } = parsed.data;

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key is not configured" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

        const prompt = `Generate 5 creative, engaging, and SEO-friendly article titles for the topic: "${topic}". Return them as a valid JSON object with a single key "titles" which is an array of strings. Example: {"titles": ["Title 1", "Title 2"]}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        try {
            const jsonString = responseText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(jsonString);

            if (!parsed.titles || !Array.isArray(parsed.titles)) {
                throw new Error("AI returned an invalid data structure.");
            }

            return NextResponse.json(parsed);
        } catch (parseError) {
            console.error("Failed to parse AI response:", responseText, parseError);
            return NextResponse.json({ error: "The AI returned a response in an unexpected format." }, { status: 500 });
        }

    } catch (error) {
        console.error("AI generation error:", error);
        return NextResponse.json({ error: "Failed to generate titles." }, { status: 500 });
    }
}

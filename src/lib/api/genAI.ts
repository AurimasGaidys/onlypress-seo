import { GoogleGenAI } from "@google/genai";


const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error('GOOGLE_API_KEY environment variable is not set.');
}

export const genAI = new GoogleGenAI({ apiKey });
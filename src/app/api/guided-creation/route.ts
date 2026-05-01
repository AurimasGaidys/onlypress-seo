// src/app/api/guided-creation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { adminAuth } from '@/lib/firebase-admin';
import { handleGuidedCreationRequest } from '@/lib/conversation/guided-creation-logic'; // <-- Importuojame naują funkciją

const guidedCreationRequestSchema = z.object({
  idToken: z.string(),
  chatPhase: z.string(),
  lastUserMessage: z.string(),
  messages: z.array(z.any()),
  fileUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = guidedCreationRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { idToken, ...payload } = validationResult.data;
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    // Iškviečiame bendrą logiką ir grąžiname jos rezultatą
    return await handleGuidedCreationRequest(payload, decodedToken, ai, modelName);

  } catch (error) {
    console.error('Guided Creation API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

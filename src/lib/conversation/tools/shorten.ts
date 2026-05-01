// src/lib/conversation/tools/shorten.ts
import { GoogleGenAI } from '@google/genai';
import { PhaseHandler, PhaseHandlerResult } from '../conversationMachine';
import { EDITOR_SYSTEM_PROMPT } from './rewrite';

export async function runShortenTool(context: Parameters<PhaseHandler>[0], params: Record<string, unknown>): Promise<PhaseHandlerResult> {
  const { documentContent, selectedText } = context;
  const { target } = params;

  // Jei vartotojas nurodė, ką trumpinti (pvz., "sutrumpink įžangą") ARBA yra pažymėtas tekstas
  const hasSpecificTarget = (target && target !== 'pažymėtas tekstas') || selectedText;

  const textToProcess = selectedText || documentContent;
  const targetDescription = selectedText ? 'pažymėtą tekstą' : (target || 'visą straipsnį');

  const prompt = `
    ${EDITOR_SYSTEM_PROMPT}

    Vartotojo komanda: "Sutrumpink ${targetDescription}"

    Dabartinis dokumento HTML:
    ${textToProcess}

    UŽDUOTIS:
    ${hasSpecificTarget
      ? `1. Modifikuok TIK nurodytą dalį (${targetDescription}). Likusį tekstą palik identišką.
         2. Grąžink VISĄ HTML dokumentą su atliktu pakeitimu.`
      : `1. Sutrumpink visą pateiktą tekstą.
         2. Grąžink VISĄ sutrumpintą HTML turinį.`
    }

    UŽDUOTIS (tęsinys):
    3. Sutrumpink tekstą taip, kad jis taptų glaustesnis, bet išlaikytų pagrindinę mintį.
    4. Išlaikyk redaktoriaus rolę ir profesionalų toną.
    5. Atsakyme turi būti TIK HTML kodas.
  `;

  const apiKey = process.env.GOOGLE_API_KEY;
  // if (!apiKey) {
  //   thow({ error: 'API key is not configured' }, { status: 500 });
  // }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';


  const result = await ai.models.generateContent({
    model: modelName,
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
  });
  const newHtml = result.text;

  // Jei keitėme tik dalį, atnaujiname visą dokumentą. Jei visą - pakeičiame visą.
  const finalHtml = hasSpecificTarget ? newHtml : newHtml;

  return {
    nextPhase: 'INTERACTIVE_REFINEMENT',
    response: {
      type: 'contentUpdate',
      html: finalHtml,
      confirmationMessage: `Supratau, sutrumpinau ${targetDescription}.`
    }
  } as any;
}

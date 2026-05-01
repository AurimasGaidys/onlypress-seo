// src/lib/conversation/tools/fixGrammar.ts
import { genAI } from '@/lib/api/genAI';
import { PhaseHandler, PhaseHandlerResult } from '../conversationMachine';
import { sanitizeJsonOutput } from '../utils';

export async function runFixGrammarTool(context: Parameters<PhaseHandler>[0], params: Record<string, unknown>): Promise<PhaseHandlerResult> {
  const { documentContent, selectedText } = context;

  // Šis įrankis veikia TIK su pažymėtu tekstu.
  if (!selectedText) {
    return {
      nextPhase: 'INTERACTIVE_REFINEMENT',
      response: {
        type: 'message',
        response: "Norėdami taisyti gramatiką, pirma pažymėkite norimą teksto dalį."
      }
    };
  }

  const prompt = `
    Tu esi profesionalus lietuvių kalbos redaktorius. Ištaisyk gramatikos, stiliaus ir skyrybos klaidas šiame tekste.
    Grąžink TIK ištaisytą tekstą, be jokių paaiškinimų.

    Tekstas taisymui: "${selectedText}"
  `;

  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  });

  const correctedText = sanitizeJsonOutput(result.text || '');

  // Pakeičiame tik pažymėtą dalį nauju tekstu
  const newHtml = documentContent.replace(selectedText, correctedText);

  return {
    nextPhase: 'INTERACTIVE_REFINEMENT',
    response: {
      type: 'contentUpdate',
      html: newHtml,
      confirmationMessage: "Gramatika ir stilius pataisyti."
    }
  };
}

// src/lib/conversation/tools/expand.ts
import { PhaseHandler, PhaseHandlerResult } from '../conversationMachine';
import { sanitizeJsonOutput } from '../utils';

export async function runExpandTool(context: Parameters<PhaseHandler>[0], params: Record<string, unknown>): Promise<PhaseHandlerResult> {
  const { documentContent, selectedText } = context;
  const { target } = params;

  const textToProcess = selectedText || documentContent;
  const targetDescription = selectedText ? 'pažymėtą tekstą' : (target || 'visą straipsnį');

  const prompt = `
    Tu esi AI redaktorius. Tavo užduotis - išplėsti pateiktą tekstą, pridedant daugiau detalių, pavyzdžių ar paaiškinimų.

    Tekstas, kurį reikia apdoroti:
    \`\`\`html
    ${textToProcess}
    \`\`\`

    Instrukcija: Išplėsk ${targetDescription}.

    GRIEŽTOS TAISYKLĖS:
    1. Surask nurodytą dalį (${targetDescription}) ir ją išplėsk. Visą kitą turinį palik nepakeistą.
    2. Grąžink VISĄ HTML dokumentą su atliktu pakeitimu.
    3. Atsakyme turi būti TIK HTML kodas.
  `;

  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  });

  const correctedText = sanitizeJsonOutput(result.text || '');

  return {
    nextPhase: 'INTERACTIVE_REFINEMENT',
    response: {
      type: 'contentUpdate',
      html: correctedText,
      confirmationMessage: `Supratau, išplėčiau ${targetDescription}.`
    }
  };
}

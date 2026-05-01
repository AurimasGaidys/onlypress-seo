// src/lib/conversation/tools/addSection.ts
import { PhaseHandler, PhaseHandlerResult } from '../conversationMachine';
import { sanitizeJsonOutput } from '../utils';

export async function runAddSectionTool(context: Parameters<PhaseHandler>[0], params: Record<string, unknown>): Promise<PhaseHandlerResult> {
  const { documentContent } = context;
  const { topic, location } = params;

  if (!topic) {
    return {
      nextPhase: 'INTERACTIVE_REFINEMENT',
      response: {
        type: 'message',
        response: "Nurodykite, kokia tema norite pridėti naują skiltį."
      }
    };
  }

  const locationInstruction = location ? `Nurodyta vieta, kur įterpti: ${location}.` : 'Įterpk naują skiltį logiškiausioje vietoje.';

  const generationPrompt = `
    Sugeneruok naują straipsnio skiltį (pastraipą ar kelias) tema: "${topic}".
    Naudok HTML žymes, pvz., <h2> antraštėms ir <p> pastraipoms.
    Grąžink TIK sugeneruotą HTML fragmentą.
  `;
  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents: [{
      role: 'user',
      parts: [{ text: generationPrompt }]
    }]
  });

  const newSectionHtml = sanitizeJsonOutput(result.text || '');


  const insertionPrompt = `
    Tu esi HTML redaktorius. Įterpk šį naują HTML fragmentą į esamą dokumentą.

    Naujas fragmentas:
    \`\`\`html
    ${newSectionHtml}
    \`\`\`

    Esamas dokumentas:
    \`\`\`html
    ${documentContent}
    \`\`\`

    Instrukcija: ${locationInstruction}
    Grąžink VISĄ atnaujintą HTML dokumentą. Atsakyme turi būti TIK HTML kodas.
  `;

  const insertionResult = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents: [{
      role: 'user',
      parts: [{ text: insertionPrompt }]
    }]
  });

  return {
    nextPhase: 'INTERACTIVE_REFINEMENT',
    response: {
      type: 'contentUpdate',
      html: insertionResult.response.text(),
      confirmationMessage: `Pridėjau naują skiltį tema "${topic}".`
    }
  };
}

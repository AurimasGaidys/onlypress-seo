import { genAI } from '@/lib/api/genAI';
import { PhaseHandler } from '../conversationMachine';
import { sanitizeJsonOutput } from '../utils';

export const handleArticleTypeSelectionPhase: PhaseHandler = async ({
  lastUserMessage,
  state,
}) => {
  const updatedBlueprint = {
    ...state.metadata.blueprint,
    type: lastUserMessage,
  };

  const infoPrompt = `Vartotojas pasirinko straipsnio tipą: "${lastUserMessage}". Tavo užduotis - be jokių įžangų, iškart užduoti pirmąjį esminį klausimą, reikalingą šio tipo straipsniui. Užduok TIK VIENĄ klausimą. Pavyzdžiui, jei tipas yra "Naujienų straipsnis", klausk: "Kas yra pagrindiniai įvykio dalyviai, vieta ir laikas?". Jei tipas "Analitinis straipsnis", klausk: "Kokia yra pagrindinė analizuojama problema ar tezė?". Būk maksimaliai konkretus.`;


  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents: [{
      role: 'user',
      parts: [{ text: infoPrompt }]
    }]
  });

  const correctedText = sanitizeJsonOutput(result.text || '');

  return {
    nextPhase: 'INFORMATION_GATHERING',
    metadataUpdates: {
      blueprint: updatedBlueprint,
    },
    response: {
      type: 'message',
      response: correctedText,
    },
  };
};

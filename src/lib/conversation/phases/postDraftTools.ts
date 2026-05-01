import { genAI } from '@/lib/api/genAI';
import { PhaseHandler } from '../conversationMachine';
import { sanitizeJsonOutput } from '../utils';

export const handlePostDraftToolsPhase: PhaseHandler = async ({
  lastUserMessage,
  documentContent,
}) => {
  const toolExecutionPrompt = `Vartotojas pasirinko įrankį: "${lastUserMessage}". Remdamasis galutiniu straipsnio turiniu, įvykdyk šią užduotį. Grąžink rezultatą aiškiai suformatuotą Markdown'u (pvz., naudojant code block). Straipsnio turinys:\n\n${documentContent}`;

  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents: [{
      role: 'user',
      parts: [{ text: toolExecutionPrompt }]
    }]
  });

  const responseText = sanitizeJsonOutput(result.text || '');

  return {
    nextPhase: 'POST_DRAFT_TOOLS',
    response: {
      type: 'message',
      response: responseText,
    },
  };
};

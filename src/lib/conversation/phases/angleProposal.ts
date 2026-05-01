import { genAI } from '@/lib/api/genAI';
import { PhaseHandler } from '../conversationMachine';
import { buildConversationHistory, sanitizeJsonOutput } from '../utils';

export const handleAngleProposalPhase: PhaseHandler = async ({
  lastUserMessage,
  state,
}) => {
  const updatedBlueprint = {
    ...state.metadata.blueprint,
    angle: lastUserMessage,
  };

  const conversationHistory = buildConversationHistory(state.messages);

  const structurePrompt = `Vartotojas pasirinko rašyti straipsnį su rakursu: "${lastUserMessage}". Remiantis VISA pokalbio istorija ir šiuo rakursu, sugeneruok detalų straipsnio planą (struktūrą) Markdown formatu. Pokalbio istorija:\n${conversationHistory}`;

  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents: [{
      role: 'user',
      parts: [{ text: structurePrompt }]
    }]
  });

  const generatedPlan = sanitizeJsonOutput(result.text || '');

  return {
    nextPhase: 'STRUCTURE_PROPOSAL',
    metadataUpdates: {
      blueprint: updatedBlueprint,
      lastGeneratedStructure: generatedPlan,
    },
    response: {
      type: 'message',
      response: `Puikus pasirinkimas! Štai siūloma straipsnio struktūra, orientuota į jūsų pasirinktą kampą:\n\n${generatedPlan}\n\nAr patvirtinate šį planą?`,
      actions: [
        { label: 'Taip, patvirtinu' },
        { label: 'Ne, generuoti iš naujo' },
      ],
    },
  };
};

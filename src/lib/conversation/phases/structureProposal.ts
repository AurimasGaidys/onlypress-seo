import { genAI } from '@/lib/api/genAI';
import { PhaseHandler } from '../conversationMachine';
import { buildConversationHistory, sanitizeJsonOutput } from '../utils';

export const handleStructureProposalPhase: PhaseHandler = async ({ state }) => {
  const conversationHistory = buildConversationHistory(state.messages);

  const prompt = `Tu esi AI rašytojas. Remiantis šiuo pokalbiu ir patvirtintu planu:\n${conversationHistory}\n\nSugeneruok pilną straipsnio juodraštį HTML formatu. Pradėk iškart nuo turinio, be <html> ar <body> žymių.\n\nGRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.`;

  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  });

  const html = sanitizeJsonOutput(result.text || '');

  return {
    streaming: false,
    nextPhase: 'INTERACTIVE_REFINEMENT',
    metadataUpdates: {
      lastGeneratedDraftId: `${Date.now()}`,
    },
    response: {
      type: 'contentUpdate',
      html,
      confirmationMessage:
        'Juodraštis paruoštas ir įkeltas į redaktorių. Dabar galime jį tobulinti kartu. Ką norėtumėte keisti?',
    },
  };
};

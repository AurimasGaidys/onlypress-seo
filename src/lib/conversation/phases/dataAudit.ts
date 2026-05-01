import { PhaseHandler } from '../conversationMachine';
import { buildConversationHistory, sanitizeJsonOutput, safeJsonParse } from '../utils';

export const handleDataAuditPhase: PhaseHandler = async ({ model, state }) => {
  const conversationHistory = buildConversationHistory(state.messages);

  const anglePrompt = `Remiantis VISA iki šiol surinkta informacija (žemiau) pasiūlyk 2-3 galimus straipsnio rakurso (angle) variantus. Kiekvienas variantas turi būti aiškus, įdomus ir pritaikytas pasirinktam straipsnio tipui. Atsakymą grąžink TIK kaip validų JSON objektą su raktais "response" (tavo įžanginis tekstas, pvz., "Štai keli galimi kampai:") ir "actions" (masyvas su objektais, kurių kiekvienas turi raktą "label").\n---\n${conversationHistory}`;

  return {
    streaming: true,
    streamType: 'message',
    prompt: anglePrompt,
    nextPhase: 'ANGLE_PROPOSAL',
  };
};

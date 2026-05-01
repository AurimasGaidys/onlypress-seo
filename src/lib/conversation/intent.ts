import { GoogleGenAI, Part } from '@google/genai';
import { ConversationIntent, ConversationMessage } from '@/types/conversation';

export interface IntentAnalysisInput {
  lastUserMessage: string;
  history: ConversationMessage[];
  fileParts?: Part[];
}

export async function inferConversationIntent({
  lastUserMessage,
  history,
  fileParts,
}: IntentAnalysisInput): Promise<ConversationIntent> {
  const conversationHistory = history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join('\n');

  const prompt = `
Analizuok paskutinę vartotojo žinutę ir visą pokalbio kontekstą. Nustatyk vartotojo intenciją.

Paskutinė vartotojo žinutė: "${lastUserMessage}"

Pokalbio istorija:
${conversationHistory}

Galimos intencijos:
1. "PROVIDE_INFO": Vartotojas pateikia daugiau informacijos, atsako į klausimus.
2. "REQUEST_GENERATION": Vartotojas aiškiai arba netiesiogiai prašo pradėti straipsnio rašymą/generavimą, neatsakydamas į konkretų klausimą (pvz., "užtenka, rašyk", "sugalvok pats", "generuok straipsnį").
3. "FINISH_GATHERING": Vartotojas naudoja raktažodžius kaip "užtenka", "tęsti", "viskas", nurodydamas, kad baigė teikti informaciją.

Grąžink atsakymą TIK kaip validų JSON objektą su vienu raktu "intent". Pavyzdys: {"intent": "PROVIDE_INFO"}
  `;

  const parts: Part[] = [{ text: prompt }];
  if (fileParts?.length) {
    parts.push(...fileParts);
  }

  try {

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return 'PROVIDE_INFO';
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

    const result = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
    });

    const raw = result.text || '';
    const sanitized = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(sanitized) as { intent?: ConversationIntent };

    if (parsed.intent && isConversationIntent(parsed.intent)) {
      return parsed.intent;
    }
  } catch (error) {
    console.warn('Failed to infer conversation intent:', error);
  }

  return 'PROVIDE_INFO';
}

function isConversationIntent(value: string): value is ConversationIntent {
  return (
    value === 'PROVIDE_INFO' ||
    value === 'REQUEST_GENERATION' ||
    value === 'FINISH_GATHERING' ||
    value === 'CONFIRM_STRUCTURE' ||
    value === 'REVISE_STRUCTURE' ||
    value === 'REQUEST_UNDO' ||
    value === 'ACCEPT_CHANGES' ||
    value === 'REJECT_CHANGES' ||
    value === 'REQUEST_TOOLS' ||
    value === 'COMPLETE_DOCUMENT' ||
    value === 'UNKNOWN'
  );
}

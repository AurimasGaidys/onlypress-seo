// src/lib/conversation/tools/recognizeIntent.ts

import { GenerativeModel } from '@google/genai';
import { EditorIntent } from '@/types/conversation';
import { sanitizeJsonOutput, safeJsonParse } from '../utils';
import { genAI } from '@/lib/api/genAI';

interface IntentRecognitionResult {
  intent: EditorIntent;
  parameters: Record<string, unknown>;
  reasoning: string;
}

const INTENT_LIST = [
  'REWRITE_SECTION', 'SHORTEN_SECTION', 'EXPAND_SECTION', 'FIX_GRAMMAR',
  'ADD_SECTION', 'REMOVE_SECTION', 'CHANGE_TONE', 'FIND_AND_REPLACE',
  'RUN_SEO_ANALYSIS', 'RUN_PORTAL_CHECK', 'GENERAL_CHAT', 'UNKNOWN'
].join(', ');

export async function recognizeEditorIntent(model: GenerativeModel, command: string, selectedText?: string): Promise<IntentRecognitionResult> {
  const prompt = `
    Analizuok vartotojo komandą redaktoriuje. Tavo tikslas yra nustatyti vartotojo intenciją ir ištraukti reikiamus parametrus.

    Galimos intencijos: ${INTENT_LIST}

    Vartotojo komanda: "${command}"
    ${selectedText ? `Pažymėtas tekstas, kuriam taikoma komanda: "${selectedText.substring(0, 200)}..."` : ''}

    Atsakymą grąžink TIK kaip validų JSON objektą su trimis raktais: "intent", "parameters", "reasoning".
    - "intent": Viena iš galimų intencijų.
    - "parameters": Objektas su ištrauktais parametrais. Pvz., "target", "style", "topic", "find", "replaceWith".
    - "reasoning": Trumpas paaiškinimas, kodėl pasirinkai tokią intenciją.

    Pavyzdžiai:
    1. Komanda: "Perrašyk antrą pastraipą laisvesniu stiliumi"
       Atsakymas: {"intent": "REWRITE_SECTION", "parameters": {"target": "antra pastraipa", "style": "laisvesnis"}, "reasoning": "Vartotojas nori perrašyti konkrečią dalį, nurodydamas stilių."}
    2. Komanda: "Sutrumpink šį tekstą" (kai yra pažymėtas tekstas)
       Atsakymas: {"intent": "SHORTEN_SECTION", "parameters": {"target": "pažymėtas tekstas"}, "reasoning": "Vartotojas nori sutrumpinti pažymėtą tekstą."}
    3. Komanda: "patikrink SEO"
       Atsakymas: {"intent": "RUN_SEO_ANALYSIS", "parameters": {}, "reasoning": "Vartotojas aiškiai prašo SEO patikros."}
    4. Komanda: "labas, kaip sekasi?"
       Atsakymas: {"intent": "GENERAL_CHAT", "parameters": {}, "reasoning": "Komanda yra bendrinio pobūdžio pokalbis, o ne redagavimo užduotis."}
  `;

  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  });
  const rawJson = sanitizeJsonOutput(result.text || '');

  return safeJsonParse<IntentRecognitionResult>(rawJson, {
    intent: 'UNKNOWN',
    parameters: {},
    reasoning: 'Failed to parse model response.'
  });
}

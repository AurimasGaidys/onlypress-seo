import { genAI } from '@/lib/api/genAI';
import { PhaseHandler } from '../conversationMachine';
import { buildConversationHistory, sanitizeJsonOutput } from '../utils';

export const handleInformationGatheringPhase: PhaseHandler = async ({
  state,
  intent = 'PROVIDE_INFO',
  fileParts = [],
}) => {
  const conversationHistory = buildConversationHistory(state.messages);

  if (intent === 'REQUEST_GENERATION') {
    const generationPrompt = `Vartotojas paprašė sugeneruoti straipsnį. Remdamasis VISA pokalbio istorija, sukurk detalų straipsnio planą (struktūrą) Markdown formatu.
Pradėk atsakymą trumpa, vieno sakinio įžanga, pvz., "Gerai, štai siūlomas straipsnio planas:".

GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.

POKALBIO ISTORIJA:
${conversationHistory}
---
Pabaigoje aiškiai paklausk, ar planas tinka.`;

    const parts = [{ text: generationPrompt }, ...fileParts];

    const structureResult = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
      contents: [{
        role: 'user',
        parts
      }]
    });

    console.log('Unused Information Gathering - Generated Structure:', structureResult.text);

    return {
      streaming: true,
      streamType: 'message',
      prompt: generationPrompt,
      nextPhase: 'STRUCTURE_PROPOSAL',
      metadataUpdates: {
        lastIntent: intent,
      },
      actions: [
        { label: 'Taip, patvirtinu' },
        { label: 'Ne, reikia keisti' },
      ],
    };
  }

  if (intent === 'FINISH_GATHERING') {
    const auditPrompt = `Remdamasis VISA pokalbio istorija ir įkelto failo turiniu (jei toks buvo), atlik surinktos informacijos auditą. Žemiau pateikta pokalbio istorija:\n${conversationHistory}\n---\nTavo tikslas – identifikuoti trūkumus, reikalingus kokybiškam straipsniui. Patikrink:\n1.  **Šaltinių patikimumą:** Ar nurodyti šaltiniai?\n2.  **Pusiausvyrą:** Ar atstovaujamos visos nuomonės, ar yra tik viena pusė?\n3.  **Citatas:** Ar yra konkrečių, stiprių citatų iš ekspertų ar dalyvių?\n4.  **Kontekstą:** Ar pakanka foninės informacijos skaitytojui suprasti temą?\nSavo išvadas pateik trumpai, aiškiai ir mandagiai. Jei trūkumų neradai, tiesiog parašyk: "Informacijos pakanka, viskas puiku." Pabaigoje visada paklausk: "Ar galime tęsti?"`;

    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
      contents: [{
        role: 'user',
        parts: [{ text: auditPrompt }, ...fileParts],
      }]
    });

    const infoResult = sanitizeJsonOutput(result.text || '');
    console.log('Unused Information Gathering - Audit Result:', infoResult);

    return {
      streaming: true,
      streamType: 'message',
      prompt: auditPrompt,
      nextPhase: 'DATA_AUDIT',
      metadataUpdates: {
        lastIntent: intent,
      },
      actions: [{ label: 'Taip, tęsti' }],
    };
  }

  const infoPrompt = `Atsižvelgiant į pokalbio istoriją, suformuluok sekantį, logišką ir konkretų klausimą, kad surinktum trūkstamą informaciją.
POKALBIO ISTORIJA:
${conversationHistory}
---
UŽDUOTIS: Užduok TIK VIENĄ, patį svarbiausią sekantį klausimą. Jokios įžangos, jokių paaiškinimų, jokių motyvacinių frazių. Tiesiog klausimas.
Pavyzdžiui: "Koks yra oficialus vizito statusas?" arba "Ar yra oficialių citatų iš spaudos konferencijos?"`;



  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents: [{
      role: 'user',
      parts: [{ text: infoPrompt }, ...fileParts],
    }]
  });

  const infoResult = sanitizeJsonOutput(result.text || '');

  console.log('Unused Information Gathering - Generated Question:', infoResult);

  return {
    streaming: true,
    streamType: 'message', // Nurodome, kad tai bus žinutės srautas
    prompt: infoPrompt,
    nextPhase: 'INFORMATION_GATHERING',
    metadataUpdates: {
      lastIntent: intent,
    },
    actions: null,
  };
};

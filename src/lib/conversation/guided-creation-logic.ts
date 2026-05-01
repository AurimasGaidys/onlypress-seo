// src/lib/conversation/guided-creation-logic.ts
import { GoogleGenAI } from '@google/genai';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { welcomeMessageContent } from '@/lib/constants/messages';
import { ConversationMessage, ConversationPhase } from '@/types/conversation';
import { buildConversationHistory } from '@/lib/conversation/utils';
import { NextResponse } from 'next/server';

interface RequestPayload {
  chatPhase?: string | undefined;
  lastUserMessage: string;
  messages: any[];
  fileUrl?: string;
}

interface UserToken {
  uid: string;
}

// Ši funkcija dabar yra viso proceso šerdis
export async function handleGuidedCreationRequest(
  payload: RequestPayload,
  user: UserToken,
  ai: GoogleGenAI,
  modelName: string
) {
  const { lastUserMessage, messages: clientMessages } = payload;
  let currentPhase = payload.chatPhase as ConversationPhase;

  const conversationHistory = buildConversationHistory(clientMessages);
  const isInitialMessage = clientMessages.length === 0;

  if (isInitialMessage) {
    const topic = lastUserMessage;
    const firstQuestionPrompt = `Tu esi profesionalus ir draugiškas naujienų redaktoriaus asistentas. Vartotojas ką tik nurodė straipsnio temą: "${topic}". TAVO UŽDUOTIS: Atsakyk trumpa (2-3 sakinių), mandagia pasisveikinimo žinute ir iškart paklausk, kokio žanro straipsnį norėtų kurti. Tavo atsakymas turi būti paprastas klausimas. PAVYZDYS: "Sveiki! Tema "${topic}" skamba labai įdomiai. Kokio žanro straipsnį norėtumėte kurti?"`;
    const result = await ai.models.generateContent({
      model: modelName,
      contents: firstQuestionPrompt,
    });
    const aiResponseText = result.text ?? '';
    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: aiResponseText,
      timestamp: new Date(),
      actions: [{ label: 'Naujiena (žinutė)' }, { label: 'Analitinė apžvalga' }, { label: 'Reportažas' }, { label: 'Interviu' }, { label: 'Nuomonės straipsnis (kolonėlė)' }, { label: 'Tyrimas' }],
    };
    return NextResponse.json({ assistantMessage: assistantMessage, newChatPhase: 'INFORMATION_GATHERING' });
  }

  const isConfirmingStructure = currentPhase === 'STRUCTURE_PROPOSAL' && /patvirtinu|taip|generuok/i.test(lastUserMessage);
  if (isConfirmingStructure) {
    currentPhase = 'DRAFT_GENERATION';
  }

  if (currentPhase === 'DRAFT_GENERATION') {
    const generationPrompt = `Tu esi AI rašytojas. Remdamasis šiuo pokalbiu ir patvirtintu planu: ${conversationHistory}\n\nTAVO UŽDUOTIS: Sugeneruok pilną straipsnio juodraštį ir meta duomenis.\n\nGRIEŽTOS INSTRUKCIJOS ATSAKYMUI:\n1. Grąžink TIK validų JSON objektą. Jokių paaiškinimų.\n2. JSON objektas privalo turėti raktus: "htmlContent", "title", "metaDescription".\n\nGRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.\n\nPavyzdys: { "htmlContent": "<h2>...", "title": "Geras SEO Pavadinimas", "metaDescription": "Patrauklus meta aprašymas." }`;
    let htmlContent: string;
    let documentTitle: string;
    let metaDescription: string;
    
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: generationPrompt,
      });
      const jsonString = (result.text ?? '').replace(/```json|```/g, '').trim();
      const parsedResponse = JSON.parse(jsonString);
      if (!parsedResponse.htmlContent || !parsedResponse.title || !parsedResponse.metaDescription) {
        throw new Error("AI returned an invalid JSON structure.");
      }
      htmlContent = parsedResponse.htmlContent;
      documentTitle = parsedResponse.title;
      metaDescription = parsedResponse.metaDescription;
    } catch (error) {
      console.error("Failed to generate or parse article content:", error);
      return NextResponse.json({ error: "AI failed to generate article. Please try again." }, { status: 500 });
    }
    const newDocRef = adminDb.collection('documents').doc();
    const batch = adminDb.batch();
    batch.set(newDocRef, {
      title: documentTitle,
      content: `${htmlContent}`,
      metaTitle: documentTitle,
      metaDescription: metaDescription,
      createdAt: FieldValue.serverTimestamp(),
      lastEdited: FieldValue.serverTimestamp(),
      userId: user.uid,
      agencyId: `personal_${user.uid}`, // Pridėta asmeninės erdvės agencyId
      folderId: null,
      status: 'draft'
    });
    const metaRef = newDocRef.collection('conversation').doc('metadata');
    batch.set(metaRef, { chatPhase: 'INTERACTIVE_REFINEMENT', lastUpdatedAt: FieldValue.serverTimestamp() });
    const initialMsgRef = metaRef.collection('messages').doc();
    const initialMessage = {
        role: 'assistant',
        content: welcomeMessageContent,
        timestamp: FieldValue.serverTimestamp(),
        withTypingEffect: true
    };
    batch.set(initialMsgRef, initialMessage);
    await batch.commit();

    // Grąžiname būtent tokį formatą, kokį tikisi frontend'as
    return NextResponse.json({ type: 'creationSuccess', newDocumentId: newDocRef.id, html: `${htmlContent}` });
  }

  const planningPrompt = `Tu esi PUBLIKUOTA.LT profesionalus AI redaktorius (Co-pilot). Tavo bendravimas turi būti greitas, konkretus ir orientuotas į rezultatą. Jei vartotojas duoda komandas kaip "sugalvok pats", "neturiu info" - tai yra tiesioginis nurodymas tau pačiam sukurti trūkstamą informaciją (fiktyvų scenarijų) ir pereiti prie plano kūrimo.\n\nPOKALBIO ISTORIJA:\n${conversationHistory}\n\nGRIEŽTOS TAISYKLĖS:\n1. BŪK GREITAS: Po 2-3 bandymų gauti informaciją, jei vartotojas jos neteikia, PRIVALAI pats sukurti trūkstamas detales ir iškart pereiti prie plano kūrimo.\n2. NAUDOK MARKDOWN: VISUS savo atsakymus formatuok su Markdown.\n3. LOGIKA: JEI TRŪKSTA INFO - užduok TIK KLAUSIMĄ. JEI INFO PAKANKA - sugeneruok straipsnio planą ir pabaigoje BŪTINAI pridėk sakinį: "Ar šis planas tinka?".\n\nGRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.`;
  const result = await ai.models.generateContent({
    model: modelName,
    contents: planningPrompt,
  });
  const aiResponseText = result.text ?? '';

  if (aiResponseText.includes('Ar šis planas tinka?')) {
    const assistantMessage: ConversationMessage = { role: 'assistant', content: aiResponseText, timestamp: new Date(), actions: [{ label: 'Taip, patvirtinu' }] };
    return NextResponse.json({ assistantMessage: assistantMessage, newChatPhase: 'STRUCTURE_PROPOSAL' });
  } else {
    const assistantMessage: ConversationMessage = { role: 'assistant', content: aiResponseText, timestamp: new Date() };
    return NextResponse.json({ assistantMessage: assistantMessage, newChatPhase: 'INFORMATION_GATHERING' });
  }
}

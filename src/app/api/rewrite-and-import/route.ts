// src/app/api/rewrite-and-import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { welcomeMessageContent } from '@/lib/constants/messages';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { logAIResult } from '@/lib/api/ai-usage-logger';
import * as cheerio from 'cheerio';
import { findOrCreateFolderByName } from '@/lib/folder-utils';
import { getFolderIdForDocument } from '@/lib/folder-helpers';
import { RssRelease } from '@/types/rss'; // Importuojame tipą

// Pagalbinės funkcijos
function generateSnippet(htmlContent: string): string {
  const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
}

function countWords(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]*>/g, ' ').trim();
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

// Funkcija, kuri generuoja specifinį prompt'ą pagal stilių
function getRewritePrompt(style: string, content: string, title: string): string {
  const $ = cheerio.load(content);
  const cleanContent = $('body').text().replace(/\s+/g, ' ').trim();

  const baseInstruction = `KRITINĖ TAISYKLĖ: Visą informaciją imk IŠSKIRTINAI iš pateikto originalaus turinio. Griežtai draudžiama prigalvoti bet kokius naujus faktus, skaičius, citatas ar išorines nuorodas. Tavo užduotis yra transformuoti formą, o ne turinį.
Grąžink atsakymą kaip vientisą HTML bloką, prasidedantį <h1> žyma naujai antraštei. Nenaudok <html>, <body> ar <head> žymų.

  GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.`;

  switch (style) {
    case 'news_article':
      return `Tu esi patyręs naujienų redaktorius. Transformuok šį spaudos pranešimą į neutralų, informatyvų naujienų straipsnį.
      - Sukurk patrauklią, bet faktus atitinkančią antraštę.
      - Parašyk trumpą įžanginę pastraipą (lead'ą), apibendrinančią esmę (kas, ką, kur, kada, kodėl).
      - Struktūruok tekstą pagal "apverstos piramidės" principą.
      - Pašalink bet kokias rinkodaros frazes ar subjektyvius vertinimus.
      ${baseInstruction}

      Originali antraštė: "${title}"
      Originalus turinys: "${cleanContent.substring(0, 8000)}"`; // Padidintas limitas

    case 'analytical_review':
      return `Tu esi rinkos analitikas. Transformuok šį spaudos pranešimą į analitinę apžvalgą.
      - Ne tik perfrazuok faktus, bet ir pateik įžvalgas apie jų svarbą ar galimas pasekmes, REMDAMASIS TIK PATEIKTA INFORMACIJA.
      - Sukurk analitinį pobūdį atspindinčią antraštę.
      - Naudok <h2> paantraštes, kad struktūrotum skirtingus analizės aspektus.
      - Naudok profesionalų, autoritetingą toną.
      ${baseInstruction}

      Originali antraštė: "${title}"
      Originalus turinys: "${cleanContent.substring(0, 8000)}"`;

    case 'qa_format':
      return `Tu esi redaktorius, ruošiantis turinį greitam vartojimui. Perrašyk šį spaudos pranešimą į Klausimų ir Atsakymų (Q&A) formatą.
      - Identifikuok 5-7 svarbiausius klausimus, kurie galėtų kilti skaitytojui.
      - Suformuluok aiškius klausimus ir pateik glaustus atsakymus, naudodamas TIK pranešimo turinį.
      - Klausimus formatuok su <h2>, atsakymus – su <p>.
      - Sukurk tinkamą antraštę Q&A stiliaus straipsniui.
      ${baseInstruction}

      Originali antraštė: "${title}"
      Originalus turinys: "${cleanContent.substring(0, 8000)}"`;

    default:
      return `Perrašyk šį turinį: "${cleanContent.substring(0, 8000)}". ${baseInstruction}`;
  }
}

// PAKEITIMAS: Išplečiame 'release' schemą, kad atitiktų pilną RssRelease tipą
const rewriteSchema = z.object({
  idToken: z.string(),
  release: z.any(), // Priimame bet kokį objektą, nes tipą tikrinsime su TypeScript
  rewriteStyle: z.enum(["news_article", "analytical_review", "qa_format"]),
  agencyId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, release: rawRelease, rewriteStyle, agencyId, clientId, projectId } = rewriteSchema.parse(body);

    const release = rawRelease as RssRelease; // Tipuojame gautus duomenis

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("API key not configured");

    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // PAKEITIMAS: Naudojame teisingus laukus iš 'textInfo'
    const prompt = getRewritePrompt(rewriteStyle, release.textInfo.content, release.textInfo.title);

    let rewrittenHtml;
    try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
          },
        });
        
        if (!result.text) {
            throw new Error("AI returned empty response.");
        }
        await logAIResult({ userId: uid, endpoint: 'rewrite-and-import', model: modelName, result });
        rewrittenHtml = result.text;
    } catch (aiError) {
        console.error('[API:rewrite] Gemini API Error:', aiError);
        throw new Error("AI content generation failed.");
    }

    const $ = cheerio.load(rewrittenHtml);
    const newTitle = $('h1').first().text() || `Perrašyta: ${release.textInfo.title}`;

    // Pašaliname h1, nes jis bus dokumento pavadinime, bet paliekame jį turinyje, kad būtų nuoseklu
    // $('h1').first().remove();
    const finalContent = $.html();

    const folderId = agencyId
      ? await getFolderIdForDocument(agencyId, clientId || null, projectId || null)
      : await findOrCreateFolderByName(adminDb, uid, 'Public Releases');

    const docData = {
      title: newTitle,
      content: finalContent, // Įdedame h1 atgal į turinį
      snippet: generateSnippet(finalContent),
      wordCount: countWords(finalContent),
      userId: uid,
      folderId: folderId,
      agencyId: agencyId || null,
      clientId: clientId || null,
      projectId: projectId || null,
      createdAt: FieldValue.serverTimestamp(),
      lastEdited: FieldValue.serverTimestamp(),
      status: 'draft',
      sourceUrl: release.sourceUrl,
      thumbnailUrl: release.textInfo.seo?.featuredImage || '',
      rewriteStyle: rewriteStyle,
    };

    const newDocRef = adminDb.collection('documents').doc();
    await newDocRef.set(docData);

    const conversationMetaRef = newDocRef.collection('conversation').doc('metadata');
    const messagesRef = conversationMetaRef.collection('messages');
    const initialMessage = {
        role: 'assistant',
        content: welcomeMessageContent,
        timestamp: FieldValue.serverTimestamp(),
        withTypingEffect: true
    };

    await adminDb.batch()
        .set(conversationMetaRef, { chatPhase: 'INTERACTIVE_REFINEMENT', lastUpdatedAt: FieldValue.serverTimestamp() })
        .set(messagesRef.doc(), initialMessage)
        .commit();

    return NextResponse.json({ success: true, newDocumentId: newDocRef.id });

  } catch (error) {
    console.error("[API:rewrite] Critical Error in POST handler:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: `Failed to rewrite and import. ${message}` }, { status: 500 });
  }
}

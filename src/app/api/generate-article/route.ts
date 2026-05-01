import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from "@google/genai";
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { DocumentData } from 'firebase-admin/firestore';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { welcomeMessageContent, MESSAGES } from '@/lib/constants/messages';
import { getFolderIdForDocument } from '@/lib/folder-helpers';
import { logAIResult } from '@/lib/api/ai-usage-logger';

// Zod schemas for different modes
const simpleModeSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(200, "Topic must be less than200 characters"),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  wordCount: z.number().min(100).max(2000),
  writingStyle: z.string().min(1, "Writing style is required"),
  fileUrl: z.string().url().optional(),
  agencyId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  scheduledDate: z.string().optional(),
});

const advancedModeSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(200),
  targetKeywords: z.array(z.string()),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  metaTitle: z.string().optional(),
  backlinks: z.array(z.string()),
  tone: z.string().min(1, "Tone is required"),
  wordCount: z.number().min(100).max(2000),
  articleStructure: z.string(),
  customInstructions: z.string().optional(),
  file: z.any().optional(),
  fileUrl: z.string().optional(),
  addFAQ: z.boolean().optional(),
  agencyId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  scheduledDate: z.string().optional(),
});

// Note: file mode would require file parsing - for now we'll create a placeholder
const fileModeSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  topic: z.string().optional().default("General Topic"),
});

const generateArticleSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('simple'),
    payload: simpleModeSchema,
    idToken: z.string().min(1, "Authentication token is required"),
  }),
  z.object({
    mode: z.literal('advanced'),
    payload: advancedModeSchema,
    idToken: z.string().min(1, "Authentication token is required"),
  }),
  z.object({
    mode: z.literal('from-file'),
    payload: fileModeSchema,
    idToken: z.string().min(1, "Authentication token is required"),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = checkRateLimit('generateArticle', clientIp);
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse();
    }

    const body = await req.json();

    const validationResult = generateArticleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: MESSAGES.errors.validationError, details: validationResult.error.format() }, { status: 400 });
    }

    const { mode, payload, idToken } = validationResult.data;

    // Patikriname, ar tokenas egzistuoja
    if (!idToken) {
      return NextResponse.json({ error: MESSAGES.errors.authenticationRequired }, { status: 401 });
    }

    // Verifikuojame tokeną
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json({ error: MESSAGES.errors.authenticationFailed }, { status: 401 });
    }

    const uid = decodedToken.uid; // Gauname patvirtinto vartotojo ID

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: MESSAGES.errors.serverError }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    let htmlContent: string;
    let initialTitle: string; // Pervadiname `title` į `initialTitle`
    let topic: string;

    // ======================= PAKEITIMAS: Pridedame meta laukus =======================
    let metaTitle: string | undefined;
    let metaDescription: string | undefined;
    // ==============================================================================

    // Construct prompt based on mode
    switch (mode) {
      case 'simple':
        const simplePayload = payload as z.infer<typeof simpleModeSchema>;
        topic = simplePayload.topic;
        initialTitle = simplePayload.title; // Naudojame laikiną pavadinimą
        const simplePrompt = buildSimplePrompt(simplePayload);
        const simpleResult = await ai.models.generateContent({
          model: modelName,
          contents: simplePrompt,
        });
        await logAIResult({ userId: uid, endpoint: 'generate-article/simple', model: modelName, result: simpleResult });
        htmlContent = simpleResult.text ?? '';
        
        if (!htmlContent) {
          throw new Error("AI failed to generate content for simple mode.");
        }
        
        // ======================= PAKEITIMAS: Generuojame meta description =======================
        metaTitle = initialTitle; // metaTitle bus toks pat kaip pagrindinis
        const metaDescPrompt = `Remdamasis šiuo straipsnio tekstu, sugeneruok trumpą (iki 160 simbolių) ir patrauklią SEO meta aprašymą. Grąžink TIK aprašymo tekstą.\n\nTekstas: ${htmlContent.substring(0, 2000)}`;
        const metaDescResult = await ai.models.generateContent({
          model: modelName,
          contents: metaDescPrompt,
        });
        await logAIResult({ userId: uid, endpoint: 'generate-article/meta-desc', model: modelName, result: metaDescResult });
        metaDescription = metaDescResult.text?.trim() || generateSnippet(htmlContent);
        // ========================================================================================
        break;

      // =================================================================================
      // PRASIDEDA PAGRINDINIAI PAKEITIMAI "ADVANCED" REŽIMUI
      // =================================================================================
      case 'advanced':
        const advancedPayload = payload as z.infer<typeof advancedModeSchema>;
        topic = advancedPayload.topic;
        initialTitle = advancedPayload.seoTitle || topic;
        // ======================= PAKEITIMAS: Išsaugome meta duomenis =======================
        metaTitle = advancedPayload.seoTitle;
        metaDescription = advancedPayload.seoDescription;
        // ===================================================================================

        // --- 1 ŽINGSNIS: GENERUOJAME DETALŲ PLANĄ (BLUEPRINT) ---
        const outlinePrompt = `
        Tu esi pasaulinio lygio SEO turinio strategas. Tavo užduotis - sukurti nepriekaištingą, detalų straipsnio planą (blueprint), remiantis vartotojo nurodymais.

        Vartotojo nurodymai:
        - Tema: ${advancedPayload.topic}
        - Antraštė: ${advancedPayload.seoTitle || advancedPayload.topic}
        - Meta antraštė (SEO): ${advancedPayload.metaTitle || advancedPayload.seoTitle || advancedPayload.topic}
        - Raktažodžiai: ${advancedPayload.targetKeywords.join(', ')}
        - SEO meta aprašymas: ${advancedPayload.seoDescription || 'Nepateiktas'}
        - Tonas: ${advancedPayload.tone}
        - Tikslinė apimtis: ~${advancedPayload.wordCount} žodžių
        - Struktūra: ${advancedPayload.articleStructure}
        - Vidinės nuorodos (backlinks): ${advancedPayload.backlinks.join(', ')}
        - Papildomos instrukcijos: ${advancedPayload.customInstructions || 'Nėra'}
        - Pridėti DUK sekciją: ${advancedPayload.addFAQ ? 'Taip' : 'Ne'}

        GRIEŽTOS TAISYKLĖS PLANUI:
        1.  Išanalizuok visus nurodymus ir sukurk logišką straipsnio struktūrą su H2 ir H3 antraštėmis.
        2.  Kiekvienai sekcijai numatyk pagrindines aptariamas mintis (talking points).
        3.  Strategiškai plane pažymėk, kurioje sekcijoje ir kurioje vietoje turėtų būti panaudoti raktažodžiai. Naudok formatą: [RAKTAŽODIS: '...'].
        4.  Taip pat plane numatyk, kur logiškai ir natūraliai įterpti vidines nuorodas. Naudok formatą: [NUORODA: '...'].
        5.  Jei nurodytas SEO meta aprašymas, atsižvelk į jį kuriant turinio temą ir toną.
        6.  Grąžink atsakymą TIK kaip validų JSON objektą su vienu raktu "outline", kurio vertė yra masyvas objektų. Kiekvienas objektas turi turėti "type" ('h2' arba 'h3') ir "title" raktus.

        GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.

        JSON Struktūros pavyzdys:
        {
          "outline": [
            { "type": "h2", "title": "Įžanga: Kodėl tai svarbu?", "points": ["Užkabinti skaitytoją...", "Paminėti [RAKTAŽODIS: '...']"] },
            { "type": "h2", "title": "Pagrindinė dalis" },
            { "type": "h3", "title": "Pirmas aspektas", "points": ["Paaiškinti X...", "Pateikti pavyzdį su [NUORODA: '...']"] },
            ...
          ]
        }
        `;

        const outlineResult = await ai.models.generateContent({
          model: modelName,
          contents: outlinePrompt,
        });
        await logAIResult({ userId: uid, endpoint: 'generate-article/outline', model: modelName, result: outlineResult });
        const outlineJsonText = outlineResult.text?.replace(/```json|```/g, '').trim();
        
        if (!outlineJsonText) {
          throw new Error("AI failed to generate article outline.");
        }
        
        const { outline } = JSON.parse(outlineJsonText);

        // --- 2 ŽINGSNIS: GENERUOJAME KIEKVIENĄ SEKCIJĄ ATSKIRAI ---
        const htmlSections: string[] = [];
        for (const section of outline) {
          const sectionPrompt = `
          Tu esi ekspertas rašytojas. Tavo užduotis - parašyti VIENĄ konkrečią straipsnio sekciją, remiantis bendru planu.

          VISAS STRAIPSNIO PLANAS (kontekstui):
          ${JSON.stringify(outline, null, 2)}

          DABARTINĖ UŽDUOTIS:
          Parašyk TIK šią sekciją: "${section.title}" (${section.type}).
          - Rašyk ${advancedPayload.tone} tonu.
          - Vadovaukis plano punktais (points), jei jie nurodyti.
          - Natūraliai integruok nurodytus raktažodžius ir nuorodas.
          - Naudok HTML žymes: <p>, <ul>, <li>, <strong>, <a>. Antraštę formatuok su <${section.type}>.
          - Grąžink TIK sugeneruotą sekcijos HTML kodą, be jokių paaiškinimų.

          GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.
          `;

          const sectionResult = await ai.models.generateContent({
            model: modelName,
            contents: sectionPrompt,
          });
          await logAIResult({ userId: uid, endpoint: 'generate-article/section', model: modelName, result: sectionResult });
          const sectionText = sectionResult.text ?? '';
          if (sectionText) {
            htmlSections.push(sectionText);
          }
        }

        htmlContent = htmlSections.join('\n');
        break;

      // =================================================================================
      // PAKEITIMŲ PABAIGA
      // =================================================================================

      case 'from-file':
        const filePayload = payload as z.infer<typeof fileModeSchema>;
        topic = filePayload.topic || "Document Analysis";
        initialTitle = `Analysis: ${filePayload.fileName}`;
        const filePrompt = buildFilePrompt(filePayload);
        const fileResult = await ai.models.generateContent({
          model: modelName,
          contents: filePrompt,
        });
        await logAIResult({ userId: uid, endpoint: 'generate-article/from-file', model: modelName, result: fileResult });
        htmlContent = fileResult.text ?? '';
        
        if (!htmlContent) {
          throw new Error("AI failed to generate content from file.");
        }
        break;

      default:
        throw new Error('Invalid mode');
    }

    if (!htmlContent || htmlContent.length < 100) {
      throw new Error("AI returned invalid or too short article content.");
    }

    // === NAUJAS KODAS: GENERUOJAME SEO PAVADINIMĄ (META TITLE) ===
    const titlePrompt = `Based on the following article content, generate a concise, compelling, and SEO-optimized title (meta title) under 60 characters. Return ONLY title text, without any quotes or prefixes. Article content snippet: ${htmlContent.substring(0, 1500)}`;

    let documentTitle = initialTitle; // Fallback to original title
    try {
      const titleResult = await ai.models.generateContent({
        model: modelName,
        contents: titlePrompt,
      });
      await logAIResult({ userId: uid, endpoint: 'generate-article/seo-title', model: modelName, result: titleResult });
      const generatedTitle = titleResult.text?.trim();
      if (generatedTitle) {
        documentTitle = generatedTitle.replace(/^"|"$/g, ''); // Nuimame kabutes, jei AI jas pridėjo
      }
    } catch (titleError) {
      console.warn("Failed to generate a custom SEO title, using fallback.", titleError);
    }
    // === NAUJO KODO PABAIGA ===

    // Extract agencyId, clientId, projectId, and scheduledDate from payload based on mode
    let agencyId: string | null = null;
    let clientId: string | null = null;
    let projectId: string | null = null;
    let scheduledDate: string | undefined = undefined;
    
    if (mode === 'simple') {
      const simplePayload = payload as z.infer<typeof simpleModeSchema>;
      agencyId = simplePayload.agencyId === undefined ? null : simplePayload.agencyId;
      clientId = simplePayload.clientId === undefined ? null : simplePayload.clientId;
      projectId = simplePayload.projectId === undefined ? null : simplePayload.projectId;
      scheduledDate = simplePayload.scheduledDate;
    } else if (mode === 'advanced') {
      const advancedPayload = payload as z.infer<typeof advancedModeSchema>;
      agencyId = advancedPayload.agencyId === undefined ? null : advancedPayload.agencyId;
      clientId = advancedPayload.clientId === undefined ? null : advancedPayload.clientId;
      projectId = advancedPayload.projectId === undefined ? null : advancedPayload.projectId;
      scheduledDate = advancedPayload.scheduledDate;
    }

    // --- PRADĖKITE PAKEITIMĄ ČIA ---
    const folderId = agencyId ? await getFolderIdForDocument(agencyId, clientId, projectId) : null;
    // --- PAKEITIMO PABAIGA ---

    // Create document and conversation structure using writeBatch for atomic operations
    const docData: DocumentData = {
      title: initialTitle || documentTitle, // <-- NAUDOJAME SUGENERUOTĄ PAVADINIMĄ (SEO TITLE)
      content: `${htmlContent}`, // H1 is user-provided title
      // ======================= PAKEITIMAS: Pridedame naujus laukus =======================
      metaTitle: metaTitle || documentTitle,
      metaDescription: metaDescription || generateSnippet(htmlContent), // Fallback
      // =================================================================================
      snippet: generateSnippet(htmlContent),
      userId: uid,
      // --- PRADĖKITE PAKEITIMĄ ČIA ---
      folderId: folderId, // Pakeičiame iš null
      // --- PAKEITIMO PABAIGA ---
      agencyId: agencyId, // <-- agencyId iš payload
      clientId: clientId, // <-- clientId iš payload
      projectId: projectId, // <-- PRIDĖTI projectId iš payload
      createdAt: FieldValue.serverTimestamp(),   // <-- 2. PAKEISKITE ČIA
      lastEdited: FieldValue.serverTimestamp(),  // <-- IR ČIA
      wordCount: countWords(htmlContent),
      status: 'draft',
    };

    // Initialize writeBatch for atomic operations
    const batch = adminDb.batch();
    const newDocRef = adminDb.collection('documents').doc(); // Generate ID in advance

    // 1. Create document
    batch.set(newDocRef, docData);

    // 2. Create conversation metadata
    const conversationMetaRef = newDocRef.collection('conversation').doc('metadata');
    batch.set(conversationMetaRef, {
      chatPhase: 'INTERACTIVE_REFINEMENT',
      blueprint: {},
      lastUpdatedAt: FieldValue.serverTimestamp(),
    });

    // 3. Create the initial welcome message from AI assistant

    const messagesRef = conversationMetaRef.collection('messages');
    const initialMessageRef = messagesRef.doc();
    const initialMessage = {
        role: 'assistant',
        content: welcomeMessageContent,
        timestamp: FieldValue.serverTimestamp(),
        withTypingEffect: true
    };
    batch.set(initialMessageRef, initialMessage);

    // Execute batch transaction
    await batch.commit();

    const documentId = newDocRef.id;

    // --- AUTOMATINIO PLANAVIMO LOGIKA ---
    if (scheduledDate && agencyId && clientId && projectId) {
      try {
        // Nukopijuojame "Smart Time-Slotting" logiką iš /api/agency/schedule-document
        const [year, month, day] = scheduledDate.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        
        const query = adminDb.collection('schedules')
            .where('projectId', '==', projectId)
            .where('scheduledAt', '>=', Timestamp.fromDate(startOfDay))
            .where('scheduledAt', '<=', Timestamp.fromDate(endOfDay))
            .orderBy('scheduledAt', 'desc');

        const snapshot = await query.get();
        let newScheduledTime: Date;
        if (snapshot.empty) {
            newScheduledTime = new Date(startOfDay);
            newScheduledTime.setUTCHours(8, 0, 0, 0);
        } else {
            const latestTime = snapshot.docs[0].data().scheduledAt.toDate();
            newScheduledTime = new Date(latestTime.getTime() + 4 * 60 * 60 * 1000); // Numatytasis intervalas
        }

        const newScheduleRef = adminDb.collection('schedules').doc();
        await newScheduleRef.set({
            documentId: documentId,
            agencyId: agencyId,
            clientId: clientId,
            projectId: projectId,
            scheduledAt: Timestamp.fromDate(newScheduledTime),
            status: 'scheduled',
            createdAt: FieldValue.serverTimestamp(),
            createdBy: uid,
        });

        // Atnaujiname ir patį dokumentą, kad būtų 'scheduled'
        await newDocRef.update({ status: 'scheduled' });
        console.log(`Document ${documentId} automatically scheduled for ${scheduledDate}`);

      } catch (scheduleError) {
        // Jei planavimas nepavyksta, tęsiame toliau, bet išvedame klaidą
        console.error(`Automatic scheduling failed for document ${documentId}:`, scheduleError);
      }
    }
    // --- PABAIGA ---

    return NextResponse.json({
      success: true,
      documentId,
      message: MESSAGES.success.draftCreated
    });

  } catch (error) {
    console.error("Article generation error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: MESSAGES.errors.generationFailed + ". " + message }, { status: 500 });
  }
}

function buildSimplePrompt(payload: z.infer<typeof simpleModeSchema>): string {
  const fileInstruction = payload.fileUrl
    ? "If a document is provided as context, use it as primary source of information to write the article. Summarize, analyze, and expand upon its content."
    : "Use your general knowledge to write the article.";

  return `
    Write an SEO-optimized article in HTML format with the following specifications:

    TITLE: "${payload.title}"
    TOPIC: "${payload.topic}"
    WORD COUNT: ${payload.wordCount}
    STYLE: ${payload.writingStyle}

    REQUIREMENTS:
    - ${fileInstruction}
    - Start immediately with HTML content (no H1 tags)
    - Use proper H2 and H3 headings for structure
    - Make it engaging and informative
    - Include practical examples and insights
    - Natural keyword integration
    - Professional structure with introduction and conclusion

    GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.

    FORMAT: Return ONLY raw HTML content of the article body. Do NOT include <h1>, <html>, <body> tags or markdown code blocks like \`\`\`html.
  `;
}


function buildFilePrompt(payload: z.infer<typeof fileModeSchema>): string {
  return `
    Analyze the provided document "${payload.fileName}" and generate a comprehensive article based on its content.

    Please create a well-structured article that:
    - Extracts key insights and main themes
    - Builds upon the document's content with additional analysis
    - Maintains professional tone and structure
    - Provides value through deeper exploration of topics
    - Includes practical applications where relevant

    GRIEŽTA TAISYKLĖ ANTRAŠTĖMS (H1, H2, H3...): Niekada nenaudok 'Title Case' formato (kai kiekvienas žodis prasideda didžiąja raide). Visada naudok 'Sentence case' formatą (tik pirmas žodis ir tikriniai daiktavardžiai prasideda didžiąja raide). Ši taisyklė galioja visoms kalboms, išskyrus anglų.

    FORMAT: Clean HTML content with proper heading structure.
  `;
}

function generateSnippet(htmlContent: string): string {
  // Strip HTML tags and get first 150 characters
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
}

function countWords(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

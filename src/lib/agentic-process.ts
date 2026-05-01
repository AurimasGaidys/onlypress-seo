// src/lib/agentic-process.ts
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import { getStorage } from 'firebase-admin/storage';
import { AgenticSession, AgentMessage } from '@/types/agentic-generation';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");
const genAI = new GoogleGenAI({ apiKey });

async function updateSession(sessionId: string, data: Partial<AgenticSession>) {
  const sessionRef = adminDb.doc(`agentic_sessions/${sessionId}`);
  await sessionRef.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
}

async function getAgentResponse(sessionId: string, agent: 'Strategos' | 'Scriptor', prompt: string, thinkingTime: number): Promise<string> {
  const thinkingMessage: AgentMessage = {
    agent: 'System',
    content: 'Thinking...',
    timestamp: new Date(),
  };
  await updateSession(sessionId, { chatHistory: FieldValue.arrayUnion(thinkingMessage) as unknown as AgentMessage[] });

  await sleep(thinkingTime);

  const personaPrompts = {
    Strategos: `Tu esi 'Strategos', pasaulinio lygio SEO analitikas ir turinio strategas. Bendrauk aiškiai, struktūruotai. TAVO ATSAKYMAS TURI BŪTI AIŠKIAI STRUKTŪRUOTAS. Naudok Markdown formatavimą (pvz., sąrašus su - arba *, paryškintą tekstą su **), kad tavo atsakymai būtų lengvai skaitomi.`,
    Scriptor: `Tu esi 'Scriptor', talentingas rašytojas ir turinio kūrėjas. Bendrauk kūrybiškai, bet profesionaliai. TAVO ATSAKYMAS TURI BŪTI AIŠKIAI STRUKTŪRUOTAS. Naudok Markdown formatavimą (pvz., sąrašus, paryškintą tekstą, citatas su >), kad tavo atsakymai būtų įtraukiantys ir lengvai skaitomi.`
  };

  const fullPrompt = `${personaPrompts[agent]}\n\nUŽDUOTIS:\n${prompt}`;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';
  const result = await genAI.models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
  });
  const responseText = result.text || '';

  const message: AgentMessage = {
    agent,
    content: responseText,
    timestamp: new Date(),
    thinkingTime,
  };
  await updateSession(sessionId, { chatHistory: FieldValue.arrayUnion(message) as unknown as AgentMessage[] });

  return responseText;
}

export async function runAgenticProcess(sessionId: string) {
  const sessionRef = adminDb.doc(`agentic_sessions/${sessionId}`);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    console.error(`Session ${sessionId} not found!`);
    return;
  }
  const session = sessionSnap.data() as AgenticSession;

  switch (session.status) {
    case 'initializing':
      await handleTitleGeneration(sessionId, session);
      break;
    case 'awaiting_title_selection':
      if (session.selectedTitle) {
        await updateSession(sessionId, { status: 'planning' });
        await runAgenticProcess(sessionId);
      }
      break;
    case 'planning':
      await handlePlanningPhase(sessionId, session);
      break;
    case 'writing':
      await handleWritingPhase(sessionId, session);
      break;
    case 'image_planning':
      await handleImagePlanningPhase(sessionId, session);
      break;
    case 'meta_generating':
      await handleMetaGeneratingPhase(sessionId, session);
      break;
    case 'done':
      console.log(`[Session ${sessionId}] Process finished. Awaiting user action.`);
      break;
  }
}

async function handleTitleGeneration(sessionId: string, session: AgenticSession) {
  await updateSession(sessionId, {
    status: 'titles_generating',
    currentStep: '🔄 Generating titles...',
  });

  const responseText = await getAgentResponse(
    sessionId,
    'Strategos',
    `Remdamasis tema "${session.topic}", sugeneruok 5 SEO optimizuotas ir patrauklias straipsnio antraštes. Grąžink jas kaip paprastą sąrašą.`,
    3000
  );

  const generatedTitles = responseText.split('\n').map(t => t.replace(/^- \s*|\d+\.\s*/, '').trim()).filter(Boolean);

  await updateSession(sessionId, {
    status: 'awaiting_title_selection',
    currentStep: '✅ Titles generated. Please select one.',
    generatedTitles,
  });
}

async function handlePlanningPhase(sessionId: string, session: AgenticSession) {
  await updateSession(sessionId, { currentStep: '📋 Planning SEO strategy...' });
  
  const keywordsPrompt = `Based on topic "${session.topic}" and title "${session.selectedTitle}", propose 3-5 primary and 5-7 semantic keywords. Also, recommend an optimal article length in words. End by asking Scriptor for an opinion.`;
  await getAgentResponse(sessionId, 'Strategos', keywordsPrompt, 5000);

  const feedbackPrompt = `Review Strategos' keyword and length proposal. Do you agree, or do you have suggestions for improvement? Justify your answer.`;
  await getAgentResponse(sessionId, 'Scriptor', feedbackPrompt, 4000);

  const planPrompt = `Based on the approved strategy, create a detailed article outline with H2 and H3 headings. Ensure it follows SEO best practices. At the end, ask Scriptor for feedback on the plan.`;
  await getAgentResponse(sessionId, 'Strategos', planPrompt, 8000);

  const improvementPrompt = `Critically review the proposed plan. Find at least one area for improvement (e.g., add an E-E-A-T element, reorder sections, clarify a heading). Propose a specific change and justify it.`;
  await getAgentResponse(sessionId, 'Scriptor', improvementPrompt, 5000);

  const finalPlanPrompt = `I agree with your suggestion. I'm updating the plan. Present the final, confirmed article outline. After the plan, give a clear command to Scriptor to start writing the first section.`;
  const finalPlan = await getAgentResponse(sessionId, 'Strategos', finalPlanPrompt, 3000);
  
  await updateSession(sessionId, { status: 'writing', seoPlan: { fullPlan: finalPlan } });
  await runAgenticProcess(sessionId);
}

async function handleWritingPhase(sessionId: string, session: AgenticSession) {
  await updateSession(sessionId, { currentStep: '✍️ Writing article...' });
  const fullPlan = session.seoPlan?.fullPlan || "No plan found.";
  
  // A simple way to extract sections from Markdown list
  const sections = fullPlan.match(/(\*\*H[23]:\*\*.*)/g) || fullPlan.match(/(- .*)/g) || [];

  let fullHtml = `<h1>${session.selectedTitle}</h1>`;

  for (const sectionTitle of sections) {
    const cleanTitle = sectionTitle.replace(/(\*\*H[23]:\*\*|-)\s*/, '').trim();
    await updateSession(sessionId, { currentStep: `✍️ Writing section: "${cleanTitle}"` });

    const writePrompt = `Write the article section "${cleanTitle}" in HTML format. Return ONLY the HTML content, without any explanations. Make sure to use appropriate tags like <h2>, <h3>, <p>, <ul>, etc.`;
    const sectionHtml = await getAgentResponse(sessionId, 'Scriptor', writePrompt, 8000);
    
    fullHtml += '\n' + sectionHtml;
    await updateSession(sessionId, { fullArticleHtml: fullHtml });
  }

  await updateSession(sessionId, { status: 'image_planning' });
  await runAgenticProcess(sessionId);
}

async function handleImagePlanningPhase(sessionId: string, session: AgenticSession) {
  await updateSession(sessionId, { currentStep: '🖼️ Planning images...' });
  
  const imagePlanPrompt = `The article is complete. Review the full HTML content and identify 2-3 logical H2 headings that should have an image. Then, ask Scriptor to propose creative prompts for them.`;
  await getAgentResponse(sessionId, 'Strategos', imagePlanPrompt, 5000);

  const promptSuggestionPrompt = `Based on Strategos' request, create detailed, photorealistic prompts for image generation for the selected headings. Return them as a simple list.`;
  await getAgentResponse(sessionId, 'Scriptor', promptSuggestionPrompt, 7000);

  // Generate actual images using the new Gemini 2.5 Flash Image model
  await updateSession(sessionId, { currentStep: '🎨 Generating images...' });
  
  let updatedHtml = session.fullArticleHtml || '';
  
  // Extract H2 headings for image generation
  const h2Matches = updatedHtml.match(/<h2[^>]*>.*?<\/h2>/g) || [];
  
  if (h2Matches.length > 0) {
    // Create prompts object for image generation
    const prompts: Record<string, string> = {};
    
    h2Matches.forEach((h2, index) => {
      const headingText = h2.replace(/<[^>]+>/g, '').trim();
      if (headingText && index < 2) { // Generate for first 2 H2s
        const blockId = `h2_${index}`;
        prompts[blockId] = `Create a professional, photorealistic image representing: "${headingText}". High quality, detailed, suitable for article illustration.`;
      }
    });

    // Generate images using our existing API logic
    if (Object.keys(prompts).length > 0) {
      try {
        const imageResults: Record<string, string> = {};
        
        for (const [blockId, prompt] of Object.entries(prompts)) {
          try {
            // Use the same image generation logic as in god-mode
            const result = await genAI.models.generateContent({
              model: "gemini-2.5-flash-image",
              contents: [{
                role: 'user',
                parts: [
                  { text: `${prompt}, high resolution, professional quality` }
                ]
              }]
            });

            const imagePart = result.candidates?.[0]?.content?.parts?.find((part) => 'inlineData' in part && part.inlineData);

            if (imagePart && imagePart.inlineData) {
              // Upload to Firebase Storage
              const base64Data = imagePart.inlineData.data;
              const imageBuffer = Buffer.from(`data:image/png;base64,${base64Data}`, 'base64');
              
              // Get userId from session
              const userId = session.userId || 'unknown';
              const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
              
              if (bucketName) {
                const bucket = getStorage().bucket(bucketName);
                const uniqueFilename = `images/${userId}/${Date.now()}-${blockId}.png`;
                const file = bucket.file(uniqueFilename);

                await file.save(imageBuffer, {
                  metadata: { contentType: 'image/png' },
                });

                const [url] = await file.getSignedUrl({
                  action: 'read',
                  expires: '03-09-2491',
                });
                
                imageResults[blockId] = url;
              }
            }
          } catch (error) {
            console.error(`Error generating image for ${blockId}:`, error);
          }
        }

        // Insert generated images into HTML
        let htmlWithImages = updatedHtml;
        h2Matches.forEach((h2, index) => {
          const blockId = `h2_${index}`;
          const imageUrl = imageResults[blockId];
          
          if (imageUrl) {
            const headingText = h2.replace(/<[^>]+>/g, '').trim();
            const imageHtml = `<img src="${imageUrl}" alt="${headingText}" style="width: 100%; height: auto; margin: 20px 0; border-radius: 8px;">`;
            htmlWithImages = htmlWithImages.replace(h2, h2 + '\n' + imageHtml);
          }
        });
        
        updatedHtml = htmlWithImages;
        
      } catch (error) {
        console.error('Error in image generation process:', error);
      }
    }
  }

  await updateSession(sessionId, { fullArticleHtml: updatedHtml, status: 'meta_generating' });
  await runAgenticProcess(sessionId);
}

async function handleMetaGeneratingPhase(sessionId: string, session: AgenticSession) {
  await updateSession(sessionId, { currentStep: '🏷️ Generating meta data...' });

  const metaPrompt = `Final step. Review the entire article and generate:
1. SEO Meta Title (max 60 chars)
2. SEO Meta Description (max 160 chars)
3. ALT texts for all images (<img> tags).

Return the response ONLY as a valid JSON object with keys: "metaTitle", "metaDescription", "altTexts" (an array of strings).`;
  
  const metaJsonText = await getAgentResponse(sessionId, 'Strategos', metaPrompt, 6000);
  
  let metaData = {};
  try {
    const cleanJson = metaJsonText.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);
    const imageAlts: Record<string, string> = {};
    if (parsedData.altTexts && Array.isArray(parsedData.altTexts)) {
      parsedData.altTexts.forEach((alt: string, index: number) => {
        imageAlts[`image_${index}`] = alt;
      });
    }
    metaData = { metaTitle: parsedData.metaTitle, metaDescription: parsedData.metaDescription, imageAlts };
  } catch (e) {
    console.error("Failed to parse meta data JSON:", e);
    metaData = { metaTitle: session.selectedTitle, metaDescription: '', imageAlts: {} };
  }
  
  const finalMessage: AgentMessage = {
    agent: 'System',
    content: "Work complete. The article is ready. The user can now save it.",
    timestamp: new Date()
  };
  
  await updateSession(sessionId, { 
    status: 'done',
    currentStep: '✅ Article Ready! Click "Save as Document".',
    metaData,
    chatHistory: FieldValue.arrayUnion(finalMessage) as unknown as AgentMessage[]
  });
}

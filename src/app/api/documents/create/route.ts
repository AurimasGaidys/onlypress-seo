import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import mammoth from 'mammoth';
import { marked } from 'marked';
import { welcomeMessageContent } from '@/lib/constants/messages';
import { logAudit } from '@/lib/auditLogger';
import { getFolderIdForDocument } from '@/lib/folder-helpers';
import * as cheerio from 'cheerio';
import { RssRelease } from '@/types/rss';

// Helper function to get pdf-parse (dynamic import for Next.js compatibility)
async function getPdfParser() {
  const pdf = await import('pdf-parse');
  return (pdf as unknown as { default: (buffer: Buffer) => Promise<{ text: string }> }).default;
}

// Helper function to upload images to Firebase Storage
async function uploadImageToStorage(imageBuffer: Buffer, originalFilename: string, userId: string): Promise<string> {
  const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  const uniqueFilename = `imports/${userId}/${Date.now()}-${originalFilename}`;
  const file = bucket.file(uniqueFilename);

  await file.save(imageBuffer, {
    metadata: { contentType: 'image/png' },
  });

  const [url] = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });
  return url;
}

// Helper functions for content processing
function generateSnippet(htmlContent: string): string {
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
}

function countWords(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

// Server-side version of image extraction using regex
function extractFirstImageFromHtmlServer(htmlContent: string): string | null {
  if (!htmlContent) return null;

  // Use regex to find the first img tag with src
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
}

// Request schema validation
const createDocumentSchema = z.object({
  idToken: z.string(),
  creationData: z.object({
    source: z.enum(['blank', 'file', 'release', 'god-mode']),
    title: z.string().optional(),
    htmlContent: z.string().optional(),
    file: z.string().optional(), // base64 encoded file content
    fileExtension: z.string().optional(),
    scheduledDate: z.string().optional(), // <-- PRIDĖTI
    folderId: z.string().optional(), // <-- PRIDĖTAS folderId
    release: z.object({
      id: z.string(),
      textInfo: z.object({
        title: z.string(),
        content: z.string(),
        seo: z.object({
          featuredImage: z.string().optional(),
          title: z.string(),
          description: z.string(),
        }),
      }),
      sourceUrl: z.string().url(),
      status: z.string(),
      textLanguage: z.string(),
      publishCategory: z.string(),
      publishCategories: z.array(z.string()),
      dateCreated: z.number(),
      dateUpdated: z.number(),
      sourceName: z.string().optional(),
      contacts: z.object({
        name: z.string().optional(),     // Padarome neprivalomu
        company: z.string().optional(), // Padarome neprivalomu
        phone: z.string().optional(),     // Padarome neprivalomu
        position: z.string().optional(),// Padarome neprivalomu
      }).optional(),
    }).optional(),
    context: z.object({
      agencyId: z.string().nullable().optional(),
      clientId: z.string().nullable().optional(),
      projectId: z.string().nullable().optional(),
    }),
  }),
});

async function processFileContent(
  fileBuffer: Buffer,
  fileExtension: string,
  userId: string
): Promise<string> {
  switch (fileExtension) {
    case '.docx': {
      const options = {
        convertImage: mammoth.images.imgElement(async (image: { read: () => Promise<Buffer> }) => {
          const imageBuffer = await image.read();
          const imageUrl = await uploadImageToStorage(imageBuffer, `image-${Date.now()}.png`, userId);
          return { src: imageUrl };
        }),
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh"
        ]
      };

      const docxResult = await mammoth.convertToHtml({ buffer: fileBuffer }, options);
      return docxResult.value;
    }

    case '.pdf': {
      const pdfParser = await getPdfParser();
      const data = await pdfParser(fileBuffer);
      return data.text.split('\n').map(p => `<p>${p}</p>`).join('');
    }

    case '.md':
      return marked(fileBuffer.toString('utf-8')) as string;

    case '.txt':
      return fileBuffer.toString('utf-8').split('\n').map(p => `<p>${p}</p>`).join('');

    default:
      throw new Error('Unsupported file type.');
  }
}

async function processReleaseContent(release: RssRelease): Promise<string> {
  const $ = cheerio.load(release.textInfo.content);
  $('script, style, .clearfix').remove();
  return `<h1>${release.textInfo.title}</h1>\n` + $.html();
}

async function resolveAndValidateContext(
  context: { agencyId?: string | null; clientId?: string | null; projectId?: string | null },
  userId: string
): Promise<{ agencyId: string | null; clientId: string | null; projectId: string | null; clientName: string | null }> {
  const { agencyId: initialAgencyId, clientId: initialClientId, projectId: initialProjectId } = context;
  let agencyId = initialAgencyId || null;
  const clientId = initialClientId || null;
  const projectId = initialProjectId || null;
  let clientName: string | null = null;

  // Validate client relationship if clientId is provided
  if (clientId) {
    const clientRef = adminDb.doc(`clients/${clientId}`);
    const clientSnap = await clientRef.get();
    if (!clientSnap.exists) {
      throw new Error("Client not found.");
    }
    const clientData = clientSnap.data();
    agencyId = clientData?.agencyId || agencyId;
    clientName = clientData?.name || null;

    // Security check - ensure user has permission for this agency
    if (agencyId) {
      if (agencyId.startsWith("personal")) {

      } else {
        const agencyRef = adminDb.doc(`seo-agencies-private/${agencyId}`);
        const agencySnap = await agencyRef.get();
        if (!agencySnap.exists || !agencySnap.data()?.members[userId]) {
          throw new Error("You do not have permission to create documents for this client." + JSON.stringify(clientData));
        }
      }
    }
  }

  // Validate project relationship if projectId is provided
  if (projectId) {
    const projectRef = adminDb.doc(`projects/${projectId}`);
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists) {
      throw new Error("Project not found.");
    }
    const projectData = projectSnap.data();

    // Ensure project belongs to the specified client
    if (projectData?.clientId !== clientId) {
      throw new Error("Project does not belong to the specified client.");
    }
  }

  return { agencyId, clientId, projectId, clientName };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, creationData } = createDocumentSchema.parse(body);

    // Authenticate user
    const user = await adminAuth.verifyIdToken(idToken);
    const { source, title, htmlContent, file, fileExtension, scheduledDate, folderId, release, context } = creationData;

    // Resolve and validate context
    const { agencyId, clientId, projectId, clientName } = await resolveAndValidateContext(context, user.uid);

    // Get folder ID for the document - use provided folderId first, otherwise fallback to helper
    const finalFolderId = folderId || (agencyId ? await getFolderIdForDocument(agencyId, clientId, projectId) : null);

    // Process content based on source
    let processedTitle = title || 'Untitled Document';
    let processedContent = htmlContent || '';
    let thumbnailUrl = '';
    let sourceUrl = '';

    switch (source) {
      case 'blank':
        processedContent = `<p>Content goes here</p>`;
        // No thumbnail for blank documents initially
        break;

      case 'file':
        if (!file || !fileExtension) {
          throw new Error("File and fileExtension are required for file source.");
        }
        const fileBuffer = Buffer.from(file, 'base64');
        processedContent = await processFileContent(fileBuffer, fileExtension, user.uid);
        // Extract first image from processed content
        const fileImage = extractFirstImageFromHtmlServer(processedContent);
        if (fileImage) {
          thumbnailUrl = fileImage;
        }
        break;

      case 'release':
        if (!release) {
          throw new Error("Release data is required for release source.");
        }
        processedContent = await processReleaseContent(release);
        processedTitle = release.textInfo.title;
        thumbnailUrl = release.textInfo.seo?.featuredImage || '';
        sourceUrl = release.sourceUrl;
        break;

      case 'god-mode':
        if (!htmlContent) {
          throw new Error("HTML content is required for god-mode source.");
        }
        processedContent = htmlContent;
        // Extract first image from HTML content for thumbnail
        const godModeImage = extractFirstImageFromHtmlServer(processedContent);
        if (godModeImage) {
          thumbnailUrl = godModeImage;
        }
        break;

      default:
        throw new Error("Invalid source specified.");
    }

    // Create document in Firestore
    const newDocRef = adminDb.collection('documents').doc();
    const docData = {
      title: processedTitle,
      content: processedContent,
      snippet: generateSnippet(processedContent),
      wordCount: countWords(processedContent),
      userId: user.uid,
      agencyId: agencyId,
      clientId: clientId,
      projectId: projectId,
      folderId: finalFolderId,
      createdAt: FieldValue.serverTimestamp(),
      lastEdited: FieldValue.serverTimestamp(),
      status: 'draft',
      sourceUrl: sourceUrl,
      thumbnailUrl: thumbnailUrl,
    };

    await newDocRef.set(docData);

    const newDocumentId = newDocRef.id;

    // --- AUTOMATINIO PLANAVIMO LOGIKA ---
    if (scheduledDate && agencyId && clientId && projectId) {
      try {
        // Nukopijuojame "Smart Time-Slotting" logiką iš /api/agency/schedule-document
        const [year, month, day] = scheduledDate.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        const query = adminDb.collection('schedules')
          .where('agencyId', '==', agencyId)
          .where('scheduledAt', '>=', Timestamp.fromDate(startOfDay))
          .where('scheduledAt', '<=', Timestamp.fromDate(endOfDay));

        const snapshot = await query.orderBy('scheduledAt', 'desc').get();

        const projectSchedules = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.projectId === projectId;
        });

        let newScheduledTime: Date;
        if (projectSchedules.length === 0) {
          newScheduledTime = new Date(startOfDay);
          newScheduledTime.setUTCHours(8, 0, 0, 0);
        } else {
          const latestScheduleData = projectSchedules[0].data();
          const latestTime = latestScheduleData.scheduledAt.toDate();
          newScheduledTime = new Date(latestTime.getTime() + 4 * 60 * 60 * 1000); // Numatytasis intervalas
        }

        const newScheduleRef = adminDb.collection('schedules').doc();
        await newScheduleRef.set({
          documentId: newDocumentId,
          agencyId: agencyId,
          clientId: clientId,
          projectId: projectId,
          scheduledAt: Timestamp.fromDate(newScheduledTime),
          status: 'scheduled',
          createdAt: FieldValue.serverTimestamp(),
          createdBy: user.uid,
        });

        // Atnaujiname ir patį dokumentą, kad būtų 'scheduled'
        await newDocRef.update({ status: 'scheduled' });
        console.log(`Document ${newDocumentId} automatically scheduled for ${scheduledDate}`);

      } catch (scheduleError) {
        // Jei planavimas nepavyksta, tęsiame toliau, bet išvedame klaidą
        console.error(`Automatic scheduling failed for document ${newDocumentId}:`, scheduleError);
      }
    }
    // --- PABAIGA ---

    // Create initial conversation metadata
    const conversationMetaRef = newDocRef.collection('conversation').doc('metadata');
    const messagesRef = conversationMetaRef.collection('messages');

    const initialMessage = {
      role: 'assistant',
      content: welcomeMessageContent,
      timestamp: FieldValue.serverTimestamp(),
      withTypingEffect: true
    };

    await adminDb.batch()
      .set(conversationMetaRef, {
        chatPhase: 'INTERACTIVE_REFINEMENT',
        lastUpdatedAt: FieldValue.serverTimestamp()
      })
      .set(messagesRef.doc(), initialMessage)
      .commit();

    // Log audit if agency context
    if (agencyId) {
      await logAudit({
        agencyId,
        userId: user.uid,
        userEmail: user.email || 'Unknown',
        action: 'document_created',
        details: {
          documentTitle: processedTitle,
          clientName: clientName || 'N/A',
          source: source
        },
      });
    }

    return NextResponse.json({
      success: true,
      newDocumentId: newDocRef.id,
      title: processedTitle
    });

  } catch (error) {
    console.error("Unified document creation error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

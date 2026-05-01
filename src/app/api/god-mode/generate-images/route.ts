import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';
import { generateImagesSchema } from '@/lib/schemas';
import { z } from 'zod';
import { GoogleGenAI } from "@google/genai";
import { logAIResult } from '@/lib/api/ai-usage-logger';


// function base64ToBuffer(base64: string): Buffer {
//   const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
//   return Buffer.from(base64Data, 'base64');
// }

async function uploadImageToStorage(imageBuffer: Buffer, filename: string, userId: string): Promise<string> {
  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error("Firebase Storage bucket name is not configured.");
    }
    const bucket = getStorage().bucket(bucketName);
    const uniqueFilename = `aiimages/${userId}/${Date.now()}-${filename}.png`;
    const file = bucket.file(uniqueFilename);

    await file.save(imageBuffer, {
      metadata: { contentType: 'image/png' },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491',
    });
    return url;
  } catch (error) {
    console.error("Error uploading image to storage:", error);
    throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateImageWithImagen2(prompt: string, apiKey: string): Promise<string> {

  const ai = new GoogleGenAI({ apiKey });

  // const response = await ai.models.generateImages({
  //   model: 'gemini-3-pro-image-preview',
  //   prompt: prompt,
  //   config: {
  //     numberOfImages: 1,
  //     includeRaiReason: true,
  //     safetyFilterLevel: SafetyFilterLevel.BLOCK_ONLY_HIGH
  //   },
  // });
  const conf = {
    tools: [{ googleSearch: {} }],
    imageConfig: {
      aspectRatio: "16:9",
      imageSize: "4K"
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: "Generate an image of" + prompt,
    config: conf
  });
  await logAIResult({ userId: 'system', endpoint: 'god-mode/generate-images', model: 'gemini-3-pro-image-preview', result: response });

  const imgResp = response?.candidates?.[0].content?.parts?.[0];

  console.log("response ===> ", prompt, imgResp);

  const imageData = imgResp?.inlineData?.data;

  return imageData || JSON.stringify(response);

  // let idx = 0;
  // for (const generatedImage of response.generatedImages || []) {
  //   const imgBytes = generatedImage?.image?.imageBytes || "";
  //   const buffer = Buffer.from(imgBytes, "base64");
  //   fs.writeFileSync(`imagen-${idx}.png`, buffer);
  //   idx++;
  // }
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateImageWithImagen(prompt: string, apiKey: string): Promise<string> {
  try {
    // Use Google Generative Language API for Imagen 3
    // Using the latest Imagen 3 model version
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        instances: [{
          prompt: prompt
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
          negativePrompt: 'low quality, blurry, distorted',
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Imagen API error: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();

    if (!data.predictions || data.predictions.length === 0) {
      throw new Error('No image generated in response');
    }

    const prediction = data.predictions[0];

    if (!prediction.bytesBase64Encoded) {
      throw new Error('No image data found in response');
    }

    return prediction.bytesBase64Encoded;

  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('godMode', clientIp);
  const steps = []

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse();
  }

  try {
    const body = await req.json();
    const { idToken, prompts } = generateImagesSchema.parse(body);

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Google API key is not configured");
    }

    const results: Record<string, { imageUrl: string; prompt: string }> = {};

    // Process each prompt sequentially to avoid rate limits
    for (const [blockId, prompt] of Object.entries(prompts)) {
      try {
        const fullPrompt = `${prompt}, high resolution, natural light`;

        console.log(`Generating image for block ${blockId}: ${fullPrompt}`);

        // Generate image using Imagen 3
        // const base64Data = await generateImageWithImagen(fullPrompt, apiKey);
        const base64Data = await generateImageWithImagen2(fullPrompt, apiKey);
        steps.push(`Generated image for block ${blockId}`);

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, "base64");//base64ToBuffer(`data:image/png;base64,${base64Data}`);

        // Upload to Firebase Storage
        const safeHeading = blockId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const imageUrl = await uploadImageToStorage(imageBuffer, safeHeading, userId);

        results[blockId] = { imageUrl, prompt };
        console.log(`Successfully generated image for block ${blockId}`);

      } catch (error) {
        console.error(`Error generating/uploading image for block ID "${blockId}":`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results[blockId] = {
          imageUrl: 'error',
          prompt: `${prompt} (Error: ${errorMessage})`
        };
      }
    }

    const failedCount = Object.values(results).filter(res => res.imageUrl === 'error').length;
    const successCount = Object.values(results).length - failedCount;

    if (failedCount > 0) {
      return NextResponse.json({
        message: `Generated ${successCount} of ${Object.values(results).length} images. ${failedCount} failed.`,
        steps:
          results
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error("God Mode image generation error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.format() }, { status: 400 });
    }
    return NextResponse.json({ error: `Failed to generate images. ${message}` }, { status: 500 });
  }
}

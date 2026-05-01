// src/lib/conversation/file-utils.ts
import { Part } from '@google/genai';
import mammoth from 'mammoth';

// Dinaminis importas, kuris naudoja saugią, gryno JavaScript, pdf.js versiją
async function getPdfParser() {
    const pdfParse = await import('pdf-parse');
    return (pdfParse as unknown as { default: (buffer: Buffer) => Promise<{ text: string }> }).default;
}

export async function buildFileParts(fileUrl: string): Promise<Part[]> {
  if (!fileUrl) {
    return [];
  }

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from URL: ${fileUrl}`);
  }

  const mimeType = response.headers.get('content-type') ?? '';
  const buffer = Buffer.from(await response.arrayBuffer());

  if (mimeType.startsWith('image/')) {
    return [{
        inlineData: {
          mimeType,
          data: buffer.toString('base64'),
        },
    }];
  }

  if (mimeType === 'application/pdf') {
    const pdfParser = await getPdfParser(); // Gauname saugią versiją
    const data = await pdfParser(buffer);
    return [{
        text: `\n\n--- ĮKELTO PDF DOKUMENTO TURINYS ---\n${data.text}\n--- DOKUMENTO PABAIGA ---\n`,
    }];
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ buffer });
    return [{
        text: `\n\n--- ĮKELTO DOCX DOKUMENTO TURINYS ---\n${value}\n--- DOKUMENTO PABAIGA ---\n`,
    }];
  }

  return [{
      text: `\n\n--- ĮKELTO TEKSTINIO FAILO TURINYS ---\n${buffer.toString('utf-8')}\n--- FAILO PABAIGA ---\n`,
  }];
}

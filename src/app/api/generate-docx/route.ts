// src/app/api/generate-docx/route.ts
import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error - html-to-docx does not have TypeScript definitions
import HTMLtoDOCX from 'html-to-docx';

export async function POST(request: NextRequest) {
  try {
    const { htmlContent } = await request.json();

    if (!htmlContent) {
      return NextResponse.json({ error: 'htmlContent is required' }, { status: 400 });
    }

    const fileBuffer = await HTMLtoDOCX(htmlContent, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });
    
    // Return the buffer as a Uint8Array with the correct content type
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

  } catch (error) {
    console.error('Error generating DOCX:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate DOCX file', details: message }, { status: 500 });
  }
}

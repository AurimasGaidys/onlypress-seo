import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  // Validate that url parameter exists and is a proper URL
  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  try {
    // Decode URL (handle double-encoded URLs from Firebase Storage)
    let decodedUrl = decodeURIComponent(imageUrl);
    
    // If still contains encoded characters, decode again
    if (decodedUrl.includes('%')) {
      decodedUrl = decodeURIComponent(decodedUrl);
    }
    
    // Validate URL format
    const url = new URL(decodedUrl);
    
    // Security checks - only allow specific domains
    const allowedDomains = [
      'storage.googleapis.com',
      'firebasestorage.googleapis.com',
      'rasytojai-bbb76.appspot.com'
    ];
    
    if (!allowedDomains.includes(url.hostname)) {
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 }
      );
    }
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return NextResponse.json(
        { error: 'Invalid protocol' },
        { status: 400 }
      );
    }

    // Extract file path from Firebase Storage URL
    // URL format: https://storage.googleapis.com/rasytojai-bbb76.appspot.com/images/filename.png
    const pathMatch = url.pathname.match(/\/rasytojai-bbb76\.appspot\.com\/(.+)/);
    
    if (!pathMatch || !pathMatch[1]) {
      return NextResponse.json(
        { error: 'Invalid Firebase Storage URL format' },
        { status: 400 }
      );
    }

    const filePath = pathMatch[1];
    
    // Get file from Firebase Storage
    const bucket = getStorage().bucket('rasytojai-bbb76.appspot.com');
    const file = bucket.file(filePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get file metadata
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'image/jpeg';
    
    // Download file as buffer
    const [buffer] = await file.download();

    // Create headers for response
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', buffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Create a proper Response with the buffer
    return new Response(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

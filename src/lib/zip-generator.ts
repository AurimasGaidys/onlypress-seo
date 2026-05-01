import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface DocumentData {
  title: string;
  htmlContent: string;
  featuredImageUrl?: string;
}

// Helper to fetch an image via our proxy and return as a Blob
async function fetchImageAsBlob(imageUrl: string): Promise<Blob> {
  try {
    const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${imageUrl} - ${response.statusText}`);
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    return response.blob();
  } catch (error) {
    console.error(`Error fetching image ${imageUrl}:`, error);
    throw error;
  }
}

export async function generateDocumentZip(doc: DocumentData) {
  toast.info('Starting ZIP generation...', { description: 'This may take a moment for articles with many images.' });

  try {
    const zip = new JSZip();
    // Better filename sanitization - keep basic valid filename characters
    const sanitizedTitle = doc.title
      .replace(/[<>:"/\\|?*]/g, '_') // Remove invalid Windows filename characters
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .substring(0, 50) // Limit length
      || 'document'; // Fallback if title becomes empty
    
    // 1. Generate DOCX via API
    const docxHtml = doc.htmlContent.replace(/<img[^>]*>/g, (match, index) => `[ Image ${index + 1} ]`);

    const docxResponse = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent: docxHtml }),
    });

    if (!docxResponse.ok) {
        throw new Error('Failed to generate DOCX file from API.');
    }

    const docxBuffer = await docxResponse.arrayBuffer();
    zip.file(`${sanitizedTitle}.docx`, docxBuffer);

    // 2. Prepare HTML and find image URLs
    const imageURLs: string[] = [];
    const imageNames: string[] = [];
    const modifiedHtml = doc.htmlContent.replace(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi, (match, src) => {
      if (!src) return match;
      imageURLs.push(src);
      // Better extension extraction - handle complex URLs
      const extension = src.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
      const validExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension) ? extension : 'jpg';
      const filename = `picture${imageURLs.length}.${validExtension}`;
      imageNames.push(filename);
      console.log(`Image mapping: ${src} -> img/${filename}`);
      return match.replace(src, `img/${filename}`);
    });
    
    console.log(`Found ${imageURLs.length} images in HTML`);
    console.log('Image URLs:', imageURLs);
    console.log('Image names:', imageNames);
    
    zip.file(`${sanitizedTitle}.html`, modifiedHtml);

    // 3. Download all images (featured + content)
    const allImageUrls = [...new Set([doc.featuredImageUrl, ...imageURLs].filter(Boolean) as string[])];
    const imgFolder = zip.folder('img');
    let failedCount = 0;

    if (allImageUrls.length > 0) {
      // Correctly create promises without a .catch
      const imagePromises = allImageUrls.map(url => fetchImageAsBlob(url));

      // Use Promise.allSettled as intended
      const results = await Promise.allSettled(imagePromises);

      // 4. Add successfully downloaded images to ZIP
      results.forEach((result, index) => {
        const originalUrl = allImageUrls[index];

        if (result.status === 'fulfilled') {
          const blob = result.value;
          let filename;

          if (originalUrl === doc.featuredImageUrl) {
            // Better extension handling for featured image
            const mimeType = blob.type.split('/')[1] || 'jpeg';
            const validExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(mimeType) ? mimeType : 'jpg';
            filename = `featured_image.${validExtension}`;
          } else {
            const urlIndex = imageURLs.indexOf(originalUrl);
            if (urlIndex !== -1) {
              filename = imageNames[urlIndex];
            }
          }

          if (filename) {
            imgFolder?.file(filename, blob);
            console.log(`Added image to ZIP: ${filename} (size: ${blob.size} bytes)`);
          }
        } else {
          failedCount++;
          console.warn(`Failed to download image: ${originalUrl}`, result.reason);
        }
      });
    }

    if (failedCount > 0) {
      toast.warning(`${failedCount} image(s) could not be downloaded`, { description: 'The ZIP file will be generated without them.' });
    }

    // 5. Generate and save the ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${sanitizedTitle}.zip`);
    toast.success('ZIP archive generated successfully!');
  } catch (error) {
    console.error('ZIP Generation Error:', error);
    toast.error('Failed to generate ZIP file', { description: error instanceof Error ? error.message : 'Unknown error' });
  }
}

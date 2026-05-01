// Failas: src/lib/rss-utils.ts

import { RssRelease } from '@/types/rss';

/**
 * Extracts all image URLs from an RSS release object's HTML content.
 * @param release - The RSS release object.
 * @returns An array of unique image URLs found within the content.
 */
export function extractImageUrls(release: RssRelease): string[] {
    const urls: string[] = [];

    // 1. Visada pridedame "featuredImage", jei jis yra, nepriklausomai nuo šaltinio.
    // Tai padaro logiką universalesne.
    if (release.textInfo.seo?.featuredImage) {
        try {
            // Patikriname, ar tai validus URL, kad išvengtume klaidų.
            urls.push(new URL(release.textInfo.seo.featuredImage).href);
        } catch {
            console.warn(`Invalid featuredImage URL: "${release.textInfo.seo.featuredImage}"`);
        }
    }

    if (typeof window !== 'undefined' && release.textInfo.content) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(release.textInfo.content, 'text/html');
        const images = doc.querySelectorAll('img');

        // 2. Patikimesnis bazinio URL nustatymas.
        let baseUrl: URL | null = null;
        if (release.sourceUrl) {
            try {
                baseUrl = new URL(release.sourceUrl);
            } catch {
                try {
                    // Bandoma pridėti "https://" jei URL'as nepilnas (pvz., "elta.lt/...")
                    baseUrl = new URL(`https://${release.sourceUrl}`);
                } catch {
                    console.warn(`Could not construct a valid base URL from sourceUrl: "${release.sourceUrl}"`);
                }
            }
        }

        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src) {
                try {
                    let absoluteUrl: string;
                    // 3. Patikriname, ar src jau yra pilnas URL.
                    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
                        absoluteUrl = new URL(src).href;
                    } else if (baseUrl) {
                        // Jei ne, ir turime bazinį URL, sukonstruojame pilną.
                        // Naudojame baseUrl.origin, kad išvengtume problemų su keliais (paths).
                        absoluteUrl = new URL(src, baseUrl.origin).href;
                    } else {
                        // Jei neturime bazinio URL, negalime apdoroti reliatyvių nuorodų.
                        return;
                    }
                    urls.push(absoluteUrl);
                } catch {
                    // Ignoruojame klaidas, jei URL yra neteisingo formato.
                    console.warn(`Could not process image src: "${src}"`);
                }
            }
        });
    }

    // Pašaliname dublikatus ir grąžiname
    return [...new Set(urls)];
}

/**
 * Converts HTML content to a plain text preview.
 * (Ši funkcija lieka nepakitusi)
 * @param htmlContent - The raw HTML string.
 * @param maxLength - The maximum number of characters for the preview.
 * @returns A truncated plain text string with an ellipsis if needed.
 */
export function getPlainTextPreview(htmlContent: string | undefined | null, maxLength: number): string {
  if (!htmlContent) {
    return "";
  }

  if (typeof window !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const text = doc.body.textContent || "";

    const cleanText = text.replace(/\s+/g, ' ').trim();

    if (cleanText.length > maxLength) {
      return cleanText.substring(0, maxLength) + '...';
    }
    return cleanText;
  }

  const plainText = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (plainText.length > maxLength) {
      return plainText.substring(0, maxLength) + '...';
  }
  return plainText;
}

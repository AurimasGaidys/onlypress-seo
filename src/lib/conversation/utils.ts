import { ConversationMessage } from '@/types/conversation';

export function sanitizeJsonOutput(text: string): string {
  return text.replace(/```json|```/g, '').replace(/```/g, '').trim();
}

export function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn('Failed to parse JSON response from model:', error);
    return fallback;
  }
}

export function buildConversationHistory(messages: ConversationMessage[]): string {
  return messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
}

interface DocumentBlock {
  id: string;
  description: string; // Pakeitėme 'tag' ir 'text' į vieną aiškų aprašymą
  text_preview: string;
}

/**
 * Sukuria protingą dokumento žemėlapį su aiškiais aprašymais,
 * kad AI būtų lengviau suprasti vartotojo komandas.
 */
export function createDocumentMap(html: string): DocumentBlock[] {
  const map: DocumentBlock[] = [];
  const blockRegex = /<(\w+)[^>]*data-block-id="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g;

  let match;
  let h1Count = 0;
  let h2Count = 0;
  let pCount = 0;
  let isAfterH1 = false;

  while ((match = blockRegex.exec(html)) !== null) {
    const [_, tag, id, innerContent] = match;
    const textPreview = innerContent.replace(/<[^>]*>/g, '').trim().substring(0, 100);
    let description = '';

    switch (tag.toLowerCase()) {
      case 'h1':
        h1Count++;
        description = h1Count === 1 ? 'Pagrindinė antraštė (H1)' : `${h1Count}-oji antraštė (H1)`;
        isAfterH1 = true;
        break;
      case 'h2':
        h2Count++;
        description = `${h2Count}-oji paantraštė (H2)`;
        break;
      case 'p':
        pCount++;
        if (isAfterH1 && pCount === 1) {
          description = 'Įžanga (pirma pastraipa po H1)';
        } else {
          description = `${pCount}-oji pastraipa`;
        }
        break;
      default:
        description = `Elementas (tag: ${tag})`;
        break;
    }

    if (id) {
      map.push({ id, description, text_preview: textPreview });
    }
  }
  return map;
}

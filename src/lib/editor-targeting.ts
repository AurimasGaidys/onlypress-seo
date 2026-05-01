import { Editor } from '@tiptap/react';

// Interface for identified text target
export interface TextTarget {
  text: string;
  range: {
    from: number;
    to: number;
  };
  type: 'selection' | 'current-sentence' | 'current-paragraph' | 'near-cursor' | 'full-document';
  context: {
    before: string; // Text before target (50 chars)
    after: string;  // Text after target (50 chars)
    paragraphStart: number;
    paragraphEnd: number;
  };
}

/**
 * Creates a TextTarget object with proper context information
 */
function createTarget(text: string, from: number, to: number, type: TextTarget['type'], state: any, doc: any): TextTarget {
  const contextBefore = Math.max(0, from - 50);
  const contextAfter = Math.min(doc.content.size, to + 50);

  return {
    text,
    range: { from, to },
    type,
    context: {
      before: doc.textBetween(contextBefore, from).slice(-50),
      after: doc.textBetween(to, contextAfter).slice(0, 50),
      paragraphStart: Math.max(0, from - 100), // Approximate paragraph boundaries
      paragraphEnd: Math.min(doc.content.size, to + 100),
    },
  };
}

// Interface for targeting configuration
export interface TargetingConfig {
  prioritizeSelection: boolean;
  fallbackToParagraph: boolean;
  fallbackToSentence: boolean;
  includeContext: boolean;
  maxTargetLength: number;
}

/**
 * Identifies the most appropriate text target based on editor state and configuration
 * Provides reliable target identification with multiple fallback strategies
 */
export function identifyTextTarget(editor: Editor, config: Partial<TargetingConfig> = {}): TextTarget {
  const defaultConfig: TargetingConfig = {
    prioritizeSelection: true,
    fallbackToParagraph: true,
    fallbackToSentence: true,
    includeContext: true,
    maxTargetLength: 10000,
  };

  const finalConfig = { ...defaultConfig, ...config };
  const { state } = editor;
  const { selection, doc } = state;

  // 1. Primary: Check for user selection
  if (finalConfig.prioritizeSelection && !selection.empty) {
    const selectedText = doc.textBetween(selection.from, selection.to, ' ').trim();
    if (selectedText.length > 0 && selectedText.length <= finalConfig.maxTargetLength) {
      return createTarget(selectedText, selection.from, selection.to, 'selection', state, doc);
    }
  }

  // 2. Fallback to current paragraph
  if (finalConfig.fallbackToParagraph) {
    const paragraphTarget = findCurrentParagraph(selection.head, state, doc);
    if (paragraphTarget && paragraphTarget.text.length <= finalConfig.maxTargetLength) {
      return paragraphTarget;
    }
  }

  // 3. Fallback to current sentence
  if (finalConfig.fallbackToSentence) {
    const sentenceTarget = findCurrentSentence(selection.head, state, doc);
    if (sentenceTarget && sentenceTarget.text.length <= finalConfig.maxTargetLength) {
      return sentenceTarget;
    }
  }

  // 4. Cursor-based context (small area around cursor)
  const cursorTarget = findCursorContext(selection.head, state, doc);
  if (cursorTarget) {
    return cursorTarget;
  }

  // 5. Ultimate fallback: entire document
  return findEntireDocument(state, doc, finalConfig.maxTargetLength);
}

/**
 * Finds the current paragraph containing the given position
 */
function findCurrentParagraph(pos: number, state: any, doc: any): TextTarget | null {
  let paragraphStart = pos;
  let paragraphEnd = pos;

  // Move paragraphStart to the beginning of the current paragraph
  while (paragraphStart > 0) {
    const char = doc.textBetween(paragraphStart - 1, paragraphStart);
    if (char === '\n' || char === '\r') {
      // Found paragraph boundary
      if (doc.textBetween(paragraphStart, paragraphEnd).trim().length === 0) {
        // Empty line, continue looking
        paragraphEnd = paragraphStart - 1;
      } else {
        break;
      }
    }
    paragraphStart--;
  }

  // Move paragraphEnd to the end of the current paragraph
  while (paragraphEnd < doc.content.size) {
    const char = doc.textBetween(paragraphEnd, paragraphEnd + 1);
    if (char === '\n' || char === '\r') {
      break; // Found paragraph end
    }
    paragraphEnd++;
  }

  const text = doc.textBetween(paragraphStart, paragraphEnd).trim();

  if (text.length > 0) {
    return createTarget(text, paragraphStart, paragraphEnd, 'current-paragraph', state, doc);
  }

  return null;
}

/**
 * Finds the current sentence containing the given position
 */
function findCurrentSentence(pos: number, state: any, doc: any): TextTarget | null {
  let sentenceStart = pos;
  let sentenceEnd = pos;

  // Find sentence start (move back to sentence boundary)
  const sentenceEndings = ['.', '!', '?', '\n'];
  try {
    while (sentenceStart > 0) {
      sentenceStart--;

      // Check if we're at a sentence boundary
      const prevChar = doc.textBetween(Math.max(0, sentenceStart - 1), sentenceStart);
      const currentChar = doc.textBetween(sentenceStart, sentenceStart + 1);

      if (sentenceEndings.includes(currentChar)) {
        // Make sure it's not in the middle of something
        const nextText = doc.textBetween(sentenceStart + 1, sentenceStart + 10).toLowerCase();
        const isNewSentence = /^(\s|$|[A-Z])/g.test(nextText);

        if (isNewSentence || sentenceStart === 0) {
          break;
        }
      }
    }

    // Find sentence end (move forward to sentence boundary)
    while (sentenceEnd < doc.content.size) {
      sentenceEnd++;

      const char = doc.textBetween(sentenceEnd, sentenceEnd + 1);

      if (sentenceEndings.includes(char)) {
        // Found sentence end, include the ending punctuation
        sentenceEnd++;
        break;
      }
    }
  } catch (error) {
    console.warn('Error in sentence boundary detection:', error);
    // Fallback to simple approach
    sentenceStart = Math.max(0, pos - 100);
    sentenceEnd = Math.min(doc.content.size, pos + 100);
  }

  const text = doc.textBetween(sentenceStart, sentenceEnd).trim();

  if (text.length > 0) {
    return createTarget(text, sentenceStart, sentenceEnd, 'current-sentence', state, doc);
  }

  return null;
}

/**
 * Finds context around cursor position
 */
function findCursorContext(pos: number, state: any, doc: any): TextTarget {
  const start = Math.max(0, pos - 200); // 200 characters before
  const end = Math.min(doc.content.size, pos + 200); // 200 characters after
  const text = doc.textBetween(start, end).trim();

  return createTarget(text, start, end, 'near-cursor', state, doc);
}

/**
 * Finds entire document as fallback target
 */
function findEntireDocument(state: any, doc: any, maxLength: number): TextTarget {
  const fullText = doc.textBetween(0, doc.content.size).trim();

  if (fullText.length <= maxLength) {
    return createTarget(fullText, 0, doc.content.size, 'full-document', state, doc);
  }

  // If document is too long, return first portion
  const truncatedText = fullText.substring(0, maxLength);
  const truncatedEnd = findEndIndex(truncatedText.length, doc);

  return createTarget(truncatedText, 0, truncatedEnd, 'full-document', state, doc);
}

/**
 * Helper to find text position by character count
 */
function findEndIndex(charCount: number, doc: any): number {
  let currentPos = 0;

  doc.descendants((node: any) => {
    if (currentPos >= charCount) {
      currentPos = charCount;
      return false; // Stop traversal
    }

    if (node.isText) {
      const nodeLength = node.text.length;
      if (currentPos + nodeLength > charCount) {
        currentPos = charCount;
        return false;
      }
      currentPos += nodeLength;
    }
  });

  return Math.min(currentPos, doc.content.size);
}

/**
 * Validates text target and provides error information if invalid
 */
export function validateTextTarget(target: TextTarget): {
  isValid: boolean;
  error?: string;
  suggestion?: string;
} {
  // Check if text exists
  if (!target.text || target.text.trim().length === 0) {
    return {
      isValid: false,
      error: 'No text found to modify',
      suggestion: 'Please select some text or ensure cursor is positioned in a paragraph'
    };
  }

  // Check text length
  if (target.text.length > 10000) {
    return {
      isValid: false,
      error: 'Selected text is too long',
      suggestion: 'Please select a smaller portion of text to modify'
    };
  }

  // Check target type
  if (target.type === 'full-document' && target.text.length > 5000) {
    return {
      isValid: false,
      error: 'Document is too long for full processing',
      suggestion: 'Please select a specific section or paragraph to modify'
    };
  }

  return { isValid: true };
}

/**
 * Creates a user-friendly description of the target area
 */
export function describeTextTarget(target: TextTarget): string {
  switch (target.type) {
    case 'selection':
      return `pažymėta tekstas (${target.text.length} simbolių)`;

    case 'current-paragraph':
      const paragraphLength = target.range.to - target.range.from;
      return `dabartinis pastraipa (${paragraphLength} simbolių)`;

    case 'current-sentence':
      return `dabartinis sakinys (${target.text.length} simbolių)`;

    case 'near-cursor':
      return `tekstas aplink žymeklį (${target.text.length} simbolių)`;

    case 'full-document':
      return `viso dokumento tekstas (${target.text.length} simbolių)`;

    default:
      return `tekstinė sritis (${target.text.length} simbolių)`;
  }
}

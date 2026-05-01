/**
 * Comprehensive input validation and sanitization utilities
 * Ensures all text editing inputs are safe and properly formatted for article editing
 */

import DOMPurify from 'isomorphic-dompurify';

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
  warnings: string[];
}

export interface TextValidationOptions {
  maxLength?: number;
  minLength?: number;
  allowHtml?: boolean;
  checkLanguage?: 'lithuanian' | 'english' | 'both';
  checkForSpam?: boolean;
  checkProfanity?: boolean;
}

/**
 * Validate and sanitize text input for article editing
 */
export function validateTextInput(
  input: string,
  options: TextValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic input validation
  if (typeof input !== 'string') {
    errors.push('Input must be a string');
    return {
      isValid: false,
      sanitized: '',
      errors,
      warnings,
    };
  }

  // Length validation
  const { maxLength = 100000, minLength = 1 } = options;

  if (input.length < minLength) {
    errors.push(`Text must be at least ${minLength} characters long`);
  }

  if (input.length > maxLength) {
    errors.push(`Text must not exceed ${maxLength} characters`);
    input = input.substring(0, maxLength) + '...';
    warnings.push('Text was truncated due to length limits');
  }

  // Sanitize input
  let sanitized = input;
  if (options.allowHtml !== true) {
    // Remove HTML tags but preserve basic formatting
    sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['br', 'p', 'strong', 'em', 'u'],
      ALLOWED_ATTR: [],
    });
  } else {
    // For full HTML content, sanitize more thoroughly
    sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
    });
  }

  // Language detection and validation
  if (options.checkLanguage) {
    const languageCheck = validateLanguage(sanitized, options.checkLanguage);
    if (!languageCheck.isValid) {
      warnings.push(...languageCheck.errors);
    }
  }

  // Spam detection (simple heuristics for article content)
  if (options.checkForSpam) {
    const spamCheck = detectSpam(sanitized);
    if (spamCheck.isSpam) {
      errors.push('Content appears to contain spam patterns');
      warnings.push(...spamCheck.reasons);
    }
  }

  // Profanity check (basic for Lithuanian/English)
  if (options.checkProfanity) {
    const profanityCheck = checkProfanity(sanitized);
    if (profanityCheck.hasProfanity) {
      warnings.push('Content may contain inappropriate language');
    }
  }

  // Check for common article writing issues
  const contentAnalysis = analyzeArticleContent(sanitized);
  warnings.push(...contentAnalysis.suggestions);

  const isValid = errors.length === 0;

  return {
    isValid,
    sanitized,
    errors,
    warnings,
  };
}

/**
 * Validate language of the text content
 */
function validateLanguage(text: string, expectedLanguage: 'lithuanian' | 'english' | 'both') {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Lithuanian character patterns
  const lithuanianChars = /[ąčėįšųūžĄČĖĮŠŲŪŽ]/g;
  const lithuanianWords = /(mano|jūsų|labai|iš|tikrai|noriu|galite|rašyti)/gi;

  // English character/word patterns
  const englishWords = /(the|and|or|but|in|on|at|to|for|of|with|by|an|as)/gi;

  const hasLithuanianChars = lithuanianChars.test(text);
  const hasLithuanianWords = lithuanianWords.test(text);
  const hasEnglishWords = englishWords.test(text);

  const isLikelyLithuanian = hasLithuanianChars || hasLithuanianWords;
  const isLikelyEnglish = hasEnglishWords && !hasLithuanianChars;

  if (expectedLanguage === 'lithuanian' && !isLikelyLithuanian) {
    warnings.push('Text appears to be written in English, expected Lithuanian');
  } else if (expectedLanguage === 'english' && !isLikelyEnglish) {
    warnings.push('Text appears to be written in Lithuanian, expected English');
  } else if (expectedLanguage === 'both') {
    if (!isLikelyLithuanian && !isLikelyEnglish) {
      warnings.push('Text language could not be confidently identified');
    }
  }

  return {
    isValid: warnings.length === 0,
    errors: warnings, // Language warnings are treated as validation errors
  };
}

/**
 * Simple spam detection for article content
 */
function detectSpam(text: string) {
  const reasons: string[] = [];
  let spamScore = 0;

  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.3) {
    spamScore += 2;
    reasons.push('Excessive use of capital letters');
  }

  // Check for repetitive words or phrases
  const words = text.toLowerCase().split(/\s+/);
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 3) { // Only check meaningful words
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });

  const repetitiveWords = Object.entries(wordCount).filter(([, count]) => count > words.length * 0.05);
  if (repetitiveWords.length > 0) {
    spamScore += 1;
    reasons.push(`Repeated words detected: ${repetitiveWords.slice(0, 3).map(([word]) => word).join(', ')}`);
  }

  // Check for excessive punctuation
  const punctuationCount = (text.match(/[!?.,;:"""''(){}[\]]/g) || []).length;
  if (punctuationCount > text.length * 0.1) {
    spamScore += 1;
    reasons.push('Excessive punctuation usage');
  }

  // Check for common spam patterns
  if (/(free|buy now|click here|limited time)/gi.test(text)) {
    spamScore += 2;
    reasons.push('Contains promotional/marketing language');
  }

  return {
    isSpam: spamScore >= 3,
    score: spamScore,
    reasons,
  };
}

/**
 * Basic profanity check for Lithuanian and English
 */
function checkProfanity(text: string) {
  // Simple list of profane words (should be expanded for production)
  const profaneWords = [
    // English profanity (basic list)
    'damn', 'hell', 'crap', 'shit', 'fuck', 'ass', 'bastard', 'bitch', 'dick', 'pussy',
    // Lithuanian profanity (basic)
    'velnias', 'šūdas', 'pimpalas', 'idiotas', 'debīls',
  ];

  const lowerText = text.toLowerCase();
  const foundProfanity = profaneWords.filter(word => lowerText.includes(word));

  return {
    hasProfanity: foundProfanity.length > 0,
    foundWords: foundProfanity,
  };
}

/**
 * Analyze article content for common writing issues
 */
function analyzeArticleContent(text: string) {
  const suggestions: string[] = [];

  // Check sentence structure
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length;

  if (avgSentenceLength > 25) {
    suggestions.push('Average sentence length is high - consider breaking up long sentences');
  } else if (avgSentenceLength < 8) {
    suggestions.push('Sentences are quite short - consider some variety in sentence length');
  }

  // Check for passive voice (simple heuristic)
  const passiveIndicators = /\b((?:is|are|was|were|be|been|being) \w+ed|(?:has|have|had) been \w+ed)\b/gi;
  const passiveMatches = text.match(passiveIndicators) || [];
  if (passiveMatches.length > sentences.length * 0.3) {
    suggestions.push('High use of passive voice detected - consider using more active voice');
  }

  // Check paragraph length
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const avgParagraphWords = paragraphs.reduce((sum, p) => sum + p.trim().split(/\s+/).length, 0) / paragraphs.length;

  if (avgParagraphWords > 150) {
    suggestions.push('Some paragraphs are quite long - consider breaking them up');
  } else if (avgParagraphWords < 30) {
    suggestions.push('Paragraphs are quite short - consider combining related ideas');
  }

  // Check for repeated transitions
  const transitions = /(however|therefore|thus|consequently|furthermore|moreover|additionally|besides|specifically|particularly)/gi;
  const transitionMatches = text.match(transitions) || [];
  if (transitionMatches.length > sentences.length * 0.1) {
    suggestions.push('High use of transition words - vary your sentence structures');
  }

  return {
    suggestions,
    metrics: {
      sentenceCount: sentences.length,
      avgSentenceLength,
      paragraphCount: paragraphs.length,
      avgParagraphWords,
      passiveVoiceCount: passiveMatches.length,
    },
  };
}

/**
 * Validate request body for API endpoints
 */
export function validateApiRequest<T>(body: unknown, schema: (data: unknown) => T): { data: T | null; errors: string[] } {
  try {
    const validatedData = schema(body);
    return { data: validatedData, errors: [] };
  } catch (error) {
    return {
      data: null,
      errors: [error instanceof Error ? error.message : 'Invalid request format'],
    };
  }
}

/**
 * Sanitize HTML content while preserving article structure
 */
export function sanitizeArticleContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'cite',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'sup', 'sub'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title', 'width', 'height',
      'class', 'id',
      'colspan', 'rowspan'
    ],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'style'],
  });
}

/**
 * Validate file upload for article content
 */
export function validateFileUpload(file: { name: string; size: number; type: string }): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size (max 10MB for articles)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`File size ${Math.round(file.size / 1024 / 1024)}MB exceeds limit of ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  const allowedTypes = [
    'text/plain',
    'text/html',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.type)) {
    // Fallback check by extension
    const allowedExtensions = ['.txt', '.html', '.htm', '.doc', '.docx', '.pdf'];
    const fileName = file.name.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasAllowedExtension) {
      errors.push('Unsupported file type. Please upload a text document (.txt, .html, .doc, .docx, or .pdf)');
    } else {
      warnings.push('File type detection unreliable - file will be processed based on content');
    }
  }

  return {
    isValid: errors.length === 0,
    sanitized: file.name, // File name is already user-controlled, but no further sanitization needed
    errors,
    warnings,
  };
}

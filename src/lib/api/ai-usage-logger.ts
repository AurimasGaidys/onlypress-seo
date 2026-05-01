// src/lib/api/ai-usage-logger.ts
// Centralized AI usage logging — logs every Gemini API call to Firestore
// Collection: AI-usage-logs / seo-logs-YYYY-MM-DD / entries/{autoId}

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { calculateCost } from '@/lib/constants/aiModelPricing';
import { DatabaseTables } from '@/lib/constants/databaseTables';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIUsageLogEntry {
  userId: string;
  endpoint: string;        // e.g. "generate-article", "chat-assistant", "conversation/fixGrammar"
  model: string;           // e.g. "gemini-2.5-flash"
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUSD: number;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
  timestamp?: FirebaseFirestore.FieldValue;
}

export interface LogAIUsageParams {
  userId: string;
  endpoint: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get today's date as a human-readable string: YYYY-MM-DD
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extract token usage from a Gemini API response.
 * Works with both generateContent and generateContentStream responses.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractTokenUsage(result: any): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} {
  const usageMetadata = result?.usageMetadata;
  if (usageMetadata) {
    return {
      inputTokens: usageMetadata.promptTokenCount || 0,
      outputTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    };
  }

  // Fallback: estimate from text length if no metadata
  const text = result?.text || '';
  const estimatedOutputTokens = Math.ceil(text.length / 4); // ~4 chars per token
  return {
    inputTokens: 0,
    outputTokens: estimatedOutputTokens,
    totalTokens: estimatedOutputTokens,
  };
}

// ─── Core Logger ─────────────────────────────────────────────────────────────

/**
 * Log a single AI API call to Firestore.
 * 
 * Writes to: AI-usage-logs/seo-logs-{date}/entries/{autoId}
 * Also increments daily aggregate counters on the parent document.
 * 
 * This function is fire-and-forget — it never throws.
 */
export async function logAIUsage(params: LogAIUsageParams): Promise<void> {
  try {
    const {
      userId,
      endpoint,
      model,
      inputTokens = 0,
      outputTokens = 0,
      totalTokens = inputTokens + outputTokens,
      durationMs,
      success = true,
      errorMessage,
    } = params;

    const costUSD = calculateCost(model, inputTokens, outputTokens);
    const dateStr = getTodayDateString();
    const docName = `seo-logs-${dateStr}`;

    // Build entry, excluding undefined fields (Firestore rejects undefined values)
    const entry: Record<string, unknown> = {
      userId,
      endpoint,
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      costUSD,
      success,
      timestamp: FieldValue.serverTimestamp(),
    };
    if (durationMs !== undefined) entry.durationMs = durationMs;
    if (errorMessage !== undefined) entry.errorMessage = errorMessage;

    // Reference to daily document and entries sub-collection
    const dailyDocRef = adminDb
      .collection(DatabaseTables.aiUsageLogs)
      .doc(docName);

    const entryRef = dailyDocRef.collection('entries').doc();

    // Use a batch to write the entry and update daily aggregates atomically
    const batch = adminDb.batch();

    // 1. Write the log entry
    batch.set(entryRef, entry);

    // 2. Update (or create) the daily summary document with increments
    batch.set(
      dailyDocRef,
      {
        date: dateStr,
        totalTokens: FieldValue.increment(totalTokens),
        totalCostUSD: FieldValue.increment(costUSD),
        totalCalls: FieldValue.increment(1),
        lastUpdated: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    // Never let logging failures break the main flow
    console.error('[AI-Usage-Logger] Failed to log AI usage:', error);
  }
}

// ─── Convenience: Log from a Gemini result ───────────────────────────────────

/**
 * Convenience function: extract tokens from a Gemini response and log usage.
 * Use this after any `generateContent` or completed `generateContentStream` call.
 * 
 * @example
 *   const result = await genAI.models.generateContent({ model, contents });
 *   await logAIResult({ userId: uid, endpoint: 'generate-article', model: modelName, result });
 */
export async function logAIResult(params: {
  userId: string;
  endpoint: string;
  model: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
}): Promise<void> {
  const { userId, endpoint, model, result, durationMs, success = true, errorMessage } = params;
  const tokens = extractTokenUsage(result);

  await logAIUsage({
    userId,
    endpoint,
    model,
    inputTokens: tokens.inputTokens,
    outputTokens: tokens.outputTokens,
    totalTokens: tokens.totalTokens,
    durationMs,
    success,
    errorMessage,
  });
}

// ─── Timer Helper ────────────────────────────────────────────────────────────

/**
 * Start a timer for measuring AI call duration.
 * Returns a function that, when called with the result, logs the usage with timing.
 * 
 * @example
 *   const done = startAITimer({ userId: uid, endpoint: 'generate-article', model: modelName });
 *   const result = await genAI.models.generateContent({ model, contents });
 *   await done(result);
 */
export function startAITimer(params: {
  userId: string;
  endpoint: string;
  model: string;
}): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  done: (result: any) => Promise<void>;
  fail: (error?: Error) => Promise<void>;
} {
  const startTime = Date.now();

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    done: async (result: any) => {
      const durationMs = Date.now() - startTime;
      await logAIResult({
        ...params,
        result,
        durationMs,
        success: true,
      });
    },
    fail: async (error?: Error) => {
      const durationMs = Date.now() - startTime;
      await logAIUsage({
        ...params,
        durationMs,
        success: false,
        errorMessage: error?.message || 'Unknown error',
      });
    },
  };
}

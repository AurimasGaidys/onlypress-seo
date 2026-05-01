// src/lib/constants/aiModelPricing.ts
// Prices per 1M tokens (USD) — based on Google AI pricing as of 2025
// Update these values when Google changes pricing

export interface ModelPricing {
  input: number;   // USD per 1M input tokens
  output: number;  // USD per 1M output tokens
}

export const AI_MODEL_PRICING: Record<string, ModelPricing> = {
  // Gemini 2.5 Flash
  "gemini-2.5-flash":         { input: 0.15,  output: 0.60 },
  "gemini-2.5-flash-image":   { input: 0.15,  output: 0.60 },

  // Gemini 2.0 Flash
  "gemini-2.0-flash-exp":     { input: 0.10,  output: 0.40 },
  "gemini-2.0-flash":         { input: 0.10,  output: 0.40 },

  // Gemini 1.5 Flash
  "gemini-1.5-flash":         { input: 0.075, output: 0.30 },
  "gemini-flash-latest":      { input: 0.075, output: 0.30 },

  // Gemini 3 Pro (image generation)
  "gemini-3-pro-image-preview": { input: 1.25, output: 5.00 },

  // Fallback for any unknown model
  "default":                  { input: 0.15,  output: 0.60 },
};

/**
 * Get pricing for a given model name.
 * Falls back to "default" pricing if the model isn't in the table.
 */
export function getModelPricing(modelName: string): ModelPricing {
  return AI_MODEL_PRICING[modelName] || AI_MODEL_PRICING["default"];
}

/**
 * Calculate cost in USD given token counts and model name.
 */
export function calculateCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getModelPricing(modelName);
  const inputCost  = (inputTokens / 1_000_000)  * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // Round to 6 decimals
}

import { z } from 'zod';

export const generateImagesSchema = z.object({
  idToken: z.string(),
  prompts: z.record(z.string(), z.string()), // {"heading": "prompt"}
});

// Ateityje čia galėsite talpinti ir kitas API schemas
// pvz., generatePromptsSchema
export const generatePromptsSchema = z.object({
  idToken: z.string(),
  headings: z.array(z.string()),
  content: z.string(),
});

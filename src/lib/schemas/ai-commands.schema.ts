// src/lib/schemas/ai-commands.schema.ts
import { z } from 'zod';

// Pagalbinė schema vienam redagavimui
export const BlockEditSchema = z.object({
  blockId: z.string(),
  newHtml: z.string(),
});

// Kiekvienos galimos operacijos schema
const ReplaceBlockSchema = z.object({
  command: z.literal('REPLACE_BLOCK'),
  blockId: z.string(),
  newHtml: z.string(),
  reasoning: z.string(),
});

const InsertBlockAfterSchema = z.object({
  command: z.literal('INSERT_BLOCK_AFTER'),
  targetBlockId: z.union([z.string(), z.literal('DOCUMENT_END')]),
  newHtml: z.string(),
  reasoning: z.string(),
});

const InsertBlockBeforeSchema = z.object({
  command: z.literal('INSERT_BLOCK_BEFORE'),
  targetBlockId: z.union([z.string(), z.literal('DOCUMENT_START')]),
  newHtml: z.string(),
  reasoning: z.string(),
});

const DeleteBlocksSchema = z.object({
  command: z.literal('DELETE_BLOCKS'),
  blockIds: z.array(z.string()),
  reasoning: z.string(),
});

const AnswerQuestionSchema = z.object({
  command: z.literal('ANSWER_QUESTION'),
  markdownText: z.string(),
  reasoning: z.string(),
});

const ReplaceMultipleBlocksSchema = z.object({
  command: z.literal('REPLACE_MULTIPLE_BLOCKS'),
  edits: z.array(BlockEditSchema),
  reasoning: z.string(),
});

const ReplaceArticleContentSchema = z.object({
  command: z.literal('REPLACE_ARTICLE_CONTENT'),
  newFullHtml: z.string(),
  reasoning: z.string(),
});

// Apjungiame visas operacijų schemas į vieną
export const AiOperationSchema = z.discriminatedUnion('command', [
  ReplaceBlockSchema,
  InsertBlockAfterSchema,
  InsertBlockBeforeSchema,
  DeleteBlocksSchema,
  AnswerQuestionSchema,
  ReplaceMultipleBlocksSchema,
  ReplaceArticleContentSchema,
]);

// Pagrindinė, pilno AI atsakymo, schema
export const AiCommandResponseSchema = z.object({
  operation: z.union([AiOperationSchema, z.array(AiOperationSchema)]),
  confirmationMessage: z.string(),
});

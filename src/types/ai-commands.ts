// src/types/ai-commands.ts

// 1. NAUJAS PAGALBINIS TIPAS
export interface BlockEdit {
  blockId: string;
  newHtml: string;
}

/**
 * Apibrėžia vieną redagavimo operaciją, kurią AI gali nurodyti.
 */
export type AiOperation =
  | {
      command: 'REPLACE_BLOCK';
      blockId: string;
      newHtml: string;
      reasoning: string;
    }
  | {
      command: 'INSERT_BLOCK_AFTER';
      targetBlockId: string | 'DOCUMENT_END';
      newHtml: string;
      reasoning: string;
    }
  | {
      command: 'INSERT_BLOCK_BEFORE';
      targetBlockId: string | 'DOCUMENT_START';
      newHtml: string;
      reasoning: string;
    }
  | {
      command: 'DELETE_BLOCKS';
      blockIds: string[];
      reasoning: string;
    }
  | {
      command: 'ANSWER_QUESTION';
      markdownText: string;
      reasoning: string;
    }
  // 2. PRIDEDAME NAUJAS KOMANDAS
  | {
      command: 'REPLACE_MULTIPLE_BLOCKS';
      edits: BlockEdit[]; // Naudojame naują tipą
      reasoning: string;
    }
  | {
      command: 'REPLACE_ARTICLE_CONTENT';
      newFullHtml: string;
      reasoning: string;
    };

/**
 * Pilnas AI atsakymo formatas, kurį backend'as gaus JSON pavidalu.
 */
export interface AiCommandResponse {
  // 3. ATNAUJINAME `operation` TIPĄ
  operation: AiOperation | AiOperation[]; // Dabar gali būti viena operacija arba masyvas
  confirmationMessage: string;
}

import { Part } from '@google/genai';
import {
  ConversationAction,
  ConversationIntent,
  ConversationMetadata,
  ConversationPhase,
  ConversationState,
} from '@/types/conversation';
import { phaseHandlers } from './phases';

export type ConversationMode = 'solo';

export interface PhaseHandlerContext {
  state: ConversationState;
  lastUserMessage: string;
  documentContent: string;
  fileUrl?: string;
  fileParts?: Part[];
  intent?: ConversationIntent;
  selectedText?: string;
  targetBlockId?: string;
}

export type ConversationResponse =
  | {
      type: 'message';
      response: string;
      actions?: ConversationAction[] | null;
    }
  | {
      type: 'contentUpdate';
      html?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload?: any;
      confirmationMessage?: string;
    }
  | {
      type: 'undo';
      reason?: string;
    };

export type PhaseHandlerResult = {
    streaming: boolean;
    prompt?: string | (string | Part)[];
    systemInstruction?: string;
    nextPhase: ConversationPhase;
    metadataUpdates?: Partial<ConversationMetadata>;
    response?: ConversationResponse;
    streamType?: 'contentUpdate' | 'message';
    confirmationMessage?: string;
    actions?: ConversationAction[] | null;
};

export type PhaseHandler = (context: PhaseHandlerContext) => Promise<PhaseHandlerResult>;

const notImplementedHandler: PhaseHandler = async ({ state }) => {
  return {
    streaming: false,
    nextPhase: state.metadata.chatPhase,
    response: {
      type: 'message',
      response:
        'Ši darbo eiga dar kuriama. Prašome pabandyti dar kartą arba susisiekti su administratoriumi.',
      actions: null,
    },
  };
};

export async function runConversationPhase(context: PhaseHandlerContext): Promise<PhaseHandlerResult> {
  const handler = phaseHandlers[context.state.metadata.chatPhase] ?? notImplementedHandler;
  return handler(context);
}

export function mergeConversationMetadata(
  metadata: ConversationMetadata,
  updates?: Partial<ConversationMetadata>,
  nextPhase?: ConversationPhase,
): ConversationMetadata {
  if (!updates) {
    return metadata;
  }

  const merged: ConversationMetadata = {
    ...metadata,
    ...updates,
    chatPhase: nextPhase ?? updates?.chatPhase ?? metadata.chatPhase,
    blueprint: {
      ...metadata.blueprint,
      ...updates?.blueprint,
    },
  };

  return merged;
}

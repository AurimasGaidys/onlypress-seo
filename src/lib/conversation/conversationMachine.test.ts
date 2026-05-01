import { describe, expect, it } from 'vitest';
import { mergeConversationMetadata } from './conversationMachine';
import { DEFAULT_CONVERSATION_METADATA } from '@/types/conversation';

describe('mergeConversationMetadata', () => {
  it('merges blueprint updates immutably and sets next phase', () => {
    const initialMetadata = {
      ...DEFAULT_CONVERSATION_METADATA,
      chatPhase: 'INFORMATION_GATHERING' as const,
      blueprint: {
        topic: 'Energetikos krizė',
        type: 'Naujienų straipsnis',
      },
    };

    const result = mergeConversationMetadata(initialMetadata, {
      blueprint: {
        angle: 'Žmogiškasis kampas',
      },
    }, 'ANGLE_PROPOSAL');

    expect(result.chatPhase).toBe('ANGLE_PROPOSAL');
    expect(result.blueprint.topic).toBe('Energetikos krizė');
    expect(result.blueprint.type).toBe('Naujienų straipsnis');
    expect(result.blueprint.angle).toBe('Žmogiškasis kampas');

    expect(initialMetadata.chatPhase).toBe('INFORMATION_GATHERING');
    expect(initialMetadata.blueprint.angle).toBeUndefined();
  });

  it('keeps existing values when no updates are provided', () => {
    const initialMetadata = {
      ...DEFAULT_CONVERSATION_METADATA,
      chatPhase: 'GREETING' as const,
    };

    const result = mergeConversationMetadata(initialMetadata, undefined, undefined);

    expect(result.chatPhase).toBe('GREETING');
    expect(result.blueprint).toEqual(DEFAULT_CONVERSATION_METADATA.blueprint);
  });
});

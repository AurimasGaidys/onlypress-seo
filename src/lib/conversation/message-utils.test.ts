import { describe, expect, it } from 'vitest';
import { formatMessageTimestamp } from './message-utils';

const format = (value: Date) =>
  new Intl.DateTimeFormat('lt-LT', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(value);

describe('formatMessageTimestamp', () => {
  it('returns formatted string for Date instance', () => {
    const input = new Date('2024-05-14T10:15:00Z');
    const formatted = formatMessageTimestamp(input);
    expect(formatted).toBe(format(input));
  });

  it('supports Firestore timestamp-like object', () => {
    const seconds = 1_717_304_800; // corresponds to 2024-05-15T11:00:00Z
    const expected = format(new Date(seconds * 1000));
    const formatted = formatMessageTimestamp({ seconds, nanoseconds: 0 });
    expect(formatted).toBe(expected);
  });

  it('returns null for invalid inputs', () => {
    expect(formatMessageTimestamp(undefined)).toBeNull();
    expect(formatMessageTimestamp('not-a-date')).toBeNull();
    expect(formatMessageTimestamp({} as never)).toBeNull();
  });
});

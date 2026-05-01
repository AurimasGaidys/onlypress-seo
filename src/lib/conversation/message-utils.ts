import { ConversationMessage } from '@/types/conversation';

type TimestampLike = ConversationMessage['timestamp'];

export function formatMessageTimestamp(timestamp?: TimestampLike): string | null {
  if (!timestamp) {
    return null;
  }

  let dateValue: Date | null = null;

  try {
    if (timestamp instanceof Date) {
      dateValue = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      dateValue = new Date(timestamp);
    } else if (typeof timestamp === 'object' && timestamp !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objTimestamp = timestamp as unknown as any;
      if (typeof objTimestamp.toDate === 'function') {
        dateValue = objTimestamp.toDate();
      } else if (typeof objTimestamp.seconds === 'number') {
        const seconds = objTimestamp.seconds;
        const nanos = objTimestamp.nanoseconds ?? 0;
        dateValue = new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
      }
    }
  } catch (error) {
    console.warn('Could not parse message timestamp', error);
    dateValue = null;
  }

  if (!dateValue || Number.isNaN(dateValue.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('lt-LT', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(dateValue);
}

// src/lib/formatters.ts
export const formatCredit = (amount: number | null | undefined): string => {
  // Check for null, undefined, not a number, or NaN
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0,00 €';
  }
  return `${amount.toFixed(2).replace('.', ',')} €`;
};

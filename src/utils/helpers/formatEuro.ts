export const formatEuro = (amount: number | undefined): string => {
  // We use the 'de-DE' locale because it provides the desired number format:
  // - A period (.) for the thousands separator.
  // - A comma (,) for the decimal separator.
  const numberFormatter = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (amount === undefined || amount === null) {
    return '€0,00'; // Return a default value if amount is undefined or null
  }

  const formattedNumber = numberFormatter.format(amount);

  // Prepend the Euro symbol to the formatted number string.
  return `€${formattedNumber}`;
};

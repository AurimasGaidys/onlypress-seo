/**
 * Options for formatting the number.
 */
interface FormatNumberOptions {
  /** The string to append after the formatted number and its unit (e.g., " Visits/month"). */
  suffix?: string;
  /** The number of decimal places to use for numbers over 1,000. Defaults to 1. */
  decimals?: number;
}

/**
 * Formats a number into a more readable string with metric prefixes (K, M, B).
 *
 * @param num The number to format.
 * @param options An optional object for suffix and decimal precision.
 * @returns A human-readable string representation of the number.
 *
 * @example
 * formatReadableNumber(40000, { suffix: " Visits/month" });
 * // returns "40K Visits/month"
 *
 * @example
 * formatReadableNumber(1550000);
 * // returns "1.6M"
 *
 * @example
 * formatReadableNumber(999);
 * // returns "999"
 *
 * @example
 * formatReadableNumber(12345, { decimals: 2, suffix: ' units' });
 * // returns "12.35K units"
 */
export function userCountBeatifier(
  num: number | null | undefined,
  options?: FormatNumberOptions
): string {
  // Handle null, undefined, or non-numeric inputs gracefully
  if (num === null || num === undefined) {
    return "0";
  }

  // Use default values for options
  const { suffix = "", decimals = 1 } = options || {};

  // Define the tiers for formatting (K, M, B for Thousand, Million, Billion)
  const tiers = [
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "K" },
  ];

  // Find the first tier that the number is greater than or equal to
  const tier = tiers.find((t) => Math.abs(num) >= t.value);

  // If a tier is found, format the number accordingly
  if (tier) {
    const value = num / tier.value;
    const formattedValue = value.toFixed(decimals);
    
    // Check if the formatted value is an integer (e.g., "40.0" should become "40")
    // This avoids unnecessary decimals like "40.0K"
    const displayValue = Number.isInteger(parseFloat(formattedValue))
      ? Math.trunc(value)
      : formattedValue;

    return `${displayValue}${tier.symbol}${suffix}`;
  }

  // If the number is less than 1,000, return it as is with the suffix
  return `${num.toString()}${suffix}`;
}


/**
 * Anthropic Claude Sonnet 4.6 pricing (USD per million tokens).
 *
 * Source: https://www.anthropic.com/pricing  (verify quarterly — these
 * numbers change without notice; if Anthropic publishes new tiers we
 * update here in one place).
 *
 * Cache pricing:
 *  - cache_creation_input_tokens: 1.25× normal input (~$3.75/M)
 *  - cache_read_input_tokens: 0.10× normal input (~$0.30/M)
 */
export const SONNET_4_6_PRICING_USD_PER_MTOK = {
  input: 3.0,
  output: 15.0,
  cache_creation_input: 3.75,
  cache_read_input: 0.30,
} as const;

export type TokenBundle = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
};

/** Total billable input tokens (sum of all categories). */
export function totalInputTokens(b: TokenBundle): number {
  return (
    b.input_tokens +
    b.cache_creation_input_tokens +
    b.cache_read_input_tokens
  );
}

/** USD cost for a token bundle, computed per-category at Sonnet 4.6 rates. */
export function costUsd(b: TokenBundle): number {
  const p = SONNET_4_6_PRICING_USD_PER_MTOK;
  const dollars =
    (b.input_tokens / 1_000_000) * p.input +
    (b.output_tokens / 1_000_000) * p.output +
    (b.cache_creation_input_tokens / 1_000_000) * p.cache_creation_input +
    (b.cache_read_input_tokens / 1_000_000) * p.cache_read_input;
  return dollars;
}

/** Pretty-print USD with appropriate precision for small amounts. */
export function formatUsd(amount: number): string {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}

/** Pretty-print a token count with thousands separators. */
export function formatTokens(n: number): string {
  return n.toLocaleString("en-US");
}

/** Sum two token bundles. */
export function sumBundles(...bundles: TokenBundle[]): TokenBundle {
  return bundles.reduce(
    (acc, b) => ({
      input_tokens: acc.input_tokens + b.input_tokens,
      output_tokens: acc.output_tokens + b.output_tokens,
      cache_creation_input_tokens:
        acc.cache_creation_input_tokens + b.cache_creation_input_tokens,
      cache_read_input_tokens:
        acc.cache_read_input_tokens + b.cache_read_input_tokens,
    }),
    {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
  );
}

export const ZERO_BUNDLE: TokenBundle = {
  input_tokens: 0,
  output_tokens: 0,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
};

/**
 * Brand-content sanitization.
 *
 * Em-dashes and en-dashes are forbidden in user-facing copy (CLAUDE.md
 * + system prompt rule). This module enforces that no matter the
 * source: user-typed text, materials-extraction output, or Claude
 * synthesis output. Apply at every persistence boundary so we never
 * write em-dashes into the database or generated files.
 *
 * Replacement strategy:
 *  - Em-dash (—, U+2014) → comma + space when in the middle of a
 *    sentence, period + space at clause boundaries, hyphen elsewhere.
 *    Simplest defensible default: ", " (comma-space). Reads cleanly
 *    in PT and EN.
 *  - En-dash (–, U+2013) → kept ONLY between digits (numeric ranges:
 *    "4–10", "2024–2025"). Replaced with "-" (hyphen) otherwise.
 *  - Horizontal bar (―, U+2015) → ", " (treated same as em-dash).
 */

const EM_DASH = "—";
const EN_DASH = "–";
const HORIZONTAL_BAR = "―";

/** Strip em-dashes / en-dashes from a single string. Idempotent. */
export function sanitizeBrandText(input: string): string {
  if (!input || typeof input !== "string") return input;

  let out = input;

  // Em-dash + horizontal bar → comma+space, collapsing surrounding whitespace.
  out = out.replace(
    new RegExp(`\\s*[${EM_DASH}${HORIZONTAL_BAR}]\\s*`, "g"),
    ", ",
  );

  // En-dash: keep when between digits (date / page ranges like "12-15");
  // replace with hyphen otherwise.
  out = out.replace(
    new RegExp(`(\\d)\\s*${EN_DASH}\\s*(\\d)`, "g"),
    "$1-$2",
  );
  out = out.replace(new RegExp(`\\s*${EN_DASH}\\s*`, "g"), " - ");

  // Tidy: collapse accidental double-commas or commas before terminal
  // punctuation produced by the em-dash replacement.
  out = out.replace(/,\s*,/g, ",");
  out = out.replace(/,\s*([.!?;:])/g, "$1");
  out = out.replace(/\s{2,}/g, " ");

  return out;
}

/**
 * Recursively sanitize all string values inside an arbitrary JSON-ish
 * payload. Used for the chat's update_fields executor: whatever shape
 * the user-provided value comes in (string, array, nested object), we
 * walk it and clean every string.
 */
export function sanitizeBrandValue<T>(value: T): T {
  if (value == null) return value;
  if (typeof value === "string") {
    return sanitizeBrandText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeBrandValue(v)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeBrandValue(v);
    }
    return out as T;
  }
  return value;
}

/** True if the text still contains em-dashes after sanitization
 * (shouldn't, but useful for assertions in tests / logs). */
export function containsBannedDash(input: string): boolean {
  return (
    typeof input === "string" &&
    (input.includes(EM_DASH) || input.includes(HORIZONTAL_BAR))
  );
}

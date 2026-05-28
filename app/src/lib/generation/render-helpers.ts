import "server-only";
import type { AnswersJson, RenderContext } from "./types";
import type { Phase } from "@/interview/types";

/** Safe phase reader — returns the phase blob or empty object. */
export function ph(answers: AnswersJson, n: Phase): Record<string, unknown> {
  return (answers[`phase_${n}`] as Record<string, unknown>) ?? {};
}

/** Get a sub-object from a phase blob, e.g. q(answers,1,'q1_3'). */
export function q(
  answers: AnswersJson,
  phase: Phase,
  field: string,
): unknown {
  const p = ph(answers, phase);
  return p[field];
}

/** Coerce to string, returning "(none)" if missing. */
export function s(value: unknown): string {
  if (value == null) return "(none)";
  if (typeof value === "string") return value;
  return String(value);
}

/** Coerce to a string list. Returns [] if missing. */
export function l(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v) => v != null).map((v) => String(v));
  }
  return [];
}

/** Render a list as markdown bullets. Returns "(none)" placeholder when empty. */
export function bullets(list: string[], placeholder = "(none captured)"): string {
  if (list.length === 0) return `_${placeholder}_`;
  return list.map((item) => `- ${item}`).join("\n");
}

/** Numbered list. */
export function numbered(list: string[], placeholder = "(none captured)"): string {
  if (list.length === 0) return `_${placeholder}_`;
  return list.map((item, i) => `${i + 1}. ${item}`).join("\n");
}

/** Render key/value pairs from an object as a definition list. */
export function defList(
  obj: Record<string, unknown> | null | undefined,
  labels?: Record<string, string>,
): string {
  if (!obj) return "_(none captured)_";
  const entries = Object.entries(obj).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return "_(none captured)_";
  return entries
    .map(([k, v]) => {
      const label = labels?.[k] ?? k;
      const value =
        typeof v === "string"
          ? v
          : Array.isArray(v)
            ? v.join(", ")
            : JSON.stringify(v);
      return `- **${label}:** ${value}`;
    })
    .join("\n");
}

/** Header line + horizontal rule, used for file section breaks. */
export function section(title: string): string {
  return `\n## ${title}\n`;
}

/** Top-of-file header with brand metadata and version note. */
export function fileHeader(
  ctx: RenderContext,
  title: string,
  description: string,
): string {
  const localeNote = ctx.locale ? ` · locale: ${ctx.locale}` : "";
  return [
    `# ${title}`,
    ``,
    `Brand: **${ctx.brand.brand_name}**${localeNote}`,
    ``,
    `> ${description}`,
    ``,
  ].join("\n");
}

/** Get the value for a sub-field within a record-shaped answer. */
export function sub(record: unknown, key: string): unknown {
  if (record && typeof record === "object" && !Array.isArray(record)) {
    return (record as Record<string, unknown>)[key];
  }
  return undefined;
}

/** Pick the locale-specific entry from a per-locale answer, falling back
 * to whichever locale is present if the requested one isn't. */
export function perLocale(
  value: unknown,
  locale: string,
): unknown {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  if (obj[locale] !== undefined) return obj[locale];
  // Fallback: take whatever locale exists, so we never produce an
  // empty file for a locale the user didn't fill explicitly.
  const firstKey = Object.keys(obj)[0];
  return firstKey ? obj[firstKey] : undefined;
}

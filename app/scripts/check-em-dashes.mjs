#!/usr/bin/env node
/**
 * Em-dash guard for user-facing copy.
 *
 * The brand rule forbids em-dashes (—, U+2014) in any text the user
 * reads. The sanitizer in src/lib/text/sanitize.ts catches em-dashes
 * inside DYNAMIC content (generated files, chat updates, materials
 * extraction). It does NOT cover STATIC strings hardcoded in TSX/TS
 * source. This script closes that gap: it scans the source tree and
 * exits non-zero if it finds an em-dash that's not inside a comment
 * or a known internal-only context (LLM prompts, JSDoc, etc.).
 *
 * Whitelisted (em-dash allowed):
 *  - Lines that are clearly comments (`//`, `*`, `/*` at the start of
 *    trimmed line)
 *  - The literal "—" used as a placeholder glyph in admin UI (e.g.
 *    `?? "—"` for no-value cells). Admin-only iconography.
 *  - Files under src/interview/conversational/system-prompt.ts and
 *    src/lib/generation/{files,synthesize}.ts — those compose prompts
 *    that instruct Claude, never rendered as-is to a user.
 *  - Files under src/lib/materials/extract-drafts.ts — same reason.
 *
 * Block (em-dash in rendered prose):
 *  - Anything else inside a string literal, template literal, or JSX
 *    text in src/app/* (page.tsx / *.tsx), src/components/*,
 *    src/interview/components/* (form UI being deprecated).
 *
 * Usage:
 *   node scripts/check-em-dashes.mjs        # report findings, exit 1 if any
 *   node scripts/check-em-dashes.mjs --soft # report only, never fail (CI hint)
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

// fileURLToPath handles URL-encoded paths (spaces → %20 etc.) correctly,
// unlike .pathname which leaves the encoding in place.
const ROOT = fileURLToPath(new URL("../src", import.meta.url));
const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOFT = process.argv.includes("--soft");

const EM_DASH = "—";

/** Files whose em-dashes are intentional. ONLY LLM-instruction files
 * are exempt — anything Claude reads as its own system prompt, where
 * the em-dashes are dictation for the model, not text the user reads.
 *
 * Everything else (admin UI, form UI, public copy, email subjects,
 * generated files, etc.) is held to the brand rule: no em-dashes.
 *
 * Generated brand-pack files for clients are double-guarded at
 * runtime: synthesis prompts forbid em-dashes, and the sanitizer in
 * src/lib/text/sanitize.ts strips them at persist time before they
 * land in the database / zip. So this allow-list is only for the
 * INTERNAL prompt source files.
 */
const ALLOW_FILES = new Set([
  // System prompts and tool descriptions read by Claude.
  "src/interview/conversational/system-prompt.ts",
  "src/interview/conversational/archetypes.ts",
  "src/interview/conversational/role-framing.ts",
  "src/lib/conversational/tools.ts",
  "src/lib/generation/files.ts",
  "src/lib/generation/synthesize.ts",
  "src/lib/materials/extract-drafts.ts",
  "src/lib/text/sanitize.ts",
  // Question registry: each question's `prompt` and `extractionHint`
  // flow into the materials extraction user message as instructions to
  // Claude. The form UI that used to render these to humans is gone.
  // Em-dashes here are LLM dictation, not user copy.
  "src/interview/questions/phase1.ts",
  "src/interview/questions/phase2.ts",
  "src/interview/questions/phase3.ts",
  "src/interview/questions/phase4.ts",
  "src/interview/questions/phase5.ts",
  "src/interview/questions/phase6.ts",
  "src/interview/questions/phase7.ts",
  "src/interview/registry.ts",
  "src/interview/types.ts",
]);

/** Walk src recursively, return all .ts / .tsx files. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

/** Decide if a line is a comment line. Rough heuristic, but enough. */
function isCommentLine(line) {
  const trimmed = line.trim();
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("/**")
  ) {
    return true;
  }
  // JSX inline comment: `{/* ... */}` on a single line.
  if (/^{\s*\/\*.*\*\/\s*}$/.test(trimmed)) return true;
  // JSX comment containing only whitespace and the em-dash inside `{/* */}`.
  if (trimmed.startsWith("{/*") && trimmed.endsWith("*/}")) return true;
  return false;
}

const findings = [];
for (const file of walk(ROOT)) {
  const rel = relative(PROJECT_ROOT, file);
  if (ALLOW_FILES.has(rel)) continue;
  const text = readFileSync(file, "utf8");
  if (!text.includes(EM_DASH)) continue;
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (!line.includes(EM_DASH)) return;
    if (isCommentLine(line)) return;
    findings.push({ file: rel, lineNo: i + 1, line: line.trim() });
  });
}

if (findings.length === 0) {
  console.log("Em-dash check: OK (no user-facing em-dashes found).");
  process.exit(0);
}

console.log(
  `\nEm-dash check: ${findings.length} occurrence${findings.length === 1 ? "" : "s"} in user-facing source.\n`,
);
for (const f of findings) {
  console.log(`  ${f.file}:${f.lineNo}`);
  console.log(`    ${f.line}`);
}
console.log(
  "\nFix: replace em-dashes (—) with a period, comma, parentheses, colon, or hyphen as the sentence allows.",
);
console.log(
  "If the file is intentionally instructional (LLM prompt) or internal-only, add it to ALLOW_FILES in scripts/check-em-dashes.mjs.",
);

process.exit(SOFT ? 0 : 1);

/**
 * One-shot exporter: reads the interview question registry and writes a
 * human-readable framework-questions.txt at repo root.
 *
 * Run: `npx tsx scripts/export-framework.ts`
 *
 * Why: per Hugo's call, we're pivoting from the form-based interview to
 * a conversational Claude-driven flow. The form question definitions in
 * src/interview/questions/phase[1-7].ts encode the framework's required
 * output shape — even after the form UI is deleted, this txt is the
 * single source of truth for "what every interview must produce."
 *
 * Use cases for the resulting txt:
 *   - Validation: confirm the conversational engine fills every required field
 *   - Onboarding: reference doc for anyone building new question logic
 *   - Snapshot: framework v1 spec preserved before we delete the source files
 */

import { writeFileSync } from "fs";
import { join } from "path";
import {
  getImplementedPhases,
  getQuestionsForPhase,
} from "../src/interview/registry";
import { PHASE_NAMES, type Question } from "../src/interview/types";

const phaseFileMap: Record<number, string> = {
  1: "10_BRAND_CORE.txt",
  2: "11_AUDIENCE.txt",
  3: "12_PILLARS.txt",
  4: "20_VOICE_CORE.txt + 21_VOICE_FLEX_[LOCALE].txt",
  5: "22_LEXICON_[LOCALE].txt",
  6: "30_CHANNEL_SPECS_[LOCALE].txt",
  7: "31_EXAMPLES_LIBRARY_[LOCALE].txt",
};

function describeQuestion(q: Question, indent = ""): string[] {
  const lines: string[] = [];
  const i = indent;
  lines.push(`${i}### ${q.id.toUpperCase().replace("_", ".")} — ${q.prompt.slice(0, 80)}${q.prompt.length > 80 ? "…" : ""}`);
  lines.push(`${i}Type: ${q.type}`);
  if (q.optional) lines.push(`${i}Optional: yes`);
  if (q.tags && q.tags.length) lines.push(`${i}Tags: ${q.tags.join(", ")}`);
  if (q.extractable) {
    lines.push(`${i}Extractable: yes`);
    if (q.extractionHint) {
      lines.push(`${i}Extraction hint: ${q.extractionHint.slice(0, 280)}${q.extractionHint.length > 280 ? "…" : ""}`);
    }
  }
  if (q.showWhen) lines.push(`${i}Conditional (showWhen) — only shown given prior answers`);
  lines.push(``);
  lines.push(`${i}Prompt:`);
  lines.push(`${i}  ${q.prompt}`);
  lines.push(``);
  lines.push(`${i}Why this matters:`);
  lines.push(`${i}  ${q.why}`);
  lines.push(``);
  lines.push(`${i}Orientative (guidance for the user):`);
  lines.push(`${i}  ${q.orientative}`);
  lines.push(``);

  // Type-specific shape detail
  switch (q.type) {
    case "short_text":
    case "long_text":
      lines.push(`${i}Field: ${q.field.key} (label: "${q.field.label}")`);
      if ("maxLength" in q.field && q.field.maxLength) lines.push(`${i}  max ${q.field.maxLength} chars`);
      if ("minWords" in q.field && q.field.minWords) lines.push(`${i}  min ${q.field.minWords} words`);
      if ("maxWords" in q.field && q.field.maxWords) lines.push(`${i}  max ${q.field.maxWords} words`);
      break;
    case "multi_field_group":
      lines.push(`${i}Fields:`);
      for (const f of q.fields) {
        lines.push(`${i}  - ${f.key} ("${f.label}")${f.required ? " · required" : ""}${f.maxLength ? ` · max ${f.maxLength} chars` : ""}`);
      }
      if (q.rejectPhrases) lines.push(`${i}Reject phrases: ${q.rejectPhrases.join(", ")}`);
      break;
    case "list_input":
      lines.push(`${i}List: ${q.constraints.min}–${q.constraints.max} items${q.constraints.itemMaxLength ? `, each ≤ ${q.constraints.itemMaxLength} chars` : ""}`);
      if (q.constraints.itemFormatHint) lines.push(`${i}  Format hint: ${q.constraints.itemFormatHint}`);
      break;
    case "structured_list":
      lines.push(`${i}Structured list: ${q.constraints.min}–${q.constraints.max} items, each item with fields:`);
      for (const f of q.itemFields) {
        lines.push(`${i}  - ${f.key} (${f.type})${f.required ? " · required" : ""}${f.maxLength ? ` · max ${f.maxLength} chars` : ""}`);
      }
      break;
    case "per_locale_long_text":
      lines.push(`${i}Per-locale long text. Field key: ${q.fieldKey}.`);
      if (q.minWords) lines.push(`${i}  min ${q.minWords} words per locale`);
      if (q.maxWords) lines.push(`${i}  max ${q.maxWords} words per locale`);
      break;
    case "per_locale_structured_list":
      lines.push(`${i}Per-locale ${q.variant}. Field key: ${q.fieldKey}.`);
      lines.push(`${i}  Per locale: ${q.constraints.min}–${q.constraints.max} items`);
      if (q.itemFields) {
        lines.push(`${i}  Item fields: ${q.itemFields.map((f) => f.key).join(", ")}`);
      }
      break;
    case "per_locale_per_subkey":
      lines.push(`${i}Per-locale × per-${q.fieldKey.includes("playbook") ? "situation" : "register"}. Field key: ${q.fieldKey}.`);
      lines.push(`${i}  Sub-keys: ${q.subKeys.map((s) => s.key).join(", ")}`);
      if (q.minWords) lines.push(`${i}  min ${q.minWords} words per cell`);
      if (q.maxWords) lines.push(`${i}  max ${q.maxWords} words per cell`);
      if (q.validateContains) lines.push(`${i}  Required placeholders: ${q.validateContains.join(", ")}`);
      break;
    case "multi_field_select_group":
      lines.push(`${i}Multi-field select group:`);
      for (const f of q.fields) {
        const opts = f.options.map((o) => o.value).join(" / ");
        lines.push(`${i}  - ${f.key} ("${f.label}") → ${opts}`);
      }
      break;
    case "channel_locale_defaults":
      lines.push(`${i}Per-channel locale: 'follows_prompt' or specific locale code`);
      lines.push(`${i}  Channels: ${q.channels.join(", ")}`);
      break;
    case "segment_setup":
      lines.push(`${i}Segment setup: ${q.minCount}–${q.maxCount} segments. Captures segment_count + segments[] + primary_segment_id.`);
      break;
    case "segment_loop":
      lines.push(`${i}Segment loop: reads segments from ${q.sourceQuestionId}. Per-segment sub-questions:`);
      for (const sq of q.subQuestions) {
        lines.push(`${i}  - ${sq.key} (${sq.type}) — ${sq.prompt.slice(0, 80)}${sq.prompt.length > 80 ? "…" : ""}`);
      }
      break;
    case "pillar_setup":
      lines.push(`${i}Pillar setup: ${q.minCount}–${q.maxCount} pillars. Captures pillar_count + pillars[].`);
      break;
    case "pillar_loop":
      lines.push(`${i}Pillar loop: reads pillars from ${q.sourceQuestionId}. Per-pillar sub-questions:`);
      for (const sq of q.subQuestions) {
        lines.push(`${i}  - ${sq.key} (${sq.type}) — ${sq.prompt.slice(0, 80)}${sq.prompt.length > 80 ? "…" : ""}`);
      }
      break;
    case "select":
      lines.push(`${i}Select. Field key: ${q.fieldKey}. Options:`);
      for (const o of q.options) lines.push(`${i}  - ${o.value} ("${o.label}")`);
      break;
  }

  lines.push(``);
  lines.push(`${i}---`);
  lines.push(``);
  return lines;
}

function main() {
  const phases = getImplementedPhases();
  const all = phases.flatMap((p) => getQuestionsForPhase(p));
  const totalQuestions = all.length;

  const out: string[] = [];
  out.push(`# Brand.soul OS: Interview Framework Specification`);
  out.push(``);
  out.push(`Snapshot of the structured-form interview's question definitions.`);
  out.push(`Generated from src/interview/questions/phase[1-7].ts.`);
  out.push(``);
  out.push(`Generated at: ${new Date().toISOString()}`);
  out.push(`Total questions: ${totalQuestions}`);
  out.push(`Phases: ${phases.length}`);
  out.push(``);
  out.push(`---`);
  out.push(``);
  out.push(`## Purpose`);
  out.push(``);
  out.push(`This file is the single source of truth for what every completed`);
  out.push(`interview must produce. The conversational UI (post DN-003) is`);
  out.push(`responsible for filling out every required field listed below,`);
  out.push(`regardless of how the conversation flows.`);
  out.push(``);
  out.push(`Use this file to:`);
  out.push(`- Validate that a completed interview has filled every required field`);
  out.push(`- Reference field shapes when prompting Claude for the next conversational beat`);
  out.push(`- Compare future framework versions against this v1 baseline`);
  out.push(``);
  out.push(`Output mapping: each phase maps to one or more .txt files in the`);
  out.push(`final brand DNA file pack:`);
  out.push(``);
  for (const p of phases) {
    out.push(`- Phase ${p} (${PHASE_NAMES[p]}) → ${phaseFileMap[p]}`);
  }
  out.push(``);
  out.push(`---`);
  out.push(``);

  for (const p of phases) {
    const qs = getQuestionsForPhase(p);
    out.push(`## Phase ${p} — ${PHASE_NAMES[p]}`);
    out.push(``);
    out.push(`Populates ${phaseFileMap[p]}.`);
    out.push(`Questions in this phase: ${qs.length}`);
    out.push(``);
    for (const q of qs) {
      out.push(...describeQuestion(q));
    }
    out.push(``);
  }

  const outPath = join(__dirname, "..", "framework-questions.txt");
  writeFileSync(outPath, out.join("\n"), "utf8");
  console.log(`Wrote ${out.length} lines, ${totalQuestions} questions across ${phases.length} phases →`);
  console.log(`  ${outPath}`);
}

main();

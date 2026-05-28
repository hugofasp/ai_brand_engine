import type { Phase, Question } from "./types";
import { phaseKey } from "./types";
import { PHASE_1_QUESTIONS } from "./questions/phase1";
import { PHASE_2_QUESTIONS } from "./questions/phase2";
import { PHASE_3_QUESTIONS } from "./questions/phase3";
import { PHASE_4_QUESTIONS } from "./questions/phase4";
import { PHASE_5_QUESTIONS } from "./questions/phase5";
import { PHASE_6_QUESTIONS } from "./questions/phase6";
import { PHASE_7_QUESTIONS } from "./questions/phase7";

/**
 * Central registry of all interview questions, grouped by phase.
 * All 7 phases encoded.
 */
const QUESTIONS_BY_PHASE: Partial<Record<Phase, Question[]>> = {
  1: PHASE_1_QUESTIONS,
  2: PHASE_2_QUESTIONS,
  3: PHASE_3_QUESTIONS,
  4: PHASE_4_QUESTIONS,
  5: PHASE_5_QUESTIONS,
  6: PHASE_6_QUESTIONS,
  7: PHASE_7_QUESTIONS,
};

export function getQuestionsForPhase(phase: Phase): Question[] {
  return QUESTIONS_BY_PHASE[phase] ?? [];
}

export function getQuestion(
  phase: Phase,
  questionId: string,
): Question | undefined {
  return getQuestionsForPhase(phase).find((q) => q.id === questionId);
}

/**
 * Phases that currently have questions implemented. Used by navigation
 * to know where the interview legitimately ends.
 */
export function getImplementedPhases(): Phase[] {
  return (Object.keys(QUESTIONS_BY_PHASE) as `${Phase}`[])
    .map((k) => Number(k) as Phase)
    .sort((a, b) => a - b);
}

/**
 * Filter a phase's questions by their `showWhen` predicate against the
 * current answers. Returns the visible-only question list for navigation.
 */
export function getVisibleQuestions(
  phase: Phase,
  answers: Record<string, unknown>,
): Question[] {
  return getQuestionsForPhase(phase).filter((q) =>
    q.showWhen ? q.showWhen(answers) : true,
  );
}

export type NavTarget =
  | { kind: "intro"; phase: Phase }
  | { kind: "question"; phase: Phase; questionId: string }
  | { kind: "summary"; phase: Phase }
  | { kind: "submit" }
  | { kind: "complete" };

/**
 * Compute the next navigation target after the current location.
 * Order within a phase: intro → q1 → q2 … → qN → summary → next phase intro.
 * After the last implemented phase's summary, the next target is "submit".
 */
export function getNextTarget(
  current: NavTarget,
  answers: Record<string, unknown>,
): NavTarget {
  const phases = getImplementedPhases();

  if (current.kind === "intro") {
    const visible = getVisibleQuestions(current.phase, answers);
    if (visible.length === 0) return { kind: "summary", phase: current.phase };
    return { kind: "question", phase: current.phase, questionId: visible[0].id };
  }

  if (current.kind === "question") {
    const visible = getVisibleQuestions(current.phase, answers);
    const idx = visible.findIndex((q) => q.id === current.questionId);
    if (idx === -1) {
      // unknown question id — fall back to phase summary
      return { kind: "summary", phase: current.phase };
    }
    const next = visible[idx + 1];
    if (next) return { kind: "question", phase: current.phase, questionId: next.id };
    return { kind: "summary", phase: current.phase };
  }

  if (current.kind === "summary") {
    const i = phases.indexOf(current.phase);
    const nextPhase = phases[i + 1];
    if (!nextPhase) return { kind: "submit" };
    return { kind: "intro", phase: nextPhase };
  }

  if (current.kind === "submit") return { kind: "complete" };
  return { kind: "complete" };
}

export function getPrevTarget(
  current: NavTarget,
  answers: Record<string, unknown>,
): NavTarget | null {
  const phases = getImplementedPhases();

  if (current.kind === "question") {
    const visible = getVisibleQuestions(current.phase, answers);
    const idx = visible.findIndex((q) => q.id === current.questionId);
    if (idx <= 0) return { kind: "intro", phase: current.phase };
    return {
      kind: "question",
      phase: current.phase,
      questionId: visible[idx - 1].id,
    };
  }

  if (current.kind === "summary") {
    const visible = getVisibleQuestions(current.phase, answers);
    const last = visible[visible.length - 1];
    if (last) {
      return { kind: "question", phase: current.phase, questionId: last.id };
    }
    return { kind: "intro", phase: current.phase };
  }

  if (current.kind === "intro") {
    const i = phases.indexOf(current.phase);
    if (i <= 0) return null; // first phase intro is the start
    const prev = phases[i - 1];
    return { kind: "summary", phase: prev };
  }

  return null;
}

/**
 * Total visible questions across all implemented phases — used by the
 * progress bar.
 */
export function countVisibleQuestionsAcrossPhases(
  answers: Record<string, unknown>,
): number {
  return getImplementedPhases().reduce(
    (sum, p) => sum + getVisibleQuestions(p, answers).length,
    0,
  );
}

/**
 * For a given phase + questionId, return its 1-based position in the
 * flattened, visible question list across all implemented phases.
 */
export function flattenedPositionOf(
  phase: Phase,
  questionId: string,
  answers: Record<string, unknown>,
): number {
  let position = 0;
  for (const p of getImplementedPhases()) {
    const visible = getVisibleQuestions(p, answers);
    if (p === phase) {
      const idx = visible.findIndex((q) => q.id === questionId);
      return idx === -1 ? position + 1 : position + idx + 1;
    }
    position += visible.length;
  }
  return position;
}

/** Convenience: read a question's saved answer from the JSONB blob. */
export function readAnswer(
  answers: Record<string, unknown>,
  phase: Phase,
  questionId: string,
): unknown {
  const ph = (answers[phaseKey(phase)] ?? {}) as Record<string, unknown>;
  return ph[questionId];
}

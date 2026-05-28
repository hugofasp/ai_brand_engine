"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getRequestIdFromCookie } from "@/app/actions/requests";
import { crawlDomain } from "@/lib/materials/crawl-domain";
import { extractDrafts } from "@/lib/materials/extract-drafts";
import type {
  MaterialsContext,
  DraftEntry,
} from "@/lib/supabase/types";

async function authorize(requestId: string): Promise<true | { error: string }> {
  const cookieId = await getRequestIdFromCookie();
  if (cookieId && cookieId !== requestId) {
    return { error: "Request ID mismatch" };
  }
  return true;
}

export async function getMaterialsContext(requestId: string) {
  const auth = await authorize(requestId);
  if (auth !== true) return auth;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interview_answers")
    .select("materials_context")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error) return { error: error.message };
  return (data?.materials_context as MaterialsContext) ?? {};
}

export type RunResult =
  | {
      ok: true;
      attempted: string[];
      succeeded: string[];
      empty: string[];
      summary: string;
      pages_read: Array<{ url: string; title: string }>;
      mode: "website" | "pasted_text";
    }
  | { ok: false; error: string; mode: "website" | "pasted_text" };

/**
 * Two entry-points for the two CTAs on Phase 0 — mutually exclusive
 * per submission. Both write to the same materials_context column and
 * produce the same downstream interview experience.
 */
export async function extractFromUrl(input: {
  requestId: string;
  url: string;
}): Promise<RunResult> {
  const auth = await authorize(input.requestId);
  if (auth !== true) return { ok: false, error: auth.error, mode: "website" };
  if (!input.url.trim()) {
    return { ok: false, error: "Provide a URL.", mode: "website" };
  }

  // 1. Crawl the domain.
  const crawl = await crawlDomain(input.url);
  if (!crawl.ok) {
    return { ok: false, error: crawl.error, mode: "website" };
  }
  if (crawl.pages.length === 0) {
    return {
      ok: false,
      error: "Couldn't read any pages from this site.",
      mode: "website",
    };
  }

  // 2. Run extraction. Pass the LinkedIn URLs the crawler found — under
  //    Hugo's rule, structural inferences like "founder-led" require
  //    converging evidence (e.g., LinkedIn headcount ≤ 10), and we only
  //    use LinkedIn pages the user's own website links to.
  const extraction = await extractDrafts({
    crawled_pages: crawl.pages,
    linkedin_urls: crawl.linkedin_urls,
  });
  if (!extraction.ok) {
    return { ok: false, error: extraction.error, mode: "website" };
  }

  // 3. Build the drafts map.
  const sourceLabel = `From your website (${new URL(crawl.origin).hostname})`;
  const drafts: Record<string, DraftEntry> = {};
  for (const qid of extraction.result.succeeded_questions) {
    const ex = extraction.result.drafts[qid];
    drafts[qid] = {
      value: ex.value,
      source: sourceLabel,
      source_quotes: ex.source_quotes ?? [],
      missing_context: ex.missing_context ?? [],
    };
  }

  // 4. Persist.
  const now = new Date().toISOString();
  const materials_context: MaterialsContext = {
    url: crawl.origin,
    url_scraped_at: now,
    url_content: crawl.pages
      .map((p) => `[${p.url}] ${p.title}\n${p.text}`)
      .join("\n\n"),
    pasted_text: null,
    extracted_at: now,
    extraction_model: extraction.result.model,
    drafts,
    linkedin_urls: crawl.linkedin_urls,
    summary: extraction.result.summary,
  };

  const supabase = getSupabaseAdmin();
  const { error: writeErr } = await supabase
    .from("interview_answers")
    .update({ materials_context })
    .eq("request_id", input.requestId);
  if (writeErr) {
    return { ok: false, error: writeErr.message, mode: "website" };
  }

  revalidatePath(`/interview/${input.requestId}`);
  return {
    ok: true,
    attempted: extraction.result.attempted_questions,
    succeeded: extraction.result.succeeded_questions,
    empty: extraction.result.empty_questions,
    summary: extraction.result.summary,
    pages_read: crawl.pages.map((p) => ({ url: p.url, title: p.title })),
    mode: "website",
  };
}

export async function extractFromPaste(input: {
  requestId: string;
  pasted_text: string;
}): Promise<RunResult> {
  const auth = await authorize(input.requestId);
  if (auth !== true) return { ok: false, error: auth.error, mode: "pasted_text" };
  if (!input.pasted_text.trim()) {
    return { ok: false, error: "Paste some context.", mode: "pasted_text" };
  }

  const extraction = await extractDrafts({ pasted_text: input.pasted_text });
  if (!extraction.ok) {
    return { ok: false, error: extraction.error, mode: "pasted_text" };
  }

  const sourceLabel = "From your pasted context";
  const drafts: Record<string, DraftEntry> = {};
  for (const qid of extraction.result.succeeded_questions) {
    const ex = extraction.result.drafts[qid];
    drafts[qid] = {
      value: ex.value,
      source: sourceLabel,
      source_quotes: ex.source_quotes ?? [],
      missing_context: ex.missing_context ?? [],
    };
  }

  const now = new Date().toISOString();
  const materials_context: MaterialsContext = {
    url: null,
    url_scraped_at: null,
    url_content: null,
    pasted_text: input.pasted_text,
    extracted_at: now,
    extraction_model: extraction.result.model,
    drafts,
    summary: extraction.result.summary,
  };

  const supabase = getSupabaseAdmin();
  const { error: writeErr } = await supabase
    .from("interview_answers")
    .update({ materials_context })
    .eq("request_id", input.requestId);
  if (writeErr) {
    return { ok: false, error: writeErr.message, mode: "pasted_text" };
  }

  revalidatePath(`/interview/${input.requestId}`);
  return {
    ok: true,
    attempted: extraction.result.attempted_questions,
    succeeded: extraction.result.succeeded_questions,
    empty: extraction.result.empty_questions,
    summary: extraction.result.summary,
    pages_read: [],
    mode: "pasted_text",
  };
}

/** Mark a draft as dismissed. */
export async function dismissDraft(input: {
  requestId: string;
  questionId: string;
}): Promise<{ ok: boolean }> {
  const auth = await authorize(input.requestId);
  if (auth !== true) return { ok: false };
  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("interview_answers")
    .select("materials_context")
    .eq("request_id", input.requestId)
    .maybeSingle();
  const ctx = (row?.materials_context as MaterialsContext | undefined) ?? {};
  const drafts = (ctx.drafts ?? {}) as Record<string, DraftEntry>;
  if (drafts[input.questionId]) {
    drafts[input.questionId] = {
      ...drafts[input.questionId],
      dismissed: true,
    };
    const { error } = await supabase
      .from("interview_answers")
      .update({ materials_context: { ...ctx, drafts } })
      .eq("request_id", input.requestId);
    if (error) return { ok: false };
  }
  revalidatePath(`/interview/${input.requestId}`);
  return { ok: true };
}

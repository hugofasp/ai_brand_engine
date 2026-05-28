import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, AdminTopBar } from "@/lib/admin/auth-guard";
import { DeleteRequestButton } from "../delete-button";
import { GenerateBrandEngineCta } from "../generate-cta";
import { ForceCompleteButton } from "../force-complete-button";
import { IteratePackCta } from "../iterate-cta";
import { SendPackButton } from "../send-pack-button";
import { CustomInstructionsPanel } from "../custom-instructions-panel";
import {
  costUsd,
  formatTokens,
  formatUsd,
  sumBundles,
  totalInputTokens,
  ZERO_BUNDLE,
  type TokenBundle,
  SONNET_4_6_PRICING_USD_PER_MTOK,
} from "@/lib/admin/pricing";
import { PHASE_NAMES, type Phase } from "@/interview/types";
import type {
  InterviewConversation,
  MaterialsContext,
  ConversationMessage,
  DraftEntry,
  GeneratedFileRow,
  PackIteration,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Request",
};

export const dynamic = "force-dynamic";

export default async function AdminRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  await requireAdmin();
  const { requestId } = await params;

  const supabase = getSupabaseAdmin();
  // Resilient lookup: try the full select (which includes the
  // iteration_history column added by migration 0006). If that errors
  // (e.g. migration not applied in this env), fall back to a select
  // without that column so the page still loads with empty history.
  let { data: request, error: requestErr } = await supabase
    .from("requests")
    .select(
      "id, company_name, contact_name, contact_email, contact_role, status, created_at, updated_at, product, iteration_history",
    )
    .eq("id", requestId)
    .maybeSingle();
  if (requestErr) {
    const retry = await supabase
      .from("requests")
      .select(
        "id, company_name, contact_name, contact_email, contact_role, status, created_at, updated_at, product",
      )
      .eq("id", requestId)
      .maybeSingle();
    request = retry.data
      ? ({ ...retry.data, iteration_history: [] } as typeof request)
      : null;
    requestErr = retry.error;
  }
  if (!request) {
    return (
      <RequestMissing
        requestId={requestId}
        dbError={requestErr?.message}
      />
    );
  }

  const { data: ans } = await supabase
    .from("interview_answers")
    .select(
      "answers, interview_conversation, materials_context, completed_phases, current_phase",
    )
    .eq("request_id", requestId)
    .maybeSingle();

  const { data: filesRaw } = await supabase
    .from("generated_files")
    .select(
      "id, file_name, file_size_bytes, framework_version, locale, status, content, generation_model, created_at",
    )
    .eq("request_id", requestId)
    .order("file_name", { ascending: true });
  const files: GeneratedFileRow[] = (filesRaw ?? []) as GeneratedFileRow[];

  const conv =
    (ans?.interview_conversation as InterviewConversation | undefined) ?? {};
  const materials =
    (ans?.materials_context as MaterialsContext | undefined) ?? {};
  const completedPhases = (ans?.completed_phases as number[]) ?? [];
  const answers =
    (ans?.answers as Record<string, Record<string, unknown>> | undefined) ??
    {};

  const chatUsage = bundleOrZero(conv.token_usage);
  const extractionUsage = bundleOrZero(materials.token_usage);
  const total = sumBundles(chatUsage, extractionUsage);

  const turnCount = conv.token_usage?.turn_count ?? 0;
  const extractRunCount = materials.token_usage?.run_count ?? 0;

  return (
    <>
      <AdminTopBar
        trail={[
          {
            label: request.company_name ?? "(no brand)",
          },
        ]}
      />
      <div className="mx-auto max-w-[1180px] space-y-10 px-6 py-10">
        {/* Header */}
        <header>
          <p
            className="text-[12px] uppercase text-text-secondary"
            style={{ letterSpacing: "0.02em" }}
          >
            {/* Product tag carries the platform identity colour (purple).
                Marks "this artefact is brand.soul OS output". */}
            <span style={{ color: "var(--color-accent-purple)" }}>
              {request.product ?? "request"}
            </span>{" "}
            · {(request.status as string).replace(/_/g, " ")}
          </p>
          <h1
            className="mt-2 font-serif lowercase text-[28px] leading-[1.2]"
            style={{ letterSpacing: "-0.01em" }}
          >
            {request.company_name ?? "(no brand)"}
          </h1>
          {materials.summary ? (
            <p className="mt-3 max-w-[820px] text-[15px] leading-[1.55] text-text-secondary">
              {materials.summary}
            </p>
          ) : null}
        </header>

        {/* Client identity card: at-a-glance "who is this client".
            Contact, website, materials and timestamps in a key-value grid.
            Sits above the action bar so the operator knows who they're
            acting on before they click Generate or Send. */}
        <section
          className="rounded-md border bg-bg-secondary p-5"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-[13px] md:grid-cols-3">
            <div>
              <dt
                className="text-[11px] uppercase text-text-muted"
                style={{ letterSpacing: "0.04em" }}
              >
                Contact
              </dt>
              <dd className="mt-1 text-text-primary">
                {request.contact_name ?? "(no name)"}
                {request.contact_role ? ` · ${request.contact_role}` : null}
                <br />
                <a
                  className="text-text-secondary underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
                  href={`mailto:${request.contact_email}`}
                >
                  {request.contact_email ?? "(no email)"}
                </a>
              </dd>
            </div>

            <div>
              <dt
                className="text-[11px] uppercase text-text-muted"
                style={{ letterSpacing: "0.04em" }}
              >
                Website
              </dt>
              <dd className="mt-1 text-text-primary">
                {materials.url ? (
                  <a
                    href={materials.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:opacity-70"
                  >
                    {materials.url} ↗
                  </a>
                ) : (
                  <span className="text-text-muted italic">none provided</span>
                )}
                {materials.url_content ? (
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {materials.url_content.length.toLocaleString()} chars
                    crawled
                  </p>
                ) : null}
              </dd>
            </div>

            <div>
              <dt
                className="text-[11px] uppercase text-text-muted"
                style={{ letterSpacing: "0.04em" }}
              >
                Created
              </dt>
              <dd className="mt-1 text-text-primary">
                {new Date(request.created_at as string).toLocaleString()}
                <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                  id {requestId}
                </p>
              </dd>
            </div>
          </dl>

          <div
            className="mt-5 flex flex-wrap items-center gap-4 border-t pt-4 text-[12px]"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <Link
              href={`/interview/${requestId}/chat`}
              className="text-text-secondary underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
            >
              Open user-facing chat ↗
            </Link>
            {materials.extracted_at ? (
              <span className="text-text-muted">
                extracted{" "}
                {new Date(materials.extracted_at).toLocaleString()}
              </span>
            ) : null}
          </div>
        </section>

        {/* Client materials: a single panel that shows everything the
            client gave us (website, pasted text, uploaded files). Always
            renders, with explicit "none provided" states so the operator
            can see at a glance whether the inputs are thin or rich. */}
        <section>
          <h2
            className="text-[12px] uppercase text-text-secondary"
            style={{ letterSpacing: "0.02em" }}
          >
            Client materials
          </h2>
          <p className="mt-1 text-[12px] text-text-muted">
            What the client submitted in Phase 0. The conversational
            interviewer and the draft extraction both consume this set.
          </p>

          <div
            className="mt-3 divide-y rounded-md border bg-bg-secondary"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            {/* Website */}
            <div className="p-4">
              <p
                className="text-[11px] uppercase text-text-muted"
                style={{ letterSpacing: "0.04em" }}
              >
                Website
              </p>
              {materials.url ? (
                <>
                  <p className="mt-1 text-[13px]">
                    <a
                      href={materials.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-primary hover:underline"
                    >
                      {materials.url} ↗
                    </a>
                  </p>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {materials.url_scraped_at
                      ? `Crawled ${new Date(materials.url_scraped_at).toLocaleString()}`
                      : "(not yet crawled)"}
                    {materials.url_content
                      ? ` · ${materials.url_content.length.toLocaleString()} chars captured`
                      : ""}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[13px] text-text-muted italic">
                  none provided
                </p>
              )}
            </div>

            {/* Pasted text */}
            <div className="p-4">
              <p
                className="text-[11px] uppercase text-text-muted"
                style={{ letterSpacing: "0.04em" }}
              >
                Pasted text
              </p>
              {materials.pasted_text ? (
                <>
                  <p className="mt-1 text-[13px] text-text-primary">
                    {materials.pasted_text.length.toLocaleString()} chars
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[12px] text-text-muted hover:text-[color:var(--color-accent-purple)]">
                      Preview
                    </summary>
                    <pre className="mt-2 max-h-[240px] overflow-auto rounded-md bg-bg-primary p-2 text-[12px] whitespace-pre-wrap text-text-secondary">
                      {materials.pasted_text}
                    </pre>
                  </details>
                </>
              ) : (
                <p className="mt-1 text-[13px] text-text-muted italic">
                  none provided
                </p>
              )}
            </div>

            {/* Uploaded files */}
            <div className="p-4">
              <p
                className="text-[11px] uppercase text-text-muted"
                style={{ letterSpacing: "0.04em" }}
              >
                Uploaded files
                {(materials.uploaded_files?.length ?? 0) > 0
                  ? ` (${materials.uploaded_files!.length})`
                  : ""}
              </p>
              {(materials.uploaded_files?.length ?? 0) > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {materials.uploaded_files!.map((f) => (
                    <li
                      key={f.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border bg-bg-primary px-3 py-2 text-[13px]"
                      style={{ borderColor: "var(--color-border-subtle)" }}
                    >
                      <div className="min-w-0">
                        <a
                          href={`/api/admin/materials/${requestId}/${f.id}`}
                          className="font-mono text-text-primary hover:underline"
                        >
                          {f.name}
                        </a>
                        <p className="mt-0.5 text-[11px] text-text-muted">
                          {f.mime} ·{" "}
                          {f.bytes < 1024 * 1024
                            ? `${Math.round(f.bytes / 1024)} KB`
                            : `${(f.bytes / 1024 / 1024).toFixed(1)} MB`}{" "}
                          ·{" "}
                          {f.extraction_empty
                            ? "no text extracted"
                            : `${f.extracted_chars.toLocaleString()} chars extracted`}
                          {" · uploaded "}
                          {new Date(f.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                      <a
                        href={`/api/admin/materials/${requestId}/${f.id}`}
                        className="text-[12px] text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
                        download
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[13px] text-text-muted italic">
                  none provided
                </p>
              )}
              {(materials.uploaded_text?.length ?? 0) > 0 ? (
                <p className="mt-2 text-[11px] text-text-muted">
                  {(materials.uploaded_text?.length ?? 0).toLocaleString()}{" "}
                  chars extracted across all files
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Action bar. Buttons sit in a single centred row; the Generate
            helper text is rendered as a caption below the row so the
            button heights stay uniform and the spacing reads as a clean
            toolbar rather than a column-stacked cluster. */}
        <section
          className="rounded-md border bg-bg-secondary p-4"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <GenerateBrandEngineCta requestId={requestId} />
            <SendPackButton
              requestId={requestId}
              contactEmail={(request.contact_email as string) ?? null}
              contactName={(request.contact_name as string) ?? null}
              hasGeneratedFiles={files.length > 0}
              alreadySent={request.status === "sent"}
            />
            <div className="ml-auto flex items-center gap-2">
              <ForceCompleteButton requestId={requestId} />
              <DeleteRequestButton
                requestId={requestId}
                brand={request.company_name as string | null}
                email={request.contact_email as string | null}
                variant="full"
                onDeleted="back-to-admin"
              />
            </div>
          </div>
          {files.length === 0 ? (
            <p className="mt-3 max-w-[640px] text-[12px] text-text-muted">
              Renders the full brand pack. Voice rules + lexicon are
              deterministic (instant). The narrative files (README,
              USAGE_GUIDE, BRAND CORE, AUDIENCE, PILLARS) are written by
              Claude in the brand&apos;s voice, which takes ~30 to 60
              seconds total.
            </p>
          ) : null}
        </section>

        {/* Custom instructions (paste-ready block + raw file) */}
        {files.find((f) => f.file_name === "0_CUSTOM_INSTRUCTIONS.txt")
          ?.content ? (
          <CustomInstructionsPanel
            fullContent={
              files.find((f) => f.file_name === "0_CUSTOM_INSTRUCTIONS.txt")
                ?.content ?? ""
            }
          />
        ) : null}

        {/* Generated files */}
        {files.length > 0 ? (
          <section id="generated-files" className="scroll-mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2
                  className="text-[12px] uppercase text-text-secondary"
                  style={{ letterSpacing: "0.02em" }}
                >
                  {/* Purple `.soul` mark signs the artefact: these files
                      are platform-authored output, not user content. */}
                  <span
                    aria-hidden="true"
                    className="font-mono"
                    style={{ color: "var(--color-accent-purple)" }}
                  >
                    &gt; brand.soul
                  </span>
                  {"  "}
                  Generated files ({files.length})
                </h2>
                <p className="mt-1 text-[12px] text-text-muted">
                  Framework version{" "}
                  <code className="text-text-primary">
                    {files[0]?.framework_version}
                  </code>{" "}
                  · generated{" "}
                  {files[0]?.created_at
                    ? new Date(files[0].created_at).toLocaleString()
                    : "(unknown)"}
                </p>
              </div>
              <a
                href={`/api/admin/download/${requestId}`}
                className="inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-[13px] text-text-primary hover:bg-bg-secondary"
                style={{ borderColor: "var(--color-border-emphasis)" }}
              >
                Download .zip
              </a>
            </div>
            <ul className="mt-3 space-y-3">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="rounded-md border bg-bg-secondary"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
                  <details>
                    <summary className="flex cursor-pointer items-baseline justify-between gap-3 p-4 hover:bg-bg-tertiary">
                      <span>
                        <span className="font-mono text-[14px] text-text-primary">
                          {f.file_name}
                        </span>
                        {f.locale ? (
                          <span className="ml-2 text-[11px] uppercase text-text-muted">
                            {f.locale}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-[12px] text-text-muted">
                        {f.file_size_bytes
                          ? `${f.file_size_bytes.toLocaleString()} bytes`
                          : ""}
                        {f.generation_model
                          ? ` · ${f.generation_model}`
                          : ""}
                      </span>
                    </summary>
                    <pre
                      className="overflow-x-auto border-t bg-bg-primary p-4 text-[13px] whitespace-pre-wrap leading-[1.6] text-text-primary"
                      style={{ borderColor: "var(--color-border-subtle)" }}
                    >
                      {f.content ?? "(no content stored)"}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Iterate (only when there's something to iterate on, or there's
            history to show). Avoids a dead panel saying "generate first"
            taking vertical space before the pack exists. */}
        {files.length > 0 ||
        ((request.iteration_history as PackIteration[] | null)?.length ?? 0) >
          0 ? (
          <section id="iterate" className="scroll-mt-6">
            <IteratePackCta
              requestId={requestId}
              variant="full"
              history={
                (request.iteration_history as PackIteration[] | null) ?? []
              }
              hasGeneratedFiles={files.length > 0}
            />
          </section>
        ) : null}

        {/* Cost & token panel */}
        <section>
          <h2
            className="text-[12px] uppercase text-text-secondary"
            style={{ letterSpacing: "0.02em" }}
          >
            Anthropic spend
          </h2>
          <div
            className="mt-3 grid grid-cols-2 gap-px rounded-md border bg-bg-secondary text-[13px] md:grid-cols-4"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <BigStat
              label="Total cost"
              value={formatUsd(costUsd(total))}
              sub={`${formatTokens(totalInputTokens(total) + total.output_tokens)} tokens`}
              primary
            />
            <BigStat
              label="Chat"
              value={formatUsd(costUsd(chatUsage))}
              sub={`${turnCount} turn${turnCount === 1 ? "" : "s"}`}
            />
            <BigStat
              label="Extraction"
              value={formatUsd(costUsd(extractionUsage))}
              sub={`${extractRunCount} run${extractRunCount === 1 ? "" : "s"}`}
            />
            <BigStat
              label="Cache hit rate"
              value={cacheHitRate(total)}
              sub="cache_read / total input"
            />
          </div>

          {/* Breakdown table */}
          <table className="mt-6 w-full text-left text-[13px]">
            <thead
              className="text-[11px] uppercase text-text-muted"
              style={{ letterSpacing: "0.04em" }}
            >
              <tr
                className="border-b"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <Th>Category</Th>
                <Th align="right">Input</Th>
                <Th align="right">Output</Th>
                <Th align="right">Cache create</Th>
                <Th align="right">Cache read</Th>
                <Th align="right">Cost</Th>
              </tr>
            </thead>
            <tbody>
              <TokenRow label="Chat" b={chatUsage} />
              <TokenRow label="Extraction" b={extractionUsage} />
              <tr
                className="border-t font-medium text-text-primary"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <Td>Total</Td>
                <Td align="right">{formatTokens(total.input_tokens)}</Td>
                <Td align="right">{formatTokens(total.output_tokens)}</Td>
                <Td align="right">
                  {formatTokens(total.cache_creation_input_tokens)}
                </Td>
                <Td align="right">
                  {formatTokens(total.cache_read_input_tokens)}
                </Td>
                <Td align="right">{formatUsd(costUsd(total))}</Td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-[12px] text-text-muted">
            Pricing: input ${SONNET_4_6_PRICING_USD_PER_MTOK.input}/M, output $
            {SONNET_4_6_PRICING_USD_PER_MTOK.output}/M, cache-create $
            {SONNET_4_6_PRICING_USD_PER_MTOK.cache_creation_input}/M,
            cache-read ${SONNET_4_6_PRICING_USD_PER_MTOK.cache_read_input}/M.
            Sonnet 4.6.
          </p>
        </section>

        {/* Progress */}
        <section>
          <h2
            className="text-[12px] uppercase text-text-secondary"
            style={{ letterSpacing: "0.02em" }}
          >
            Progress
          </h2>
          <ProgressRow
            filledFields={conv.completed_fields ?? []}
            completedPhases={completedPhases}
          />
        </section>


        {/* Interview deep-dive: heavy interview content (drafts produced
            by extraction, captured answers, full chat transcript). Closed
            by default so the operational view above stays scannable.
            Sources / uploads stay outside so the client identity is
            visible without expanding. */}
        <details className="group/dive">
          <summary
            className="cursor-pointer list-none flex items-center justify-between gap-3 rounded-md border bg-bg-secondary px-4 py-3 hover:bg-bg-tertiary"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <span className="flex items-baseline gap-3">
              <span
                className="font-mono text-[14px] text-text-primary transition-transform group-open/dive:rotate-90"
                style={{ display: "inline-block" }}
                aria-hidden="true"
              >
                ▸
              </span>
              <span
                className="text-[12px] uppercase text-text-secondary"
                style={{ letterSpacing: "0.04em" }}
              >
                Interview deep-dive
              </span>
              <span className="text-[11px] text-text-muted">
                extracted drafts · captured answers · full transcript
              </span>
            </span>
          </summary>
          <div className="mt-8 space-y-10">

        {/* Materials drafts */}
        {materials.extracted_at ? (
          <section>
            <h2
              className="text-[12px] uppercase text-text-secondary"
              style={{ letterSpacing: "0.02em" }}
            >
              Extracted drafts
            </h2>
            <p className="mt-1 text-[12px] text-text-muted">
              {[
                materials.url ? `website: ${materials.url}` : null,
                materials.pasted_text ? "pasted text" : null,
                (materials.uploaded_files?.length ?? 0) > 0
                  ? `${materials.uploaded_files!.length} uploaded file${materials.uploaded_files!.length === 1 ? "" : "s"}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "(no source recorded)"}{" "}
              · extracted{" "}
              {new Date(materials.extracted_at).toLocaleString()}
            </p>
            <DraftList drafts={materials.drafts ?? {}} />
          </section>
        ) : null}

        {/* Answers */}
        {Object.keys(answers).length > 0 ? (
          <section>
            <h2
              className="text-[12px] uppercase text-text-secondary"
              style={{ letterSpacing: "0.02em" }}
            >
              Captured answers
            </h2>
            <AnswerList answers={answers} />
          </section>
        ) : null}

        {/* Conversation transcript */}
        <section>
          <h2
            className="text-[12px] uppercase text-text-secondary"
            style={{ letterSpacing: "0.02em" }}
          >
            Conversation
          </h2>
          <Transcript messages={conv.messages ?? []} />
        </section>
          </div>
        </details>
      </div>
    </>
  );
}

/* ---------------- subcomponents ---------------- */

function RequestMissing({
  requestId,
  dbError,
}: {
  requestId: string;
  dbError?: string;
}) {
  return (
    <>
      <AdminTopBar />
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <h1
          className="font-serif lowercase text-[28px] leading-[1.2]"
          style={{ letterSpacing: "-0.01em" }}
        >
          That request isn&apos;t here anymore.
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          Either it was just deleted, or the link came from a stale list.
          Reload the dashboard to see the current set of requests.
        </p>
        <div
          className="mt-4 rounded-md border bg-bg-secondary p-3 text-[12px] text-text-muted"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <p>
            requested id{" "}
            <code className="text-text-primary">{requestId}</code>
          </p>
          {dbError ? (
            <p className="mt-1">
              db error: <code className="text-text-primary">{dbError}</code>
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-md bg-cta-bg px-4 py-2 text-[13px] font-medium text-cta-text hover:opacity-90"
          >
            Back to admin
          </Link>
        </div>
      </div>
    </>
  );
}

function bundleOrZero(u: Partial<TokenBundle> | undefined): TokenBundle {
  if (!u) return ZERO_BUNDLE;
  return {
    input_tokens: u.input_tokens ?? 0,
    output_tokens: u.output_tokens ?? 0,
    cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
  };
}

function cacheHitRate(b: TokenBundle): string {
  const totalInput = totalInputTokens(b);
  if (totalInput === 0) return "n/a";
  return `${Math.round((b.cache_read_input_tokens / totalInput) * 100)}%`;
}

function TokenRow({ label, b }: { label: string; b: TokenBundle }) {
  return (
    <tr
      className="border-b"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <Td>{label}</Td>
      <Td align="right">{formatTokens(b.input_tokens)}</Td>
      <Td align="right">{formatTokens(b.output_tokens)}</Td>
      <Td align="right">{formatTokens(b.cache_creation_input_tokens)}</Td>
      <Td align="right">{formatTokens(b.cache_read_input_tokens)}</Td>
      <Td align="right">{formatUsd(costUsd(b))}</Td>
    </tr>
  );
}

function BigStat({
  label,
  value,
  sub,
  primary,
}: {
  label: string;
  value: string;
  sub?: string;
  primary?: boolean;
}) {
  return (
    <div className="bg-bg-primary p-5">
      <p
        className="text-[11px] uppercase text-text-muted"
        style={{ letterSpacing: "0.04em" }}
      >
        {label}
      </p>
      <p
        className={
          primary
            ? "mt-1 font-serif lowercase text-[26px] text-text-primary"
            : "mt-1 text-[20px] text-text-primary"
        }
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-[11px] text-text-muted">{sub}</p>
      ) : null}
    </div>
  );
}

function ProgressRow({
  filledFields,
  completedPhases,
}: {
  filledFields: string[];
  completedPhases: number[];
}) {
  const counts: Record<Phase, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
  };
  for (const f of filledFields) {
    const m = f.match(/^phase_(\d)\./);
    if (!m) continue;
    const ph = Number(m[1]) as Phase;
    if (ph >= 1 && ph <= 7) counts[ph] += 1;
  }
  const completedSet = new Set(completedPhases);
  return (
    <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-7">
      {([1, 2, 3, 4, 5, 6, 7] as Phase[]).map((p) => {
        const done = completedSet.has(p);
        return (
          <li
            key={p}
            className="rounded-md border bg-bg-secondary p-3 text-[12px]"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <p className="text-text-muted">{PHASE_NAMES[p]}</p>
            <p className="mt-1 text-[16px] text-text-primary">
              {counts[p]}
              {done ? " ✓" : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function DraftList({ drafts }: { drafts: Record<string, DraftEntry> }) {
  const entries = Object.entries(drafts);
  if (entries.length === 0) {
    return (
      <p className="mt-3 text-[14px] text-text-muted">No drafts extracted.</p>
    );
  }
  return (
    <ul className="mt-3 space-y-3">
      {entries.map(([qid, d]) => (
        <li
          key={qid}
          className="rounded-md border bg-bg-secondary p-4 text-[14px]"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <p
            className="text-[11px] uppercase text-text-muted"
            style={{ letterSpacing: "0.04em" }}
          >
            {qid}
            {d.dismissed ? " · dismissed" : ""}
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-text-primary">
            {JSON.stringify(d.value, null, 2)}
          </pre>
          {d.source_quotes && d.source_quotes.length > 0 ? (
            <details className="mt-2 text-[12px]">
              <summary className="cursor-pointer text-text-muted">
                source quotes ({d.source_quotes.length})
              </summary>
              <ul className="mt-1 list-disc pl-5 text-text-secondary">
                {d.source_quotes.map((q, i) => (
                  <li key={i}>&ldquo;{q}&rdquo;</li>
                ))}
              </ul>
            </details>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function AnswerList({
  answers,
}: {
  answers: Record<string, Record<string, unknown>>;
}) {
  return (
    <div className="mt-3 space-y-6">
      {Object.entries(answers)
        .sort()
        .map(([phaseKey, fields]) => (
          <div key={phaseKey}>
            <p
              className="text-[11px] uppercase text-text-muted"
              style={{ letterSpacing: "0.04em" }}
            >
              {phaseKey}
            </p>
            <ul className="mt-2 space-y-2">
              {Object.entries(fields).map(([qid, v]) => (
                <li
                  key={qid}
                  className="rounded-md border bg-bg-secondary p-3 text-[13px]"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
                  <p
                    className="text-[11px] uppercase text-text-muted"
                    style={{ letterSpacing: "0.04em" }}
                  >
                    {qid}
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap text-text-primary">
                    {JSON.stringify(v, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

function Transcript({ messages }: { messages: ConversationMessage[] }) {
  if (messages.length === 0) {
    return (
      <p className="mt-3 text-[14px] text-text-muted">
        No conversation yet.
      </p>
    );
  }
  return (
    <ol className="mt-3 space-y-3">
      {messages.map((m, i) => (
        <li key={i}>
          <TranscriptRow message={m} />
        </li>
      ))}
    </ol>
  );
}

function TranscriptRow({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user";
  const text = extractText(message.content);
  const toolUses = extractToolUses(message.content, message.tool_uses);
  return (
    <div
      className="rounded-md border p-4 text-[14px]"
      style={{
        borderColor: "var(--color-border-subtle)",
        background: isUser ? "var(--color-bg-tertiary)" : "var(--color-bg-secondary)",
      }}
    >
      <p
        className="text-[11px] uppercase text-text-muted"
        style={{ letterSpacing: "0.04em" }}
      >
        {message.role} · {new Date(message.at).toLocaleString()}
      </p>
      {text ? (
        <p className="mt-2 whitespace-pre-wrap text-text-primary">{text}</p>
      ) : null}
      {toolUses.length > 0 ? (
        <details className="mt-2 text-[12px]">
          <summary className="cursor-pointer text-text-muted">
            {toolUses.length} tool call{toolUses.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-2">
            {toolUses.map((t, i) => (
              <li
                key={i}
                className="rounded border bg-bg-primary p-3"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <p className="font-medium text-text-primary">{t.name}</p>
                <pre className="mt-1 whitespace-pre-wrap text-text-secondary">
                  {JSON.stringify(t.input, null, 2)}
                </pre>
                {t.result !== undefined ? (
                  <pre className="mt-2 whitespace-pre-wrap text-text-muted">
                    {typeof t.result === "string"
                      ? t.result
                      : JSON.stringify(t.result, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const block of content as Array<Record<string, unknown>>) {
    if (!block || typeof block !== "object") continue;
    if (block.type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    } else if (block.type === "tool_result" && typeof block.content === "string") {
      parts.push(`[tool_result] ${block.content}`);
    }
  }
  return parts.join("\n\n");
}

function extractToolUses(
  content: unknown,
  trace?: Array<{ name: string; input: Record<string, unknown>; result?: unknown }>,
): Array<{ name: string; input: Record<string, unknown>; result?: unknown }> {
  if (trace && trace.length > 0) return trace;
  if (!Array.isArray(content)) return [];
  const out: Array<{ name: string; input: Record<string, unknown> }> = [];
  for (const block of content as Array<Record<string, unknown>>) {
    if (block && block.type === "tool_use") {
      out.push({
        name: String(block.name),
        input: (block.input as Record<string, unknown>) ?? {},
      });
    }
  }
  return out;
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className="px-3 py-2.5"
      style={{ textAlign: align ?? "left", fontWeight: 500 }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className="px-3 py-2.5 text-text-secondary"
      style={{ textAlign: align ?? "left" }}
    >
      {children}
    </td>
  );
}

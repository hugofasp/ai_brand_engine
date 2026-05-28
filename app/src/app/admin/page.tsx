import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, AdminTopBar } from "@/lib/admin/auth-guard";
import { CopyIdButton } from "./copy-id-button";
import { DeleteRequestButton } from "./delete-button";
import { GenerateBrandEngineCta } from "./generate-cta";
import { IteratePackCta } from "./iterate-cta";
import { SeedSampleButton } from "./seed-button";
import {
  costUsd,
  formatTokens,
  formatUsd,
  sumBundles,
  ZERO_BUNDLE,
  type TokenBundle,
} from "@/lib/admin/pricing";
import type {
  InterviewConversation,
  MaterialsContext,
  RequestStatus,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Requests",
};

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_role: string | null;
  status: RequestStatus | string;
  created_at: string;
  updated_at: string | null;
  last_active: string | null;
  filled_count: number;
  completed_phases: number;
  extraction_usage: TokenBundle;
  chat_usage: TokenBundle;
  total_usage: TokenBundle;
  total_cost_usd: number;
  has_materials: boolean;
  has_generated_files: boolean;
};

export default async function AdminDashboard() {
  await requireAdmin();

  const supabase = getSupabaseAdmin();

  // Pull every request + its interview answers in one go. For v1 the
  // expected row count is small (dozens, not thousands), so we don't
  // bother with pagination yet.
  const { data: requests, error: reqErr } = await supabase
    .from("requests")
    .select(
      "id, company_name, contact_name, contact_email, contact_role, status, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (reqErr) {
    return (
      <Wrapper>
        <p className="px-6 py-12 text-text-secondary">
          Couldn&apos;t load requests: {reqErr.message}
        </p>
      </Wrapper>
    );
  }

  const ids = (requests ?? []).map((r) => r.id as string);
  const answersById = new Map<
    string,
    {
      conv?: InterviewConversation;
      materials?: MaterialsContext;
      completedPhases: number[];
    }
  >();
  const generatedFileCount = new Map<string, number>();
  if (ids.length > 0) {
    const { data: answers } = await supabase
      .from("interview_answers")
      .select(
        "request_id, interview_conversation, materials_context, completed_phases",
      )
      .in("request_id", ids);
    for (const a of answers ?? []) {
      answersById.set(a.request_id as string, {
        conv:
          (a.interview_conversation as InterviewConversation | undefined) ??
          {},
        materials:
          (a.materials_context as MaterialsContext | undefined) ?? {},
        completedPhases: (a.completed_phases as number[]) ?? [],
      });
    }
    const { data: files } = await supabase
      .from("generated_files")
      .select("request_id")
      .in("request_id", ids);
    for (const f of files ?? []) {
      const rid = f.request_id as string;
      generatedFileCount.set(rid, (generatedFileCount.get(rid) ?? 0) + 1);
    }
  }

  const rows: Row[] = (requests ?? []).map((r) => {
    const a = answersById.get(r.id as string) ?? {
      conv: {} as InterviewConversation,
      materials: {} as MaterialsContext,
      completedPhases: [] as number[],
    };
    const chatUsage = bundleOrZero(a.conv?.token_usage);
    const extractionUsage = bundleOrZero(a.materials?.token_usage);
    const total = sumBundles(chatUsage, extractionUsage);
    return {
      id: r.id as string,
      company_name: (r.company_name as string) ?? null,
      contact_name: (r.contact_name as string) ?? null,
      contact_email: (r.contact_email as string) ?? null,
      contact_role: (r.contact_role as string) ?? null,
      status: (r.status as string) ?? "started",
      created_at: r.created_at as string,
      updated_at: (r.updated_at as string) ?? null,
      last_active: a.conv?.last_active ?? null,
      filled_count: a.conv?.completed_fields?.length ?? 0,
      completed_phases: a.completedPhases.length,
      extraction_usage: extractionUsage,
      chat_usage: chatUsage,
      total_usage: total,
      total_cost_usd: costUsd(total),
      has_materials: Boolean(a.materials?.extracted_at),
      has_generated_files: (generatedFileCount.get(r.id as string) ?? 0) > 0,
    };
  });

  // Server components render fresh per request; reading wall-clock time
  // here is intentional and stable for the duration of the response.
  // eslint-disable-next-line react-hooks/purity
  const renderedAt = Date.now();
  const grand = rows.reduce(
    (acc, r) => ({
      cost: acc.cost + r.total_cost_usd,
      input: acc.input + r.total_usage.input_tokens,
      output: acc.output + r.total_usage.output_tokens,
      cacheCreate:
        acc.cacheCreate + r.total_usage.cache_creation_input_tokens,
      cacheRead: acc.cacheRead + r.total_usage.cache_read_input_tokens,
    }),
    { cost: 0, input: 0, output: 0, cacheCreate: 0, cacheRead: 0 },
  );

  return (
    <Wrapper>
      <div className="mx-auto max-w-[1180px] px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              className="font-serif lowercase text-[28px] leading-[1.2]"
              style={{ letterSpacing: "-0.01em" }}
            >
              Requests
            </h1>
            <p className="mt-1 text-[13px] text-text-muted">
              {rows.length} request{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <SeedSampleButton />
        </header>

        {/* Grand totals card */}
        <section
          className="mt-6 grid grid-cols-2 gap-px rounded-md border bg-bg-secondary text-[13px] md:grid-cols-5"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <Stat label="Total cost" value={formatUsd(grand.cost)} primary />
          <Stat label="Input" value={formatTokens(grand.input)} />
          <Stat label="Output" value={formatTokens(grand.output)} />
          <Stat
            label="Cache (create)"
            value={formatTokens(grand.cacheCreate)}
          />
          <Stat label="Cache (read)" value={formatTokens(grand.cacheRead)} />
        </section>

        {/* Table */}
        <section className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-[12px] uppercase text-text-muted" style={{ letterSpacing: "0.02em" }}>
              <tr className="border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
                <Th>Brand</Th>
                <Th>ID</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Fields · Phases</Th>
                <Th>Materials</Th>
                <Th align="right">Chat $</Th>
                <Th align="right">Extract $</Th>
                <Th align="right">Total $</Th>
                <Th>Last active</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-text-muted">
                    No requests yet.
                  </td>
                </tr>
              ) : null}
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b align-top hover:bg-bg-secondary"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
                  <Td>
                    <Link
                      href={`/admin/${r.id}`}
                      className="block font-medium text-text-primary hover:underline"
                    >
                      {r.company_name ?? "(no brand)"}
                    </Link>
                    <span className="block text-[12px] text-text-muted">
                      {r.contact_name ?? "(no name)"}
                      {r.contact_role ? ` · ${r.contact_role}` : null}
                    </span>
                  </Td>
                  <Td>
                    <CopyIdButton id={r.id} />
                  </Td>
                  <Td>
                    {r.contact_email ? (
                      <a
                        href={`mailto:${r.contact_email}`}
                        className="text-text-primary hover:underline"
                      >
                        {r.contact_email}
                      </a>
                    ) : (
                      <span className="text-text-muted">no email</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                  <Td>
                    {r.filled_count} · {r.completed_phases}/7
                  </Td>
                  <Td>{r.has_materials ? "yes" : "no"}</Td>
                  <Td align="right">{formatUsd(costUsd(r.chat_usage))}</Td>
                  <Td align="right">
                    {formatUsd(costUsd(r.extraction_usage))}
                  </Td>
                  <Td align="right">
                    <span className="font-medium text-text-primary">
                      {formatUsd(r.total_cost_usd)}
                    </span>
                  </Td>
                  <Td>
                    <RelativeTime
                      iso={r.last_active ?? r.updated_at ?? r.created_at}
                      now={renderedAt}
                    />
                  </Td>
                  <Td align="right">
                    <div className="inline-flex flex-col items-end gap-1.5">
                      <GenerateBrandEngineCta
                        requestId={r.id}
                        variant="compact"
                      />
                      <IteratePackCta
                        requestId={r.id}
                        variant="compact"
                        hasGeneratedFiles={r.has_generated_files}
                      />
                      <DeleteRequestButton
                        requestId={r.id}
                        brand={r.company_name}
                        email={r.contact_email}
                        variant="compact"
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminTopBar />
      {children}
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

function Stat({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div className="bg-bg-primary p-4">
      <p
        className="text-[11px] uppercase text-text-muted"
        style={{ letterSpacing: "0.04em" }}
      >
        {label}
      </p>
      <p
        className={
          primary
            ? "mt-1 font-serif lowercase text-[22px] text-text-primary"
            : "mt-1 text-[18px] text-text-primary"
        }
      >
        {value}
      </p>
    </div>
  );
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

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className="inline-block rounded-sm border px-2 py-0.5 text-[11px] uppercase text-text-secondary"
      style={{
        borderColor: "var(--color-border-subtle)",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  );
}

function RelativeTime({ iso, now }: { iso: string | null; now: number }) {
  if (!iso) return <span className="text-text-muted">never</span>;
  const d = new Date(iso);
  const diffSec = Math.floor((now - d.getTime()) / 1000);
  let label: string;
  if (diffSec < 60) label = "just now";
  else if (diffSec < 3600) label = `${Math.floor(diffSec / 60)}m ago`;
  else if (diffSec < 86400) label = `${Math.floor(diffSec / 3600)}h ago`;
  else label = `${Math.floor(diffSec / 86400)}d ago`;
  return (
    <span className="text-text-muted" title={d.toLocaleString()}>
      {label}
    </span>
  );
}

import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { GeneratedFileRow } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Your brand pack",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Public delivery page for the client. No login. Authorised purely by
 * the opaque `delivery_token` in the URL (minted server-side, 32
 * random bytes hex-encoded — unguessable). Lists the files in the
 * pack and offers a one-click zip download.
 *
 * The token can be rotated by the admin clicking "Send pack to client"
 * again; the old URL stops working as soon as a new token is minted.
 */
export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = getSupabaseAdmin();
  const { data: req } = await supabase
    .from("requests")
    .select("id, company_name, contact_name, sent_at")
    .eq("delivery_token", token)
    .maybeSingle();

  if (!req) {
    return <DeliveryUnknown />;
  }

  const { data: filesRaw } = await supabase
    .from("generated_files")
    .select(
      "file_name, file_size_bytes, locale, framework_version, created_at",
    )
    .eq("request_id", req.id)
    .order("file_name", { ascending: true });
  const files = (filesRaw ?? []) as GeneratedFileRow[];

  if (files.length === 0) {
    return <DeliveryUnknown />;
  }

  const brandName = (req.company_name as string) ?? "your brand";
  const firstName =
    ((req.contact_name as string) ?? "").split(" ")[0] || null;
  const sentAt = req.sent_at
    ? new Date(req.sent_at as string).toLocaleString()
    : null;

  return (
    <section className="mx-auto max-w-[680px] px-6 py-16">
      <p
        className="text-[12px] uppercase text-text-secondary"
        style={{ letterSpacing: "0.02em" }}
      >
        Delivery
      </p>
      <h1
        className="mt-4 font-serif lowercase text-[40px] leading-[1.15]"
        style={{ letterSpacing: "-0.015em" }}
      >
        Your brand pack is ready{firstName ? `, ${firstName}` : ""}.
      </h1>
      <p className="mt-4 text-[16px] text-text-secondary">
        {brandName}: {files.length} file{files.length === 1 ? "" : "s"} ready
        to download. Load them into Claude Projects, ChatGPT Custom GPTs,
        or Gemini Gems and your LLM will produce content that respects
        your brand from there on.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`/api/deliver/${token}/download`}
          className="inline-flex items-center justify-center rounded-md bg-cta-bg px-6 py-3 text-[15px] font-medium text-cta-text hover:opacity-90"
        >
          Download .zip
        </a>
        <span className="text-[12px] text-text-muted">
          Framework {files[0]?.framework_version ?? "(unknown)"}
          {sentAt ? ` · sent ${sentAt}` : ""}
        </span>
      </div>

      <section className="mt-12">
        <h2
          className="text-[12px] uppercase text-text-secondary"
          style={{ letterSpacing: "0.02em" }}
        >
          What you&apos;ll find inside
        </h2>
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li
              key={f.file_name}
              className="flex items-baseline justify-between rounded-md border bg-bg-secondary px-3 py-2 text-[13px]"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              <span className="font-mono text-text-primary">
                {f.file_name}
              </span>
              <span className="text-[11px] text-text-muted">
                {f.locale ? `${f.locale.toUpperCase()} · ` : ""}
                {f.file_size_bytes
                  ? `${f.file_size_bytes.toLocaleString()} bytes`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2
          className="text-[12px] uppercase text-text-secondary"
          style={{ letterSpacing: "0.02em" }}
        >
          How to use it
        </h2>
        <ol className="mt-4 space-y-3 text-[14px] text-text-secondary">
          <li>
            <span className="font-medium text-text-primary">1.</span> Open
            the delivery email and copy the custom-instructions block
            (between the BEGIN and END markers). Paste it into your LLM
            project&apos;s <strong>Instructions</strong> field (Claude
            Project Instructions / ChatGPT GPT Instructions / Gemini Gem
            Instructions).{" "}
            <span className="text-text-muted">
              Do not upload the block as a knowledge file. It belongs in
              the instructions field.
            </span>
          </li>
          <li>
            <span className="font-medium text-text-primary">2.</span> Unzip
            the file you just downloaded and attach every file in it to the
            same LLM project as <strong>knowledge / project files</strong>.
          </li>
          <li>
            <span className="font-medium text-text-primary">3.</span> Ask
            the LLM for anything: captions, emails, internal memos. It
            produces content that respects your brand from there on.
          </li>
        </ol>
      </section>

      <p className="mt-12 text-[12px] text-text-muted">
        If anything looks off, reply to the email we sent. We&apos;ll
        iterate.
      </p>
    </section>
  );
}

function DeliveryUnknown() {
  return (
    <section className="mx-auto max-w-[560px] px-6 py-32 text-center">
      <h1
        className="font-serif lowercase text-[40px] leading-[1.15]"
        style={{ letterSpacing: "-0.015em" }}
      >
        This link isn&apos;t valid.
      </h1>
      <p className="mt-4 text-[16px] text-text-secondary">
        It may have been replaced by a newer delivery, or the link is
        wrong. Reply to the email we sent and we&apos;ll resend.
      </p>
    </section>
  );
}

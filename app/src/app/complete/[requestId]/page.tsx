import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Interview submitted",
  robots: { index: false, follow: false },
};

// Copy verbatim from NINEYARDS_STATIC_PAGES.md — "Page: Completion".
export default async function CompletePage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  let contactEmail = "your email";
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("requests")
      .select("contact_email")
      .eq("id", requestId)
      .maybeSingle();
    if (data?.contact_email) contactEmail = data.contact_email as string;
  }

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-[560px]">
        <div
          aria-hidden="true"
          className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-cta-bg text-cta-text"
        >
          <Check size={20} strokeWidth={2.25} />
        </div>

        <h1
          className="text-center font-serif text-[36px] leading-[1.2]"
          style={{ letterSpacing: "-0.01em" }}
        >
          Your interview is in.
        </h1>

        <div className="mt-8 space-y-4 text-[16px] text-text-secondary">
          <p>
            You&apos;ll receive your brand DNA file pack at {contactEmail}{" "}
            within 5-10 minutes for most requests. During high-volume periods,
            allow up to 24 hours.
          </p>
          <p>
            If it doesn&apos;t land, check spam. If still nothing, email
            info@nineyards.pt and we&apos;ll resend.
          </p>
        </div>

        <div className="mt-12">
          <h2
            className="text-[12px] uppercase text-text-secondary"
            style={{ letterSpacing: "0.02em" }}
          >
            While you wait
          </h2>
          <ul className="mt-4 space-y-2 text-[16px] text-text-secondary">
            <li>A zip containing your customized brand DNA file pack</li>
            <li>Implementation Manual PDF (setup for Claude or ChatGPT)</li>
            <li>How-to-Use 3-sheet Quickstart PDF</li>
            <li>
              Universal Custom Instructions text (paste into Claude or ChatGPT)
            </li>
          </ul>
          <Link
            href="/how-to-use"
            className="mt-6 inline-block text-[16px] text-text-primary underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            Read the How-to-Use guide while you wait →
          </Link>
        </div>

        <p className="mt-16 text-[14px] text-text-muted">
          No further action needed. Watch your inbox.
        </p>
      </div>
    </section>
  );
}

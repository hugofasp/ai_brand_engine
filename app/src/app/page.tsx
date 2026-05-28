import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { getRequestIdFromCookie } from "@/app/actions/requests";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { AnimatedHeroTitle } from "./animated-hero-title";
import { HeroAtomBackground } from "./hero-atom-background";
import { HeroProcessStrip } from "./hero-process-strip";

/** Look up the cookie's request id and, if it points at an in-progress
 * interview, return the URL to resume + a friendly label. Used to
 * offer a one-click resume to returning visitors. */
async function getResumeTarget(): Promise<
  | { href: string; brandLabel: string | null }
  | null
> {
  const requestId = await getRequestIdFromCookie();
  if (!requestId) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("requests")
    .select("id, company_name, status")
    .eq("id", requestId)
    .maybeSingle();
  if (error || !data) return null;
  const finishedStatuses = ["interview_complete", "files_generated", "sent"];
  if (finishedStatuses.includes(data.status as string)) return null;
  return {
    href: `/interview/${data.id}/chat`,
    brandLabel: (data.company_name as string) ?? null,
  };
}

export default async function LandingPage() {
  const resume = await getResumeTarget();

  return (
    <main className="relative isolate">
      <section className="relative overflow-hidden px-6 pt-20 pb-32 md:pt-28 md:pb-40">
        <HeroAtomBackground />
        <div className="relative z-10 mx-auto max-w-[860px]">
          <AnimatedHeroTitle />

          {/* Description. The hero says what's promised; FAQ carries
              the longer use-case detail (CEO assistant, CFO co-pilot,
              onboarding programs, multi-team unification). */}
          <p className="mt-8 max-w-[680px] text-[18px] leading-[1.6] text-text-secondary md:text-[20px]">
            Brand systems for the AI era. The single framework your team and
            every AI tool reads as authoritative.
          </p>

          {/* CTA. Terminal $ prompt frames the action verb. */}
          <div className="mt-12 flex flex-col items-start gap-3">
            {resume ? (
              <>
                <Link
                  href={resume.href}
                  className={buttonClasses({
                    size: "lg",
                    className: "px-8 font-mono uppercase tracking-wider",
                  })}
                >
                  Resume my interview →
                </Link>
                <p className="font-mono text-[13px] text-text-muted">
                  {resume.brandLabel
                    ? `// picking up ${resume.brandLabel} where you left off`
                    : "// picking up where you left off"}
                </p>
                <Link
                  href="/start"
                  className="font-mono text-[12px] uppercase text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
                  style={{ letterSpacing: "0.04em" }}
                >
                  or start a new interview
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/start"
                  className={buttonClasses({
                    size: "lg",
                    className: "px-8 font-mono uppercase tracking-wider",
                  })}
                >
                  Generate {">"} brand.soul OS →
                </Link>
                <p className="font-mono text-[13px] text-text-muted">
                  {"// 20-40 min · files delivered by email"}
                </p>
              </>
            )}
          </div>

          <HeroProcessStrip />
        </div>
      </section>
    </main>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { seedSampleRequest } from "./actions";

/**
 * "Seed sample interview" — fast-path to a fully populated request for
 * iterating on the generation pipeline. Creates a request +
 * interview_answers row from the fixture and jumps straight to its
 * admin detail page.
 */
export function SeedSampleButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const r = await seedSampleRequest();
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push(`/admin/${r.requestId}`);
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-[13px] text-text-primary hover:bg-bg-secondary disabled:opacity-50"
        style={{ borderColor: "var(--color-border-emphasis)" }}
        title="Inserts a fictional fully-completed request from the fixture"
      >
        {pending ? "Seeding…" : "Seed sample interview"}
      </button>
      {error ? (
        <span className="text-[11px] text-text-primary">{error}</span>
      ) : null}
    </div>
  );
}

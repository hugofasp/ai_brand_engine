import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to use",
  description:
    "How to use your brand.soul OS file pack with Claude Projects or ChatGPT Custom GPTs.",
};

// Copy verbatim from NINEYARDS_STATIC_PAGES.md — "Page: How-to-Use".
export default function HowToUsePage() {
  return (
    <article className="mx-auto max-w-[720px] px-6 py-20 prose-invert">
      <header className="mb-12">
        <h1
          className="font-serif lowercase text-[48px] leading-[1.15]"
          style={{ letterSpacing: "-0.015em" }}
        >
          How to use your brand.soul OS file pack
        </h1>
        <p className="mt-6 text-[18px] text-text-secondary">
          Your file pack is a brand reasoning system you upload to Claude
          Projects or a ChatGPT Custom GPT. Once installed, your team can use it
          to produce on-brand content, think through decisions using your
          brand&apos;s logic, and evaluate proposals against your brand DNA,
          all from the same source of truth.
        </p>
      </header>

      <Section title="What you received">
        <p>When your file pack arrives by email, you&apos;ll have:</p>

        <p>
          <strong>1. A zip file</strong>: contains 12 to 20 .txt files
          depending on your locale support. These are the brand DNA files Claude
          (or ChatGPT) reads as authoritative source of truth.
        </p>

        <p>
          <strong>2. Two PDF guides</strong>
        </p>
        <ul>
          <li>
            <em>Implementation Manual</em>: the long-form setup instructions.
            Read this first.
          </li>
          <li>
            <em>How-to-Use Quickstart</em>: the 3-sheet visual reference your
            team keeps handy.
          </li>
        </ul>

        <p>
          <strong>3. Two paste-in text blocks (in the email body)</strong>
        </p>
        <ul>
          <li>
            <em>Universal Custom Instructions</em>: paste into Claude
            Projects&apos; Custom Instructions field, or ChatGPT&apos;s Custom
            GPT Instructions.
          </li>
          <li>
            <em>ChatGPT addendum</em>: append after the universal text when
            deploying to ChatGPT specifically.
          </li>
        </ul>
      </Section>

      <Section title="Choosing a platform">
        <p>
          <strong>We recommend Claude.</strong> Reasons:
        </p>
        <ul>
          <li>
            Claude Projects loads every uploaded file fully into context, every
            conversation. The file pack relies on cross-file references, and
            this matters.
          </li>
          <li>
            Claude&apos;s instruction-following tends to be tighter for complex
            multi-rule systems.
          </li>
          <li>
            The framework was designed and stress-tested primarily on Claude.
          </li>
        </ul>

        <p>
          <strong>ChatGPT works</strong>, with caveats:
        </p>
        <ul>
          <li>
            ChatGPT uses retrieval over knowledge files. For larger or many
            files, only chunks may be retrieved per query.
          </li>
          <li>
            GPT models can be more variable in adhering to strict system rules.
          </li>
          <li>
            Output reliability on complex analytical work is somewhat lower.
          </li>
        </ul>

        <p>
          For routine content and most analytical work, both platforms are fine.
          For high-stakes outputs or multi-locale brands, prefer Claude.
        </p>
      </Section>

      <Section title="Setup: Claude Projects">
        <ol>
          <li>Sign in to claude.ai</li>
          <li>
            Create a new Project (named after your brand). Use this Project
            exclusively for brand reasoning. Don&apos;t mix with general chat.
          </li>
          <li>
            Upload all numbered .txt files from your zip to the Project&apos;s
            sources panel.
          </li>
          <li>Open the Project&apos;s Custom Instructions field.</li>
          <li>
            Paste the Universal Custom Instructions text (from the delivery
            email), exactly as provided. Don&apos;t modify.
          </li>
          <li>Save.</li>
          <li>
            Start a new conversation. Type:{" "}
            <code className="font-mono">system check</code>
          </li>
          <li>
            You should see: brand name, system version, files loaded, ready
            confirmation.
          </li>
          <li>Run a few test prompts to verify behavior.</li>
        </ol>
        <p>
          If system check shows wrong values or no &quot;Ready&quot;
          confirmation, return to step 3.
        </p>
      </Section>

      <Section title="Setup: ChatGPT Custom GPT">
        <ol>
          <li>Go to chatgpt.com (paid account required: Plus or Team)</li>
          <li>Create a new Custom GPT</li>
          <li>
            In the Knowledge section, upload all numbered .txt files from your
            zip
          </li>
          <li>
            In the Instructions field, paste in this order:
            <ul>
              <li>The Universal Custom Instructions text</li>
              <li>The ChatGPT addendum (appended below)</li>
            </ul>
          </li>
          <li>Save the GPT (private or shared, your choice)</li>
          <li>
            Start a conversation. Type:{" "}
            <code className="font-mono">system check</code>
          </li>
          <li>Verify the response. Run a few test prompts.</li>
        </ol>
      </Section>

      <Section title="The two modes">
        <p>
          Your brand reasoning system detects mode automatically from each
          prompt.
        </p>
        <p>
          <strong>Content mode</strong>: for deliverables.
        </p>
        <ul>
          <li>
            Generating new content: &quot;Write an Instagram post about our new
            community.&quot;
          </li>
          <li>
            Improving drafts: &quot;Make this email more professional: [paste
            draft]&quot;
          </li>
        </ul>
        <p>
          You don&apos;t need to flag that you&apos;re submitting a draft. Just
          paste it. The system uses it as starting material and produces the
          brand-aligned version.
        </p>
        <p>
          <strong>Analytical mode</strong>: for thinking and evaluation.
        </p>
        <ul>
          <li>
            Open questions: &quot;Should we expand to Spain?&quot; &quot;Why is
            vertical integration cheaper?&quot;
          </li>
          <li>
            Evaluating specific proposals: &quot;I&apos;m thinking of doing
            custom concrete builds for high-end clients.&quot;
          </li>
        </ul>
        <p>
          For specific proposals, the system produces a structured trade-off
          analysis: where it aligns with your brand, where it creates tension,
          trade-offs to consider, paths forward.
        </p>
        <p>
          You don&apos;t specify mode. The system reads what you&apos;re asking
          and routes accordingly.
        </p>
      </Section>

      <Section title="Commands">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="text-left text-text-secondary">
              <th
                className="border-b py-3 pr-4 uppercase"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  letterSpacing: "0.02em",
                }}
              >
                Command
              </th>
              <th
                className="border-b py-3 uppercase"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  letterSpacing: "0.02em",
                }}
              >
                What it does
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "system check",
                "Verify the files are loaded; shows brand info and version",
              ],
              [
                "debug",
                "After any output, shows how the system resolved your prompt (mode, locale, pillars used, etc.)",
              ],
              ["why did you write that", "Same as debug"],
              [
                "refresh",
                "Re-anchors brand rigor mid-conversation (use when drift creeps in over long threads)",
              ],
            ].map(([cmd, desc]) => (
              <tr
                key={cmd}
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <td className="border-b py-3 pr-4 align-top">
                  <code className="font-mono text-text-primary">{cmd}</code>
                </td>
                <td className="border-b py-3 align-top text-text-secondary">
                  {desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="When the system isn't enough">
        <p>
          The file pack is a brand-grounded drafting and reasoning partner, not
          a final authority. For some scenarios, human review remains essential:
        </p>
        <ul>
          <li>Legal communications and contracts</li>
          <li>Regulatory filings or financial disclosures</li>
          <li>
            High-stakes strategic decisions (use the system to reason; commit
            through your usual governance)
          </li>
          <li>Sensitive personnel communications</li>
          <li>Public crisis responses</li>
        </ul>
        <p>Use the system to think and draft. Use human judgment to commit and send.</p>
      </Section>

      <p className="mt-12 text-[16px] text-text-secondary">
        Questions or issues? Email info@nineyards.pt. We respond within a
        working day.
      </p>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <h2
        className="font-serif lowercase text-[28px] leading-[1.25]"
        style={{ letterSpacing: "0em" }}
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[16px] text-text-secondary [&_strong]:text-text-primary [&_strong]:font-medium [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6">
        {children}
      </div>
    </section>
  );
}

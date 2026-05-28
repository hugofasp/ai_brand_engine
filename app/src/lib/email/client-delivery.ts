import "server-only";
import { randomBytes } from "node:crypto";
import { getResend, SENDERS, isResendConfigured } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { assertEnv } from "@/lib/env";

/**
 * Send the brand pack to the client. Three things happen:
 *
 *  1. A new opaque delivery token is minted and stored on the request
 *     so the /deliver/<token> page can authorise the download. Rotated
 *     on every send (revokes old links).
 *  2. A transactional email is dispatched via Resend with the link to
 *     the delivery page.
 *  3. The request status flips to "sent" and gets a sent_at timestamp.
 *     The email is logged in email_log.
 *
 * Returns whether the send went through. Best-effort on logging — the
 * caller's flow shouldn't break if the email_log insert fails.
 */
export async function sendPackToClient(
  requestId: string,
  opts: {
    /** Override the destination email. If provided AND different from
     * the row's contact_email, we also persist it on the request (the
     * admin is correcting a typo, so the new address is now truth). */
    overrideEmail?: string;
  } = {},
): Promise<
  | {
      ok: true;
      messageId: string | null;
      deliveryUrl: string;
      sentTo: string;
    }
  | { ok: false; error: string }
> {
  if (!isResendConfigured()) {
    return { ok: false, error: "RESEND_API_KEY not configured." };
  }

  const supabase = getSupabaseAdmin();
  const { data: request, error: reqErr } = await supabase
    .from("requests")
    .select("id, company_name, contact_name, contact_email")
    .eq("id", requestId)
    .maybeSingle();
  if (reqErr || !request) {
    return { ok: false, error: reqErr?.message ?? "Request not found." };
  }

  // Resolve the target email. If admin supplied an override (typo
  // correction in the send modal), validate it lightly and use that.
  // We also persist the corrected email back to the request so future
  // touchpoints (reminder cron, manual look-up) use the right one.
  let destinationEmail = (request.contact_email as string) ?? "";
  if (opts.overrideEmail && opts.overrideEmail.trim()) {
    const candidate = opts.overrideEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
      return { ok: false, error: "Override email looks invalid." };
    }
    destinationEmail = candidate;
    if (candidate !== request.contact_email) {
      await supabase
        .from("requests")
        .update({ contact_email: candidate })
        .eq("id", requestId);
    }
  }
  if (!destinationEmail) {
    return { ok: false, error: "No destination email on the request." };
  }

  // Confirm the pack exists. We don't email until at least one file
  // has been generated — sending an empty pack creates support load.
  const { count, error: cntErr } = await supabase
    .from("generated_files")
    .select("id", { count: "exact", head: true })
    .eq("request_id", requestId);
  if (cntErr) {
    return { ok: false, error: cntErr.message };
  }
  if (!count || count === 0) {
    return {
      ok: false,
      error:
        "Generate the pack before sending. No files found for this request.",
    };
  }

  // Mint a fresh delivery token. 32 random bytes hex-encoded (64 chars).
  // Stored as the unique key for the /deliver/<token> page.
  const token = randomBytes(32).toString("hex");
  const { error: updErr } = await supabase
    .from("requests")
    .update({ delivery_token: token })
    .eq("id", requestId);
  if (updErr) {
    return { ok: false, error: `Token mint failed: ${updErr.message}` };
  }

  const appUrl = assertEnv("NEXT_PUBLIC_APP_URL");
  const deliveryUrl = `${appUrl}/deliver/${token}`;
  const brandName = (request.company_name as string) ?? "your brand";
  const contactName =
    ((request.contact_name as string) ?? "").split(" ")[0] || "there";

  // Fetch the custom-instructions content so we can embed it inline in
  // the email. The client never sees this file as a download — it
  // belongs in the LLM's instructions field, not as project knowledge,
  // so we deliver it in the email body for one-click copy.
  const { data: ciRow } = await supabase
    .from("generated_files")
    .select("content")
    .eq("request_id", requestId)
    .eq("file_name", "0_CUSTOM_INSTRUCTIONS.txt")
    .maybeSingle();
  const customInstructionsRaw = (ciRow?.content as string | null) ?? "";
  const customInstructionsBlock = extractInstructionsBlock(
    customInstructionsRaw,
  );

  const subject = `Your brand pack is ready, ${contactName}`;

  // Plain-text body. Two-step structure:
  //   STEP 1: copy the custom instructions block into the LLM's
  //           instructions field. Block embedded inline below.
  //   STEP 2: download the knowledge files (zip) and attach them as
  //           project knowledge.
  // We deliberately DO NOT ship the custom-instructions text as a file
  // in the zip. If the client attaches it as knowledge, the LLM would
  // treat the instructions block as searchable context instead of as
  // a top-level rule set, which dilutes its authority.
  const text = [
    `Hi ${contactName},`,
    ``,
    `Your brand pack for ${brandName} is ready. There are two pieces to install: a block of custom instructions (paste into your LLM) and a zip of knowledge files (attach to your project).`,
    ``,
    `===========================================================`,
    `STEP 1. Custom instructions (paste into your LLM)`,
    `===========================================================`,
    ``,
    `Copy the block between the BEGIN and END markers below, and paste it INTO THE INSTRUCTIONS FIELD of:`,
    `   - Claude Project: "Project instructions"`,
    `   - ChatGPT Custom GPT: "Instructions"`,
    `   - Gemini Gem: "Instructions"`,
    ``,
    `Do NOT upload this block as a knowledge / project file. It belongs in the instructions field, not in the file uploads panel.`,
    ``,
    `------ BEGIN CUSTOM INSTRUCTIONS ------`,
    ``,
    customInstructionsBlock || "(no custom instructions content found, contact support)",
    ``,
    `------ END CUSTOM INSTRUCTIONS ------`,
    ``,
    `===========================================================`,
    `STEP 2. Knowledge files (attach to your LLM project)`,
    `===========================================================`,
    ``,
    `Download the zip:`,
    deliveryUrl,
    ``,
    `It contains the brand DNA files (foundation, audience, pillars, voice, lexicon, channel specs, examples). Upload all of them to your project as knowledge / project files.`,
    ``,
    `Once both steps are done, your LLM produces content that respects your brand from there on.`,
    ``,
    `If anything looks off, reply to this email and we'll iterate.`,
    ``,
    `nineyards.`,
  ].join("\n");

  // HTML mirror. The instructions block goes in a <pre> for easy
  // copy-select on desktop clients; the BEGIN / END markers are kept
  // as visual delimiters so paste-into-instructions stays unambiguous.
  const html = `
<!doctype html>
<html lang="en">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 640px; margin: 24px auto; padding: 0 16px;">
    <p>Hi ${escapeHtml(contactName)},</p>
    <p>Your brand pack for <strong>${escapeHtml(brandName)}</strong> is ready. There are two pieces to install: a block of <strong>custom instructions</strong> (paste into your LLM) and a <strong>zip of knowledge files</strong> (attach to your project).</p>

    <h2 style="font-size: 16px; margin-top: 28px; border-top: 1px solid #d4d4d4; padding-top: 16px;">Step 1. Custom instructions (paste into your LLM)</h2>
    <p>Copy the block between the BEGIN and END markers below, and paste it <strong>into the Instructions field</strong> of:</p>
    <ul>
      <li>Claude Project &rarr; "Project instructions"</li>
      <li>ChatGPT Custom GPT &rarr; "Instructions"</li>
      <li>Gemini Gem &rarr; "Instructions"</li>
    </ul>
    <p style="background: #fff7e6; border: 1px solid #ffd591; padding: 10px 12px; border-radius: 6px; font-size: 13px;">
      <strong>Heads up:</strong> Do not upload this block as a knowledge / project file. It belongs in the instructions field. Attaching it as a file would dilute its authority because the LLM would treat it as searchable context, not as a top-level rule set.
    </p>

    <p style="font-size: 12px; color: #666666; margin-bottom: 4px;">------ BEGIN CUSTOM INSTRUCTIONS ------</p>
    <pre style="background: #f5f5f5; border: 1px solid #d4d4d4; border-radius: 6px; padding: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; line-height: 1.55; white-space: pre-wrap; word-wrap: break-word; overflow-x: auto;">${escapeHtml(customInstructionsBlock || "(no custom instructions content found, contact support)")}</pre>
    <p style="font-size: 12px; color: #666666; margin-top: 4px;">------ END CUSTOM INSTRUCTIONS ------</p>

    <h2 style="font-size: 16px; margin-top: 28px; border-top: 1px solid #d4d4d4; padding-top: 16px;">Step 2. Knowledge files (attach to your LLM project)</h2>
    <p>
      <a href="${deliveryUrl}" style="display: inline-block; padding: 12px 20px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Download the zip</a>
    </p>
    <p>The zip contains the brand DNA files (foundation, audience, pillars, voice, lexicon, channel specs, examples). Upload <strong>all of them</strong> to your project as knowledge / project files.</p>

    <p style="margin-top: 28px;">Once both steps are done, your LLM produces content that respects your brand from there on.</p>
    <p>If anything looks off, reply to this email and we'll iterate.</p>
    <p style="color: #666666;">nineyards.</p>
  </body>
</html>`.trim();

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: SENDERS.client,
      to: destinationEmail,
      subject,
      text,
      html,
    });
    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    const sentAt = new Date().toISOString();
    await supabase
      .from("requests")
      .update({ status: "sent", sent_at: sentAt })
      .eq("id", requestId);
    await supabase
      .from("email_log")
      .insert({
        request_id: requestId,
        recipient: destinationEmail,
        subject,
        type: "client_delivery",
        status: "sent",
        resend_message_id: result.data?.id ?? null,
      })
      .then(() => undefined, () => undefined); // best-effort

    return {
      ok: true,
      messageId: result.data?.id ?? null,
      deliveryUrl,
      sentTo: destinationEmail,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Pull the paste-ready custom-instructions text out of the rendered
 * `0_CUSTOM_INSTRUCTIONS.txt` file. The file's synthesis prompt asks
 * Claude to wrap the LLM-facing block in literal BEGIN / END marker
 * lines. We extract what's between them so the email shows ONLY the
 * paste-ready block, not the surrounding meta paragraphs.
 *
 * Tolerant: accepts the canonical "─── BEGIN CUSTOM INSTRUCTIONS ───"
 * markers, the ASCII fallback "------ BEGIN ...", and a few other
 * shapes that Claude might produce. Falls back to the whole content
 * if no markers are detected — better to send something than nothing.
 */
function extractInstructionsBlock(content: string): string {
  if (!content) return "";
  const beginPatterns = [
    /─{2,}\s*BEGIN\s+CUSTOM\s+INSTRUCTIONS\s*─{2,}/i,
    /-{2,}\s*BEGIN\s+CUSTOM\s+INSTRUCTIONS\s*-{2,}/i,
    /=+\s*BEGIN\s+CUSTOM\s+INSTRUCTIONS\s*=+/i,
  ];
  const endPatterns = [
    /─{2,}\s*END\s+CUSTOM\s+INSTRUCTIONS\s*─{2,}/i,
    /-{2,}\s*END\s+CUSTOM\s+INSTRUCTIONS\s*-{2,}/i,
    /=+\s*END\s+CUSTOM\s+INSTRUCTIONS\s*=+/i,
  ];
  let beginIdx = -1;
  let beginLen = 0;
  for (const p of beginPatterns) {
    const m = content.match(p);
    if (m && m.index !== undefined) {
      beginIdx = m.index;
      beginLen = m[0].length;
      break;
    }
  }
  let endIdx = -1;
  for (const p of endPatterns) {
    const m = content.match(p);
    if (m && m.index !== undefined) {
      endIdx = m.index;
      break;
    }
  }
  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) {
    return content.trim();
  }
  return content.slice(beginIdx + beginLen, endIdx).trim();
}

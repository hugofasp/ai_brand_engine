import "server-only";
import { getResend, SENDERS, isResendConfigured } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { assertEnv } from "@/lib/env";

export type NotificationKind = "new_request" | "interview_complete";

/**
 * Send the internal admin notification email. Two flavors:
 *   - "new_request":      fired right after /start creates the request
 *   - "interview_complete": fired when the conversational interview hits
 *                           the completion check (all required phases marked done)
 *
 * Silently no-ops if Resend isn't configured (typical in local dev when
 * RESEND_API_KEY is empty). Failure is best-effort — the caller should
 * NOT block the user flow on this.
 */
export async function sendInternalNotification(
  requestId: string,
  kind: NotificationKind = "interview_complete",
): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  if (!isResendConfigured()) {
    return { sent: false, error: "Resend not configured" };
  }

  const supabase = getSupabaseAdmin();
  const { data: request, error } = await supabase
    .from("requests")
    .select(
      "id, company_name, contact_name, contact_email, contact_role, product, created_at, interview_completed_at",
    )
    .eq("id", requestId)
    .single();

  if (error || !request) {
    return { sent: false, error: error?.message ?? "Request not found" };
  }

  const detailUrl = `${assertEnv("NEXT_PUBLIC_APP_URL")}/admin/${requestId}`;

  const subjects: Record<NotificationKind, string> = {
    new_request: `[nineyards] New request: ${request.company_name}`,
    interview_complete: `[nineyards] Interview complete: ${request.company_name}`,
  };
  const headers: Record<NotificationKind, string> = {
    new_request:
      "A new brand.soul OS request has just been submitted. The user is about to start (or has started) the interview.",
    interview_complete:
      "The interview is complete. The captured answers are ready for review and brand-pack generation.",
  };

  const subject = subjects[kind];
  const lines = [
    headers[kind],
    ``,
    `Company:  ${request.company_name}`,
    `Contact:  ${request.contact_name} <${request.contact_email}>`,
    request.contact_role ? `Role:     ${request.contact_role}` : null,
    `Product:  ${request.product}`,
    `Created:  ${request.created_at}`,
    kind === "interview_complete" && request.interview_completed_at
      ? `Completed: ${request.interview_completed_at}`
      : null,
    ``,
    `Open in admin: ${detailUrl}`,
  ].filter(Boolean);

  const text = lines.join("\n");

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: SENDERS.notifications,
      to: assertEnv("ADMIN_NOTIFICATION_EMAIL"),
      subject,
      text,
    });
    if (result.error) {
      return { sent: false, error: result.error.message };
    }
    await supabase.from("email_log").insert({
      request_id: requestId,
      recipient: assertEnv("ADMIN_NOTIFICATION_EMAIL"),
      subject,
      type: "internal_notification",
      status: "sent",
      resend_message_id: result.data?.id ?? null,
    });
    return { sent: true, messageId: result.data?.id };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

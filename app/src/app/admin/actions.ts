"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  clearAdminCookie,
  isAdminAuthenticated,
  isAdminConfigured,
  setAdminCookie,
} from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  SAMPLE_ANSWERS,
  SAMPLE_BRAND,
  SAMPLE_COMPLETED_PHASES,
  flattenedFieldIds,
} from "@/lib/admin/fixtures/sample-interview";
import { generateBrandPack } from "@/lib/generation/generate";

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

export async function loginAdmin(formData: FormData): Promise<LoginResult> {
  if (!isAdminConfigured()) {
    return {
      ok: false,
      error:
        "Admin password not configured. Set AIBE_ADMIN_PASSWORD in .env.local.",
    };
  }
  const password = String(formData.get("password") ?? "");
  if (!password) return { ok: false, error: "Password required." };
  if (!checkPassword(password)) {
    return { ok: false, error: "Invalid password." };
  }
  await setAdminCookie();
  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminCookie();
  redirect("/admin/login");
}

export type DeleteResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Hard-delete a request and everything that hangs off it.
 *
 * Strict order: interview_answers first (foreign key would block the
 * request delete otherwise), then the request row itself. We don't
 * touch the `emails` table — that's an audit trail and keeping the
 * deleted address there is intentional.
 */
export async function deleteRequest(
  requestId: string,
): Promise<DeleteResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Not authenticated." };
  }
  if (!requestId) {
    return { ok: false, error: "Missing request id." };
  }
  const supabase = getSupabaseAdmin();

  // 1. interview_answers row (one-to-one with request).
  const { error: ansErr } = await supabase
    .from("interview_answers")
    .delete()
    .eq("request_id", requestId);
  if (ansErr) {
    return { ok: false, error: `interview_answers: ${ansErr.message}` };
  }

  // 2. request row itself.
  const { error: reqErr } = await supabase
    .from("requests")
    .delete()
    .eq("id", requestId);
  if (reqErr) {
    return { ok: false, error: `requests: ${reqErr.message}` };
  }

  // Layer-deep revalidate so the dashboard list picks up the removal
  // immediately on the next navigation. Without "layout" Next can
  // serve the cached server component output and the row reappears
  // until a hard reload.
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/**
 * Create a fully-pre-populated sample request so the generation pipeline
 * can be built without sitting through a real conversational interview.
 * Inserts a `requests` row (with a unique-ish brand/email so multiple
 * seeds don't collide), then an `interview_answers` row with the
 * fixture's answers, all phases marked complete, status set to
 * interview_complete (and interview_completed_at stamped), and the
 * conversation's completed_fields mirror populated so the admin sidebar
 * shows full progress.
 *
 * Returns the new request id (caller redirects to /admin/[id]).
 */
export async function seedSampleRequest(): Promise<
  { ok: true; requestId: string } | { ok: false; error: string }
> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Not authenticated." };
  }
  const supabase = getSupabaseAdmin();

  // Suffix the brand + email so re-seeding doesn't conflict on the
  // implicit unique-on-email if it exists.
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const company_name = `${SAMPLE_BRAND.company_name} · ${stamp}`;
  const email_local = SAMPLE_BRAND.contact_email.split("@")[0];
  const email_domain = SAMPLE_BRAND.contact_email.split("@")[1];
  const contact_email = `${email_local}+${Date.now()}@${email_domain}`;

  const now = new Date().toISOString();
  const { data: created, error: reqErr } = await supabase
    .from("requests")
    .insert({
      company_name,
      contact_name: SAMPLE_BRAND.contact_name,
      contact_email,
      contact_role: SAMPLE_BRAND.contact_role,
      product: SAMPLE_BRAND.product,
      status: "interview_complete",
      interview_started_at: now,
      interview_completed_at: now,
    })
    .select("id")
    .single();
  if (reqErr || !created) {
    return {
      ok: false,
      error: reqErr?.message ?? "Failed to create request.",
    };
  }
  const requestId = created.id as string;

  // Mark a synthetic conversation summary so the admin transcript view
  // doesn't show "no conversation yet". Just one assistant note saying
  // this was seeded.
  const conversation = {
    messages: [
      {
        role: "assistant" as const,
        at: now,
        content:
          "Seeded sample interview. All required framework fields are populated from the fixture; no real conversation occurred.",
      },
    ],
    started_at: now,
    last_active: now,
    role: SAMPLE_BRAND.contact_role,
    completed_fields: flattenedFieldIds(),
    token_usage: {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      turn_count: 0,
    },
  };

  const { error: ansErr } = await supabase.from("interview_answers").insert({
    request_id: requestId,
    answers: SAMPLE_ANSWERS,
    completed_phases: SAMPLE_COMPLETED_PHASES,
    current_phase: 7,
    interview_conversation: conversation,
  });
  if (ansErr) {
    // Roll back the request so we don't leave dangling rows.
    await supabase.from("requests").delete().eq("id", requestId);
    return { ok: false, error: ansErr.message };
  }

  revalidatePath("/admin");
  return { ok: true, requestId };
}

export type GenerateResult =
  | { ok: true; fileCount: number }
  | { ok: false; error: string };

/**
 * Trigger the brand pack generation for a request.
 *
 * Reads `interview_answers.answers`, renders every file in the
 * registry against the brand's locale set, persists rows in
 * `generated_files`, and flips `requests.status` to `files_generated`.
 *
 * Regeneration is destructive — any prior `generated_files` rows for
 * this request are deleted first. The admin gets a fresh consistent
 * pack on each click.
 */
export async function generatePack(
  requestId: string,
): Promise<GenerateResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Not authenticated." };
  }
  const result = await generateBrandPack(requestId);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath(`/admin/${requestId}`);
  revalidatePath("/admin");
  return { ok: true, fileCount: result.fileCount };
}

export type SendDeliveryResult =
  | {
      ok: true;
      messageId: string | null;
      deliveryUrl: string;
      sentTo: string;
    }
  | { ok: false; error: string };

/**
 * Send the finished brand pack to the client by email. Mints a new
 * delivery token (rotates any prior one), dispatches the email via
 * Resend, flips status to "sent" + sent_at timestamp, logs to
 * email_log. If `overrideEmail` is provided AND different from the
 * stored contact_email, the row is updated (typo correction is
 * persistent so reminders / future sends use the right address).
 */
export async function sendDeliveryEmail(
  requestId: string,
  overrideEmail?: string,
): Promise<SendDeliveryResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Not authenticated." };
  }
  const { sendPackToClient } = await import(
    "@/lib/email/client-delivery"
  );
  const result = await sendPackToClient(requestId, {
    overrideEmail,
  });
  revalidatePath(`/admin/${requestId}`);
  revalidatePath("/admin", "layout");
  return result;
}

/**
 * Admin-only debug action: simulate the interview_complete event for a
 * request. Flips status + interview_completed_at and fires the admin
 * notification email exactly as the wrap-up trigger in
 * executeMarkPhaseComplete would have. Used to test that
 * RESEND_API_KEY / ADMIN_NOTIFICATION_EMAIL are wired correctly
 * without having to drive a full conversation to the end.
 */
export async function forceCompleteInterview(
  requestId: string,
): Promise<{ ok: true; notification: { sent: boolean; error?: string } } | { ok: false; error: string }> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Not authenticated." };
  }
  const supabase = getSupabaseAdmin();
  const { error: updErr } = await supabase
    .from("requests")
    .update({
      status: "interview_complete",
      interview_completed_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (updErr) return { ok: false, error: updErr.message };

  const { sendInternalNotification } = await import(
    "@/lib/email/internal-notification"
  );
  const notification = await sendInternalNotification(
    requestId,
    "interview_complete",
  );
  revalidatePath(`/admin/${requestId}`);
  revalidatePath("/admin");
  return { ok: true, notification };
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getResend,
  SENDERS,
  isResendConfigured,
} from "@/lib/resend";
import { env } from "@/lib/env";

/**
 * Daily reminder cron — BUILD_SPEC §10.4 / §13 Phase 2.
 *
 * Logic per spec:
 * - For any request in 'interview_in_progress' with no activity for >24h
 *   and no prior reminder logged, send one reminder.
 * - After 7 days with no activity, mark status = 'abandoned' (no email).
 *
 * Schedule via vercel.json:
 *   { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 9 * * *" }] }
 *
 * Auth: Vercel sets a Bearer token in CRON_SECRET. We accept that OR a
 * direct invocation with the same token in dev.
 */
export async function GET(request: Request) {
  // Auth — Vercel cron sends this Bearer header.
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 },
    );
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Mark week-old in-progress requests as abandoned.
  const { data: abandoned, error: abandonErr } = await supabase
    .from("requests")
    .update({ status: "abandoned" })
    .eq("status", "interview_in_progress")
    .lt("updated_at", weekAgo.toISOString())
    .select("id");
  if (abandonErr) {
    return NextResponse.json({ error: abandonErr.message }, { status: 500 });
  }

  // 2. Find 24h-stale in-progress requests with no prior reminder logged.
  const { data: stale, error: staleErr } = await supabase
    .from("requests")
    .select("id, contact_email, contact_name, company_name, updated_at")
    .eq("status", "interview_in_progress")
    .lt("updated_at", dayAgo.toISOString())
    .gte("updated_at", weekAgo.toISOString());
  if (staleErr) {
    return NextResponse.json({ error: staleErr.message }, { status: 500 });
  }

  const candidates = stale ?? [];
  const sent: string[] = [];
  const skipped: string[] = [];

  for (const req of candidates) {
    const { data: priorReminders } = await supabase
      .from("email_log")
      .select("id")
      .eq("request_id", req.id)
      .eq("type", "reminder")
      .limit(1);
    if (priorReminders && priorReminders.length > 0) {
      skipped.push(req.id);
      continue;
    }

    if (!isResendConfigured()) {
      skipped.push(req.id);
      continue;
    }

    const resumeUrl = `${env.NEXT_PUBLIC_APP_URL}/interview/${req.id}`;
    const subject = `Your brand.soul OS interview is waiting`;
    const text = [
      `Hi ${req.contact_name},`,
      ``,
      `You started the brand.soul OS interview for ${req.company_name} but haven't finished.`,
      `Pick up where you left off:`,
      ``,
      resumeUrl,
      ``,
      `We'll only send one reminder. If you'd prefer to abandon this request, just ignore this email. We'll close it out after seven days.`,
      ``,
      `brand.soul OS`,
    ].join("\n");

    try {
      const resend = getResend();
      const result = await resend.emails.send({
        from: SENDERS.client,
        to: req.contact_email,
        subject,
        text,
      });
      if (result.error) {
        skipped.push(req.id);
        continue;
      }
      await supabase.from("email_log").insert({
        request_id: req.id,
        recipient: req.contact_email,
        subject,
        type: "reminder",
        status: "sent",
        resend_message_id: result.data?.id ?? null,
      });
      sent.push(req.id);
    } catch {
      skipped.push(req.id);
    }
  }

  return NextResponse.json({
    abandoned: (abandoned ?? []).map((r) => r.id),
    reminded: sent,
    skipped,
    ran_at: now.toISOString(),
  });
}

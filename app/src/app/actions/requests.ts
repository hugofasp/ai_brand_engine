"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isPersonalEmail } from "@/lib/email/personal-domain-blocklist";

const REQUEST_COOKIE = "nineyards_request_id";
// 90 days — well beyond the typical brand-interview cycle (a handful
// of hours of work spread over a week or two) so a returning user
// always sees the resume-your-interview prompt without re-typing the
// intake form.
const COOKIE_MAX_AGE_DAYS = 90;

const startRequestSchema = z.object({
  company_name: z.string().trim().min(1, "This field is required.").max(120, "Limit: 120 characters."),
  contact_name: z.string().trim().min(1, "This field is required.").max(100, "Limit: 100 characters."),
  contact_email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .refine(
      (email) => !isPersonalEmail(email),
      "Please use your work email. We need a business domain to build the brand pack against (gmail, hotmail, outlook, yahoo, icloud and similar personal providers are blocked).",
    ),
  contact_role: z
    .enum(["Founder", "Marketing", "Brand", "Operations", "Other"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type StartRequestState =
  | { ok: false; fieldErrors: Record<string, string>; formError?: string }
  | { ok: true };

export async function startRequest(
  _prev: StartRequestState | undefined,
  formData: FormData,
): Promise<StartRequestState> {
  const raw = {
    company_name: formData.get("company_name")?.toString() ?? "",
    contact_name: formData.get("contact_name")?.toString() ?? "",
    contact_email: formData.get("contact_email")?.toString() ?? "",
    contact_role: formData.get("contact_role")?.toString() ?? "",
  };

  const parsed = startRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("requests")
    .insert({
      company_name: parsed.data.company_name,
      contact_name: parsed.data.contact_name,
      contact_email: parsed.data.contact_email,
      contact_role: parsed.data.contact_role ?? null,
      product: "brand-identity",
      status: "started",
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      fieldErrors: {},
      formError:
        "Something went wrong. Try again or contact info@nineyards.pt.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(REQUEST_COOKIE, data.id as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/",
  });

  // Best-effort admin notification. Never block the user redirect on it.
  try {
    const { sendInternalNotification } = await import(
      "@/lib/email/internal-notification"
    );
    await sendInternalNotification(data.id as string, "new_request");
  } catch (e) {
    console.error("Admin new_request notification failed:", e);
  }

  redirect("/choose");
}

export async function getRequestIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REQUEST_COOKIE)?.value ?? null;
}

/** Rewrite the cookie so this browser remembers the active request id.
 * Used when a user lands on /interview/<id> in a fresh browser via a
 * shared URL — once we've confirmed the request exists, we pin it. */
export async function setRequestIdCookie(requestId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(REQUEST_COOKIE, requestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

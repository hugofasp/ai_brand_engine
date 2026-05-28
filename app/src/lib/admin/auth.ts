import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Admin auth — single shared password, cookie-based session.
 *
 * No user accounts, no Supabase Auth. The expected use is one person
 * (Hugo) checking the admin panel on his own machine; multi-user comes
 * later. The cookie stores an HMAC of the password (not the password
 * itself) so a stolen cookie can't be reverse-engineered to the secret.
 */

const COOKIE = "nineyards_admin";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 1 week

function getPassword(): string | null {
  const pw = process.env["AIBE_ADMIN_PASSWORD"];
  return pw && pw.length > 0 ? pw : null;
}

/** Stable HMAC of the password, used as the cookie value. Re-deriving on
 * each check lets us rotate the password by simply changing the env var
 * (all existing sessions become invalid automatically). */
function sessionToken(password: string): string {
  return createHmac("sha256", password)
    .update("nineyards.admin.v1")
    .digest("hex");
}

/** True if the request carries a valid admin session cookie. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const password = getPassword();
  if (!password) return false;
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE)?.value;
  if (!value) return false;
  const expected = sessionToken(password);
  if (value.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Check a submitted password against the env var (constant-time). */
export function checkPassword(submitted: string): boolean {
  const password = getPassword();
  if (!password) return false;
  if (submitted.length !== password.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(submitted, "utf8"),
      Buffer.from(password, "utf8"),
    );
  } catch {
    return false;
  }
}

/** Set the admin session cookie after a successful login. Must be
 * called from a Server Action / Route Handler (cookies().set is not
 * allowed in plain Server Components). */
export async function setAdminCookie(): Promise<void> {
  const password = getPassword();
  if (!password) throw new Error("AIBE_ADMIN_PASSWORD not configured");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, sessionToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

/** True if the password env var is set at all. Used by the login page
 * to surface a configuration hint when it's missing. */
export function isAdminConfigured(): boolean {
  return getPassword() !== null;
}

/**
 * Environment access — read at CALL time, not module-load time.
 *
 * Why bracket notation: Next.js / Turbopack statically analyse
 * `process.env.FOO` (dot notation) at module-load and can cache the
 * value. If the env var was set AFTER the module first loaded (e.g.,
 * .env.local edited mid-session), the cached value is stale and reads
 * as undefined forever. Bracket notation `process.env[key]` is dynamic —
 * the bundler can't fold it, so each call sees the current process env.
 *
 * The `isSupabaseConfigured` / `isResendConfigured` helpers also use
 * bracket access so they always reflect runtime state.
 */

/** Keys we explicitly know about. Soft-typed so the call sites stay typed. */
export type EnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "RESEND_API_KEY"
  | "RESEND_WEBHOOK_SECRET"
  | "AIBE_ANTHROPIC_API_KEY"
  | "AIBE_ADMIN_PASSWORD"
  | "NEXT_PUBLIC_APP_URL"
  | "ADMIN_NOTIFICATION_EMAIL";

/** Defaults applied when the variable is absent from the runtime env. */
const DEFAULTS: Partial<Record<EnvKey, string>> = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  ADMIN_NOTIFICATION_EMAIL: "info@nineyards.pt",
};

/**
 * Object proxy preserved for existing call sites — reads each key
 * dynamically from process.env via bracket notation.
 */
export const env = new Proxy({} as Record<EnvKey, string | undefined>, {
  get(_target, prop: string) {
    if (typeof prop !== "string") return undefined;
    return process.env[prop] ?? DEFAULTS[prop as EnvKey];
  },
});

export function assertEnv(key: EnvKey): string {
  const value = process.env[key] ?? DEFAULTS[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Set it in .env.local for development.`,
    );
  }
  return value;
}

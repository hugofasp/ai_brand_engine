import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { env, assertEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Server-side Supabase clients.
 *
 * - `getSupabaseServer()` — RLS-respecting client tied to the request's
 *   auth cookies. Use for admin routes (Phase 3+).
 * - `getSupabaseAdmin()` — service-role client (RLS-bypassing). Use for
 *   public/client-facing server actions that write request data on
 *   behalf of unauthenticated users (per §8: "Clients don't have auth
 *   tokens — all client operations go through server actions using the
 *   service_role key").
 *
 * Both are lazy — calling them throws only if env is missing, so Phase 1
 * pages render without live credentials.
 */

export async function getSupabaseServer() {
  const url = assertEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = assertEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll called from a Server Component — safe to ignore.
        }
      },
    },
  });
}

let _adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (_adminClient) return _adminClient;
  const url = assertEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = assertEnv("SUPABASE_SERVICE_ROLE_KEY");
  _adminClient = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _adminClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

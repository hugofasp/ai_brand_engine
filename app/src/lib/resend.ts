import "server-only";
import { Resend } from "resend";
import { assertEnv, env } from "@/lib/env";

/**
 * Resend client + sender constants — BUILD_SPEC §9.2, §10.
 *
 * Phase 4 lights this up with real sends. Phase 1 ships the client
 * factory + sender list so wiring is one assignment away.
 *
 * Sender display name: "brand.soul OS" (resolved decision §15).
 */

// Verified Resend domain for outbound mail. Use a transactional
// subdomain so the apex (nineyards.pt) keeps a clean reputation and
// we can rotate / segment without touching the main domain DNS.
export const SENDERS = {
  // Client-facing emails (delivery, reminders, confirmation).
  client: "brand.soul OS <delivery@poweredby.nineyards.pt>",
  // Internal notifications + contact-form forwards.
  notifications: "brand.soul OS <notifications@poweredby.nineyards.pt>",
} as const;

export type SenderKey = keyof typeof SENDERS;

let _client: Resend | null = null;

export function getResend(): Resend {
  if (_client) return _client;
  const key = assertEnv("RESEND_API_KEY");
  _client = new Resend(key);
  return _client;
}

export function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

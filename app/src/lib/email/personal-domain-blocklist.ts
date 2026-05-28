/**
 * Personal-email-provider blocklist for the /start intake.
 *
 * brand.soul OS is a B2B product. Brand DNA work is tied to a
 * company identity, so we require a business email on intake. This
 * keeps the funnel quality high and reduces support load from drive-
 * by tyre-kickers using throwaway personal addresses.
 *
 * The list focuses on the high-volume free providers and their major
 * regional aliases. Smaller / regional providers can be added on
 * demand. We do NOT block paid Google Workspace or Microsoft 365
 * accounts that use the company's own domain (those have their own
 * apex, e.g. someone@nineyards.pt).
 *
 * Match logic: exact match on the part after @ (case-insensitive).
 */

export const PERSONAL_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  // Google
  "gmail.com",
  "googlemail.com",

  // Microsoft
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "hotmail.de",
  "hotmail.es",
  "hotmail.it",
  "outlook.com",
  "outlook.pt",
  "outlook.es",
  "outlook.fr",
  "outlook.de",
  "live.com",
  "live.co.uk",
  "msn.com",

  // Yahoo
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.es",
  "yahoo.fr",
  "yahoo.de",
  "yahoo.it",
  "yahoo.pt",
  "ymail.com",
  "rocketmail.com",

  // Apple
  "icloud.com",
  "me.com",
  "mac.com",

  // AOL
  "aol.com",

  // ProtonMail
  "protonmail.com",
  "protonmail.ch",
  "proton.me",
  "pm.me",

  // GMX
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "gmx.at",
  "gmx.ch",

  // Yandex
  "yandex.com",
  "yandex.ru",

  // Mail.com / Fastmail / Tutanota / Zoho-personal
  "mail.com",
  "fastmail.com",
  "tutanota.com",
  "tuta.io",

  // Throwaway / temporary
  "mailinator.com",
  "yopmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "throwaway.email",
  "trash-mail.com",

  // PT-specific personal providers
  "sapo.pt",
  "iol.pt",
  "clix.pt",
  "netcabo.pt",
]);

/** Returns true if the given email belongs to a personal/throwaway
 * provider on our blocklist. Case-insensitive on the domain part.
 * Returns false for malformed input (let the upstream email() rule
 * surface that error instead of conflating with the business check). */
export function isPersonalEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return false;
  return PERSONAL_EMAIL_DOMAINS.has(domain);
}

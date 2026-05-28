import "server-only";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

/**
 * Domain crawler — given a starting URL, fetch the homepage, find
 * high-signal same-domain links (About / Services / Work / Methodology /
 * etc.), and fetch up to N pages. Returns combined Readability-extracted
 * content per page.
 *
 * Deliberately small surface area:
 * - Same hostname only (no off-domain link following)
 * - Same protocol (http/https only — skip mailto:, tel:, javascript:)
 * - Skip anchors, query-only differences, common junk paths (cart, login,
 *   account, blog post permalinks)
 * - 15s timeout per page, 60s total budget, 6 pages max
 * - 200ms delay between pages to be polite
 */

const PAGE_TIMEOUT_MS = 15_000;
const TOTAL_BUDGET_MS = 60_000;
const MAX_PAGES = 6;
const MAX_CONTENT_CHARS_PER_PAGE = 12_000;
const POLITE_DELAY_MS = 200;
const USER_AGENT =
  "Mozilla/5.0 (compatible; brand-os/1.0; +https://brandsoul.nineyards.pt)";

/**
 * High-signal URL-path keywords. Pages whose path contains these are
 * crawled first; ordering matters (earlier = higher priority).
 */
const HIGH_SIGNAL_PATH_KEYWORDS = [
  "about",
  "approach",
  "methodology",
  "philosophy",
  "manifesto",
  "principles",
  "what-we-do",
  "how-we-work",
  "services",
  "work",
  "solutions",
  "products",
  "platform",
  "offering",
  "team",
  "people",
  "founders",
  "leadership",
  "story",
  "mission",
  "vision",
  "company",
  "why",
  "process",
];

// Path segments that mark a page as junk for brand extraction. Matched as
// a path segment (own segment or hyphenated variant), so `/privacy-policy`
// and `/terms-and-conditions` are caught alongside `/privacy/` and `/terms/`.
const SKIP_PATH_PATTERNS = [
  /(?:^|\/)(blog|news|press|article|articles|post|posts|category|categories|tag|tags|author)(?:[/-]|$)/i,
  /(?:^|\/)(cart|checkout|login|signup|sign-?up|register|account|profile)(?:[/-]|$)/i,
  /(?:^|\/)(legal|privacy|terms|cookies?|sitemap|search|404|500)(?:[/-]|$)/i,
  /\.(pdf|zip|jpg|jpeg|png|gif|webp|svg|mp4|mov|webm|css|js)(\?|$)/i,
];

export type CrawledPage = {
  url: string;
  title: string;
  text: string;
};

export type CrawlResult =
  | {
      ok: true;
      pages: CrawledPage[];
      origin: string;
      /**
       * LinkedIn company URLs found anywhere on the user's website. Used
       * downstream as a permission-scoped signal for structural inference
       * (e.g., founder-led claims require LinkedIn headcount evidence).
       * Hugo's rule: only LinkedIn pages the user explicitly links from
       * their own site — never fish for them via search.
       */
      linkedin_urls: string[];
    }
  | { ok: false; error: string };

/** Events the crawler can emit as it works, for the streaming UI. The
 * `onEvent` callback is optional — non-streaming callers leave it off. */
export type CrawlEvent =
  | { type: "entry-fetched"; url: string; title: string }
  | { type: "page-found"; url: string; title: string; index: number }
  | { type: "page-skipped"; url: string; reason: string }
  | { type: "linkedin-found"; url: string };

export async function crawlDomain(
  rawUrl: string,
  onEvent?: (event: CrawlEvent) => void,
): Promise<CrawlResult> {
  let entry: URL;
  try {
    entry = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "Invalid URL." };
  }
  if (entry.protocol !== "http:" && entry.protocol !== "https:") {
    return { ok: false, error: "URL must use http or https." };
  }

  const origin = entry.origin;
  const startedAt = Date.now();
  const remaining = () => TOTAL_BUDGET_MS - (Date.now() - startedAt);

  // 1. Fetch the entry page and parse links.
  const entryFetch = await fetchPage(entry.toString(), remaining());
  if (!entryFetch.ok) {
    return { ok: false, error: entryFetch.error };
  }

  const pages: CrawledPage[] = [
    {
      url: entryFetch.url,
      title: entryFetch.title,
      text: entryFetch.text,
    },
  ];
  onEvent?.({
    type: "entry-fetched",
    url: entryFetch.url,
    title: entryFetch.title,
  });

  const linkedInUrls = new Set<string>(extractLinkedInUrls(entryFetch.html));
  for (const li of linkedInUrls) {
    onEvent?.({ type: "linkedin-found", url: li });
  }

  // 2. Discover same-domain links from the entry HTML.
  const candidateLinks = discoverLinks(entryFetch.html, origin, entry.pathname);
  const ranked = rankLinks(candidateLinks);

  // 3. Fetch the top remaining pages, respecting budget.
  const seen = new Set([normalizeForDedup(entryFetch.url)]);
  for (const link of ranked) {
    if (pages.length >= MAX_PAGES) break;
    if (remaining() <= 0) break;
    const norm = normalizeForDedup(link);
    if (seen.has(norm)) continue;
    seen.add(norm);

    await sleep(POLITE_DELAY_MS);
    const r = await fetchPage(link, Math.min(remaining(), PAGE_TIMEOUT_MS));
    if (!r.ok) {
      onEvent?.({ type: "page-skipped", url: link, reason: r.error });
      continue;
    }
    if (r.text.trim().length < 200) {
      onEvent?.({ type: "page-skipped", url: link, reason: "too thin" });
      continue;
    }
    pages.push({ url: r.url, title: r.title, text: r.text });
    onEvent?.({
      type: "page-found",
      url: r.url,
      title: r.title,
      index: pages.length - 1,
    });
    for (const li of extractLinkedInUrls(r.html)) {
      if (!linkedInUrls.has(li)) {
        linkedInUrls.add(li);
        onEvent?.({ type: "linkedin-found", url: li });
      }
    }
  }

  return {
    ok: true,
    pages,
    origin,
    linkedin_urls: Array.from(linkedInUrls),
  };
}

/**
 * Pull LinkedIn company URLs from an HTML blob. Matches anchors AND any
 * raw `linkedin.com/company/...` URL inside the markup (some sites embed
 * them as plain text or schema.org metadata, not as <a href>).
 *
 * Returns canonical forms — `https://www.linkedin.com/company/{slug}` —
 * deduplicated. Caps at 3 to avoid runaway.
 */
function extractLinkedInUrls(html: string): string[] {
  const out = new Set<string>();
  // Match any linkedin.com/company/<slug> or linkedin.com/in/<slug> in the
  // HTML. The /in/ form is a personal profile and we DON'T pass those to
  // the inference rule — too easy to be a single founder profile that
  // misleads about company size.
  const re =
    /https?:\/\/(?:[a-z]{2}\.)?(?:www\.)?linkedin\.com\/company\/([a-z0-9-]+)\/?/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const slug = m[1].toLowerCase();
    if (!slug || slug === "linkedin") continue;
    out.add(`https://www.linkedin.com/company/${slug}/`);
    if (out.size >= 3) break;
  }
  return Array.from(out);
}

type FetchOk = {
  ok: true;
  url: string;
  title: string;
  text: string;
  html: string;
};
type FetchErr = { ok: false; error: string };

async function fetchPage(
  url: string,
  budgetMs: number,
): Promise<FetchOk | FetchErr> {
  if (budgetMs <= 0) return { ok: false, error: "out of budget" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Math.min(budgetMs, PAGE_TIMEOUT_MS));

  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} from ${url}` };
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      return { ok: false, error: `non-HTML content-type: ${contentType}` };
    }
    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    const title = article?.title ?? dom.window.document.title ?? "";
    const rawText = (article?.textContent ?? "").replace(/\s+/g, " ").trim();
    const text = rawText.slice(0, MAX_CONTENT_CHARS_PER_PAGE);
    // Use the resolved URL after redirects for the final identity.
    const finalUrl = res.url || url;
    return { ok: true, url: finalUrl, title, text, html };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "fetch timeout" };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pull <a href> values out of the HTML and resolve to absolute URLs on
 * the same origin. Filters obvious junk.
 */
function discoverLinks(html: string, origin: string, entryPath: string): string[] {
  const dom = new JSDOM(html);
  const anchors = Array.from(dom.window.document.querySelectorAll("a[href]"));
  const out = new Set<string>();
  for (const a of anchors) {
    const href = a.getAttribute("href");
    if (!href) continue;
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    )
      continue;

    let abs: URL;
    try {
      abs = new URL(href, origin);
    } catch {
      continue;
    }
    if (abs.origin !== origin) continue;
    if (abs.pathname === entryPath) continue;
    if (abs.pathname === "/" && !entryPath.match(/^\/+$/)) {
      // root link from a non-root entry — could be useful but we already
      // have the homepage if this is the entry. skip.
      continue;
    }
    if (SKIP_PATH_PATTERNS.some((re) => re.test(abs.pathname))) continue;
    // strip trailing slash + query/hash for canonical form
    abs.hash = "";
    out.add(abs.toString());
  }
  return Array.from(out);
}

/**
 * Rank discovered links by path-keyword signal — high-signal pages
 * (About, Services, Methodology, etc.) come first; everything else
 * falls back to discovery order.
 */
function rankLinks(links: string[]): string[] {
  return [...links].sort((a, b) => scoreLink(b) - scoreLink(a));
}

function scoreLink(url: string): number {
  try {
    const path = new URL(url).pathname.toLowerCase();
    let score = 0;
    HIGH_SIGNAL_PATH_KEYWORDS.forEach((kw, i) => {
      if (path.includes(kw)) {
        // Earlier-listed keywords get higher score; weight by 100.
        score += 100 - i;
      }
    });
    // Short, shallow paths are usually section landing pages
    const depth = path.split("/").filter(Boolean).length;
    if (depth === 1) score += 5;
    if (depth === 2) score += 2;
    if (depth >= 4) score -= 5;
    return score;
  } catch {
    return 0;
  }
}

function normalizeForDedup(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    // strip trailing slash so /about and /about/ dedupe
    let path = u.pathname.replace(/\/+$/, "");
    if (path === "") path = "/";
    return u.origin + path;
  } catch {
    return url;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

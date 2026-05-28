import "server-only";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_CONTENT_CHARS = 40_000;

/**
 * Fetch a URL and extract its main content using Mozilla's Readability.
 * Returns plain text (title + article body). Errors are caught and
 * surfaced as a structured result so the caller can decide how to react.
 */
export async function scrapeUrl(rawUrl: string): Promise<
  | { ok: true; title: string; text: string; url: string }
  | { ok: false; error: string }
> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "Invalid URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "URL must use http or https." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; brand-os/1.0; +https://brandsoul.nineyards.pt)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Got HTTP ${response.status} from ${url.hostname}`,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      return {
        ok: false,
        error: `${url.hostname} returned ${contentType || "non-HTML"}. Readability needs HTML.`,
      };
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url: url.toString() });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return {
        ok: false,
        error: `Couldn't extract readable content from ${url.hostname}. The page may be JavaScript-rendered or have no main article.`,
      };
    }

    const title = article.title ?? "";
    const rawText = article.textContent.replace(/\s+/g, " ").trim();
    const text = rawText.slice(0, MAX_CONTENT_CHARS);

    return { ok: true, title, text, url: url.toString() };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: `${url.hostname} took longer than 15s to respond.` };
    }
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Couldn't fetch ${url.hostname}: ${err.message}`
          : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

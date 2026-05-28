import JSZip from "jszip";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { GeneratedFileRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/deliver/[token]/download
 *
 * Public download endpoint authorised by the request's delivery_token.
 * No login. The token is opaque (32 random bytes hex) so URL-only auth
 * is appropriate — same threat model as the request id itself.
 *
 * Streams the zip with the brand pack files + a MANIFEST.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) {
    return new Response("Missing token.", { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: req, error: reqErr } = await supabase
    .from("requests")
    .select("id, company_name")
    .eq("delivery_token", token)
    .maybeSingle();
  if (reqErr || !req) {
    return new Response("Invalid delivery link.", { status: 404 });
  }

  const { data: filesRaw, error: filesErr } = await supabase
    .from("generated_files")
    .select(
      "id, file_name, content, framework_version, locale, status, file_size_bytes",
    )
    .eq("request_id", req.id)
    .order("file_name", { ascending: true });
  if (filesErr) {
    return new Response(`DB error: ${filesErr.message}`, { status: 500 });
  }
  const files = (filesRaw ?? []) as GeneratedFileRow[];
  if (files.length === 0) {
    return new Response("No files available for this delivery.", {
      status: 404,
    });
  }

  // Skip `0_CUSTOM_INSTRUCTIONS.txt`: that content is delivered inline
  // in the email body (Step 1) and pasted into the LLM's instructions
  // field, not uploaded as project knowledge. Keeping it out of the
  // zip prevents the client from misattaching it.
  const zip = new JSZip();
  for (const f of files) {
    if (f.file_name === "0_CUSTOM_INSTRUCTIONS.txt") continue;
    if (typeof f.content === "string" && f.content.length > 0) {
      zip.file(f.file_name, f.content);
    }
  }
  const manifest = {
    framework_version: files[0]?.framework_version ?? "unknown",
    generated_at: new Date().toISOString(),
    files: files.map((f) => ({
      name: f.file_name,
      bytes: f.file_size_bytes,
      locale: f.locale,
    })),
  };
  zip.file("MANIFEST.json", JSON.stringify(manifest, null, 2));

  const buffer = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/zip",
  });

  const slug =
    (req.company_name as string | null | undefined)
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) ?? "brand-pack";

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}-brand-pack.zip"`,
      "Cache-Control": "no-store",
      "Content-Length": String(buffer.byteLength),
    },
  });
}

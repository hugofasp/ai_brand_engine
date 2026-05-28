import JSZip from "jszip";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import type { GeneratedFileRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/download/[requestId]
 *
 * Bundles every row in `generated_files` for this request into a zip
 * and streams it back as a download. File names match what's in the
 * DB. The zip is named `<slug>-brand-pack.zip` using the brand's
 * company_name slug.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Not authenticated.", { status: 401 });
  }
  const { requestId } = await params;

  const supabase = getSupabaseAdmin();
  const { data: req, error: reqErr } = await supabase
    .from("requests")
    .select("company_name")
    .eq("id", requestId)
    .maybeSingle();
  if (reqErr || !req) {
    return new Response("Request not found.", { status: 404 });
  }

  const { data: filesRaw, error: filesErr } = await supabase
    .from("generated_files")
    .select(
      "id, file_name, content, framework_version, locale, status, file_size_bytes",
    )
    .eq("request_id", requestId)
    .order("file_name", { ascending: true });
  if (filesErr) {
    return new Response(`DB error: ${filesErr.message}`, { status: 500 });
  }
  const files = (filesRaw ?? []) as GeneratedFileRow[];
  if (files.length === 0) {
    return new Response(
      "No generated files for this request yet. Run the generator first.",
      { status: 404 },
    );
  }

  // Build the zip in-memory. Pack size is well under 1 MB even with
  // every locale variant, so a streaming approach isn't worth the
  // complexity here.
  //
  // We deliberately skip `0_CUSTOM_INSTRUCTIONS.txt`: that file's
  // content is delivered inline in the email body and pasted into the
  // LLM's instructions field, not uploaded as project knowledge. If we
  // shipped it in the zip the client might attach it alongside the
  // brand DNA files and the LLM would treat the instructions as
  // searchable context (diluting their authority) instead of as a
  // top-level rule set. Admin can still see + copy the content from
  // the admin detail page.
  const zip = new JSZip();
  for (const f of files) {
    if (f.file_name === "0_CUSTOM_INSTRUCTIONS.txt") continue;
    if (typeof f.content === "string" && f.content.length > 0) {
      zip.file(f.file_name, f.content);
    }
  }
  // Embed a manifest with framework version + file list so the
  // operator (or whatever downstream system unpacks this) can verify
  // what was shipped.
  const frameworkVersion = files[0]?.framework_version ?? "unknown";
  const manifest = {
    request_id: requestId,
    framework_version: frameworkVersion,
    generated_at: new Date().toISOString(),
    files: files.map((f) => ({
      name: f.file_name,
      bytes: f.file_size_bytes,
      locale: f.locale,
      status: f.status,
    })),
  };
  zip.file("MANIFEST.json", JSON.stringify(manifest, null, 2));

  const buffer = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  // Wrap in a Blob so the Response body type narrows cleanly under
  // the Web Fetch types Next exposes for Route Handlers.
  const blob = new Blob([new Uint8Array(buffer)], { type: "application/zip" });

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

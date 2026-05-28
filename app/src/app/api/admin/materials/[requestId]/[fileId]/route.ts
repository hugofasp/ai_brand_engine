import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  MaterialsContext,
  UploadedFile,
} from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/materials/[requestId]/[fileId]
 *
 * Streams the raw uploaded file back to an authenticated admin. We
 * look up the file's storage_path from materials_context.uploaded_files
 * (so a stale fileId can't probe arbitrary paths) and download from
 * the private bucket with the service role.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ requestId: string; fileId: string }>;
  },
) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Not authenticated.", { status: 401 });
  }
  const { requestId, fileId } = await params;

  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("interview_answers")
    .select("materials_context")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error || !row) return new Response("Not found.", { status: 404 });

  const ctx = (row.materials_context as MaterialsContext | undefined) ?? {};
  const file = (ctx.uploaded_files ?? []).find(
    (f: UploadedFile) => f.id === fileId,
  );
  if (!file) return new Response("File not found.", { status: 404 });

  const { data: blob, error: dlErr } = await supabase.storage
    .from("materials-uploads")
    .download(file.storage_path);
  if (dlErr || !blob) {
    return new Response(`Download error: ${dlErr?.message ?? "no body"}`, {
      status: 500,
    });
  }

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": file.mime || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(file.name)}"`,
      "Cache-Control": "no-store",
    },
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\r\n"]/g, "").slice(0, 200);
}

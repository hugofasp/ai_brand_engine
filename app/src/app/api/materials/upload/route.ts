import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/materials/extract-text";
import type {
  MaterialsContext,
  UploadedFile,
} from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
]);
const ACCEPTED_EXT = new Set(["pdf", "docx", "doc", "txt", "md"]);
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_FILES_PER_REQUEST = 5;
const BUCKET = "materials-uploads";

/**
 * POST /api/materials/upload
 *
 * multipart/form-data with:
 *   - requestId  (string, required)
 *   - file       (one or more File entries, required)
 *
 * Uploads each file to Supabase Storage, extracts text, and merges the
 * resulting metadata into `materials_context.uploaded_files`. Returns
 * the updated list so the client can render the new entries inline.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return jsonErr("Missing form data.", 400);
  }
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) return jsonErr("Missing requestId.", 400);

  const files = formData.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) return jsonErr("No files attached.", 400);
  if (files.length > MAX_FILES_PER_REQUEST) {
    return jsonErr(
      `Maximum ${MAX_FILES_PER_REQUEST} files per upload.`,
      400,
    );
  }

  const supabase = getSupabaseAdmin();

  // Validate the request exists + load current materials_context.
  const { data: row, error: rowErr } = await supabase
    .from("interview_answers")
    .select("materials_context")
    .eq("request_id", requestId)
    .maybeSingle();
  if (rowErr) return jsonErr(rowErr.message, 500);

  // First-time visit on materials page may not yet have an
  // interview_answers row. Bootstrap one so the upload has a home.
  if (!row) {
    const { error: insErr } = await supabase
      .from("interview_answers")
      .insert({ request_id: requestId });
    if (insErr) return jsonErr(insErr.message, 500);
  }

  const ctx =
    (row?.materials_context as MaterialsContext | undefined) ?? {};
  const existing = ctx.uploaded_files ?? [];

  // Combined cap across this request (existing + incoming).
  if (existing.length + files.length > MAX_FILES_PER_REQUEST) {
    return jsonErr(
      `This request already has ${existing.length} file(s). Limit is ${MAX_FILES_PER_REQUEST}.`,
      400,
    );
  }

  const accepted: UploadedFile[] = [];
  const newTexts = new Map<string, string>();
  const rejections: Array<{ name: string; reason: string }> = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      rejections.push({
        name: file.name,
        reason: `over 25 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
      });
      continue;
    }
    if (!isAccepted(file)) {
      rejections.push({
        name: file.name,
        reason: "type not supported (allowed: pdf, docx, txt, md)",
      });
      continue;
    }

    const ext = extensionOf(file);
    const id = randomUUID();
    const storagePath = `${requestId}/${id}.${ext}`;

    const arrayBuf = await file.arrayBuffer();

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuf, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (upErr) {
      rejections.push({ name: file.name, reason: upErr.message });
      continue;
    }

    const extraction = await extractTextFromFile({
      name: file.name,
      mime: file.type || "application/octet-stream",
      buffer: new Uint8Array(arrayBuf),
    });

    accepted.push({
      id,
      name: file.name,
      mime: file.type || `application/${ext}`,
      bytes: file.size,
      storage_path: storagePath,
      uploaded_at: new Date().toISOString(),
      extracted_chars: extraction.text.length,
      extraction_empty: extraction.empty,
    });
    newTexts.set(id, extraction.text);
  }

  const allFiles = [...existing, ...accepted];

  // Rebuild the concatenated uploaded_text from the persisted text of
  // every file in the set. We re-fetch each file's text from storage
  // (faster path: store it inline in the row). For v1 we keep the
  // newly-extracted text in `uploaded_text` directly and only fetch
  // old files when missing — simpler write, slight redundancy.
  const nextUploadedText = await rebuildUploadedText(
    supabase,
    BUCKET,
    allFiles,
    newTexts,
  );

  const nextCtx: MaterialsContext = {
    ...ctx,
    uploaded_files: allFiles,
    uploaded_text: nextUploadedText,
  };

  const { error: writeErr } = await supabase
    .from("interview_answers")
    .update({ materials_context: nextCtx })
    .eq("request_id", requestId);
  if (writeErr) return jsonErr(writeErr.message, 500);

  return new Response(
    JSON.stringify({
      ok: true,
      accepted: accepted.map((f) => ({
        id: f.id,
        name: f.name,
        bytes: f.bytes,
        mime: f.mime,
        extracted_chars: f.extracted_chars,
        extraction_empty: f.extraction_empty ?? false,
      })),
      rejections,
      total_files: allFiles.length,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

/* ---------------- helpers ---------------- */

function jsonErr(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAccepted(file: File): boolean {
  if (file.type && ACCEPTED_MIME.has(file.type)) return true;
  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return Boolean(ext && ACCEPTED_EXT.has(ext));
}

function extensionOf(file: File): string {
  const fromName = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (fromName && ACCEPTED_EXT.has(fromName)) return fromName;
  if (file.type === "application/pdf") return "pdf";
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (file.type === "application/msword") return "doc";
  if (file.type === "text/markdown") return "md";
  return "txt";
}

/** Concat the extracted text of every uploaded file into a single
 * blob the extractor can consume. Newly-accepted files in this
 * request have their text in `newTexts`; older files are re-extracted
 * from storage on demand. */
async function rebuildUploadedText(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  bucket: string,
  allFiles: UploadedFile[],
  newTexts: Map<string, string>,
): Promise<string> {
  const sections: string[] = [];
  for (const f of allFiles) {
    let text = newTexts.get(f.id);
    if (text == null) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(f.storage_path);
      if (error || !data) continue;
      const buffer = new Uint8Array(await data.arrayBuffer());
      const res = await extractTextFromFile({
        name: f.name,
        mime: f.mime,
        buffer,
      });
      text = res.text;
    }
    if (!text || text.trim().length < 40) continue;
    sections.push(
      `--- BEGIN UPLOAD: ${f.name} (${f.mime}) ---\n${text}\n--- END UPLOAD ---`,
    );
  }
  return sections.join("\n\n");
}

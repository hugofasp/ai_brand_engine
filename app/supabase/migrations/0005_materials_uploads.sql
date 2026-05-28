-- DN-005: PDF/DOCX upload support for the materials phase.
--
-- The bucket is PRIVATE — only the service role can read or write.
-- Uploads are gated by the server-side /api/materials/upload route
-- which authenticates via cookie + URL request id. Admin downloads go
-- through /api/admin/materials/<requestId>/<fileId>/route.ts which
-- generates signed URLs on demand.
--
-- Allowed mime types and 25 MB cap are also enforced server-side
-- (defense in depth — the bucket-level limit is a final guard).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials-uploads',
  'materials-uploads',
  false,
  26214400, -- 25 MiB
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do nothing;

-- Storage RLS: deny everything by default; the service role bypasses
-- RLS entirely so server actions still work. No explicit policy needed
-- to lock the bucket down (the absence of policies means no anon /
-- authenticated user can touch it).

-- Tighten storage_path on generated_files (no-op if already nullable
-- from migration 0004) — included here for idempotency on fresh envs.
-- alter table generated_files alter column storage_path drop not null;

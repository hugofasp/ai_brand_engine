-- DN-004: Generation pipeline
-- Adds inline `content` to generated_files so v1 can persist file bodies
-- in the table without round-tripping through Supabase Storage. Storage
-- upload comes later (DN-005) when we wire the client-delivery zip.

alter table generated_files
  alter column storage_path drop not null;

alter table generated_files
  add column if not exists content text;

-- Tag rows produced by the generator with the model + token usage so we
-- can attribute spend per file in the admin panel.
alter table generated_files
  add column if not exists generation_model text;

alter table generated_files
  add column if not exists token_usage jsonb default '{}'::jsonb;

create index if not exists idx_files_request_status on generated_files(request_id, status);

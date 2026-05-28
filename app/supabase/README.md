# Supabase migrations

The platform uses Supabase Postgres + Auth + Storage.

## Applying migrations

Two paths:

**Option A — Supabase CLI (recommended for local dev):**

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option B — paste into SQL Editor:**

1. Open your Supabase project → SQL Editor
2. Paste the contents of `migrations/0001_initial_schema.sql`
3. Run

## Storage buckets (create manually in the dashboard)

Per BUILD_SPEC §8:

- `framework-templates` — private (admin only). Stores universal file
  templates (00, 01, 90, 92) and master PDFs.
- `request-files` — private (admin only). Stores per-request generated
  files at `requests/[id]/files/[filename]` and zip bundles.
- `public-assets` — public read. Logos, favicon, OG image.

For each: in the Supabase dashboard → Storage → New bucket, then add
RLS policies appropriate to the bucket's access.

## Auth setup

- Disable open sign-ups (admins are added manually via the dashboard).
- Enable email/password and magic link.
- Site URL: `https://aibrandengine.nineyards.pt`
- Redirect URLs: `https://aibrandengine.nineyards.pt/admin`

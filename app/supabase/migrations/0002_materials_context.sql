-- DN-001: Materials pre-step
-- Adds materials_context column to interview_answers so we can store
-- uploaded text + scraped URL content + per-question extracted drafts.

alter table interview_answers
  add column if not exists materials_context jsonb default '{}'::jsonb;

-- Shape:
-- {
--   url: string | null,
--   url_scraped_at: timestamp | null,
--   pasted_text: string | null,
--   extracted_at: timestamp | null,
--   drafts: {
--     [questionId]: { value: unknown, source: string, dismissed?: boolean }
--   }
-- }

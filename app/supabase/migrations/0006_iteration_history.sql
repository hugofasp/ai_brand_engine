-- DN-006: Iteration history for the brand pack.
--
-- Each time an admin asks to re-generate the pack with feedback, we
-- append a record: { at, prompt, file_count, token_usage }. Persisted
-- on the request itself so the iteration log survives even if the
-- generated_files rows are wiped.

alter table requests
  add column if not exists iteration_history jsonb default '[]'::jsonb;

-- DN-003: Conversational interview pivot
-- Adds interview_conversation to store the Claude-driven dialog state.

alter table interview_answers
  add column if not exists interview_conversation jsonb default '{}'::jsonb;

-- Shape:
-- {
--   messages: [
--     { role: 'user' | 'assistant',
--       content: string | ContentBlock[],
--       at: timestamp,
--       tool_calls?: [{ name, input, result }] }
--   ],
--   started_at: timestamp,
--   last_active: timestamp,
--   role: 'Founder' | 'Marketing' | 'Brand' | 'Operations' | 'Other' | null,
--   archetype_decisions?: { [field_id]: archetype_key },
--   completed_fields?: string[]  // mirror of which framework fields Claude has filled
-- }

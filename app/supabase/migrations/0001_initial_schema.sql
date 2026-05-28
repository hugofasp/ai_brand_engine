-- ai brand engine — initial schema (BUILD_SPEC §8)
-- Supabase Auth manages auth.users for admins. Clients don't authenticate.

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Client info
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_role text,

  -- Product
  product text not null check (product in ('brand-identity', 'design-brand-book')),

  -- Status flow
  status text not null default 'started' check (status in (
    'started',
    'interview_in_progress',
    'interview_complete',
    'files_generated',
    'sent',
    'failed',
    'abandoned'
  )),

  -- Audit timestamps
  interview_started_at timestamptz,
  interview_completed_at timestamptz,
  files_generated_at timestamptz,
  sent_at timestamptz,

  -- Admin
  admin_notes text,
  assigned_admin uuid references auth.users(id)
);

create index if not exists idx_requests_status on requests(status);
create index if not exists idx_requests_email on requests(contact_email);
create index if not exists idx_requests_created on requests(created_at desc);

-- Interview answers (one row per request)
create table if not exists interview_answers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  current_phase int default 1,
  completed_phases int[] default '{}',

  -- { phase_1: { q1_1: {...}, q1_2: {...}, ... }, phase_2: {...}, ... }
  answers jsonb default '{}'::jsonb,

  -- Admin post-interview edits (preserved separately for audit)
  admin_edits jsonb default '{}'::jsonb
);

create unique index if not exists idx_answers_request on interview_answers(request_id);

-- Generated files
create table if not exists generated_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  created_at timestamptz default now(),

  file_name text not null,
  storage_path text not null,
  file_size_bytes int,
  framework_version text not null,
  locale text,

  status text not null default 'generated' check (status in (
    'generated',
    'edited',
    'finalized'
  ))
);

create index if not exists idx_files_request on generated_files(request_id);

-- Email log
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  created_at timestamptz default now(),

  recipient text not null,
  subject text not null,
  type text not null check (type in (
    'internal_notification',
    'client_confirmation',
    'client_delivery',
    'contact_form',
    'reminder',
    'resend'
  )),
  resend_message_id text,
  status text default 'sent' check (status in (
    'queued',
    'sent',
    'delivered',
    'opened',
    'clicked',
    'bounced',
    'failed'
  )),
  error text,
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_email_request on email_log(request_id);
create index if not exists idx_email_status on email_log(status);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_requests_updated on requests;
create trigger update_requests_updated
  before update on requests
  for each row execute function update_updated_at();

drop trigger if exists update_answers_updated on interview_answers;
create trigger update_answers_updated
  before update on interview_answers
  for each row execute function update_updated_at();

-- Row Level Security (admins only — clients use service_role server-side)
alter table requests enable row level security;
alter table interview_answers enable row level security;
alter table generated_files enable row level security;
alter table email_log enable row level security;

drop policy if exists "Admins full access on requests" on requests;
create policy "Admins full access on requests"
  on requests for all
  using (auth.uid() is not null);

drop policy if exists "Admins full access on answers" on interview_answers;
create policy "Admins full access on answers"
  on interview_answers for all
  using (auth.uid() is not null);

drop policy if exists "Admins full access on files" on generated_files;
create policy "Admins full access on files"
  on generated_files for all
  using (auth.uid() is not null);

drop policy if exists "Admins full access on emails" on email_log;
create policy "Admins full access on emails"
  on email_log for all
  using (auth.uid() is not null);

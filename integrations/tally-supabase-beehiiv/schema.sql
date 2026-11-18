-- Boudie Eats only. Apply in project vktegxiycqwqnnqpxiuh.
-- Do not run against Without Permission's Supabase project.
-- Additive migration: does not alter existing be_profiles / editorial tables.

create table if not exists public.be_tally_submissions (
  id bigint generated always as identity primary key,
  form_id text not null,
  submission_id text not null,
  event_id text,
  kind text not null check (kind in ('waitlist', 'feedback')),
  language text not null check (language in ('ar', 'en')),
  email text,
  first_name text,
  launch_contact_consent boolean not null default false,
  recurring_newsletter_consent boolean not null default false,
  newsletter_sync_status text not null default 'not_authorized'
    check (newsletter_sync_status in ('not_authorized', 'pending', 'synced')),
  synced_at timestamptz,
  fields jsonb not null default '[]'::jsonb,
  submitted_at timestamptz,
  received_at timestamptz not null default now(),
  constraint be_tally_submissions_unique_response unique (form_id, submission_id)
);

create index if not exists be_tally_submissions_received_idx
  on public.be_tally_submissions (received_at desc);

-- Webhook delivery uses only the server-side service role.
-- Reader/admin browser accounts cannot query raw respondent data via Data API.
alter table public.be_tally_submissions enable row level security;
revoke all on public.be_tally_submissions from anon, authenticated;
revoke all on sequence public.be_tally_submissions_id_seq from anon, authenticated;

comment on table public.be_tally_submissions is
  'Private Boudie Eats Tally intake; no public read policies. Use service role only.';

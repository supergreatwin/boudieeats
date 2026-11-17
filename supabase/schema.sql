-- BoudieEats account & editorial schema (DEDICATED BoudieEats project only).
-- This file must never be deployed to Without Permission's database.
-- Apply with the Supabase SQL editor to the separate BoudieEats project.
-- Auth > Providers > Email: require email confirmation. Configure approved SMTP.
-- Auth > URL Configuration: set both /account/ and /ar/account/ redirect URLs.
-- To bootstrap one verified owner: UPDATE public.be_profiles SET role='admin'
-- WHERE id='<UUID from auth.users with confirmed email>'; do not add a public admin self-signup.

create extension if not exists pgcrypto;

create table if not exists public.be_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-z][a-z0-9_]{2,23}$'),
  display_name text not null default '' check (char_length(display_name) <= 80),
  bio text not null default '' check (char_length(bio) <= 500),
  role text not null default 'reader' check (role in ('reader','contributor','editor','admin')),
  joined_at timestamptz not null default now()
);

create table if not exists public.be_applications (
  user_id uuid primary key references public.be_profiles(id) on delete cascade,
  statement text not null check (char_length(statement) between 30 and 2000),
  state text not null default 'pending' check (state in ('pending','approved','declined')),
  created_at timestamptz not null default now()
);

create table if not exists public.be_pitches (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.be_profiles(id) on delete cascade,
  kind text not null check (kind in ('recipe','review','story','other')),
  title text not null check (char_length(title) between 4 and 160),
  description text not null check (char_length(description) between 20 and 4000),
  state text not null default 'received' check (state in ('received','in_review','accepted','declined')),
  created_at timestamptz not null default now()
);

create table if not exists public.be_drafts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.be_profiles(id) on delete cascade,
  kind text not null check (kind in ('recipe','review','story')),
  language text not null check (language in ('ar','en')),
  title text not null check (char_length(title) between 4 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 90),
  body text not null check (char_length(body) between 50 and 100000),
  state text not null default 'draft' check (state in ('draft','submitted','needs_changes','approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(language,kind,slug)
);

create index if not exists be_pitches_author on public.be_pitches (author_id, created_at desc);
create index if not exists be_drafts_author on public.be_drafts (author_id, updated_at desc);
create index if not exists be_drafts_state on public.be_drafts (state, updated_at desc);

create or replace function public.be_register_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.be_profiles(id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists be_on_signup on auth.users;
create trigger be_on_signup after insert on auth.users for each row
execute function public.be_register_profile();

-- Only a confirmed user gets a role. Metadata is never used as authorization.
create or replace function public.be_my_role()
returns text language sql stable security definer set search_path = ''
as $$
  select p.role from public.be_profiles p
  join auth.users u on u.id=p.id
  where p.id=(select auth.uid()) and u.email_confirmed_at is not null
  limit 1
$$;

create or replace function public.be_staff()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(public.be_my_role() in ('editor','admin'), false)
$$;

create or replace function public.be_can_write()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(public.be_my_role() in ('contributor','editor','admin'), false)
$$;

revoke all on function public.be_register_profile() from public, anon, authenticated;
revoke all on function public.be_my_role() from public, anon, authenticated;
revoke all on function public.be_staff() from public, anon, authenticated;
revoke all on function public.be_can_write() from public, anon, authenticated;
grant execute on function public.be_my_role(), public.be_staff(), public.be_can_write() to authenticated;

alter table public.be_profiles enable row level security;
alter table public.be_applications enable row level security;
alter table public.be_pitches enable row level security;
alter table public.be_drafts enable row level security;

revoke all on public.be_profiles, public.be_applications, public.be_pitches, public.be_drafts from public, anon, authenticated;

grant select on public.be_profiles to authenticated;
grant update(username, display_name, bio) on public.be_profiles to authenticated;
grant select, insert on public.be_applications to authenticated;
grant select, insert on public.be_pitches to authenticated;
grant select, insert on public.be_drafts to authenticated;
grant update(kind, language, title, slug, body) on public.be_drafts to authenticated;

drop policy if exists be_profile_self on public.be_profiles;
create policy be_profile_self on public.be_profiles for select to authenticated
using (id=(select auth.uid()) or (select public.be_staff()));
drop policy if exists be_profile_edit on public.be_profiles;
create policy be_profile_edit on public.be_profiles for update to authenticated
using (id=(select auth.uid()) and public.be_my_role() is not null)
with check (id=(select auth.uid()) and public.be_my_role() is not null);

drop policy if exists be_application_read on public.be_applications;
create policy be_application_read on public.be_applications for select to authenticated
using (user_id=(select auth.uid()) or (select public.be_staff()));
drop policy if exists be_application_submit on public.be_applications;
create policy be_application_submit on public.be_applications for insert to authenticated
with check (user_id=(select auth.uid()) and public.be_my_role()='reader' and state='pending');

drop policy if exists be_pitch_read on public.be_pitches;
create policy be_pitch_read on public.be_pitches for select to authenticated
using (author_id=(select auth.uid()) or (select public.be_staff()));
drop policy if exists be_pitch_create on public.be_pitches;
create policy be_pitch_create on public.be_pitches for insert to authenticated
with check (author_id=(select auth.uid()) and public.be_my_role() is not null and state='received');

drop policy if exists be_draft_read on public.be_drafts;
create policy be_draft_read on public.be_drafts for select to authenticated
using (author_id=(select auth.uid()) or (select public.be_staff()));
drop policy if exists be_draft_create on public.be_drafts;
create policy be_draft_create on public.be_drafts for insert to authenticated
with check (author_id=(select auth.uid()) and (select public.be_can_write()) and state='draft');
drop policy if exists be_draft_update on public.be_drafts;
create policy be_draft_update on public.be_drafts for update to authenticated
using (author_id=(select auth.uid()) and (select public.be_can_write()) and state in ('draft','needs_changes'))
with check (author_id=(select auth.uid()) and (select public.be_can_write()) and state in ('draft','needs_changes'));

-- Status transitions may only happen through these checked RPCs.
create or replace function public.be_submit_draft(_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.be_can_write() then raise exception 'Verified contributor account required'; end if;
  update public.be_drafts
  set state='submitted', updated_at=now()
  where id=_id and author_id=auth.uid() and state in ('draft','needs_changes');
  if not found then raise exception 'Draft not available to submit'; end if;
end;
$$;

create or replace function public.be_review_draft(_id uuid, _decision text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.be_staff() then raise exception 'Editor role required'; end if;
  if _decision not in ('needs_changes','approved') then raise exception 'Invalid review decision'; end if;
  update public.be_drafts set state=_decision, updated_at=now()
  where id=_id and state='submitted';
  if not found then raise exception 'Only submitted drafts can be reviewed'; end if;
end;
$$;

create or replace function public.be_review_pitch(_id uuid, _decision text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.be_staff() then raise exception 'Editor role required'; end if;
  if _decision not in ('in_review','accepted','declined') then raise exception 'Invalid pitch decision'; end if;
  update public.be_pitches set state=_decision
  where id=_id and state in ('received','in_review');
  if not found then raise exception 'Pitch not available for review'; end if;
end;
$$;

create or replace function public.be_review_application(_user uuid, _approve boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if public.be_my_role() is distinct from 'admin' then raise exception 'Admin required'; end if;
  update public.be_applications set state=case when _approve then 'approved' else 'declined' end
  where user_id=_user and state='pending';
  if not found then raise exception 'Pending application not found'; end if;
  if _approve then
    update public.be_profiles set role='contributor'
    where id=_user and role='reader';
  end if;
end;
$$;

revoke all on function public.be_submit_draft(uuid) from public, anon, authenticated;
revoke all on function public.be_review_draft(uuid,text) from public, anon, authenticated;
revoke all on function public.be_review_pitch(uuid,text) from public, anon, authenticated;
revoke all on function public.be_review_application(uuid,boolean) from public, anon, authenticated;
grant execute on function public.be_submit_draft(uuid),
  public.be_review_draft(uuid,text),
  public.be_review_pitch(uuid,text),
  public.be_review_application(uuid,boolean) to authenticated;

-- BoudieEats separate publication layer.
-- This SQL was applied to the dedicated BoudieEats Supabase project as
-- boudieeats_editorial_publications_20261119. DO NOT rerun blindly.
-- Never install this in the Without Permission or Amira projects.

create table if not exists public.be_publications (
  draft_id uuid primary key references public.be_drafts(id) on delete cascade,
  kind text not null check (kind in ('recipe','review','story')),
  language text not null check (language in ('en','ar')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 90),
  title text not null check (char_length(title) between 4 and 160),
  body text not null check (char_length(body) between 50 and 100000),
  published_at timestamptz not null default now(),
  unique (language, kind, slug)
);

alter table public.be_publications enable row level security;
revoke all on public.be_publications from public, anon, authenticated;
grant select on public.be_publications to anon, authenticated;

drop policy if exists be_publications_read on public.be_publications;
create policy be_publications_read on public.be_publications
  for select to anon, authenticated using (true);

create or replace function public.be_publish_draft(_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  draft public.be_drafts%rowtype;
begin
  if not coalesce(public.be_staff(), false) then
    raise exception 'Verified editor role required to publish' using errcode = '42501';
  end if;
  select * into draft from public.be_drafts
    where id = _id and state = 'approved';
  if not found then
    raise exception 'Only approved drafts can be published';
  end if;
  insert into public.be_publications
    (draft_id,kind,language,slug,title,body)
  values (draft.id,draft.kind,draft.language,draft.slug,draft.title,draft.body)
  on conflict (draft_id) do update set
    kind = excluded.kind,
    language = excluded.language,
    slug = excluded.slug,
    title = excluded.title,
    body = excluded.body,
    published_at = now();
end;
$$;

create or replace function public.be_unpublish_draft(_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not coalesce(public.be_staff(), false) then
    raise exception 'Verified editor role required to unpublish' using errcode = '42501';
  end if;
  delete from public.be_publications where draft_id = _id;
  if not found then
    raise exception 'This article is not published';
  end if;
end;
$$;

revoke all on function public.be_publish_draft(uuid) from public, anon, authenticated;
revoke all on function public.be_unpublish_draft(uuid) from public, anon, authenticated;
grant execute on function public.be_publish_draft(uuid),
  public.be_unpublish_draft(uuid) to authenticated;

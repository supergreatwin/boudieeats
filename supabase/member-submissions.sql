-- Boudie Eats: signed-in reader submissions, visible only to their author and staff.
create table if not exists public.be_member_submissions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('recipe','place','review')),
  title text not null check (char_length(btrim(title)) between 3 and 140),
  description text not null check (char_length(btrim(description)) between 15 and 6000),
  city text not null default '' check (char_length(city) <= 120),
  cuisine text not null default '' check (char_length(cuisine) <= 100),
  ingredients text not null default '' check (char_length(ingredients) <= 6000),
  instructions text not null default '' check (char_length(instructions) <= 9000),
  restaurant_name text not null default '' check (char_length(restaurant_name) <= 140),
  rating smallint check (rating between 1 and 5),
  visited_on date check (visited_on <= current_date),
  status text not null default 'pending' check (status in ('pending','in_review','approved','declined')),
  staff_note text not null default '' check (char_length(staff_note) <= 2000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint be_member_submission_fields check (
    (kind='recipe' and char_length(btrim(ingredients)) >= 3 and char_length(btrim(instructions)) >= 15
       and restaurant_name='' and rating is null)
    or
    (kind='place' and char_length(btrim(city)) >= 2 and restaurant_name='' and rating is null)
    or
    (kind='review' and char_length(btrim(restaurant_name)) >= 2 and rating is not null)
  )
);
create index if not exists be_member_submissions_author_recent_idx
  on public.be_member_submissions(author_id,created_at desc);
create index if not exists be_member_submissions_staff_queue_idx
  on public.be_member_submissions(status,created_at desc);
alter table public.be_member_submissions enable row level security;
revoke all on public.be_member_submissions from public,anon,authenticated;
grant select on public.be_member_submissions to authenticated;
grant insert (author_id,kind,title,description,city,cuisine,ingredients,instructions,restaurant_name,rating,visited_on)
  on public.be_member_submissions to authenticated;
grant update (status,staff_note,reviewed_at) on public.be_member_submissions to authenticated;
create policy "member submission owner or staff read" on public.be_member_submissions
  for select to authenticated
  using (author_id=(select auth.uid()) or (select public.be_staff()));
create policy "member submission author creates pending" on public.be_member_submissions
  for insert to authenticated
  with check (author_id=(select auth.uid()) and status='pending' and staff_note='' and reviewed_at is null);
create policy "member submission staff moderation only" on public.be_member_submissions
  for update to authenticated
  using ((select public.be_staff()))
  with check ((select public.be_staff()));
-- Limit repeated submissions without revealing another member's records.
create or replace function public.be_limit_member_submissions()
returns trigger language plpgsql security invoker
set search_path=public,pg_temp
as $$
begin
 if (select count(*) from public.be_member_submissions
     where author_id=auth.uid() and created_at>now()-interval '1 hour')>=12 then
   raise exception 'Hourly submission limit reached. Please try again later.'
     using errcode='P0001';
 end if;
 return new;
end $$;
revoke all on function public.be_limit_member_submissions() from public;
drop trigger if exists be_member_submissions_rate_limit on public.be_member_submissions;
create trigger be_member_submissions_rate_limit
before insert on public.be_member_submissions
for each row execute function public.be_limit_member_submissions();

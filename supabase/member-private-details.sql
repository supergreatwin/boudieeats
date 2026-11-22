-- Boudie Eats private member personal details and avatar storage.
-- Never expose DOB or address on public profiles or in the editorial desk.
create table if not exists public.be_member_private (
  id uuid primary key references auth.users(id) on delete cascade,
  date_of_birth date,
  address text not null default '',
  avatar_path text not null default '',
  updated_at timestamptz not null default now(),
  constraint be_member_private_address_length check (char_length(address) <= 240),
  constraint be_member_private_avatar_length check (char_length(avatar_path) <= 180),
  constraint be_member_private_avatar_owner check (
    avatar_path = '' or avatar_path like id::text || '/%'
  )
);

alter table public.be_member_private enable row level security;
revoke all on public.be_member_private from public, anon;
grant select,insert,update on public.be_member_private to authenticated;

create policy "be_member_private_select_own"
  on public.be_member_private for select to authenticated
  using ((select auth.uid())=id);
create policy "be_member_private_insert_own"
  on public.be_member_private for insert to authenticated
  with check ((select auth.uid())=id);
create policy "be_member_private_update_own"
  on public.be_member_private for update to authenticated
  using ((select auth.uid())=id) with check ((select auth.uid())=id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('be-profile-photos','be-profile-photos',false,2097152,
  array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "be_avatar_select_own" on storage.objects for select to authenticated
using (bucket_id='be-profile-photos' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "be_avatar_insert_own" on storage.objects for insert to authenticated
with check (bucket_id='be-profile-photos' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "be_avatar_update_own" on storage.objects for update to authenticated
using (bucket_id='be-profile-photos' and split_part(name,'/',1)=(select auth.uid())::text)
with check (bucket_id='be-profile-photos' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "be_avatar_delete_own" on storage.objects for delete to authenticated
using (bucket_id='be-profile-photos' and split_part(name,'/',1)=(select auth.uid())::text);

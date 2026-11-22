-- Add context-specific member contributions to all seven Boudie Eats experiences.
-- Existing recipe, place and review submissions remain valid.
alter table public.be_member_submissions drop constraint if exists be_member_submissions_kind_check;
alter table public.be_member_submissions
 add constraint be_member_submissions_kind_check
 check (kind in ('recipe','place','review','mama_pick','dish_idea',
                'gallery_photo','spotlight_story','passport_idea','food_lab_idea'));
alter table public.be_member_submissions
 add column if not exists photo_path text not null default '';
alter table public.be_member_submissions
 add column if not exists source_url text not null default '';
alter table public.be_member_submissions
 add constraint be_member_submissions_photo_owner check
 (char_length(photo_path)<=220 and (photo_path='' or photo_path like author_id::text||'/%'));
alter table public.be_member_submissions
 add constraint be_member_submissions_source_url_length check (char_length(source_url)<=500);
alter table public.be_member_submissions drop constraint if exists be_member_submission_fields;
alter table public.be_member_submissions add constraint be_member_submission_fields check (
 (kind='recipe' and char_length(btrim(ingredients))>=3 and char_length(btrim(instructions))>=15
  and restaurant_name='' and rating is null)
 or (kind='place' and char_length(btrim(city))>=2 and restaurant_name='' and rating is null)
 or (kind='review' and char_length(btrim(restaurant_name))>=2 and rating is not null)
 or (kind='mama_pick' and char_length(btrim(description))>=15 and rating is null)
 or (kind='dish_idea' and char_length(btrim(description))>=15 and rating is null)
 or (kind='gallery_photo' and photo_path<>'' and char_length(btrim(description))>=15
    and rating is null)
 or (kind='spotlight_story' and char_length(btrim(description))>=15 and rating is null)
 or (kind='passport_idea' and char_length(btrim(description))>=15 and rating is null)
 or (kind='food_lab_idea' and char_length(btrim(description))>=15 and rating is null)
);
grant insert(photo_path,source_url) on public.be_member_submissions to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('be-member-contributions','be-member-contributions',false,3145728,
 array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

create policy "Member submission photos: owner reads" on storage.objects
 for select to authenticated
 using(bucket_id='be-member-contributions'
 and split_part(name,'/',1)=(select auth.uid())::text);
create policy "Member submission photos: staff reviews" on storage.objects
 for select to authenticated
 using(bucket_id='be-member-contributions' and (select public.be_staff()));
create policy "Member submission photos: owner uploads" on storage.objects
 for insert to authenticated
 with check(bucket_id='be-member-contributions'
  and split_part(name,'/',1)=(select auth.uid())::text);
create policy "Member submission photos: owner removes" on storage.objects
 for delete to authenticated
 using(bucket_id='be-member-contributions'
 and split_part(name,'/',1)=(select auth.uid())::text);

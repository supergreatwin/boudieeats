-- What to Eat phase two: private bilingual pages, FAQs, collections, photo galleries.
create table if not exists public.be_wte_sections(
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('editorial','faq','collection')),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title_en text not null check(length(btrim(title_en)) between 2 and 160),
 title_ar text not null check(length(btrim(title_ar)) between 2 and 160),
 body_en text not null default '', body_ar text not null default '',
 filter_tag text not null default '',
 status text not null default 'draft' check(status in ('draft','ready','published')),
 partner_reviewed boolean not null default false,
 active boolean not null default true,
 position integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint be_wte_section_approval check(status<>'published' or partner_reviewed)
);
create table if not exists public.be_wte_photos(
 id uuid primary key default gen_random_uuid(),
 place_id uuid not null references public.be_wte_places(id) on delete cascade,
 image_url text not null check(image_url like 'storage:%' or image_url like 'https://%'),
 caption_en text not null default '', caption_ar text not null default '',
 image_alt_en text not null default '', image_alt_ar text not null default '',
 image_credit text not null default '', image_rights_confirmed boolean not null default false,
 position integer not null default 0, created_at timestamptz not null default now()
);
create index if not exists be_wte_sections_order on public.be_wte_sections(kind,status,position);
create index if not exists be_wte_photos_place on public.be_wte_photos(place_id,position);
alter table public.be_wte_sections enable row level security;
alter table public.be_wte_photos enable row level security;
create policy "wte sections staff select" on public.be_wte_sections for select to authenticated using ((select public.be_my_role()) in ('admin','editor'));
create policy "wte sections staff insert" on public.be_wte_sections for insert to authenticated with check ((select public.be_my_role()) in ('admin','editor'));
create policy "wte sections staff update" on public.be_wte_sections for update to authenticated using ((select public.be_my_role()) in ('admin','editor')) with check ((select public.be_my_role()) in ('admin','editor'));
create policy "wte sections staff delete" on public.be_wte_sections for delete to authenticated using ((select public.be_my_role()) in ('admin','editor'));
create policy "wte sections public read" on public.be_wte_sections for select to anon,authenticated using (active and status='published' and partner_reviewed and exists(select 1 from public.be_wte_settings s where s.id=1 and s.site_enabled and s.partner_approved));
create policy "wte photos staff select" on public.be_wte_photos for select to authenticated using ((select public.be_my_role()) in ('admin','editor'));
create policy "wte photos staff insert" on public.be_wte_photos for insert to authenticated with check ((select public.be_my_role()) in ('admin','editor'));
create policy "wte photos staff update" on public.be_wte_photos for update to authenticated using ((select public.be_my_role()) in ('admin','editor')) with check ((select public.be_my_role()) in ('admin','editor'));
create policy "wte photos staff delete" on public.be_wte_photos for delete to authenticated using ((select public.be_my_role()) in ('admin','editor'));
create policy "wte photos public read" on public.be_wte_photos for select to anon,authenticated using (image_rights_confirmed and exists(select 1 from public.be_wte_places p where p.id=place_id and p.status='published' and p.partner_reviewed and (nullif(p.image_url,'') is null or p.image_rights_confirmed) and exists(select 1 from public.be_wte_settings s where s.id=1 and s.site_enabled and s.partner_approved)));
grant select on public.be_wte_sections,public.be_wte_photos to anon;
grant select,insert,update,delete on public.be_wte_sections,public.be_wte_photos to authenticated;
-- Close the original storage read policy loophole: public images require global launch.
drop policy if exists "wte images live read" on storage.objects;
create policy "wte images live read" on storage.objects for select to anon,authenticated
 using (bucket_id='be-wte-media'
  and exists(select 1 from public.be_wte_settings s where s.id=1 and s.site_enabled and s.partner_approved)
  and (exists(select 1 from public.be_wte_places p where p.image_url='storage:'||name and p.status='published' and p.partner_reviewed and p.image_rights_confirmed)
  or exists(select 1 from public.be_wte_photos ph where ph.image_url='storage:'||name and ph.image_rights_confirmed)));
-- These editable category choices and page blocks are unpublished placeholders, not fabricated businesses.
insert into public.be_wte_terms(kind,slug,label_en,label_ar,position) values
('city','cairo','Cairo','القاهرة',10),('city','giza','Giza','الجيزة',20),
('city','alexandria','Alexandria','الإسكندرية',30),('city','ismailia','Ismailia','الإسماعيلية',40),
('city','port-said','Port Said','بورسعيد',50),('city','mansoura','Mansoura','المنصورة',60),
('cuisine','egyptian','Egyptian','مصري',10),('cuisine','levantine','Levantine','شامي',20),
('cuisine','italian','Italian','إيطالي',30),('cuisine','asian','Asian','آسيوي',40),
('cuisine','seafood','Seafood','مأكولات بحرية',50),('cuisine','cafes','Cafés','كافيهات',60),
('cuisine','bakeries','Bakeries & desserts','مخبوزات وحلويات',70),
('cuisine','street-food','Street food','أكل شارع',80),('cuisine','breakfast','Breakfast','فطار',90)
on conflict(kind,slug) do nothing;
insert into public.be_wte_sections(kind,slug,title_en,title_ar,body_en,body_ar,status,partner_reviewed,position) values
('editorial','how-to-use','Find your next food stop','اختار أكلتك الجاية',
 'Browse by city, cuisine, and price. Each listing can include original photographs, what to order, and useful links.',
 'دور حسب المدينة ونوع الأكل والسعر. كل مكان ممكن تلاقي له صور أصلية وترشيحات للطلبات وروابط مفيدة.','draft',false,10),
('editorial','editorial-note','Our editorial approach','طريقتنا في الترشيحات',
 'Restaurant information and recommendations are prepared for review. Any partnership or promotional involvement should be clearly disclosed before publication.',
 'معلومات الأماكن والترشيحات تحت المراجعة. أي تعاون أو محتوى ترويجي لازم يكون معلن بوضوح قبل النشر.','draft',false,20),
('editorial','pdf-guide','The downloadable guide','الدليل القابل للتحميل',
 'A PDF edition is planned but will not be released before the collaboration and its content are finalized.',
 'فيه نسخة PDF مخطط لها، لكنها مش هتتنشر قبل اكتمال الاتفاق والمحتوى.','draft',false,30),
('faq','guide-availability','When will the guide launch?','إمتى الدليل هينزل؟',
 'The publication date will be confirmed when the collaboration is finalized.',
 'موعد النشر هيتحدد بعد ما الاتفاق يكتمل.','draft',false,40)
on conflict(slug) do nothing;
comment on table public.be_wte_sections is 'Editor-managed bilingual What to Eat sections, FAQs and tag collections.';
comment on table public.be_wte_photos is 'Optional privately managed restaurant gallery images.';

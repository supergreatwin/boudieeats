-- What to Eat: free, private-by-default editorial catalogue.
-- Run only on BoudieEats Supabase project vktegxiycqwqnnqpxiuh.
-- The collaboration and its entries remain inaccessible to public clients until
-- BOTH the admin's explicit launch flag and partner approval are true.
create table if not exists public.be_wte_settings (
  id integer primary key default 1 check (id=1),
  site_enabled boolean not null default false,
  partner_approved boolean not null default false,
  pdf_url text,
  updated_at timestamptz not null default now()
);
insert into public.be_wte_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.be_wte_terms (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('city','cuisine')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label_en text not null check (length(btrim(label_en)) between 2 and 100),
  label_ar text not null check (length(btrim(label_ar)) between 2 and 100),
  active boolean not null default true,
  position integer not null default 0,
  unique(kind,slug)
);

create table if not exists public.be_wte_places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null check (length(btrim(name_en)) between 2 and 160),
  name_ar text not null check (length(btrim(name_ar)) between 2 and 160),
  city_id uuid not null references public.be_wte_terms(id) on delete restrict,
  cuisine_id uuid not null references public.be_wte_terms(id) on delete restrict,
  district_en text not null default '',
  district_ar text not null default '',
  summary_en text not null default '',
  summary_ar text not null default '',
  must_try_en text not null default '',
  must_try_ar text not null default '',
  address_en text not null default '',
  address_ar text not null default '',
  price_band text not null default 'mid' check (price_band in ('budget','mid','premium')),
  tags text[] not null default '{}',
  image_url text,
  image_alt_en text not null default '',
  image_alt_ar text not null default '',
  image_credit text not null default '',
  image_rights_confirmed boolean not null default false,
  website_url text,
  instagram_url text,
  booking_url text,
  editorial_notes text not null default '',
  source_reference text not null default '',
  partner_reviewed boolean not null default false,
  status text not null default 'draft' check (status in ('draft','ready','published')),
  featured boolean not null default false,
  position integer not null default 0,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint be_wte_picture_rights check (image_url is null or image_url='' or image_rights_confirmed or status<>'published'),
  constraint be_wte_partner_reviewed check (status<>'published' or partner_reviewed)
);
create index if not exists be_wte_places_filters on public.be_wte_places(city_id,cuisine_id,status,position);
create index if not exists be_wte_places_updated on public.be_wte_places(updated_at desc);

alter table public.be_wte_settings enable row level security;
alter table public.be_wte_terms enable row level security;
alter table public.be_wte_places enable row level security;

-- A public client can see the launch flag only AFTER the two launch gates pass.
create policy "wte live flag public" on public.be_wte_settings for select to anon,authenticated
  using (site_enabled and partner_approved);
create policy "wte private settings staff" on public.be_wte_settings for select to authenticated
  using ((select public.be_my_role()) in ('editor','admin'));
create policy "wte settings admin changes" on public.be_wte_settings for update to authenticated
  using ((select public.be_my_role())='admin')
  with check ((select public.be_my_role())='admin');

create policy "wte live terms public" on public.be_wte_terms for select to anon,authenticated
  using (active and exists(select 1 from public.be_wte_settings s where s.id=1 and s.site_enabled and s.partner_approved));
create policy "wte terms staff read" on public.be_wte_terms for select to authenticated
  using ((select public.be_my_role()) in ('editor','admin'));
create policy "wte terms staff insert" on public.be_wte_terms for insert to authenticated
  with check ((select public.be_my_role()) in ('editor','admin'));
create policy "wte terms staff update" on public.be_wte_terms for update to authenticated
  using ((select public.be_my_role()) in ('editor','admin'))
  with check ((select public.be_my_role()) in ('editor','admin'));
create policy "wte terms staff delete" on public.be_wte_terms for delete to authenticated
  using ((select public.be_my_role()) in ('editor','admin'));

create policy "wte live places public" on public.be_wte_places for select to anon,authenticated
  using (status='published' and partner_reviewed and (nullif(image_url,'') is null or image_rights_confirmed)
     and exists(select 1 from public.be_wte_settings s where s.id=1 and s.site_enabled and s.partner_approved));
create policy "wte places staff read" on public.be_wte_places for select to authenticated
  using ((select public.be_my_role()) in ('editor','admin'));
create policy "wte places staff insert" on public.be_wte_places for insert to authenticated
  with check ((select public.be_my_role()) in ('editor','admin'));
create policy "wte places staff update" on public.be_wte_places for update to authenticated
  using ((select public.be_my_role()) in ('editor','admin'))
  with check ((select public.be_my_role()) in ('editor','admin'));
create policy "wte places staff delete" on public.be_wte_places for delete to authenticated
  using ((select public.be_my_role()) in ('editor','admin'));

grant select on public.be_wte_settings, public.be_wte_terms, public.be_wte_places to anon;
grant select,insert,update,delete on public.be_wte_terms, public.be_wte_places to authenticated;
grant select,update on public.be_wte_settings to authenticated;

comment on table public.be_wte_places is 'Partner-controlled food guide; public rows appear only after dual launch gates and individual publication approval.';
comment on column public.be_wte_settings.pdf_url is 'Reserved for final collaboration PDF; leave empty until signed off.';
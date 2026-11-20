-- What to Eat independent brand configuration. Existing dual RLS launch gates are unchanged.
alter table public.be_wte_settings
  add column if not exists guide_intro_en text not null default 'Find places by cuisine and city, with carefully written recommendations.',
  add column if not exists guide_intro_ar text not null default 'اختار أكلتك ومدينتك، وشوف ترشيحات مكتوبة بعناية.',
  add column if not exists brand_hero_url text,
  add column if not exists brand_hero_rights_confirmed boolean not null default false,
  add column if not exists community_instagram_url text not null default 'https://www.instagram.com/whattocommunity/',
  add column if not exists community_handle text not null default '@whattocommunity';
alter table public.be_wte_settings
  add constraint be_wte_brand_hero_rights check (
    brand_hero_url is null or
    (brand_hero_url ~ '^https://[^[:space:]]+$' and brand_hero_rights_confirmed)
  );
alter table public.be_wte_settings
  add constraint be_wte_community_instagram_https check (
    community_instagram_url ~ '^https://[^[:space:]]+$'
  );
comment on column public.be_wte_settings.brand_hero_url is
  'Optional explicitly licensed HTTPS replacement for the bundled original what to eat? photograph.';
comment on column public.be_wte_settings.community_instagram_url is
  'Community profile supplied by the collaborator; only surfaced when the independently approved community section is visible.';
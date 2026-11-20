# boudieeats.

An Egyptian food journal with recipes, restaurant and café photos, and supermarket taste tests.

[Open BoudieEats](https://boudieeats.pages.dev/)

The Cloudflare Pages build runs `node tools/build-pages.mjs` with `SITE_URL` set to the production origin and publishes `boudieeats/dist`. The build uses Node.js 24 and applies the reviewed editorial files and pinned Astro dependencies after extracting the archive. GitHub Pages uses the same build with its repository base path.


# BoudieEats — independent accounts

BoudieEats has a bilingual private account interface at `/account/` and `/ar/account/`. The editorial workspace lives at `/editorial-desk/` and `/ar/editorial-desk/`.

## Status

The dedicated BoudieEats Supabase project **vktegxiycqwqnnqpxiuh** is active and the account schema was applied successfully. The bilingual site is configured to use this project's public publishable key, with RLS protecting all account and editorial data. **Email-confirmation redirects, SMTP delivery, and end-to-end signup have not yet been verified; do not announce public registration as launch-ready until those checks pass.**

BoudieEats accounts are independent of GitHub and other publications. Do not deploy the schema to another project's backend.

## Verify production authentication and launch

1. The separate project is already created at [BoudieEats Supabase](https://supabase.com/dashboard/project/vktegxiycqwqnnqpxiuh), with initial cost quoted at $0/month. Its four RLS-enabled tables and policies are deployed as migration `boudieeats_independent_accounts_initial`. **Do not rerun the initial schema.**
2. The site has the dedicated project's public URL and publishable key in `tools/be-public-config.mjs`. This key is public by design, not a secret. The GitHub build no longer needs repository variables; Cloudflare may optionally override using matching `BE_SUPABASE_URL` and `BE_SUPABASE_PUBLISHABLE_KEY`. Never use another project's Supabase instance.
3. The next steps are Auth configuration and a controlled real-email signup test; they cannot be confirmed through the available Supabase project-management connector.
4. Auth settings: enable Email provider and **Confirm email**, minimum password length at least 12, rate limits, and CAPTCHA if appropriate. Configure a verified SMTP provider; do **not** open public registration until confirmation and password-reset messages arrive successfully.
5. Set the Supabase Auth Site URL to the chosen production site. Add **both** language return URLs to the redirect allowlist:
   - `https://boudieeats.pages.dev/account/`
   - `https://boudieeats.pages.dev/ar/account/`
   - `https://supergreatwin.github.io/boudieeats/account/`
   - `https://supergreatwin.github.io/boudieeats/ar/account/`
6. Public URL and publishable key are already embedded in the build, so manually adding build variables is **not required**. Do not put private or service-role keys into client settings. If Cloudflare already has `BE_SUPABASE_URL` or `BE_SUPABASE_PUBLISHABLE_KEY` overrides, check they match the BoudieEats project.
7. Confirm the owner account with a real email address. Then bootstrap **only** that verified user from the BoudieEats SQL editor:
   ```sql
   update public.be_profiles
   set role='admin'
   where id='ACTUAL-VERIFIED-AUTH-USER-UUID'
   and exists (select 1 from auth.users u
               where u.id=public.be_profiles.id
                 and u.email_confirmed_at is not null);
   ```
   This is a manual, privileged step; **never** permit self-assigned admin or editor roles.
8. Test English and Arabic registration, email confirmation, duplicate usernames, sign-in, logout, password reset, profile updates, reader pitches, contributor applications, draft submission, editor approval, and access denied to other readers' private records. Check mobile and desktop, GitHub Pages and Cloudflare Pages. Test actual inbox delivery and user-facing redirects.

## Role model

- **Reader:** independent email/password login; reserved unique username after confirmation; private profile; food pitches; contributor application.
- **Contributor:** reader capabilities plus private article drafts and submit-for-review.
- **Editor:** review queue; request changes or approve submitted drafts.
- **Admin:** editorial privileges plus approval of contributor applications. The first admin must be provisioned from the dedicated Supabase project.

Draft approval remains private until an editor clicks **Publish article**. The published copy is stored in `public.be_publications` and rendered on the corresponding English or Arabic recipes, reviews, or stories page. Editors can unpublish without deleting the approved draft. Private pitches, applications, and unpublished drafts remain protected by RLS. This is client-rendered publication; server-rendered URLs and sitemap generation for optimal SEO are a separate future enhancement.

## Build checks

The standard static build creates both language routes, a language selector, and account menu links. CI runs `node tools/verify-accounts.mjs` plus the existing bilingual and English validation.

Documentation: [Supabase password auth](https://supabase.com/docs/guides/auth/passwords), [email and SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## What to Eat collaboration (private by default)

Routes: `/what-to-eat/` and `/ar/what-to-eat/` are private visitor previews until approved. Their editors are at `/editorial-desk/what-to-eat/` and `/ar/editorial-desk/what-to-eat/`, linked from the existing Editorial Desk.

Editors and admins can add bilingual cities, cuisine types, places, pricing, recommendations, original photographs, credits, source references and notes. Search, city, cuisine and price filters replace the map. No restaurants or AI-generated images were fabricated.

Security: Pages are excluded from the sitemap and public navigation and use noindex/nofollow. A guessed URL does not grant access: Supabase RLS hides the catalogue and private photo bucket until the administrator enables BOTH site_enabled and partner_approved. Each public listing also needs published status, partner sign-off, and image-use rights if applicable. Private notes are in a staff-only table.

PDF: The URL is intentionally blank until the collaboration and future PDF are finalized. Adding the PDF is optional and separate.

Cost: Uses the existing static hosting and dedicated free Supabase project, subject to free-tier quotas; no paid map, CMS or extra service. The upload size limit is 5 MB per image.

Database schema: `supabase/what-to-eat.sql` applied only to the dedicated Boudie Eats project as migration `boudieeats_private_what_to_eat_guide`. Do not rerun the migration. Build checks: `tools/verify-what-to-eat.mjs`. Keep both launch switches OFF until formal approval.

## What to Eat — private collaboration completion

The editorial workspace now supports structured bilingual page sections, FAQs, tag-curated collections, and optional photo galleries as well as restaurant records and cuisine/city filters. The added seed terms are editable labels, not fabricated restaurant recommendations. New editorial sections are draft placeholders that MUST be reviewed before any launch. The separate phase-two schema `supabase/what-to-eat-phase-two.sql` is deployed to the dedicated Boudie Eats project, including strict global image gating. Do not run it again.

The unpublished workspace may be opened from `https://supergreatwin.github.io/boudieeats/editorial-desk/what-to-eat/` when the branded Cloudflare route is stale. The four private What to Eat GitHub Pages routes are excluded from the mirror redirect, remain noindexed, and continue to require Supabase editor/admin access for data. Everything else on the GitHub Pages mirror still redirects to the canonical branded site. A successful GitHub Pages build does NOT confirm Cloudflare deployment. Keep both global launch switches OFF until the collaboration is finalized; no final PDF or partner information has been added.

## What to Eat identity update (supplied original artwork)

The private collaboration section uses the original supplied What to Eat photographic branding: monochrome dining photograph, bright orange brand block, lower-case bold italic `what to eat?` wordmark, and an orange/black/white interface. The original image composition has been preserved in `assets/what-to-eat-original-reference.jpg` and copied to the generated site as `be-what-to-eat-brand.jpg`. Boudie Eats remains the parent domain and the editorial authentication host, but the guide uses its distinct partner identity. A separate `community` editorial block is installed as an unpublished, bilingual draft; editors control its copy and approval independently in the same workspace. No external community link or invented community photograph has been attached. Both public launch switches remain OFF and the PDF remains pending.

## Full what to eat? brand system

This independently branded guide now uses the original user-supplied campaign photograph with its **orange wordmark preserved**, a consistent orange/black/white editorial palette, heavy italic lowercase typography, squared graphic controls, original monochrome restaurant photography, and dedicated bilingual navigation, footer and favicon. There is no inherited burgundy/gold/Fraunces/Lalezar styling in this section; Boudie Eats appears only as a small host credit. Guide and Editorial Desk share the same identity across both languages and mobile/desktop.

Administrators can update the guide's EN/AR introductory copy, optional rights-cleared HTTPS hero image, and community Instagram URL/handle from the private studio without touching the two separate public-launch switches. The default hero is the supplied original `assets/what-to-eat-original-reference.jpg`; no AI photos are created. Community uses the Instagram handle supplied by the user, `@whattocommunity`, and displays only when its dedicated section is approved or privately previewed by editors. The settings migration `supabase/what-to-eat-brand-settings.sql` has been applied to the dedicated Boudie Eats project. The PDF, individual restaurants, and partner approval remain pending; `site_enabled=false` and `partner_approved=false` must remain unchanged until final sign-off.

## Authenticated private preview fix

The visitor route `/what-to-eat/` intentionally still renders a generic unavailable page to anonymous visitors until both launch gates are approved. To see the complete design *before launch*, staff sign in at `/editorial-desk/what-to-eat/` and select **View full private preview**, which links to `/editorial-desk/what-to-eat/?preview=1` on the same origin. That editor-only query renders the real full-width image, filters, draft sections, and community block without publishing content; the query does not grant special privileges. Normal Supabase authentication, role lookup, and RLS still restrict data. Preview has a prominent **Back to content studio** bar; filters work while previewing and edit/delete buttons are hidden there. An anonymous user who visits the query sees only a branded sign-in form, never draft records. The previous editor preview button that linked to the unreleased visitor URL has been corrected. No PDF or partner content was fabricated.

## What to Eat private newsletter + installable PWA

The What to Eat guide now mounts an Amira-inspired (native accessible `<dialog>`) black-and-orange editorial popup only on the **rendered guide view** (an authenticated staff preview until both launch switches are on, then the approved public guide). It opens after six seconds on eligible visits, suppresses repeat automatic opens for five days after dismissal, remains manually reopenable via **Get the food letter**, and closes with Escape/backdrop/close button. It embeds the EXISTING Tally forms for **Boudie Eats’ prelaunch newsletter** (English `vXDORl`, Arabic `7XK9Dz`), both verified published and accepting submissions on November 20, 2026. Popup copy clearly identifies the Boudie Eats list: this is NOT an independent partner newsletter and must not promise What to Eat-only subscriptions. Existing Tally delivery/automation remains unchanged. No newsletter modal is triggered in the Editorial Desk editing view or for anonymous unreleased pages.

Both bilingual guide and editor shells now carry per-route **web app manifests**, standalone display metadata and 192/512px branded PNG icons. The installed private Studio starts at the existing Supabase-protected `/editorial-desk/what-to-eat/`; users sign in normally, and the app remains unavailable to anonymous visitors. No new hosting/subscription is required: it uses the existing static Cloudflare/GitHub hosting and Supabase free-tier components, subject to plan quotas. The PWA is **online-only** for account access and live content: no service worker caches confidential pages or Supabase responses. This is web installation (Add to Home Screen/Install App), not App Store/Play Store publishing. The visitor guide PWA manifest is pre-staged for eventual public launch but not activated. The collaboration and PDF launch flags remain unchanged.

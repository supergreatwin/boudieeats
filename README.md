# boudieeats.

An Egyptian food journal with recipes, restaurant and café photos, and supermarket taste tests.

[Open BoudieEats](https://boudieeats.pages.dev/)

The Cloudflare Pages build runs `node tools/build-pages.mjs` with `SITE_URL` set to the production origin and publishes `boudieeats/dist`. The build uses Node.js 24 and applies the reviewed editorial files and pinned Astro dependencies after extracting the archive. GitHub Pages uses the same build with its repository base path.


# BoudieEats — independent accounts

BoudieEats has a bilingual private account interface at `/account/` and `/ar/account/`. The editorial workspace lives at `/editorial-desk/` and `/ar/editorial-desk/`.

## Status

The UI and isolated schema are in the repository. **Registration and login are disabled until a dedicated BoudieEats Supabase project, SQL schema, email confirmation, SMTP, and browser tests are configured.** This is intentional: do not provide an insecure or misleading sign-up button.

BoudieEats accounts are independent of GitHub and of the **Without Permission** publication. Do not deploy the schema to the latter's project.

## Activate in a dedicated Supabase project

1. Obtain explicit confirmation of which Supabase organization the BoudieEats project should use. Check any nonzero project cost and obtain the user's approval before purchase.
2. Create an independent project, e.g. `BoudieEats`. Use only its own project URL and **publishable** client key. Never copy a service-role or secret key into the repository or browser.
3. In the **BoudieEats** project SQL Editor apply [`supabase/schema.sql`](./supabase/schema.sql). Verify that `be_profiles`, `be_applications`, `be_pitches`, and `be_drafts` exist and all have RLS enabled. Run Supabase security advisors. The schema is a setup file, **not** a managed CLI migration.
4. Auth settings: enable Email provider and **Confirm email**, minimum password length at least 12, rate limits, and CAPTCHA if appropriate. Configure a verified SMTP provider; do **not** open public registration until confirmation and password-reset messages arrive successfully.
5. Set the Supabase Auth Site URL to the chosen production site. Add **both** language return URLs to the redirect allowlist:
   - `https://boudieeats.pages.dev/account/`
   - `https://boudieeats.pages.dev/ar/account/`
   - `https://supergreatwin.github.io/boudieeats/account/`
   - `https://supergreatwin.github.io/boudieeats/ar/account/`
6. Add the following public (not secret) build-time environment variables to Cloudflare Pages and GitHub Actions repository variables:
   - `BE_SUPABASE_URL=https://PROJECT_REF.supabase.co`
   - `BE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
   No other project key is valid. The static build rejects incomplete/mismatched settings.
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

Draft approval in the private database **does not automatically publish a public article**. A separate renderer/deployment integration is still needed before calling this a publishing CMS. Reader submissions remain private under RLS.

## Build checks

The standard static build creates both language routes, a language selector, and account menu links. CI runs `node tools/verify-accounts.mjs` plus the existing bilingual and English validation.

Documentation: [Supabase password auth](https://supabase.com/docs/guides/auth/passwords), [email and SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

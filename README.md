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

Draft approval in the private database **does not automatically publish a public article**. A separate renderer/deployment integration is still needed before calling this a publishing CMS. Reader submissions remain private under RLS.

## Build checks

The standard static build creates both language routes, a language selector, and account menu links. CI runs `node tools/verify-accounts.mjs` plus the existing bilingual and English validation.

Documentation: [Supabase password auth](https://supabase.com/docs/guides/auth/passwords), [email and SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

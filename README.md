# Boudie Eats / بودي إيتس

An independent bilingual Egyptian food journal and discovery platform.

- Public website: https://boudieeats.com/
- Source: https://github.com/supergreatwin/boudieeats
- Hosting: Cloudflare Pages (canonical), GitHub Pages mirror.
- Backend: dedicated BoudieEats Supabase project.
- Core publication: original recipes, reviews, food stories and reader contributions.
- Design: original Boudie Eats artwork and typography, no generated food photography.

## Seven independent experiences

1. Boudie’s Mama Picks / اختيارات ماما عند بودي
2. Boudie’s Dish Finder / دور على أكلة
3. Boudie’s City Guide / دليل بودي للمدن
4. Boudie Gallery / ألبوم بودي
5. Boudie Spotlight / بودي سبوتلايت
6. Boudie Passport / جواز سفر بودي
7. Boudie Food Personality Lab / معمل شخصية الأكل من بودي

Bilingual prototype routes are /discover/ and /ar/discover/, with a dedicated subroute for each experience. The prototype has functioning client-side dish filters, an interactive food-preference quiz and a session-only demonstration passport. Demonstrations do not persist personal data. No unverified restaurant records or third-party photos are published.

Build: node tools/build-pages.mjs (Node 24; see workflow for SITE_URL and SITE_BASE_PATH). The build uses the archived Astro source plus reviewed editorial content and adds independent pages after compiling the bilingual editions.

Verification: node tools/verify-boudie-experiences.mjs, node tools/verify-accounts.mjs, node tools/verify-bilingual.mjs, node tools/verify-publishing.mjs.

## Current release state — November 21, 2026

**STAGING ONLY. DO NOT ENABLE PUBLIC ACCESS TO THE NEW SEVEN FEATURES YET.**

- Existing public editorial content remains on Boudie Eats.
- Private accounts, contributions and the Editorial Desk remain controlled by Supabase Auth and RLS.
- The old catalogue has **zero independently verified place records**. Do not import data without rights.
- The experience prototype is noindexed and is not linked from visitor navigation.
- Newsletter forms exist, but subscriber delivery, consent language and automation need testing.
- Existing account email confirmation, password reset, mobile flows and privilege boundaries require real end-to-end tests.
- Before launch, migrate internal legacy feature-table names and approval policies into an independent Boudie Eats model. Never bypass RLS or reuse any obsolete external approval flag as an authorization decision.

## Conditional end-of-week launch checklist (target November 26–27, 2026)

1. Complete original bilingual copy and rights-cleared real photography. Never fabricate venues.
2. Seed independently verified city, dish and restaurant records with source and image-rights fields; test filters against actual rows.
3. Connect all seven experiences to the CMS: drafts, reviews, publication, unpublish, submissions and moderation.
4. Persist quiz preferences, saves/passports and community voting only for logged-in, consented users with RLS and anti-abuse protection. A food personality quiz is recreational, not scientific.
5. Test account signup, email confirmation, password reset, rate limiting, anti-enumeration responses, newsletter consent and delivery.
6. Review Supabase security advisors; restrict privileged RPC exposure, fix password-protection warning, and validate that anonymous users cannot see drafts or personal data.
7. Run bilingual keyboard/mobile/browser/accessibility checks, image performance, broken-link tests, canonical/hreflang/robots/sitemap tests and analytics consent review.
8. Deploy only after signoff, confirm that the custom-domain output matches the tested commit, and then selectively make approved routes indexable.

**Release rule:** missing legal permissions, private-data protection, authentication verification or real content means postponing public access instead of shipping unsafe or misleading features.

# BoudieEats Editorial Desk

Production: https://boudieeats.pages.dev/
English desk: https://boudieeats.pages.dev/editorial-desk/
Arabic desk: https://boudieeats.pages.dev/ar/editorial-desk/
Accounts: https://boudieeats.pages.dev/account/

## Account status

The project **vktegxiycqwqnnqpxiuh** has been created on Supabase, and the protected account schema has been applied successfully. The bilingual website now uses its independent public browser connection. **Signup and recovery email deliverability, Auth redirect configuration and real-user login still require end-to-end acceptance tests.** Do not claim those email flows have passed before verifying them.

Do not use or modify the Without Permission database. For the remaining Auth configuration and admin bootstrap, see the README.

## Reader-to-editor workflow

1. A reader registers with an email, password and requested username, confirms email, then uses the on-site account area. The username is claimed after verification if available.
2. Readers can save their profile, submit private food ideas, and apply to become contributors.
3. A verified administrator can approve contributor applications, after which a contributor can create private recipe, review or food-story drafts in Arabic or English.
4. The contributor submits the draft for review; an editor requests changes or approves it.
5. A verified editor uses **Publish article** on an approved draft. This copies the article into `public.be_publications`, which is readable publicly under separate RLS policies without exposing private drafts.
6. The article appears in the matching live English/Arabic recipe, review, or story list and opens in `/published/read/?kind=...&slug=...` (or `/ar/published/read/`). The editor can use **Unpublish** to withdraw it immediately. Approval alone is deliberately private.
7. New articles use browser-side public rendering. For best SEO (server-rendered individual articles and sitemap entries), a future build-time publishing integration is still recommended. Existing reviewed Markdown articles continue through GitHub PRs.

## Existing editorial source workflow

- Reviewed site content lives under `editorial/reviews/`, `editorial/stories/`, and `editorial/newsletter/`.
- Updates to those files are built from GitHub PRs. New article paths require content-collection integration in `tools/build-pages.mjs`.
- Public response forms: English https://tally.so/r/kbG7Lo · Arabic https://tally.so/r/aO4rxy.
- Newsletter prelaunch waitlist: English https://tally.so/r/vXDORl · Arabic https://tally.so/r/7XK9Dz.
- Neither waitlist is an active email-sending subscription. Keep subscriber lists private and separated by publication.

## Security

All BoudieEats profiles, pitches, applications and drafts are protected by Supabase RLS. Roles are assigned in the dedicated backend, never by browser metadata. Only a publishable key may be sent to the browser; keep all secret keys on the server. Verify email and password reset end to end before opening registration.

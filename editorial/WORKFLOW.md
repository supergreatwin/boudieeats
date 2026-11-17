# BoudieEats Editorial Desk

Production: https://boudieeats.pages.dev/
English desk: https://boudieeats.pages.dev/editorial-desk/
Arabic desk: https://boudieeats.pages.dev/ar/editorial-desk/
Accounts: https://boudieeats.pages.dev/account/

## Account status

Account pages and the permissions-first editorial interface are generated in both languages. **The dedicated BoudieEats Supabase backend has not yet been created or configured.** Until then, sign-up is intentionally disabled and the desk clearly indicates that it is awaiting setup. Do not claim it is a functioning user login.

Create a dedicated BoudieEats project and apply `supabase/schema.sql`. Never put BoudieEats readers into the Without Permission database. For full activation steps, see the repository README.

## Reader-to-editor workflow

1. A reader registers with an email, password and requested username, confirms email, then uses the on-site account area. The username is claimed after verification if available.
2. Readers can save their profile, submit private food ideas, and apply to become contributors.
3. A verified administrator can approve contributor applications, after which a contributor can create private recipe, review or food-story drafts in Arabic or English.
4. The contributor submits the draft for review; an editor requests changes or approves it.
5. **Approving a draft is not public publishing.** A separate deployment integration is needed before editorial approval can put content onto the static site. Until then the existing GitHub PR workflow remains the manual way to publish editorial content.

## Existing editorial source workflow

- Reviewed site content lives under `editorial/reviews/`, `editorial/stories/`, and `editorial/newsletter/`.
- Updates to those files are built from GitHub PRs. New article paths require content-collection integration in `tools/build-pages.mjs`.
- Public response forms: English https://tally.so/r/kbG7Lo · Arabic https://tally.so/r/aO4rxy.
- Newsletter prelaunch waitlist: English https://tally.so/r/vXDORl · Arabic https://tally.so/r/7XK9Dz.
- Neither waitlist is an active email-sending subscription. Keep subscriber lists private and separated by publication.

## Security

All BoudieEats profiles, pitches, applications and drafts are protected by Supabase RLS. Roles are assigned in the dedicated backend, never by browser metadata. Only a publishable key may be sent to the browser; keep all secret keys on the server. Verify email and password reset end to end before opening registration.

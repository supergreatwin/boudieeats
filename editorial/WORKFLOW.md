# BoudieEats Editorial Desk

Production: https://boudieeats.pages.dev/
Editorial gateway: https://boudieeats.pages.dev/editorial-desk/

## Workflow
1. **Pitch / backlog:** Create a GitHub Issue from a recipe, review, or editorial task template.
2. **Draft:** Write in the relevant \`editorial/reviews/\`, \`editorial/stories/\`, or newsletter draft directory. Additional content paths need wiring into \`tools/build-pages.mjs\` and Astro collections before they appear publicly.
3. **Review:** Open a Pull Request. Check sourcing, Arabic voice, factual accuracy, copyright, sensitive personal data, and mobile layout.
4. **Approve / publish:** After approval, merge to \`main\`. The existing GitHub Actions workflow builds the site; Cloudflare Pages deploys only if its Git integration/build is still enabled.
5. **Measure:** Use the existing Google Analytics property on the production origin. Do not publish private reader submissions.

## Reader contributions
- Public response form: https://tally.so/r/kbG7Lo
- Newsletter interest list: https://tally.so/r/vXDORl
- Review submissions inside the authenticated Tally dashboard; do not copy reader email addresses into public GitHub issues.
- A quote may be used only after the contributor's publishing permission and editorial review; avoid publishing contact details.
- These forms are separate from Without Permission.

## Newsletter
The interest list is **not** an active Beehiiv subscription.
The connected Beehiiv account currently only has a Without Permission publication. Create a distinct BoudieEats publication in Beehiiv before any activation or migration, configure opt-in/unsubscribe and sender details, and connect its approved signup form on this site. Never add waitlist contacts to another brand's mailing list.

## Backend and permissions
This is a GitHub-based editorial workflow, not a full authenticated headless CMS.
The connected Supabase project is named Without Permission; do not share its auth, service role, or editorial tables with BoudieEats. If a dedicated BoudieEats project is created later, protect all editorial/response tables with RLS and keep service keys off the frontend.

## Cloudflare
The source archive remains the original site content; \`tools/engagement-pages.mjs\` adds the reader, newsletter, and editorial gateway pages **after** Astro builds.
Cloudflare Pages should build with:
- Build command: \`node tools/build-pages.mjs\`
- Output: \`boudieeats/dist\`
- \`SITE_URL=https://boudieeats.pages.dev\`
- Production branch: \`main\`

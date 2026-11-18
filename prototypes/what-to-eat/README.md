# Boudie Eats × What To Eat — standalone prototype

This is an **isolated, non-production** UI prototype stored on branch `prototype/what-to-eat-community`.

## Open the prototype

1. On GitHub, switch to branch `prototype/what-to-eat-community`.
2. Open `prototypes/what-to-eat/index.html` and download the raw file.
3. Open the HTML file directly in Safari, Chrome, or Firefox.

The file has embedded HTML, CSS, and JavaScript; Google Fonts is the only optional external dependency. There is **no build step, backend integration, API key, analytics tracking, or deployment requirement**.

## Experience

- Bilingual Arabic/English, responsive design based on Boudie Eats' current editorial branding.
- A proposed What To Eat entry directly on the Boudie Eats-style homepage.
- Demo access code: `BOUDIE` (client-side presentation only).
- Community overview and six interactive sections:
  - Mama Approved (criteria concepts and empty states).
  - Besor3a Map (sample dish search, city filter, **schematic map only**).
  - What To Eat From (location-first sample filtering).
  - Food Guide (preview of contents; no real PDF).
  - Community badge (downloadable **preview-only** SVG).
  - Monthly Spotlight (local nomination form, **no submission stored**).

## Data and design limitations

The four restaurant examples are editorial references / demo records, **not imported Facebook posts, community votes, rankings, validated coordinates, or current restaurant recommendations**. All example results are explicitly marked.

The cover recipe image is an illustration stand-in rather than reproducing the existing website's original photo. The layout and color system echo the website design, but this is not a byte-for-byte copy of the production build.

Facebook group membership verification is **not implemented**; the demo gate is not authentication and does not protect actual data. No Supabase connection is made. No personal data is sent anywhere by the nomination form.

The concept is independent and unofficial; What To Eat co-branding and official membership labels should require prior administrator approval before a production launch.

## Safety / isolation

- All prototype code is contained inside `prototypes/what-to-eat/` on a non-main branch.
- No production files or the current Astro build are changed.
- **Do not merge the branch into main** or deploy the experience until explicitly approved.
- Existing Cloudflare, GitHub Pages, accounts, Supabase, editorial CMS, and newsletter configuration are untouched.

## Scope of later production work

Real Supabase authorization and invite handling, RLS, user consent, attributed community submissions, verified geocoding, actual search indices, PDF guide generation, moderation and branding permissions would be needed for a launch.

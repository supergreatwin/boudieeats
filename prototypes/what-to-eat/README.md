# Boudie Eats × What To Eat — Interactive Prototype

**Status:** isolated non-production prototype. **Branch:** `prototype/what-to-eat-community`. No files in `main` were changed.

## Preview

Open: https://raw.githack.com/supergreatwin/boudieeats/prototype/what-to-eat-community/prototypes/what-to-eat/index.html

Or download `index.html`, `enhancements.js` and the `assets/` directory together, then open `index.html` in a modern browser.

**Demo access code:** `BOUDIE` (display-only gate, not a real security mechanism).

## Boudie Eats' ORIGINAL photography

The original repository retains source content in `boudieeats-source.tar.gz`. A one-time GitHub Action extracted and converted **24 real, original site photos** into `assets/photo-01.jpg` through `photo-24.jpg`. The manifest records each source path and selected hero. The original photo of the vermicelli dessert now appears in the home-page cover, replacing the mock illustration.

Images have been inserted into the Boudie Eats-style homepage, original photography gallery, gate, community dashboard, guide cover and spotlight preview. No generated stock or AI photography is used.

Extractor: `extract-original-photos.py`. Workflow: `.github/workflows/what-to-eat-photos.yml`. Only the prototype branch receives derived assets.

## Working prototype interactions

- Arabic/English navigation and branded homepage entry.
- Demo access with `BOUDIE`.
- Six community navigation sections.
- **Besor3a**: searchable demo restaurant index by dish and area, an actual interactive Leaflet/OpenStreetMap map, an optional geolocation button, and Google Maps search links for external discovery.
- **What To Eat From**: location-first filters over the same demo records.
- **Contributions**: submit restaurant/dish/area to a **local-only** index using browser localStorage; filter results immediately and clear additions.
- **Food Guide**: open a printable preview and use the browser's Print / Save as PDF functionality.
- **Badges**: downloadable, clearly marked concept-only SVG.
- **Spotlight**: local-only nomination form with confirmation (no submission sent/stored).
- **Mama Approved**: transparent concepts, criteria and empty states. No invented approvals.

## Not yet implemented

This is a functional **front-end prototype**, not a production community platform. Facebook group membership **cannot be verified** by the mock password gate. There is no actual Supabase authorization, admin approval, private group import, real group sourced ranking, verified restaurant pin coordinates, user account persistence, moderation workflow or backend-submitted spotlight nominations.

The map shows real tiles and optional user location, but **does not make up restaurant pins**. The Google Maps buttons open external restaurant search results, **not** community rankings. Sample entries are editorial references, not verified members' recommendations.

Publishing a co-branded official What To Eat service requires permission from group administrators, data permissions, content moderation, and proper access control.

## Privacy and production isolation

No credentials, API keys, or Supabase connection are used. Location is requested only on explicit user action and is not stored. Local recommendations remain in the same browser until cleared. Form demo submissions are not sent to servers.

**Do not merge this branch into `main` or deploy to the live site without explicit approval.**

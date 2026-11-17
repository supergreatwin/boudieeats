# boudieeats.

An Egyptian food journal with recipes, restaurant and café photos, and supermarket taste tests.

[Open BoudieEats](https://boudieeats.pages.dev/)

The Cloudflare Pages build runs `node tools/build-pages.mjs` with `SITE_URL` set to the production origin and publishes `boudieeats/dist`. The build uses Node.js 24 and applies the reviewed editorial files and pinned Astro dependencies after extracting the archive. GitHub Pages uses the same build with its repository base path.

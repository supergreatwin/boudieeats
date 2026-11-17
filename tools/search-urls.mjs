import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function alignSearchUrls({ directory, deployed, canonical, indexable, excludeUnmatched = false }) {
  if (!indexable) return;
  const absolute = url => url.replaceAll(deployed.href, canonical.href);
  for (const entry of readdirSync(directory, { recursive: true })) {
    if (!entry.endsWith('.html')) continue;
    const path = join(directory, entry);
    const html = readFileSync(path, 'utf8');
    const end = html.indexOf('</head>');
    if (end === -1) continue;
    let head = html.slice(0, end).replace(/<link rel="canonical"[^>]*>|<meta property="og:(?:url|image)"[^>]*>|<script type="application\/ld\+json">[^<]*<\/script>/g, absolute);
    if (excludeUnmatched) {
      head = head.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow">');
    }
    if (entry === 'index.html') {
      const journal = { '@context': 'https://schema.org', '@type': 'WebSite',
        name: 'boudieeats.', url: canonical.href, inLanguage: 'ar-EG' };
      head += `<script type="application/ld+json">${JSON.stringify(journal)}</script>`;
    }
    writeFileSync(path, head + html.slice(end));
  }
  for (const name of ['robots.txt', 'sitemap.xml']) {
    const file = join(directory, name);
    writeFileSync(file, absolute(readFileSync(file, 'utf8')));
  }
}

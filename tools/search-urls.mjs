import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function alignSearchUrls({ directory, deployed, canonical, indexable, analyticsId }) {
  if (!indexable) return;
  const useAnalytics = deployed.href === canonical.href && /^G-[A-Z0-9]{10}$/.test(analyticsId);
  if (useAnalytics) {
    for (const file of ['analytics.css', 'analytics.js']) {
      copyFileSync(new URL(file, import.meta.url), join(directory, file));
    }
  }
  const absolute = url => url.replaceAll(deployed.href, canonical.href);
  for (const entry of readdirSync(directory, { recursive: true })) {
    if (!entry.endsWith('.html')) continue;
    const path = join(directory, entry);
    const html = readFileSync(path, 'utf8');
    const end = html.indexOf('</head>');
    if (end === -1) continue;
    let head = html.slice(0, end).replace(/<link rel="canonical"[^>]*>|<meta property="og:(?:url|image)"[^>]*>|<script type="application\/ld\+json">[^<]*<\/script>/g, absolute);
    if (useAnalytics && !/<meta name="robots"[^>]*noindex/.test(head)) {
      head += `<link rel="stylesheet" href="/analytics.css"><script defer src="/analytics.js" data-measurement-id="${analyticsId}"></script>`;
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

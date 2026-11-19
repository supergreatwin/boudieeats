import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function alignSearchUrls({ directory, deployed, canonical, indexable, analyticsId, language = 'en-US' }) {
  if (!indexable) return;
  const useAnalytics = (deployed.href === canonical.href || (canonical.hostname === 'boudieeats.com' && deployed.hostname === 'boudieeats.pages.dev')) && /^G-[A-Z0-9]{10}$/.test(analyticsId);
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
      // Site identity and editorial focus are explicit in both language editions.
      const arabic = language.toLowerCase().startsWith('ar');
      const title = arabic
        ? 'بودي إيتس | وصفات أكل ومراجعات مطاعم وكافيهات'
        : 'Boudie Eats | Egyptian Recipes & Restaurant Reviews';
      const description = arabic
        ? 'بودي إيتس مجلة أكل مصرية بتقدم وصفات منزلية ومراجعات مطاعم وكافيهات وتجارب أكل وحكايات من مصر.'
        : 'Boudie Eats is an Egyptian food journal featuring homemade recipes, restaurant and café reviews, and stories about food in Egypt.';
      const escaped = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
      const setMeta = (attribute, key, content) => {
        const expression = new RegExp('<meta[^>]*' + attribute + '="' + key + '"[^>]*>', 'i');
        const value = `<meta ${attribute}="${key}" content="${escaped(content)}">`;
        head = expression.test(head) ? head.replace(expression, value) : head + value;
      };
      const titlePattern = new RegExp('<title[^>]*>.*?</title>', 'is');
      const titleTag = `<title>${escaped(title)}</title>`;
      head = titlePattern.test(head) ? head.replace(titlePattern, titleTag) : head + titleTag;
      setMeta('name', 'description', description);
      setMeta('property', 'og:title', title);
      setMeta('property', 'og:description', description);
      setMeta('property', 'og:site_name', 'Boudie Eats');
      const journal = { '@context': 'https://schema.org', '@type': 'WebSite',
        name: 'Boudie Eats', alternateName: 'بودي إيتس',
        url: canonical.href, inLanguage: language };
      head += `<script type="application/ld+json">${JSON.stringify(journal)}</script>`;
    }
    writeFileSync(path, head + html.slice(end));
  }
  for (const name of ['robots.txt', 'sitemap.xml']) {
    const file = join(directory, name);
    writeFileSync(file, absolute(readFileSync(file, 'utf8')));
  }
}

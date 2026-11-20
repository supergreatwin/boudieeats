import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, rmSync, mkdtempSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { alignSearchUrls } from './search-urls.mjs';
import { addEngagementPages } from './engagement-pages.mjs';
import { localizeSource } from './localize-source.mjs';
import { restoreArabicVisitorPages, finishLanguageLinks } from './bilingual-pages.mjs';
import { addAccountPages } from './account-pages.mjs';
import { bePublicConfig } from './be-public-config.mjs';
import { polishVisitorPages } from './site-polish.mjs';
import { addPublishedPages } from './published-pages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const project = join(root, 'boudieeats');
const site = new URL(process.env.SITE_URL);
if (site.protocol !== 'https:' || site.href !== `${site.origin}/`) {
  throw new Error('SITE_URL must be the HTTPS production origin');
}

execFileSync('tar', ['-xzf', 'boudieeats-source.tar.gz'], { cwd: root, stdio: 'inherit' });
for (const manifest of ['package.json', 'package-lock.json']) {
  copyFileSync(join(root, 'tools', 'astro', manifest), join(project, manifest));
}
const content = join(project, 'src', 'content');
const coffee = join(content, 'reviews', 'cafe-hot-coffee.md');
const oldTitle = 'title: "فنجان قهوة في الكافيه"';
const current = readFileSync(coffee, 'utf8');
if (!current.includes(oldTitle)) throw new Error('The archived café review title has changed');
writeFileSync(coffee, current.replace(oldTitle, 'title: "فلات وايت La Mie"'));

for (const path of ['reviews/takeaway-bowls.md', 'reviews/cafe-iced-coffee.md', 'stories/cilantro-betna-el-tany.md']) {
  copyFileSync(join(root, 'editorial', path), join(content, path));
}

// Localize the compiled source before Astro generates any pages.
localizeSource(project);

const env = {
  ...process.env,
  SITE_URL: site.origin,
  SITE_BASE_PATH: process.env.SITE_BASE_PATH || '/',
  ASTRO_TELEMETRY_DISABLED: '1',
  PUBLIC_INDEXABLE: String(!process.env.CF_PAGES || process.env.CF_PAGES_BRANCH === 'main'),
};
execFileSync('npm', ['ci'], { cwd: project, env, stdio: 'inherit' });
execFileSync('npm', ['run', 'build'], { cwd: project, env, stdio: 'inherit' });

alignSearchUrls({
  directory: join(project, 'dist'),
  deployed: new URL((env.SITE_BASE_PATH.replace(/\/?$/, '/')), site),
  canonical: new URL('https://boudieeats.com/'),
  indexable: env.PUBLIC_INDEXABLE === 'true',
  analyticsId: 'G-F35G5DT9NH',
  language: 'en-US',
});

// Add editorial workspace gateway and embedded reader forms to the built site.
// This runs after canonical/analytics rewrites, preserving existing Astro output.
addEngagementPages({ directory: join(project, 'dist'), basePath: env.SITE_BASE_PATH });


const dist = join(project, 'dist');
const englishBackup = join(mkdtempSync(join(tmpdir(), 'boudie-en-')), 'site');
cpSync(dist, englishBackup, { recursive: true });

// Restore the original Arabic source from the retained archive, including the
// originally authored Arabic recipe and review content. English is a separate
// rendition, never a destructive replacement.
execFileSync('tar', ['-xzf', 'boudieeats-source.tar.gz'], { cwd: root, stdio: 'inherit' });
for (const path of ['reviews/takeaway-bowls.md', 'reviews/cafe-iced-coffee.md', 'stories/cilantro-betna-el-tany.md']) {
  copyFileSync(join(root, 'editorial', path), join(content, path));
}
copyFileSync(join(root, 'tools', 'arabic-newsletter.astro'), join(project, 'src', 'components', 'Newsletter.astro'));

const originalBase = env.SITE_BASE_PATH.replace(/\/?$/, '/');
const arabicBase = originalBase + 'ar/';
const arabicEnv = { ...env, SITE_BASE_PATH: arabicBase };
execFileSync('npm', ['run', 'build'], { cwd: project, env: arabicEnv, stdio: 'inherit' });
alignSearchUrls({
  directory: dist,
  deployed: new URL(arabicBase.replace(/^\//, ''), site),
  canonical: new URL('https://boudieeats.com/ar/'),
  indexable: arabicEnv.PUBLIC_INDEXABLE === 'true',
  analyticsId: 'G-F35G5DT9NH',
  language: 'ar-EG',
});
addEngagementPages({ directory: dist, basePath: arabicBase });
restoreArabicVisitorPages({ directory: dist, basePath: arabicBase });

const arabicBackup = join(mkdtempSync(join(tmpdir(), 'boudie-ar-')), 'site');
cpSync(dist, arabicBackup, { recursive: true });
rmSync(dist, { recursive: true, force: true });
cpSync(englishBackup, dist, { recursive: true });
cpSync(arabicBackup, join(dist, 'ar'), { recursive: true });

// Every page links to the equivalent URL in the other language; sitemap
// and hreflang include the two independent canonical editions.
addAccountPages({
  directory: dist,
  basePath: originalBase,
  supabaseUrl: process.env.BE_SUPABASE_URL || bePublicConfig.url,
  supabasePublishableKey: process.env.BE_SUPABASE_PUBLISHABLE_KEY || bePublicConfig.publishableKey,
});
addPublishedPages({
  directory: dist,
  basePath: originalBase,
  supabaseUrl: process.env.BE_SUPABASE_URL || bePublicConfig.url,
  supabasePublishableKey: process.env.BE_SUPABASE_PUBLISHABLE_KEY || bePublicConfig.publishableKey,
});
finishLanguageLinks({ directory: dist, basePath: originalBase });
// Apply responsive brand-safe corrections to both complete language editions.
polishVisitorPages({ directory: dist, basePath: originalBase });

// Cloudflare Pages: keep XML discovery available but out of normal search
// results, and keep the pages.dev mirror from competing with our own domain.
// Host-specific rules do not apply to https://boudieeats.com/.
const headersPath = join(dist, '_headers');
let headerRules = existsSync(headersPath) ? readFileSync(headersPath, 'utf8').trimEnd() + '\n\n' : '';
if (!headerRules.includes('/sitemap.xml\n')) {
  headerRules += '/sitemap.xml\n  X-Robots-Tag: noindex\n\n';
}
if (!headerRules.includes('https://boudieeats.pages.dev/*')) {
  headerRules += 'https://boudieeats.pages.dev/*\n  X-Robots-Tag: noindex\n';
}
writeFileSync(headersPath, headerRules);

// Retire the old GitHub Pages mirror without changing Cloudflare production.
// Every generated HTML route points to its matching branded-domain URL.
if (site.hostname.endsWith('.github.io')) {
  const walk = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { walk(path); continue; }
      if (!entry.isFile() || !entry.name.endsWith('.html') || entry.name.startsWith('google')) continue;
      const route = path.slice(dist.length).replaceAll('\\', '/').replace(/^\//, '')
        .replace(/index\.html$/, '').replace(/\.html$/, '');
      const target = new URL(route, 'https://boudieeats.com/').href;
      const html = readFileSync(path, 'utf8');
      if (!/<head[^>]*>/i.test(html)) continue;
      const redirect = '<meta name="robots" content="noindex,follow">' +
        '<script>location.replace(' + JSON.stringify(target) + '+location.search+location.hash)</script>';
      writeFileSync(path, html.replace(/<head([^>]*)>/i, '<head$1>' + redirect));
    }
  };
  walk(dist);
}

// Publish Google Search Console verification at the Cloudflare site root.
const verificationFile = 'google7cba358329a08d09.html';
copyFileSync(join(root, verificationFile), join(project, 'dist', verificationFile));

for (const [path, expected] of [
  ['reviews/takeaway-bowls', 'Egyptian Breakfast'],
  ['reviews/cafe-iced-coffee', 'Four Years'],
  ['stories/cilantro-betna-el-tany', 'Our Second Home'],
]) {
  const file = join(project, 'dist', path, 'index.html');
  if (!existsSync(file) || !readFileSync(file, 'utf8').includes(expected)) {
    throw new Error(`Missing the reviewed content at /${path}/`);
  }
}

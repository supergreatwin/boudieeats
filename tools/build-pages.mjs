import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { alignSearchUrls } from './search-urls.mjs';

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
  canonical: new URL('https://boudieeats.pages.dev/'),
  indexable: env.PUBLIC_INDEXABLE === 'true',
  analyticsId: 'G-F35G5DT9NH',
});

// Publish Google Search Console verification at the Cloudflare site root.
const verificationFile = 'google7cba358329a08d09.html';
copyFileSync(join(root, verificationFile), join(project, 'dist', verificationFile));

for (const [path, expected] of [
  ['reviews/takeaway-bowls', 'الفطار المصري'],
  ['reviews/cafe-iced-coffee', 'أربع سنين'],
  ['stories/cilantro-betna-el-tany', 'بيتنا التاني'],
]) {
  const file = join(project, 'dist', path, 'index.html');
  if (!existsSync(file) || !readFileSync(file, 'utf8').includes(expected)) {
    throw new Error(`Missing the reviewed content at /${path}/`);
  }
}

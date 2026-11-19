import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../boudieeats/dist/', import.meta.url).pathname;
const errors = [];
for (const lang of ['', 'ar/']) {
  for (const kind of ['recipe', 'review', 'story']) {
    const plural = kind === 'story' ? 'stories' : kind + 's';
    const file = join(dist, lang, plural, 'index.html');
    if (!existsSync(file)) { errors.push('Missing listing ' + lang + plural); continue; }
    const html = readFileSync(file, 'utf8');
    if (!html.includes('data-be-publications="' + kind + '"'))
      errors.push('Missing public article cards on ' + lang + plural);
    if (!html.includes('be-publications.js')) errors.push('Missing public article client on ' + lang + plural);
  }
  const reader = join(dist, lang, 'published', 'read', 'index.html');
  if (!existsSync(reader)) { errors.push('Missing article reader ' + lang); continue; }
  const html = readFileSync(reader, 'utf8');
  for (const fragment of ['data-be-article', 'be-publications.js', 'class="be-language"', 'hreflang="en"', 'hreflang="ar-EG"']) {
    if (!html.includes(fragment)) errors.push('Reader ' + lang + ' missing ' + fragment);
  }
}
const scriptPath = join(dist, 'be-publications.js');
if (!existsSync(scriptPath)) errors.push('Public article JS missing');
else {
  const src = readFileSync(scriptPath, 'utf8');
  for (const snippet of ['be_publications', 'data-be-publications', 'data-be-article', 'textContent']) {
    if (!src.includes(snippet)) errors.push('Public article script missing ' + snippet);
  }
  if (/sb_secret_|service_role/.test(src)) errors.push('Secret key reference in public renderer');
}
const privateClient = readFileSync(join(dist, 'be-account.js'), 'utf8');
for (const name of ['be_publish_draft', 'be_unpublish_draft', 'publish-draft', 'unpublish-draft']) {
  if (!privateClient.includes(name)) errors.push('Editorial desk missing ' + name);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('PASS: bilingual published article lists and readers; editorial publish/unpublish actions present.');

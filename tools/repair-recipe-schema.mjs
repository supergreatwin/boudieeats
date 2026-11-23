import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// Editorially confirmed metadata. Do not infer durations, nutrients, reviews or media.
const confirmed = {
  'shaareya-bel-laban': {
    ar: { recipeCuisine: 'مصري', keywords: 'شعرية, لبن, قشطة, طواجن' },
    en: { recipeCuisine: 'Egyptian', keywords: 'vermicelli, milk pudding, baladi ghee, cream' },
  },
};

const schemaTag = /<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;
const stripText = s => s.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const isRecipe = node => node && typeof node === 'object' && !Array.isArray(node) &&
  (node['@type'] === 'Recipe' || (Array.isArray(node['@type']) && node['@type'].includes('Recipe')));
function recipeNodes(root) {
  if (Array.isArray(root)) return root.flatMap(recipeNodes);
  if (!root || typeof root !== 'object') return [];
  return [...(isRecipe(root) ? [root] : []), ...(Array.isArray(root['@graph']) ? root['@graph'].flatMap(recipeNodes) : [])];
}
function addStepAnchor(html, stepName, id) {
  let matchedId = '';
  const updated = html.replace(/<h([2-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attributes, inner) => {
    if (matchedId || stripText(inner).replace(/^[\d٠-٩]+[.)\-:]\s*/, '') !== stripText(stepName)) return full;
    const existing = attributes.match(/\bid\s*=\s*["']([^"']+)["']/i);
    matchedId = existing ? existing[1] : id;
    return existing ? full : `<h${level}${attributes} id="${id}">${inner}</h${level}>`;
  });
  return { html: updated, id: matchedId };
}
function* htmlFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield path;
  }
}
export function repairRecipeStructuredData({ directory }) {
  let found = 0, updated = 0, anchors = 0;
  for (const path of htmlFiles(directory)) {
    let html = readFileSync(path, 'utf8');
    if (!/application\/ld\+json/i.test(html) || !/"@type"\s*:\s*"Recipe"/.test(html)) continue;
    const route = relative(directory, path).replaceAll('\\', '/');
    const slug = route.match(/(?:^|\/)recipes\/([^/]+)\/index\.html$/)?.[1];
    const language = route.startsWith('ar/') ? 'ar' : 'en';
    const data = slug ? confirmed[slug]?.[language] : null;
    const scripts = [...html.matchAll(schemaTag)];
    for (const [, raw] of scripts) {
      let parsed;
      try { parsed = JSON.parse(raw); } catch { continue; }
      for (const node of recipeNodes(parsed)) {
        found++;
        if (node.inLanguage !== (language === 'ar' ? 'ar-EG' : 'en-GB')) {
          node.inLanguage = language === 'ar' ? 'ar-EG' : 'en-GB';
        }
        if (data) {
          if (!node.recipeCuisine) node.recipeCuisine = data.recipeCuisine;
          if (!node.keywords) node.keywords = data.keywords;
        }
        // Each link is added only when an existing visible step heading matches.
        if (Array.isArray(node.recipeInstructions) && /^https:\/\/boudieeats\.com\//.test(node.url || '')) {
          node.recipeInstructions.forEach((step, idx) => {
            if (!step || step['@type'] !== 'HowToStep' || !step.name || step.url) return;
            const result = addStepAnchor(html, step.name, `recipe-step-${idx+1}`);
            if (!result.id) return;
            html = result.html;
            step.url = node.url.split('#')[0] + '#' + encodeURIComponent(result.id);
            anchors++;
          });
        }
        updated++;
      }
      if (recipeNodes(parsed).length) html = html.replace(raw, safeJson(parsed));
    }
    if (html !== readFileSync(path, 'utf8')) writeFileSync(path, html);
  }
  console.log(`Recipe SEO: ${found} Recipe nodes checked, ${updated} updated, ${anchors} real step anchors.`);
  if (!found) throw new Error('No recipe JSON-LD was detected in the generated bilingual site');
  return { found, updated, anchors };
}

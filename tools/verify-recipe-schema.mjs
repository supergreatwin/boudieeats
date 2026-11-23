import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const dist = new URL('../boudieeats/dist/', import.meta.url).pathname;
for (const [prefix, lang, cuisine] of [['','en-GB','Egyptian'],['ar/','ar-EG','مصري']]) {
  const path = join(dist, prefix, 'recipes/shaareya-bel-laban/index.html');
  assert(existsSync(path), 'Missing ' + path);
  const html = readFileSync(path, 'utf8');
  const tags = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes = tags.flatMap(([,raw]) => {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : (value['@graph'] || [value]);
  });
  const recipe = nodes.find(x => x['@type'] === 'Recipe');
  assert(recipe, 'Missing Recipe JSON-LD on ' + path);
  assert.equal(recipe.inLanguage, lang);
  assert.equal(recipe.recipeCuisine, cuisine);
  assert(recipe.keywords?.length, 'Missing verified keywords for ' + lang);
  assert.equal(recipe.recipeInstructions?.length, 5, 'Recipe lost its five authored instructions');
  for (const [i,step] of recipe.recipeInstructions.entries()) {
    assert.equal(step['@type'], 'HowToStep');
    const fragment = step.url?.split('#')[1];
    assert(fragment, 'Missing step URL ' + (i+1));
    assert(html.includes('id="' + decodeURIComponent(fragment) + '"'), 'Step URL does not point to a visible anchor');
  }
  assert(!recipe.aggregateRating, 'Do not invent ratings');
  assert(!recipe.nutrition, 'Do not invent nutritional analysis');
  assert(!recipe.prepTime && !recipe.cookTime, 'Do not invent cooking durations');
}
console.log('PASS: bilingual Recipe SEO metadata; 10 authentic step anchors; no fabricated nutrition, rating, or durations.');

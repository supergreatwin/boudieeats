import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = new URL('../boudieeats/', import.meta.url).pathname;
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
}
const recipeFiles = walk(join(root, 'src', 'content')).filter(f => /recipes?\//i.test(f) && /\.(md|mdx|json|ya?ml)$/.test(f));
console.log('RECIPE SOURCE FILES', recipeFiles.length);
for (const file of recipeFiles.slice(0, 12)) {
  const data = readFileSync(file, 'utf8');
  console.log('SOURCE', relative(root,file), data.slice(0, 1450));
}
let count = 0;
for (const file of walk(join(root, 'dist')).filter(f => f.endsWith('.html'))) {
  const html = readFileSync(file,'utf8');
  const tags = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [,raw] of tags) {
    try {
      const schema=JSON.parse(raw);
      const nodes = Array.isArray(schema) ? schema : [schema];
      for(const node of nodes.flatMap(n => Array.isArray(n['@graph']) ? n['@graph'] : [n])) {
        if (!String(node?.['@type'] || '').includes('Recipe')) continue;
        count++;
        if (count > 12) continue;
        console.log('RECIPE OUTPUT',relative(join(root,'dist'),file), JSON.stringify(node).slice(0,3300));
        console.log('HTML INSTRUCTION MARKERS', [...html.matchAll(/<(h[1-6]|ol|li|section)[^>]{0,220}>/gi)].slice(-24).map(m=>m[0]).join(' ').slice(0,1800));
      }
    }catch(err){console.log('BAD JSON-LD',relative(root,file),String(err));}
  }
}
console.log('RECIPE JSONLD COUNT',count);

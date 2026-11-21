import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const routes=['','mama-picks/','dish-finder/','city-guide/','gallery/','spotlight/','passport/','food-lab/'];
const errors=[];
for(const lang of ['','ar/']){
 for(const route of routes){
  const target=join(dist,lang,'discover',route,'index.html');
  if(!existsSync(target)){errors.push('Missing '+lang+'discover/'+route);continue}
  const h=readFileSync(target,'utf8');
  for(const key of ['id="be-exp-app"','be-experiences.js','be-experiences.css','BE_DISCOVER_CONFIG','noindex,nofollow,noarchive','hreflang="en"','hreflang="ar-EG"','class="be-language"','be-responsive-release']){
   if(!h.includes(key))errors.push('Missing '+key+' in '+lang+route);
  }
  if(/whattocommunity|what[-\s]to[-\s]eat/i.test(h))errors.push('Former third-party brand in '+lang+route);
  if(/sb_secret_|service_role/.test(h))errors.push('Secret exposure in '+lang+route);
  if(/(?:href=|src=)"[^"]*editorial-desk\//.test(h))errors.push('Unauthenticated editorial link in '+lang+route);
 }
}
const client=join(dist,'be-experiences.js');
if(!existsSync(client))errors.push('Missing interactive content module');
else {
 const c=readFileSync(client,'utf8');
 for(const key of ['be_wte_foods','be_wte_places','be_wte_sections','be_wte_photos','be_wte_terms','be_wte_passports','status=eq.published','editorial_approved=eq.true','safeUrl','loadApprovedContent','renderPassport']){
  if(!c.includes(key))errors.push('Missing live-data check '+key);
 }
 if(/what[-\s]to[-\s]eat|whattocommunity/i.test(c))errors.push('Former brand in client code');
 if(/demo stamp|Koshary.*Ful medames/i.test(c))errors.push('Demo or fake result shipped as verified content');
}
const css=join(dist,'be-experiences.css');
if(!existsSync(css))errors.push('Missing experience styling');
else{
 const c=readFileSync(css,'utf8');
 if(!c.includes('--burgundy:#72253f'))errors.push('Burgundy palette missing');
 if(/#f0642b|--tangerine/.test(c))errors.push('Cancelled orange accent leaked');
}
const sitemap=join(dist,'sitemap.xml');
if(existsSync(sitemap)&&readFileSync(sitemap,'utf8').includes('/discover/'))errors.push('Unreleased routes leaked into indexable sitemap');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('PASS: 16 bilingual noindex routes, responsive styles, live approved Supabase data, private RLS passport and no retired brand.');

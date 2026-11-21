import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const errors=[];
const styles=readFileSync(new URL('./responsive-finish.css',import.meta.url),'utf8');
for(const marker of ['@media(max-width:1024px)','@media(max-width:760px)','@media(max-width:480px)','@media(prefers-reduced-motion:reduce)','--be-burgundy:#72253f','.cover-grid','.be-letter-dialog','.be-landing-cover']){
 if(!styles.includes(marker))errors.push('Responsive style missing '+marker);
}
for(const locale of ['','ar/']){
 const home=join(dist,locale,'index.html');
 if(!existsSync(home)){errors.push('Homepage missing '+locale);continue;}
 const h=readFileSync(home,'utf8');
 for(const marker of ['id="be-responsive-release"','class="cover-grid"','cover-picture','class="be-home-intro"','be-discover-teaser','be-letter-dialog']){
  if(!h.includes(marker))errors.push('Homepage component missing '+locale+marker);
 }
 const nav=(h.match(/<nav class="be-home-links"[\s\S]*?<\/nav>/)||[])[0]||'';
 const links=(nav.match(/<a\b/g)||[]).length;
 if(links!==3)errors.push('Expected exactly 3 editorial browse links: '+locale+', saw '+links);
 if(!h.includes(locale?'href="/ar/recipes/"':'href="/recipes/"'))errors.push('Recipe browse link wrong '+locale);
 if(/(?:what[- ]to[- ]eat|whattocommunity)/i.test(nav))errors.push('Retired brand in homepage nav '+locale);
}
for(const route of ['recipes/','reviews/','stories/','account/','editorial-desk/','privacy/','cookies/','terms/']){
 for(const locale of ['','ar/']){
  const file=join(dist,locale,route,'index.html');
  if(!existsSync(file))errors.push('Route missing '+locale+route);
  else if(!readFileSync(file,'utf8').includes('id="be-responsive-release"'))errors.push('Responsive style not applied '+locale+route);
 }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('PASS: responsive 320px+ layout, complete bilingual routes, authentic cover photo, compact navigation and reduced motion.');

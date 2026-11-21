import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const problems=[];
const read=(f)=>{const p=join(dist,f);return existsSync(p)?readFileSync(p,'utf8'):(problems.push('Missing '+f),'')};
const styles=read('be-unified-brand.css');
const script=read('be-unified-brand.js');
for(const marker of ['--be-brand-gold:#ebc57b','--be-brand-burgundy:#72253f',
 'html[data-be-theme="dark"]','.be-exp-hero','.be-exp-subnav','.be-landing-cover',
 'html[lang^="ar"]','@media(max-width:480px)','prefers-reduced-motion']){
 if(!styles.includes(marker))problems.push('Shared CSS missing '+marker);
}
for(const marker of ['be-preferred-theme-v1','be-theme-toggle','DOMContentLoaded',
 'replaceChildren(img)','isArabic()']){
 if(!script.includes(marker))problems.push('Theme / logo controller missing '+marker);
}
const routes=['','recipes/','reviews/','stories/','account/','editorial-desk/',
 'discover/','discover/mama-picks/','discover/dish-finder/','discover/city-guide/',
 'discover/gallery/','discover/spotlight/','discover/passport/','discover/food-lab/'];
for(const language of ['','ar/']){
 for(const route of routes){
  const full=language+route+'index.html';
  const html=read(full);
  if(!html)continue;
  for(const marker of ['id="be-unified-brand"','id="be-theme-boot"','be-unified-brand.js']){
   if(!html.includes(marker))problems.push('Not branded: '+full+' missing '+marker);
  }
  if(html.includes('whattocommunity'))problems.push('Retired brand in '+full);
  if(route==='discover/'&&(!html.includes('be-experiences.js')||!html.includes('noindex,nofollow')))
   problems.push('Protected Discover route changed '+full);
  if(route==='account/'&&!html.includes('BE_AUTH_CONFIG'))problems.push('Account config missing '+full);
  if(route==='editorial-desk/'&&!html.includes('BE_AUTH_CONFIG'))problems.push('Desk config missing '+full);
 }
}
let htmlCount=0,branded=0;
for(const entry of readdirSync(dist,{recursive:true})){
 if(!entry.endsWith('.html')||/^google[a-z0-9]+\.html$/i.test(entry))continue;
 htmlCount++;
 const h=read(entry);
 if(h.includes('</head>')&&h.includes('</body>')){
  if(!h.includes('id="be-unified-brand"'))problems.push('Unthemed route '+entry);
  else branded++;
 }
}
if(branded<25)problems.push('Unexpected branded route count '+branded+'/'+htmlCount);
if(problems.length){console.error(problems.join('\n'));process.exit(1)}
console.log('PASS: One Boudie Eats design on '+branded+' HTML routes; Arabic/English, dark/light, guest/member, staff/visitor.');

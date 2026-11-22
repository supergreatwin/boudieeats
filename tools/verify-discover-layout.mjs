import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';

const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const issues=[];
const routes=['','mama-picks/','dish-finder/','city-guide/','gallery/',
 'spotlight/','passport/','food-lab/'];

function htmlAt(path){
 const full=join(dist,path,'index.html');
 if(!existsSync(full)){issues.push('Missing '+path);return '';}
 return readFileSync(full,'utf8');
}
for(const locale of ['','ar/']){
 const navNames=[];
 for(const route of routes){
  const page=locale+'discover/'+route;
  const html=htmlAt(page);
  if(!html)continue;
  const masthead=html.match(/<header\b[^>]*class="[^"]*\bbe-unified-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/i)?.[0];
  if(!masthead){issues.push('Missing shared masthead: '+page);continue;}
  for(const required of ['class="desktop-nav"','class="be-discover-nav"',
    'class="be-account-nav"','class="be-language"','class="mobile-nav"']){
    if(!masthead.includes(required))issues.push(page+' header lacks '+required);
  }
  if(masthead.includes('class="be-exp-top"'))issues.push(page+' uses old independent header');
  if((html.match(/<header\b/g)||[]).length!==1)issues.push(page+' has duplicate headers');
  if(html.includes('class="be-exp-subnav"'))issues.push(page+' still has duplicate section navigation');
  if(!html.includes('class="be-compact-footer"'))issues.push(page+' footer differs from public site');
  if(!html.includes('be-member.js'))issues.push(page+' lost shared login/session controls');
  for(const asset of ['be-experiences.js','be-experiences-refresh.css','be-minimal.css']){
    if(!new RegExp(asset.replaceAll('.','\\.')+'\\?v=[a-f0-9]{12}').test(html))
      issues.push(page+' missing versioned '+asset);
  }
  if(!html.includes('noindex,nofollow,noarchive'))issues.push(page+' member page is indexable');
  if(route===''&&!html.includes('data-view="home"'))issues.push(page+' home view mismatch');
  if(route!==''&&!html.includes('data-view="'+route.slice(0,-1)+'"'))
    issues.push(page+' detail view mismatch');
  const desktop=masthead.match(/<nav\b[^>]*class="desktop-nav"[^>]*>[\s\S]*?<\/nav>/i)?.[0]||'';
  if(desktop)navNames.push(desktop.replace(/href="[^"]+"/g,'href=""').replace(/aria-current="page"/g,''));
 }
 if(navNames.length && !navNames.every(x=>x===navNames[0]))
   issues.push(locale+' main navigation differs across Discover routes');
}
const client=readFileSync(join(dist,'be-experiences.js'),'utf8');
for(const bad of ['be-exp-member-number','Seven ways to make food more fun.','be-exp-member-bottom']){
 if(client.includes(bad))issues.push('Removed duplicate UI has returned: '+bad);
}
for(const needed of ['be-exp-member-grid','be-exp-detail-layout',
 'be-member-contributions','mountMemberSubmissions']){
 if(!client.includes(needed))issues.push('Member feature or contribution missing: '+needed);
}
const css=readFileSync(join(dist,'be-experiences-refresh.css'),'utf8');
for(const required of ['--be-discover-gap:','body[data-view] .be-exp-detail-layout',
 'body[data-view] .be-exp-member-layout','body[data-view] .be-share-shell',
 '@media(max-width:1120px)','@media(max-width:850px)','@media(max-width:600px)']){
 if(!css.includes(required))issues.push('Shared layout CSS missing: '+required);
}
if(issues.length){
 console.error(issues.join('\n'));
 process.exit(1);
}
console.log('PASS: 16 bilingual Discover routes use one masthead, one footer, one responsive grid, one contribution panel and cache-busted assets.');

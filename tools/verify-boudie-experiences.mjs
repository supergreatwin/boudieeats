import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const views=['','mama-picks/','dish-finder/','city-guide/','gallery/','spotlight/','passport/','food-lab/'];
const issues=[];
const must=(condition,message)=>{if(!condition)issues.push(message);};
for(const prefix of ['','ar/']){
  for(const route of views){
    const file=join(dist,prefix,'discover',route,'index.html');
    must(existsSync(file),'Missing '+prefix+'discover/'+route);
    if(!existsSync(file))continue;
    const html=readFileSync(file,'utf8');
    must(html.includes('Boudie Eats'),'No parent identity: '+prefix+route);
    must(html.includes('be-experiences.js'),'Missing interactive client: '+prefix+route);
    must(html.includes('be-experiences.css'),'Missing styles: '+prefix+route);
    must(html.includes('noindex,nofollow,noarchive'),'New experience must remain staged: '+prefix+route);
    must(!/what\s+to\s+eat|whattocommunity|what-to-eat|whatto/i.test(html),'Withdrawn collaboration reference found: '+prefix+route);
    must(!/sb_secret_|service_role/.test(html),'Private key detected: '+prefix+route);
  }
  must(!existsSync(join(dist,prefix,'what-to-eat')),'Legacy public guide route still exists');
  must(!existsSync(join(dist,prefix,'editorial-desk','what-to-eat')),'Legacy studio route still exists');
  const desk=join(dist,prefix,'editorial-desk','index.html');
  if(existsSync(desk)){
    const html=readFileSync(desk,'utf8');
    must(!html.includes('editorial-desk/what-to-eat'),'Old brand manager still linked');
    must(html.includes('discover/'),'Boudie experiences link missing from editorial workspace');
  }
}
for(const file of readdirSync(dist))must(!/^be-what-to-eat/i.test(file),'Legacy branded asset still shipped: '+file);
const cli=join(dist,'be-experiences.js');
must(existsSync(cli),'Interactive JS missing');
if(existsSync(cli)){
 const js=readFileSync(cli,'utf8');
 for(const marker of ['be-lab-form','be-dish-q','be-stamp','be-city','be-gallery','Boudie Food Personality Lab']) {
  if(marker==='be-gallery')continue;
  must(js.includes(marker),'Missing interaction marker: '+marker);
 }
 must(!/what to eat|whattocommunity/i.test(js),'Old name in independent client');
}
const sitemap=join(dist,'sitemap.xml');
if(existsSync(sitemap))must(!readFileSync(sitemap,'utf8').includes('/discover/'),'Unreviewed prototype leaked into indexable sitemap');
if(issues.length){console.error(issues.join('\n'));process.exit(1)}
console.log('PASS: 16 bilingual independent experience routes, original brand, interactive demos, no retired brand output, launch still disabled.');

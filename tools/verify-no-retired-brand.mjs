import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

// The retired third-party section must never be exposed, even as a hidden
// page, linked editorial studio, indexed route, icon, or newsletter popup.
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const issues=[];
const bannedRoot=/^be-what-to-eat/i;
const bannedPaths=['what-to-eat','editorial-desk/what-to-eat','ar/what-to-eat','ar/editorial-desk/what-to-eat'];
for(const path of bannedPaths){
 if(existsSync(join(dist,path)))issues.push('Retired section was emitted: /'+path);
}
for(const entry of readdirSync(dist,{withFileTypes:true})){
 if(bannedRoot.test(entry.name))issues.push('Retired brand asset was emitted: '+entry.name);
}
for(const prefix of ['','ar/']){
 for(const route of ['index.html','editorial-desk/index.html','account/index.html']){
  const file=join(dist,prefix,route);
  if(!existsSync(file))continue;
  const html=readFileSync(file,'utf8');
  if(/what-to-eat\/|whattocommunity|be-what-to-eat/i.test(html))
   issues.push('Retired route or identity appears in '+prefix+route);
 }
}
const siteMap=join(dist,'sitemap.xml');
if(existsSync(siteMap)&&/what-to-eat\/|whattocommunity|be-what-to-eat/i.test(readFileSync(siteMap,'utf8')))
 issues.push('Retired brand route exists in sitemap');
if(issues.length){console.error(issues.join('\n'));process.exit(1)}
console.log('PASS: Cancelled collaboration and newsletter assets are absent from deploy output.');

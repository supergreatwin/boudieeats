// Read-only production check. Never request private editor records or credentials.
// Verifies that the latest independent What to Eat identity reached BOTH hosts.
const hosts=[
 {name:'Cloudflare',root:'https://boudieeats.com/'},
 {name:'GitHub private fallback',root:'https://supergreatwin.github.io/boudieeats/'}
];
const paths=['editorial-desk/what-to-eat/','ar/editorial-desk/what-to-eat/'];
let failed=0;
const request=async url=>fetch(url,{redirect:'follow',signal:AbortSignal.timeout(15000),cache:'no-store',
 headers:{'User-Agent':'BoudieEats-WhatToEat-Brandcheck/1.0'}});
for(const host of hosts){
 for(const route of paths){
  try{
   const expected=new URL(route,host.root);
   const response=await request(expected.href);
   const html=await response.text();
   const staying=new URL(response.url).host===expected.host;
   const branded=response.ok&&staying&&html.includes('data-wte-mode="editor"')&&
     html.includes('noindex,nofollow,noarchive')&&html.includes('wte-logotype')&&
     html.includes('be-what-to-eat-favicon.svg')&&html.includes('BE_WTE_CONFIG')&&
     !html.includes('<title>what to eat? | Boudie Eats</title>');
   console.log(host.name+' '+route+': '+response.status+', independent brand '+(branded?'PASS':'FAIL')+', same host '+staying);
   if(!branded)failed++;
  }catch(e){failed++;console.error(host.name+' '+route+': '+String(e));}
 }
 for(const [asset,proof] of [
   ['be-what-to-eat.css','--orange:#f36e2d'],
   ['be-what-to-eat-favicon.svg','<svg'],
   ['be-what-to-eat-brand.jpg',null]]){
  try{
   const response=await request(new URL(asset,host.root).href);
   const ok=response.ok&&(asset.endsWith('.jpg')?(response.headers.get('content-type')||'').includes('image'): (await response.text()).includes(proof));
   console.log(host.name+' '+asset+': '+response.status+', '+(ok?'PASS':'FAIL'));
   if(!ok)failed++;
  }catch(e){failed++;console.error(host.name+' '+asset+': '+String(e));}
 }
}
if(failed){console.error('FAIL: '+failed+' independent-branded What to Eat routes/assets are stale or unavailable. Verify Cloudflare and GitHub deployments separately.');process.exitCode=1;}
else console.log('PASS: four private editor routes and all brand assets available on both hosts. Authenticated editor save/upload still requires a signed-in browser test.');

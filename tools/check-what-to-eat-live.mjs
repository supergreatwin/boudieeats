// Read-only, credential-free availability check for the editorial workspace.
// No admin data is requested or revealed. Running this does not publish the collaboration.
const checks=[
 {name:'Cloudflare custom domain',url:'https://boudieeats.com/editorial-desk/what-to-eat/'},
 {name:'GitHub Pages private fallback',url:'https://supergreatwin.github.io/boudieeats/editorial-desk/what-to-eat/'}
];
let failed=0;
for(const check of checks){
  try{
    const response=await fetch(check.url,{redirect:'follow',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'BoudieEats-WhatToEat-Healthcheck/1.0'}});
    const html=await response.text();
    const ok=response.status===200&&html.includes('BE_WTE_CONFIG')&&html.includes('data-wte-mode="editor"')&&html.includes('noindex,nofollow,noarchive');
    // A GitHub fallback must render in place and not redirect into stale Cloudflare.
    const host=new URL(response.url).host;
    const expected=new URL(check.url).host;
    const stays=host===expected;
    console.log(check.name+': HTTP '+response.status+', host '+host+', editor route '+(ok?'present':'missing')+', stays on original host '+stays);
    if(!ok||!stays)failed++;
  }catch(e){failed++;console.error(check.name+': '+String(e));}
}
if(failed){console.error('FAIL: '+failed+' private editorial URL(s) unavailable or redirected. GitHub Pages deploy and Cloudflare production must be checked separately.');process.exitCode=1;}
else console.log('PASS: both private editorial shell routes are available (authenticated CRUD must still be tested interactively).');

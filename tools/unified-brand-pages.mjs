import {copyFileSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

/**
 * Brand system must run after *all* other page generators so no route
 * diverges: journals, Discover, account, private Editorial Desk, policies.
 * Theme state is shared by the two language editions on the same origin.
 */
export function applyUnifiedBrand({directory,basePath='/'}) {
 const base=basePath.endsWith('/')?basePath:basePath+'/';
 copyFileSync(new URL('./unified-brand.css',import.meta.url),join(directory,'be-unified-brand.css'));
 copyFileSync(new URL('./unified-brand.mjs',import.meta.url),join(directory,'be-unified-brand.js'));
 const boot='<script id="be-theme-boot">(function(){try{var t=localStorage.getItem("be-preferred-theme-v1");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.beTheme=t;document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.dataset.beTheme="light";}})();</script>';
 const css='<link rel="stylesheet" id="be-unified-brand" href="'+base+'be-unified-brand.css">';
 const js='<script type="module" src="'+base+'be-unified-brand.js"></script>';
 let updated=0;
 for(const file of readdirSync(directory,{recursive:true})){
  if(!file.endsWith('.html')||/^google[a-z0-9]+\.html$/i.test(file))continue;
  const path=join(directory,file);
  let html=readFileSync(path,'utf8');
  if(!html.includes('</head>')||!html.includes('</body>'))continue;
  if(html.includes('id="be-unified-brand"'))continue;
  html=html.replace('</head>',boot+css+'</head>');
  html=html.replace('</body>',js+'</body>');
  writeFileSync(path,html);
  updated++;
 }
 if(updated<25)throw new Error('Unified branding unexpectedly skipped routes: '+updated);
 console.log('Boudie Eats unified branding installed on '+updated+' pages.');
}

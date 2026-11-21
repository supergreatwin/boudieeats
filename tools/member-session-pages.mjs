import {readFileSync,writeFileSync,readdirSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';

// Apply the same free reader account session to the English/Arabic public site.
// Protected data stays under Supabase JWT + RLS. The staff desk is untouched.
export function addMemberSession({directory,basePath='/',supabaseUrl='',supabasePublishableKey=''}) {
 const base=basePath.endsWith('/')?basePath:basePath+'/';
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(supabaseUrl) ||
    !/^sb_publishable_/.test(supabasePublishableKey))throw new Error('Member modal requires only valid public Supabase credentials');
 copyFileSync(new URL('./member-session-client.mjs',import.meta.url),join(directory,'be-member.js'));
 copyFileSync(new URL('./member-session.css',import.meta.url),join(directory,'be-member.css'));
 let updated=0,homeCount=0;
 for(const entry of readdirSync(directory,{recursive:true})) {
  if(!entry.endsWith('.html')||/^google[a-z0-9]+\.html$/i.test(entry)||
      /^(?:ar\/)?(?:account|editorial-desk|discover)\//.test(entry))continue;
  const file=join(directory,entry);
  let html=readFileSync(file,'utf8');
  // The authored reader pages already expose a progressive-enhancement account link.
  if(!html.includes('be-account-nav')||!html.includes('</head>')||!html.includes('</body>'))continue;
  if(html.includes('be-member.js'))continue;
  const config=JSON.stringify({url:supabaseUrl,publishableKey:supabasePublishableKey,basePath:base}).replace(/</g,'\\u003c');
  html=html.replace('</head>','<link rel="stylesheet" href="'+base+'be-member.css"></head>');
  html=html.replace('</body>','<script>window.BE_MEMBER_CONFIG='+config+';</script>'+
     '<script type="module" src="'+base+'be-member.js"></script></body>');
  writeFileSync(file,html);
  updated++;
  if(entry==='index.html'||entry==='ar/index.html')homeCount++;
 }
 if(homeCount!==2)throw new Error('Expected shared member modal on English and Arabic homepages; found '+homeCount);
 console.log('Added bilingual member session and popup to '+updated+' public visitor pages.');
}
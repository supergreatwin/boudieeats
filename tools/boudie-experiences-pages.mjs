import {mkdirSync,readFileSync,writeFileSync,copyFileSync,readdirSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {bePublicConfig} from './be-public-config.mjs';

// Generate a clean independent Boudie Eats experience hub. The withdrawn
// collaboration routes/assets are not emitted to the deployment output.
const routes=['mama-picks','dish-finder','city-guide','gallery','spotlight','passport','food-lab'];
const names={
 'mama-picks':['Boudie’s Mama Picks','اختيارات ماما عند بودي'],
 'dish-finder':['Boudie’s Dish Finder','دور على أكلة'],
 'city-guide':['Boudie’s City Guide','دليل بودي للمدن'],
 'gallery':['Boudie Gallery','ألبوم بودي'],
 'spotlight':['Boudie Spotlight','بودي سبوتلايت'],
 'passport':['Boudie Passport','جواز سفر بودي'],
 'food-lab':['Boudie Food Personality Lab','معمل شخصية الأكل من بودي']
};
const e=(s)=>String(s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// The visitor homepage owns the header. Every Discover route reuses its markup
// rather than maintaining a second, divergent navigation implementation.
function sharedHeader({directory,arabic,view,base}) {
 const prefix=arabic?'ar/':'';
 const homepage=readFileSync(join(directory,prefix,'index.html'),'utf8');
 const found=homepage.match(/<header\b[^>]*class="[^"]*\bmasthead\b[^"]*"[^>]*>[\s\S]*?<\/header>/i);
 if(!found)throw new Error('Canonical Boudie Eats masthead missing in '+prefix+'homepage');
 let header=found[0].replace('class="masthead"','class="masthead be-unified-header"')
  .replace(/\saria-current="page"/g,'');
 // At this build stage the native homepage has not yet received the
 // public Discover link. Add it here only if it is absent.
 if(!header.includes('class="be-discover-nav"')){
   const discoverLink='<a class="be-discover-nav" href="'+base+prefix+
     'account/?next='+encodeURIComponent('/'+prefix+'discover/')+'">'+
     (arabic?'اكتشف تجارب بودي إيتس':'Discover Boudie Eats')+'</a>';
   header=header.replace(/(<nav\b[^>]*class="[^"]*\bdesktop-nav\b[^"]*"[^>]*>)/i,'$1'+discoverLink);
 }
 if(!header.includes('class="be-account-nav"')){
   const accountLabel=arabic?'دخول / حساب جديد':'Sign in / Sign up';
   header=header.replace(/(<div\b[^>]*class="[^"]*\butilities\b[^"]*"[^>]*>)/i,
     '$1<a class="be-account-nav" href="'+base+prefix+'account/">'+accountLabel+'</a>');
 }
 if(!header.includes('class="be-discover-nav"')||!header.includes('class="be-account-nav"'))
   throw new Error('Cannot assemble shared Discover and account navigation');
 header=header.replace('class="be-discover-nav"', 'aria-current="page" class="be-discover-nav"');
 const enTarget=base+'discover/'+(view==='home'?'':view+'/');
 const arTarget=base+'ar/discover/'+(view==='home'?'':view+'/');
 const switcher=/<nav\b[^>]*class="[^"]*\bbe-language\b[^"]*"[^>]*>[\s\S]*?<\/nav>/i;
 if(!switcher.test(header))throw new Error('Language switcher not found in shared masthead');
 header=header.replace(switcher, block=>{
   let links=block.replace('href="'+base+'"','href="'+enTarget+'"')
     .replace('href="'+base+'ar/"','href="'+arTarget+'"');
   const active=arabic?arTarget:enTarget;
   links=links.replace('href="'+active+'"','aria-current="page" href="'+active+'"');
   return links;
 });
 // The desktop header already has Discover; ensure mobile does too.
 header=header.replace(/(<details\b[^>]*class="[^"]*\bmobile-nav\b[^"]*"[^>]*>[\s\S]*?<nav\b[^>]*>)/i,
  '$1<a aria-current="page" class="be-discover-nav" href="'+
    base+prefix+'account/?next='+encodeURIComponent('/'+prefix+'discover/')+'">'+
    (arabic?'اكتشف تجارب بودي إيتس':'Discover Boudie Eats')+'</a>');
 return header;
}
function page({arabic,base,view,header,assetVersion,supabaseUrl,supabasePublishableKey}){
 const prefix=arabic?'ar/':'',path=base+prefix+'discover/',title=view==='home'?(arabic?'اكتشف بودي إيتس':'Discover Boudie Eats'):names[view][arabic?1:0];
 const lang=arabic?'ar-EG':'en',langHref=base+(arabic?'':'ar/')+'discover/'+(view==='home'?'':view+'/');
 const enHref='https://boudieeats.com/discover/'+(view==='home'?'':view+'/');
 const arHref='https://boudieeats.com/ar/discover/'+(view==='home'?'':view+'/');
 return '<!doctype html><html lang="'+lang+'" dir="'+(arabic?'rtl':'ltr')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
 '<title>'+e(title)+' | Boudie Eats</title>'+
 '<meta name="robots" content="noindex,nofollow,noarchive">'+
 '<meta name="description" content="'+e(arabic?'سبع تجارب أصلية للأكل من بودي إيتس':'Seven independent food discovery experiences by Boudie Eats')+'">'+
 '<meta name="theme-color" content="#72253f"><link rel="canonical" href="https://boudieeats.com/'+prefix+'discover/'+(view==='home'?'':view+'/')+'">'+
 '<link rel="alternate" hreflang="en" href="'+enHref+'"><link rel="alternate" hreflang="ar-EG" href="'+arHref+'">'+
 '<link rel="stylesheet" href="'+base+'be-experiences.css?v='+assetVersion+'"><link rel="stylesheet" href="'+base+'be-experiences-refresh.css?v='+assetVersion+'"></head><body data-view="'+view+'" data-base="'+base+'">'+
 header+
 '<div class="be-exp-page"><main id="be-exp-app" aria-live="polite"><p>'+(arabic?'جارٍ تحميل التجربة…':'Loading experience…')+'</p></main></div>'+
 '<footer class="be-exp-footer"><div><span>© Boudie Eats</span><span>'+(arabic?'الأكل حكايات.':'Food is a story.')+'</span></div></footer>'+
 '<script>window.BE_DISCOVER_CONFIG='+JSON.stringify({url:supabaseUrl,publishableKey:supabasePublishableKey}).replace(/</g,'\\u003c')+';</script>'+ 
 '<script type="module" src="'+base+'be-experiences.js?v='+assetVersion+'"></script></body></html>';
}
export function addBoudieExperiences({directory,basePath='/',supabaseUrl=bePublicConfig.url,supabasePublishableKey=bePublicConfig.publishableKey}){
 const base=basePath.endsWith('/')?basePath:basePath+'/';
 // Scrub the legacy partner deployment output. Source files remain only
 // for historical migration until the new production workflow is verified.
 for(const prefix of ['','ar/']){
  rmSync(join(directory,prefix,'what-to-eat'),{recursive:true,force:true});
  rmSync(join(directory,prefix,'editorial-desk','what-to-eat'),{recursive:true,force:true});
  const desk=join(directory,prefix,'editorial-desk','index.html');
  if(existsSync(desk)){
    let html=readFileSync(desk,'utf8');
    html=html.replace(/<a href="[^"]*editorial-desk\/what-to-eat\/">[^<]*<\/a>/g,'');
    const label=prefix?'تجارب بودي إيتس':'Boudie Eats experiences';
    const href=base+prefix+'discover/';
    if(!html.includes(href))html=html.replace('</nav>','<a href="'+href+'">'+label+'</a></nav>');
    writeFileSync(desk,html);
  }
 }
 for(const file of readdirSync(directory)){
  if(/^be-what-to-eat/i.test(file))rmSync(join(directory,file),{force:true,recursive:true});
 }
 copyFileSync(new URL('./boudie-experiences-client.mjs',import.meta.url),join(directory,'be-experiences.js'));
 copyFileSync(new URL('./boudie-experiences.css',import.meta.url),join(directory,'be-experiences.css'));
 copyFileSync(new URL('./member-submissions-client.mjs',import.meta.url),join(directory,'be-member-submissions.js'));
 copyFileSync(new URL('./member-experiences-refresh.css',import.meta.url),join(directory,'be-experiences-refresh.css'));
 // Every visual or client update gets a new URL to avoid stale Safari/edge caches.
 const assetVersion=createHash('sha256').update([
  readFileSync(new URL('./boudie-experiences-client.mjs',import.meta.url),'utf8'),
  readFileSync(new URL('./boudie-experiences.css',import.meta.url),'utf8'),
  readFileSync(new URL('./member-experiences-refresh.css',import.meta.url),'utf8')
 ].join('\n')).digest('hex').slice(0,12);
 for(const arabic of [false,true]){
  const prefix=arabic?'ar/':'';
  for(const view of ['home',...routes]){
   const folder=join(directory,prefix,'discover',...(view==='home'?[]:[view]));
   mkdirSync(folder,{recursive:true});
   writeFileSync(join(folder,'index.html'),page({arabic,base,view,header:sharedHeader({directory,arabic,view,base}),assetVersion,supabaseUrl,supabasePublishableKey}));
  }
 }
 // The new experience remains noindexed and unlinked from public menus.
 // Merge only after all release readiness gates and owner review.
}

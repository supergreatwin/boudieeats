import {mkdirSync,readFileSync,writeFileSync,copyFileSync,readdirSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
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
function page({arabic,base,view,supabaseUrl,supabasePublishableKey}){
 const prefix=arabic?'ar/':'',path=base+prefix+'discover/',title=view==='home'?(arabic?'اكتشف بودي إيتس':'Discover Boudie Eats'):names[view][arabic?1:0];
 const lang=arabic?'ar-EG':'en',langHref=base+(arabic?'':'ar/')+'discover/'+(view==='home'?'':view+'/');
 const enHref='https://boudieeats.com/discover/'+(view==='home'?'':view+'/');
 const arHref='https://boudieeats.com/ar/discover/'+(view==='home'?'':view+'/');
 const primaryNav='<a href="'+base+prefix+'">'+(arabic?'الرئيسية':'Home')+'</a>'+
 '<a href="'+base+prefix+'recipes/">'+(arabic?'الوصفات':'Recipes')+'</a>'+
 '<a href="'+base+prefix+'reviews/">'+(arabic?'التجارب':'Reviews')+'</a>'+
 '<a class="be-account-nav" href="'+base+prefix+'account/">'+(arabic?'دخول / حساب جديد':'Sign in / Sign up')+'</a>'+
 ''; 
 const switcher='<nav class="be-language" aria-label="Language"><a hreflang="'+(arabic?'en':'ar-EG')+'" href="'+langHref+'">'+(arabic?'EN':'AR')+'</a></nav>';
 const logo=arabic?'<span class="be-exp-logo-text">بودي إيتس.</span>':'<img src="'+base+'media/boudieeats-wordmark-cream-gold-v2.svg" width="195" height="32" alt="boudieeats.">';
 const nav='<nav class="be-exp-subnav" aria-label="'+(arabic?'أقسام التجربة':'Experience sections')+'">'+
 '<a href="'+path+'" '+(view==='home'?'aria-current="page"':'')+'>'+(arabic?'الكل':'All seven')+'</a>'+
 routes.map(key=>'<a href="'+path+key+'/" '+(view===key?'aria-current="page"':'')+'>'+e(names[key][arabic?1:0])+'</a>').join('')+'</nav>';
 return '<!doctype html><html lang="'+lang+'" dir="'+(arabic?'rtl':'ltr')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
 '<title>'+e(title)+' | Boudie Eats</title>'+
 '<meta name="robots" content="noindex,nofollow,noarchive">'+
 '<meta name="description" content="'+e(arabic?'سبع تجارب أصلية للأكل من بودي إيتس':'Seven independent food discovery experiences by Boudie Eats')+'">'+
 '<meta name="theme-color" content="#72253f"><link rel="canonical" href="https://boudieeats.com/'+prefix+'discover/'+(view==='home'?'':view+'/')+'">'+
 '<link rel="alternate" hreflang="en" href="'+enHref+'"><link rel="alternate" hreflang="ar-EG" href="'+arHref+'">'+
 '<link rel="stylesheet" href="'+base+'be-experiences.css"></head><body data-view="'+view+'" data-base="'+base+'">'+
 '<header class="be-exp-top"><div class="be-exp-top-in"><a href="'+base+prefix+'" class="be-exp-logo">'+logo+'</a><nav>'+primaryNav+'</nav>'+switcher+'</div></header>'+
 '<div class="be-exp-page">'+nav+'<main id="be-exp-app" aria-live="polite"><p>'+(arabic?'جارٍ تحميل التجربة…':'Loading experience…')+'</p></main></div>'+
 '<footer class="be-exp-footer"><div><span>© Boudie Eats</span><span>'+(arabic?'الأكل حكايات.':'Food is a story.')+'</span></div></footer>'+
 '<script>window.BE_DISCOVER_CONFIG='+JSON.stringify({url:supabaseUrl,publishableKey:supabasePublishableKey}).replace(/</g,'\\u003c')+';</script>'+ 
 '<script type="module" src="'+base+'be-experiences.js"></script></body></html>';
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
 for(const arabic of [false,true]){
  const prefix=arabic?'ar/':'';
  for(const view of ['home',...routes]){
   const folder=join(directory,prefix,'discover',...(view==='home'?[]:[view]));
   mkdirSync(folder,{recursive:true});
   writeFileSync(join(folder,'index.html'),page({arabic,base,view,supabaseUrl,supabasePublishableKey}));
  }
 }
 // The new experience remains noindexed and unlinked from public menus.
 // Merge only after all release readiness gates and owner review.
}

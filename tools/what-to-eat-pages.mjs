import {mkdirSync,readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';

function page({arabic,editor,base,url,key}){
  const lang=arabic?'ar-EG':'en',prefix=arabic?'ar/':'',direction=arabic?'rtl':'ltr';
  const rootPath=base+prefix;
  const guidePath=rootPath+'what-to-eat/';
  const editorPath=rootPath+'editorial-desk/what-to-eat/';
  const title=arabic?'what to eat? | ناكل إيه؟':'what to eat?';
  const brand='<span class="wte-logotype" lang="en">what to eat?</span>';
  const altPath=base+(arabic?'':'ar/')+(editor?'editorial-desk/what-to-eat/':'what-to-eat/');
  const config=JSON.stringify({url,publishableKey:key,basePath:base}).replace(/</g,'\\u003c');
  // Preview stays on the authenticated Editorial Desk route; the visitor
  // URL intentionally remains unavailable until final partnership sign-off.
  const nav=editor?
    '<a href="'+editorPath+'?preview=1" aria-label="'+(arabic?'فتح المعاينة الخاصة':'Open secure private preview')+'">'+(arabic?'المعاينة الخاصة':'Private preview')+'</a><a href="'+editorPath+'">'+(arabic?'إدارة المحتوى':'Content studio')+'</a>':
    '<a href="#wte-guide">'+(arabic?'استكشف':'Explore')+'</a><a href="#wte-sections">'+(arabic?'عن الدليل':'About the guide')+'</a>';
  return '<!doctype html><html lang="'+lang+'" dir="'+direction+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="robots" content="noindex,nofollow,noarchive"><meta name="theme-color" content="#f36c2c">'+
    '<title>'+title+'</title><meta name="description" content="what to eat? | An independent food guide in preparation.">'+
    '<link rel="icon" href="'+base+'be-what-to-eat-favicon.svg" type="image/svg+xml">'+
    '<link rel="canonical" href="https://boudieeats.com/'+prefix+(editor?'editorial-desk/':'')+'what-to-eat/">'+
    '<link rel="alternate" hreflang="en" href="https://boudieeats.com/'+(editor?'editorial-desk/':'')+'what-to-eat/">'+
    '<link rel="alternate" hreflang="ar-EG" href="https://boudieeats.com/ar/'+(editor?'editorial-desk/':'')+'what-to-eat/">'+
    '<link rel="manifest" href="manifest.webmanifest">'+
    '<link rel="apple-touch-icon" href="'+base+'be-what-to-eat-app-192.png">'+
    '<meta name="apple-mobile-web-app-capable" content="yes">'+
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'+
    '<link rel="stylesheet" href="'+base+'be-what-to-eat.css"></head>'+
    '<body data-wte-mode="'+(editor?'editor':'guide')+'"><header class="wte-site-header"><a class="wte-wordmark" href="'+(editor?editorPath+'?preview=1':guidePath)+'" aria-label="what to eat?">'+brand+'</a>'+
    '<nav class="be-language" aria-label="'+(arabic?'روابط القسم':'Section navigation')+'">'+nav+
    '<a href="'+altPath+'" hreflang="'+(arabic?'en':'ar-EG')+'">'+(arabic?'EN':'عربي')+'</a></nav></header>'+
    '<main class="wte-shell" id="wte-root" aria-live="polite"><p>'+(arabic?'جارٍ التحميل…':'Loading private guide…')+'</p></main>'+
    '<footer class="wte-site-footer"><span class="wte-footer-wordmark" lang="en">what to eat?</span><span>'+(arabic?'بالشراكة مع بودي إيتس':'In collaboration with Boudie Eats')+'</span></footer>'+
    '<script>window.BE_WTE_CONFIG='+config+';</script><script type="module" src="'+base+'be-what-to-eat.js"></script>'+ 
    '<script type="module" src="'+base+'be-what-to-eat-newsletter.js"></script></body></html>';
}
export function addWhatToEatPages({directory,basePath='/',supabaseUrl='',supabasePublishableKey=''}){
  const base=basePath.endsWith('/')?basePath:basePath+'/';
  copyFileSync(new URL('./what-to-eat-client.mjs',import.meta.url),join(directory,'be-what-to-eat.js'));
  copyFileSync(new URL('./what-to-eat.css',import.meta.url),join(directory,'be-what-to-eat.css'));
  copyFileSync(new URL('./what-to-eat-newsletter.mjs',import.meta.url),join(directory,'be-what-to-eat-newsletter.js'));
  for(const size of [192,512])copyFileSync(new URL('../assets/what-to-eat-app-'+size+'.png',import.meta.url),join(directory,'be-what-to-eat-app-'+size+'.png'));
  copyFileSync(new URL('../assets/what-to-eat-original-reference.jpg',import.meta.url),join(directory,'be-what-to-eat-brand.jpg'));
  copyFileSync(new URL('../assets/what-to-eat-favicon.svg',import.meta.url),join(directory,'be-what-to-eat-favicon.svg'));
  for(const arabic of [false,true]){
    const prefix=arabic?'ar/':'';
    for(const editor of [false,true]){
      const route=prefix+(editor?'editorial-desk/':'')+'what-to-eat';
      const folder=join(directory,route);
      mkdirSync(folder,{recursive:true});
      writeFileSync(join(folder,'index.html'),page({arabic,editor,base,url:supabaseUrl,key:supabasePublishableKey}));
      // Installable app without public release: app start URL requires a valid
      // Supabase editor session; the visitor manifest is staged for later.
      const start=base+route+'/';
      const manifest={
        id:start,name:editor?(arabic?'what to eat? | مساحة التحرير':'what to eat? | editorial studio'):(arabic?'what to eat? | دليل الأكل':'what to eat? | food guide'),
        short_name:'what to eat?',description:editor?'Private food-guide editing workspace':'Food and restaurant recommendations, awaiting launch',
        lang:arabic?'ar-EG':'en',dir:arabic?'rtl':'ltr',start_url:start,scope:start,
        display:'standalone',background_color:'#f7f7f5',theme_color:'#f36e2d',
        icons:[192,512].map(size=>({src:base+'be-what-to-eat-app-'+size+'.png',sizes:size+'x'+size,type:'image/png',purpose:'any maskable'})),
        shortcuts:editor?[{name:arabic?'معاينة خاصة':'Private preview',short_name:arabic?'معاينة':'Preview',url:start+'?preview=1'}]:[]
      };
      writeFileSync(join(folder,'manifest.webmanifest'),JSON.stringify(manifest,null,2));
    }
    // Only the private Editorial Desk links to the manager, not the public site.
    const deskPath=join(directory,prefix,'editorial-desk','index.html');
    let html=readFileSync(deskPath,'utf8');
    const label=arabic?'دليل ناكل إيه؟':'What to Eat manager';
    const link='<a href="'+base+prefix+'editorial-desk/what-to-eat/">'+label+'</a>';
    if(!html.includes(label)){
      html=html.replace('</nav>',link+'</nav>');
      writeFileSync(deskPath,html);
    }
  }
}

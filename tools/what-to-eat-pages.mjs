import {mkdirSync,readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';

function page({arabic,editor,base,url,key}){
  const lang=arabic?'ar-EG':'en',prefix=arabic?'ar/':'',direction=arabic?'rtl':'ltr';
  const rootPath=base+prefix;
  const title=arabic?'ناكل إيه؟':'What to Eat';
  const brand=arabic?'<span>بودي إيتس<span style="color:#ebc57b">.</span></span>':'<img src="'+base+'media/boudieeats-wordmark.svg" alt="boudieeats.">';
  const altPath=base+(arabic?'':'ar/')+(editor?'editorial-desk/what-to-eat/':'what-to-eat/');
  const config=JSON.stringify({url,publishableKey:key,basePath:base}).replace(/</g,'\\u003c');
  return '<!doctype html><html lang="'+lang+'" dir="'+direction+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="robots" content="noindex,nofollow,noarchive"><meta name="theme-color" content="#51283e">'+
    '<title>'+title+' | Boudie Eats</title><meta name="description" content="Private collaboration guide, currently under review.">'+
    '<link rel="canonical" href="https://boudieeats.com/'+prefix+(editor?'editorial-desk/':'')+'what-to-eat/">'+
    '<link rel="alternate" hreflang="en" href="https://boudieeats.com/'+(editor?'editorial-desk/':'')+'what-to-eat/">'+
    '<link rel="alternate" hreflang="ar-EG" href="https://boudieeats.com/ar/'+(editor?'editorial-desk/':'')+'what-to-eat/">'+
    '<link rel="stylesheet" href="'+base+'be-what-to-eat.css"></head>'+
    '<body data-wte-mode="'+(editor?'editor':'guide')+'"><header class="wte-site-header"><a class="wte-wordmark" href="'+rootPath+'">'+brand+'</a>'+
    '<nav class="be-language"><a href="'+rootPath+'">'+(arabic?'الرئيسية':'Home')+'</a><a href="'+rootPath+'editorial-desk/">'+(arabic?'مكتب التحرير':'Editorial desk')+'</a>'+
    '<a href="'+altPath+'" hreflang="'+(arabic?'en':'ar-EG')+'">'+(arabic?'EN':'عربي')+'</a></nav></header>'+
    '<main class="wte-shell" id="wte-root" aria-live="polite"><p>'+(arabic?'جارٍ التحميل…':'Loading private guide…')+'</p></main>'+
    '<footer class="wte-site-footer"><span>© Boudie Eats</span><span>'+(arabic?'دليل الطعام قيد الإعداد.':'This collaboration has not launched.')+'</span></footer>'+
    '<script>window.BE_WTE_CONFIG='+config+';</script><script type="module" src="'+base+'be-what-to-eat.js"></script></body></html>';
}
export function addWhatToEatPages({directory,basePath='/',supabaseUrl='',supabasePublishableKey=''}){
  const base=basePath.endsWith('/')?basePath:basePath+'/';
  copyFileSync(new URL('./what-to-eat-client.mjs',import.meta.url),join(directory,'be-what-to-eat.js'));
  copyFileSync(new URL('./what-to-eat.css',import.meta.url),join(directory,'be-what-to-eat.css'));
  for(const arabic of [false,true]){
    const prefix=arabic?'ar/':'';
    for(const editor of [false,true]){
      const route=prefix+(editor?'editorial-desk/':'')+'what-to-eat';
      const folder=join(directory,route);
      mkdirSync(folder,{recursive:true});
      writeFileSync(join(folder,'index.html'),page({arabic,editor,base,url:supabaseUrl,key:supabasePublishableKey}));
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

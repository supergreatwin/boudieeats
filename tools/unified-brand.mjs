/* One theme + brand controller across every generated Boudie Eats route.
   This intentionally does not alter account, Editorial Desk or subscription logic. */
(() => {
  'use strict';
  const KEY='be-preferred-theme-v1';
  const root=document.documentElement;
  const isArabic=()=>String(root.lang||'').toLowerCase().startsWith('ar');
  const storedTheme=()=>{
    try { const v=localStorage.getItem(KEY); return v==='dark'||v==='light'?v:null; }
    catch { return null; }
  };
  const osTheme=()=>{
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'; }
    catch { return 'light'; }
  };
  const currentTheme=()=>root.dataset.beTheme==='dark'?'dark':'light';
  const applyTheme=(theme,save=false)=>{
    const value=theme==='dark'?'dark':'light';
    root.dataset.beTheme=value;
    root.style.colorScheme=value;
    if(save){try{localStorage.setItem(KEY,value)}catch{}}
    const button=document.getElementById('be-theme-toggle');
    if(button){
      const next=value==='dark'?'light':'dark';
      button.setAttribute('aria-pressed',String(value==='dark'));
      button.setAttribute('aria-label',isArabic()
        ? (next==='dark'?'تفعيل الوضع الليلي':'تفعيل الوضع النهاري')
        : ('Switch to '+next+' mode'));
      const icon=button.querySelector('.be-theme-glyph');
      const label=button.querySelector('.be-theme-label');
      if(icon)icon.textContent=value==='dark'?'☀':'☾';
      if(label)label.textContent=isArabic()
        ? (value==='dark'?'نهاري':'ليلي')
        : (value==='dark'?'Light':'Dark');
    }
  };
  applyTheme(storedTheme()||osTheme());
  function init(){
    // The original uploaded wordmark remains an image, never re-typeset.
    // Account and Editorial Desk receive that same approved SVG.
    const brand=document.querySelector('.be-top .be-brand');
    if(brand){
      brand.setAttribute('aria-label',isArabic()?'بودي إيتس':'Boudie Eats');
      if(isArabic()){
        brand.textContent='بودي إيتس';
        brand.lang='ar';
      }else if(!brand.querySelector('img')){
        const css=document.querySelector('link[href*="be-unified-brand.css"]');
        if(css){
          const img=document.createElement('img');
          img.src=new URL('media/boudieeats-wordmark-cream-gold-v2.svg',css.href).href;
          img.alt='boudieeats.';
          img.width=195;img.height=32;
          brand.replaceChildren(img);
        }
      }
    }
    if(document.getElementById('be-theme-toggle')){applyTheme(currentTheme());return;}
    const target=
      document.querySelector('.masthead .header-inner .utilities')||
      document.querySelector('.be-exp-top-in')||
      document.querySelector('.be-top > .be-shell')||
      document.querySelector('.masthead .header-inner')||
      document.querySelector('header');
    if(!target)return;
    const button=document.createElement('button');
    button.type='button';
    button.className='be-theme-toggle';
    button.id='be-theme-toggle';
    const icon=document.createElement('span');
    icon.className='be-theme-glyph';
    icon.setAttribute('aria-hidden','true');
    const label=document.createElement('span');
    label.className='be-theme-label';
    button.append(icon,label);
    button.addEventListener('click',()=>applyTheme(currentTheme()==='dark'?'light':'dark',true));
    target.append(button);
    applyTheme(currentTheme());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

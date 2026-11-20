// What to Eat × The Boudie Letter: branded, accessible newsletter modal.
// Uses the EXISTING published Boudie Eats Tally prelaunch forms (EN/AR).
// This is not a separate mailing list, and no subscription API key is exposed.
(() => {
  const root=document.getElementById('wte-root');
  if(!root) return;
  const arabic=document.documentElement.lang.startsWith('ar');
  const t=(en,ar)=>arabic?ar:en;
  const id='wte-letter-modal';
  const formId=arabic?'7XK9Dz':'vXDORl';
  const signup='https://tally.so/r/'+formId;
  const embed='https://tally.so/embed/'+formId+'?hideTitle=1&alignLeft='+(arabic?'0':'1')+'&transparentBackground=1';
  const storageKey='wte-letter-dismissed-v1';
  const sessionKey='wte-letter-autoshown-v1';
  const days=5*24*60*60*1000;
  let timer=null;
  const read=(store,key)=>{try{return store.getItem(key)||'';}catch{return '';}};
  const write=(store,key,val)=>{try{store.setItem(key,val);}catch{}};
  const dismiss=()=>write(localStorage,storageKey,String(Date.now()));
  const canAuto=()=> {
    const last=Number(read(localStorage,storageKey)||'0');
    return !read(sessionStorage,sessionKey)&&(!last||Date.now()-last>days);
  };
  const shown=()=>document.querySelector('#wte-guide')!==null;
  function ensureModal(){
    let dialog=document.getElementById(id);
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id=id;dialog.className='wte-letter-modal';
    dialog.setAttribute('aria-labelledby','wte-letter-title');
    dialog.setAttribute('aria-describedby','wte-letter-description');
    dialog.innerHTML=
      '<div class="wte-letter-layout">'+
        '<div class="wte-letter-art" aria-hidden="true"><img src="'+
          (document.querySelector('.wte-brand-hero img')?.getAttribute('src')||'/be-what-to-eat-brand.jpg')+
          '" alt="" loading="lazy"></div>'+
        '<div class="wte-letter-body">'+
          '<button class="wte-letter-close" type="button" data-wte-letter-close aria-label="'+t('Close newsletter','إغلاق النشرة')+'">×</button>'+
          '<p class="wte-letter-eyebrow">WHAT TO EAT? <span>×</span> THE BOUDIE LETTER</p>'+
          '<h2 id="wte-letter-title">'+t('good food. in your inbox.','أكل حلو. في بريدك.')+'</h2>'+
          '<p id="wte-letter-description">'+t(
            'Join the Boudie Eats prelaunch mailing list for recipes, food stories and updates when this collaboration is ready.',
            'سجّل في قائمة انتظار نشرة بودي إيتس للوصفات وحكايات الأكل وأخبار التعاون لما يبقى جاهز.'
          )+'</p>'+
          '<p class="wte-letter-disclosure">'+t(
            'This is the Boudie Eats signup, not a separate What to Eat mailing list. No newsletter emails are being sent yet.',
            'دي استمارة نشرة بودي إيتس، مش قائمة بريدية منفصلة لـ What to Eat. الرسائل البريدية لسه ما بدأتش.'
          )+'</p>'+
          '<div class="wte-letter-iframe-wrap"><iframe title="'+t('Boudie Eats email signup form','استمارة نشرة بودي إيتس')+
          '" loading="lazy" data-form-url="'+embed+'" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>'+
          '<p class="wte-letter-alternative"><a href="'+signup+'" target="_blank" rel="noopener noreferrer">'+
          t('Open signup in a new tab ↗','افتح الاستمارة في صفحة مستقلة ↗')+'</a></p>'+
        '</div>'+
      '</div>';
    document.body.append(dialog);
    dialog.querySelector('[data-wte-letter-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',dismiss);
    dialog.addEventListener('click',e=>{
      if(e.target===dialog)dialog.close();
    });
    return dialog;
  }
  function open(manual=false){
    if(!shown())return;
    const dialog=ensureModal();
    const iframe=dialog.querySelector('iframe');
    if(iframe&&!iframe.src)iframe.src=iframe.dataset.formUrl;
    if(!dialog.open){
      if(typeof dialog.showModal==='function')dialog.showModal();
      else dialog.setAttribute('open','');
      write(sessionStorage,sessionKey,'1');
      dialog.querySelector('[data-wte-letter-close]').focus({preventScroll:true});
    }
  }
  function mount(){
    const guide=root.querySelector('#wte-guide');
    const intro=root.querySelector('.wte-intro');
    if(!guide||!intro)return;
    if(!intro.querySelector('[data-wte-letter-open]')){
      const btn=document.createElement('button');
      btn.type='button';btn.className='wte-letter-trigger';
      btn.dataset.wteLetterOpen='';
      btn.textContent=t('Get the food letter ↗','اشترك في جواب الأكل ↗');
      btn.addEventListener('click',()=>open(true));
      intro.append(btn);
    }
    if(!timer&&canAuto()){
      timer=setTimeout(()=>{
        timer=null;
        if(shown()&&canAuto()&&document.visibilityState==='visible')open();
      },6000);
    }
  }
  const observer=new MutationObserver(()=>{
    const active=shown();
    if(!active){
      if(timer){clearTimeout(timer);timer=null;}
      const existing=document.getElementById(id);
      if(existing?.open)existing.close();
      return;
    }
    mount();
  });
  observer.observe(root,{childList:true,subtree:false});
  mount();
})();

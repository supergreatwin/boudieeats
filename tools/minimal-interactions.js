// Progressive enhancement for the bilingual Boudie Eats public pages.
// Move the review criteria beside its section in the parsed DOM, without
// relying on fragile build-time string slicing of nested HTML.
(()=>{
 function init(){
  const isAr=document.documentElement.lang.toLowerCase().startsWith('ar');
  if(document.documentElement.dataset.beLayout==='reviews-index'){
   const headings=[...document.querySelectorAll('main h2')];
   const criteria=headings.find(h=>/ببص على إيه في التجربة|What do I look for in a review/i.test(h.textContent||''));
   const places=headings.find(h=>/المطاعم والكافيهات|Restaurants and caf(?:é|e)s/i.test(h.textContent||''));
   const side=criteria?.closest('section');
   const listing=places?.closest('section');
   if(side&&listing&&side!==listing&&!side.contains(listing)&&!listing.contains(side)){
    const layout=document.createElement('div');
    layout.className='be-review-side-layout';
    const content=document.createElement('div');
    content.className='be-review-main';
    const aside=document.createElement('aside');
    aside.className='be-review-sidebar';
    aside.setAttribute('aria-label',isAr?'معايير مراجعة التجارب':'Review criteria');
    listing.before(layout);
    content.append(listing);
    aside.append(side);
    layout.append(content,aside);
   }
  }
  document.querySelectorAll('[data-be-letter-open]').forEach(button=>{
   button.addEventListener('click',()=>{
    const newsletter=document.getElementById('be-letter-dialog');
    if(newsletter&&!newsletter.open&&typeof newsletter.showModal==='function')newsletter.showModal();
   });
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
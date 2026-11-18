/* Boudie Eats × What To Eat — production-isolated demo enhancements.
   No API keys. No Supabase calls. No Facebook scraping or membership claims. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const storageKey = 'boudie-eats-wte-prototype-recommendations-v1';
  const lang = () => document.body.dataset.lang === 'en' ? 'en' : 'ar';
  const messages = {
    ar: {
      mapNoteLive:'خريطة OpenStreetMap قابلة للتحريك والتكبير. لا تظهر نقاط مطاعم بدون إحداثيات موثقة.',
      nearbyBtn:'حدد مكاني بموافقتي',searchLiveMaps:'دور في Google Maps ↗',
      contributeEyebrow:'INDEX / تجربة تفاعلية',contributeTitle:'ضيف ترشيح للمؤشر التجريبي',
      contributeNote:'التجربة دي بتخزن اسم المطعم والأكلة والمنطقة في متصفحك فقط، مش على Supabase أو فيسبوك.',
      contributeName:'اسم المطعم',contributeDish:'الأكلة',contributeArea:'المنطقة',
      saveContribution:'احفظ الترشيح في المعاينة',clearContributions:'امسح إضافاتي',
      printGuide:'حفظ دليل تجريبي PDF ↗',saved:'اتضاف الترشيح في المؤشر التجريبي على جهازك.',cleared:'اتمسحت إضافاتك المحلية.',
      geoSuccess:'موقعك ظاهر على الخريطة، من غير حفظ للإحداثيات.',geoFail:'مش قادرين نحدد مكانك. تقدر تستخدم البحث العادي.',
      mapFail:'تعذر تحميل OpenStreetMap؛ البحث من Google Maps لا يزال متاحًا.'
    },
    en: {
      mapNoteLive:'An interactive OpenStreetMap. Restaurant pins are not fabricated without verified locations.',
      nearbyBtn:'Locate me (with permission)',searchLiveMaps:'Search Google Maps ↗',
      contributeEyebrow:'INDEX / INTERACTIVE DEMO',contributeTitle:'Add a restaurant to the demo index',
      contributeNote:'Restaurant, dish and area are stored only in this browser, never sent to Supabase or Facebook.',
      contributeName:'Restaurant name',contributeDish:'Dish',contributeArea:'Area',
      saveContribution:'Save in demo',clearContributions:'Clear my additions',
      printGuide:'Print sample guide / save PDF ↗',saved:'Your suggestion was added to this browser’s demo index.',cleared:'Your local additions have been cleared.',
      geoSuccess:'Your current position is on the map. It was not saved.',geoFail:'Location unavailable or permission was denied. You can still search.',
      mapFail:'OpenStreetMap could not load; Google Maps search remains available.'
    }
  };
  const t = key => messages[lang()][key] || key;
  let map=null, marker=null;
  function localRecords(){
    try {
      const obj=JSON.parse(localStorage.getItem(storageKey)||'[]');
      return Array.isArray(obj) ? obj.filter(r => r && typeof r.name==='string' && Array.isArray(r.dish)).slice(-35) : [];
    } catch(e) { return []; }
  }
  function reloadResults(){
    window.BE_CUSTOM_RECORDS=localRecords();
    const dish=$('dish'),area=$('areaSelect');
    if(dish)dish.dispatchEvent(new Event('input',{bubbles:true}));
    if(area)area.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function translateExtra(){
    document.querySelectorAll('#besor3aTab [data-t],#guideTab [data-t]').forEach(el=>{
      const value=messages[lang()][el.dataset.t];
      if(value)el.textContent=value;
    });
  }
  function showMap(){
    const element=$('interactiveMap');
    if(!element || element.closest('[hidden]')) return;
    if(typeof window.L === 'undefined'){
      element.textContent=t('mapFail'); return;
    }
    if(!map){
      map=L.map(element,{scrollWheelZoom:false}).setView([30.0444,31.2357],11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,
        attribution:'&copy; OpenStreetMap contributors'
      }).addTo(map);
    }
    setTimeout(()=>map.invalidateSize(),90);
  }
  function searchExternal(){
    const dish=($('dish')?.value||'').trim()||'restaurants';
    const city=$('city')?.value||'all';
    const area=city==='all'?'Cairo, Egypt':city+', Cairo, Egypt';
    // An external general restaurant search, NOT sourced from private group posts.
    const query=encodeURIComponent(dish+' '+area);
    window.open('https://www.google.com/maps/search/?api=1&query='+query,'_blank','noopener,noreferrer');
  }
  function locateMe(){
    if(!navigator.geolocation){$('geoMessage').textContent=t('geoFail');return;}
    navigator.geolocation.getCurrentPosition(
      position=>{
        showMap();if(!map)return;
        const c=[position.coords.latitude,position.coords.longitude];
        if(marker)map.removeLayer(marker);
        marker=L.marker(c).addTo(map).bindPopup(lang()==='ar'?'موقعك الحالي (مش محفوظ)':'Your location (not saved)');
        map.setView(c,13);marker.openPopup();
        $('geoMessage').textContent=t('geoSuccess');
      },
      ()=>{$('geoMessage').textContent=t('geoFail')},
      {enableHighAccuracy:false,timeout:12000,maximumAge:10000}
    );
  }
  function saveSuggestion(event){
    event.preventDefault();
    const name=$('contributeName').value.trim().slice(0,75);
    const dish=$('contributeDish').value.trim().slice(0,55);
    const area=$('contributeArea').value;
    if(!name||!dish)return;
    const saved=localRecords();
    if(saved.length>=35)saved.shift();
    saved.push({name,dish:[dish],area,
      noteAr:'ترشيح أدخلته بنفسك — محفوظ على جهازك فقط ولم يراجعه أحد.',
      noteEn:'Your locally entered recommendation — not verified or reviewed.',
      localDemo:true});
    try{localStorage.setItem(storageKey,JSON.stringify(saved))}
    catch(e){$('contributeFeedback').textContent='Local storage is unavailable';return}
    $('contributeForm').reset();
    $('contributeFeedback').textContent=t('saved');
    reloadResults();
  }
  function clearSuggestions(){
    try{localStorage.removeItem(storageKey)}catch(e){}
    $('contributeFeedback').textContent=t('cleared');
    reloadResults();
  }
  function escapeHTML(value){
    return String(value).replace(/[&<>"']/g, char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function printSampleGuide(){
    const ar=lang()==='ar';
    const records=[
      {name:'Tabali',dish:['Foul','Taameya'],area:'Korba'},
      {name:'Cilantro',dish:['Iced Latte','Coffee'],area:'Cairo'},
      {name:'La Mie',dish:['Flat White','Coffee'],area:'Cairo'},
      {name:'Yokal',dish:['Sandwich'],area:'Heliopolis'},
      ...localRecords()
    ];
    const title=ar?'بودي إيتس — دليل طباعة تجريبي':'Boudie Eats — Printable Guide Demo';
    const note=ar?'معاينة فقط، ليست توصيات موثقة أو رسمية من What To Eat. راجع مصادر كل تجربة قبل الاستخدام.':'Demo records only. Not verified or official What To Eat recommendations.';
    const rows=records.map(r=>'<li><strong>'+escapeHTML(r.name)+'</strong> — '+escapeHTML(r.dish.join(' / '))+' — '+escapeHTML(r.area)+'</li>').join('');
    const pop=window.open('','_blank');
    if(!pop)return;
    pop.document.write('<!doctype html><html dir="'+(ar?'rtl':'ltr')+'" lang="'+lang()+'"><head><meta charset="utf-8"><title>'+escapeHTML(title)+'</title><style>body{font:17px/1.75 Arial,sans-serif;margin:35px auto;max-width:760px;color:#49273b;padding:0 20px}h1{border-bottom:3px solid #ac343c;padding-bottom:12px}li{margin:12px 0}.notice{background:#f6eddd;padding:14px}button{background:#ac343c;color:white;border:0;padding:12px 16px}@media print{button{display:none}body{margin:0}}</style></head><body><h1>'+escapeHTML(title)+'</h1><p class="notice">'+escapeHTML(note)+'</p><h2>'+(ar?'فهرس المطاعم التجريبي':'Sample index')+'</h2><ul>'+rows+'</ul><button onclick="window.print()">'+(ar?'طباعة / حفظ PDF':'Print / Save PDF')+'</button></body></html>');
    pop.document.close();pop.focus();
  }
  function ready(){
    reloadResults();translateExtra();
    const mapTab=$('besor3aTab');
    if(mapTab){
      new MutationObserver(()=>{if(!mapTab.hidden)showMap()})
        .observe(mapTab,{attributes:true,attributeFilter:['hidden']});
    }
    $('useMyLocation')?.addEventListener('click',locateMe);
    $('searchLiveMaps')?.addEventListener('click',searchExternal);
    $('contributeForm')?.addEventListener('submit',saveSuggestion);
    $('clearContributions')?.addEventListener('click',clearSuggestions);
    $('printGuide')?.addEventListener('click',printSampleGuide);
    document.querySelectorAll('[data-lang-set]').forEach(btn=>btn.addEventListener('click',()=>{
      setTimeout(translateExtra,0);
    }));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);
  else ready();
})();
// Boudie Eats | What to Eat. Public key only; database RLS is authoritative.
const cfg=window.BE_WTE_CONFIG||{};
const ar=document.documentElement.lang.startsWith('ar');
const t=(en,arabic)=>ar?arabic:en;
const editor=document.body.dataset.wteMode==='editor';
const root=document.getElementById('wte-root');
const state={client:null,user:null,role:null,settings:null,terms:[],places:[],notes:[],editing:null,editingTerm:null,search:'',city:'',cuisine:'',price:''};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validUrl=v=>{if(!v)return '';try{const x=new URL(v);return x.protocol==='https:'?x.href:'';}catch{return '';}};
const staff=()=>['editor','admin'].includes(state.role);
const admin=()=>state.role==='admin';
const live=()=>Boolean(state.settings?.site_enabled&&state.settings?.partner_approved);
const termName=x=>ar?x.label_ar:x.label_en;
const placeName=x=>ar?x.name_ar:x.name_en;
const byId=id=>state.terms.find(x=>x.id===id);
const localized=(x,n)=>x[n+(ar?'_ar':'_en')]||x[n+'_en']||'';
const priceLabel=x=>({budget:t('Budget','اقتصادي'),mid:t('Moderate','متوسط'),premium:t('Premium','فاخر')})[x]||x;
function message(s,error=false){const el=document.getElementById('wte-status');if(el){el.textContent=s||'';el.dataset.error=error?'true':'false';}}
function field(name,label,value='',type='text',required=false){
  return '<label class="wte-field"><span>'+esc(label)+'</span><input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+(required?'required ':'')+'></label>';
}
function area(name,label,value=''){return '<label class="wte-field"><span>'+esc(label)+'</span><textarea name="'+name+'" rows="3">'+esc(value)+'</textarea></label>';}
function selectField(name,label,options,value,required=false){
  return '<label class="wte-field"><span>'+esc(label)+'</span><select name="'+name+'" '+(required?'required':'')+'>'+
  (required?'<option value="">'+t('Choose…','اختار…')+'</option>':'')+
  options.map(o=>'<option value="'+esc(o[0])+'" '+(String(o[0])===String(value)?'selected':'')+'>'+esc(o[1])+'</option>').join('')+
  '</select></label>';
}
function check(name,label,checked=false){return '<label class="wte-check"><input type="checkbox" name="'+name+'" '+(checked?'checked':'')+'><span>'+esc(label)+'</span></label>';}
function panel(title,body){return '<section class="wte-panel"><h2>'+title+'</h2>'+body+'</section>';}
function login(){
  root.innerHTML='<div class="wte-intro"><p class="wte-eyebrow">'+t('Private collaboration','تعاون خاص')+'</p><h1>'+t('What to Eat','ناكل إيه؟')+'</h1><p>'+t('This guide has not been released. Approved editors can sign in to review it.','الدليل لسه ما اتنشرش. فريق التحرير المعتمد يقدر يدخل ويراجعه.')+'</p></div>'+
  panel(t('Editorial sign-in','دخول فريق التحرير'),'<form id="wte-login" class="wte-form">'+field('email',t('Email','البريد الإلكتروني'),'','email',true)+field('password',t('Password','كلمة المرور'),'','password',true)+'<button class="wte-primary" type="submit">'+t('Sign in','دخول')+'</button></form>')+
  '<p id="wte-status" class="wte-status" role="status" aria-live="polite"></p>';
}
function notFound(){
  // Do not reveal the unreleased partnership even when someone guesses the URL.
  root.innerHTML='<div class="wte-intro"><h1>'+t('Page not found','الصفحة غير موجودة')+'</h1><p>'+t('The page you requested is unavailable.','الصفحة المطلوبة غير متاحة.')+'</p><a href="'+esc(cfg.basePath+(ar?'ar/':''))+'">'+t('Return home','العودة للرئيسية')+'</a></div>';
}
function denied(){
  root.innerHTML='<div class="wte-intro"><p class="wte-eyebrow">'+t('Not published','لم يُنشر بعد')+'</p><h1>'+t('What to Eat','ناكل إيه؟')+'</h1><p>'+t('This section is reserved for the collaboration team until approval.','القسم ده مخصص لفريق التعاون لحد الموافقة النهائية.')+'</p><a href="'+esc(cfg.basePath+(ar?'ar/':'')+'editorial-desk/')+'">'+t('Editorial desk','مكتب التحرير')+'</a></div><p id="wte-status" class="wte-status"></p>';
}
function filterBar(){
  const cities=state.terms.filter(x=>x.kind==='city'&&(x.active||staff())).sort((a,b)=>a.position-b.position);
  const cuisines=state.terms.filter(x=>x.kind==='cuisine'&&(x.active||staff())).sort((a,b)=>a.position-b.position);
  return '<div class="wte-filters" aria-label="'+t('Food guide filters','فلاتر دليل الأكل')+'">'+
  '<label class="wte-field"><span>'+t('Search','بحث')+'</span><input data-filter="search" placeholder="'+t('Restaurant, dish or district','مطعم أو أكلة أو منطقة')+'" value="'+esc(state.search)+'"></label>'+
  selectField('city',t('City','المدينة'),[['',t('All cities','كل المدن')],...cities.map(x=>[x.id,termName(x)])],state.city)+
  selectField('cuisine',t('Cuisine','نوع المطبخ'),[['',t('All cuisines','كل المطابخ')],...cuisines.map(x=>[x.id,termName(x)])],state.cuisine)+
  selectField('price',t('Price','السعر'),[['',t('All prices','كل الأسعار')],['budget',priceLabel('budget')],['mid',priceLabel('mid')],['premium',priceLabel('premium')]],state.price)+
  '</div>';
}
function visiblePlaces(){
  return state.places.filter(p=>{
    if(!staff()&&p.status!=='published')return false;
    if(state.city&&p.city_id!==state.city)return false;
    if(state.cuisine&&p.cuisine_id!==state.cuisine)return false;
    if(state.price&&p.price_band!==state.price)return false;
    const q=state.search.trim().toLocaleLowerCase();
    if(!q)return true;
    return [p.name_en,p.name_ar,p.district_en,p.district_ar,p.summary_en,p.summary_ar,p.must_try_en,p.must_try_ar,byId(p.city_id)?.label_en,byId(p.cuisine_id)?.label_en,...(p.tags||[])].join(' ').toLocaleLowerCase().includes(q);
  }).sort((a,b)=>Number(b.featured)-Number(a.featured)||a.position-b.position||placeName(a).localeCompare(placeName(b)));
}
function cards(){
  const list=visiblePlaces();
  if(!list.length)return '<div class="wte-empty">'+t('No entries match these filters yet.','مفيش أماكن مطابقة للفلاتر دي لسه.')+'</div>';
  return list.map(p=>{
    const city=byId(p.city_id),cuisine=byId(p.cuisine_id);
    const header='<div class="wte-card-text"><div class="wte-kicker">'+esc(city?termName(city):'')+' · '+esc(cuisine?termName(cuisine):'')+'</div><h3>'+esc(placeName(p))+'</h3>';
    const meta='<p class="wte-card-meta">'+esc(localized(p,'district'))+' · '+esc(priceLabel(p.price_band))+'</p>';
    const summary=localized(p,'summary')?'<p>'+esc(localized(p,'summary'))+'</p>':'';
    const must=localized(p,'must_try')?'<p><strong>'+t('Order this: ','جرب: ')+'</strong>'+esc(localized(p,'must_try'))+'</p>':'';
    const links=[['website_url',t('Website','الموقع')],['instagram_url','Instagram'],['booking_url',t('Booking','الحجز')]].map(([key,label])=>validUrl(p[key])?'<a href="'+esc(validUrl(p[key]))+'" target="_blank" rel="noopener noreferrer">'+label+'</a>':'').join('');
    const controls=editor&&staff()?'<div class="wte-card-actions"><button data-action="edit-place" data-id="'+esc(p.id)+'">'+t('Edit','تعديل')+'</button><button data-action="delete-place" data-id="'+esc(p.id)+'">'+t('Delete','حذف')+'</button></div>':'';
    const badge=staff()?'<span class="wte-state">'+esc(p.status)+(p.partner_reviewed?' · reviewed':'')+'</span>':'';
    const img=p.image_url?'<div class="wte-photo"><img data-image="'+esc(p.id)+'" alt="'+esc(localized(p,'image_alt')||placeName(p))+'" loading="lazy"><small>'+esc(p.image_credit||'')+'</small></div>':'<div class="wte-no-photo">'+t('Photograph pending','الصورة لسه هتتضاف')+'</div>';
    return '<article class="wte-card">'+img+header+meta+badge+summary+must+
      (localized(p,'address')?'<p class="wte-card-meta">'+esc(localized(p,'address'))+'</p>':'')+
      (links?'<div class="wte-links">'+links+'</div>':'')+controls+'</div></article>';
  }).join('');
}
function browse(){
  const isPreview=staff()&&!live();
  root.innerHTML='<div class="wte-intro"><p class="wte-eyebrow">'+t('Boudie Eats · curated food guide','بودي إيتس · دليل الأكل')+'</p><h1>'+t('What to Eat','ناكل إيه؟')+'</h1>'+
    '<p>'+t('Find places by cuisine and city, with carefully written recommendations.','اختار أكلتك ومدينتك، وشوف ترشيحات مكتوبة بعناية.')+'</p>'+
    (isPreview?'<div class="wte-private">'+t('PRIVATE PREVIEW — Not visible to visitors. Launch approval is still off.','معاينة خاصة — مش ظاهرة للزوار. الموافقة على النشر لسه مقفولة.')+'</div>':'')+
    '</div>'+filterBar()+'<p class="wte-count" id="wte-count"></p><div class="wte-results" id="wte-results"></div>'+
    '<p id="wte-status" class="wte-status" role="status" aria-live="polite"></p>';
  updateCards();
}
function updateCards(){
  const el=document.getElementById('wte-results');if(!el)return;
  el.innerHTML=cards();
  document.getElementById('wte-count').textContent=visiblePlaces().length+' '+t('places','مكان');
  hydrateImages();
}
async function hydrateImages(){
  for(const img of document.querySelectorAll('img[data-image]')){
    const p=state.places.find(x=>x.id===img.dataset.image);if(!p)continue;
    if(p.image_url?.startsWith('storage:')){
      const path=p.image_url.slice(8);
      const {data,error}=await state.client.storage.from('be-wte-media').createSignedUrl(path,3600);
      if(!error&&data?.signedUrl)img.src=data.signedUrl;
    }else if(validUrl(p.image_url)){img.src=validUrl(p.image_url);}
  }
}
function termEditor(){
  const x=state.editingTerm||{};
  return panel(t('Cities and cuisines','المدن وأنواع المطابخ'),
    '<p class="wte-hint">'+t('Add each city and cuisine once; they automatically become filter choices.','ضيف كل مدينة أو نوع مطبخ مرة واحدة، وهيظهروا تلقائي في الفلاتر.')+'</p>'+
    '<form id="wte-term-form" class="wte-form"><input type="hidden" name="id" value="'+esc(x.id||'')+'">'+
    selectField('kind',t('Category','التصنيف'),[['city',t('City','مدينة')],['cuisine',t('Cuisine','مطبخ')]],x.kind||'city')+
    field('slug',t('Code (e.g. cairo)','الكود (مثال cairo)'),x.slug||'','text',true)+
    field('label_en',t('English name','الاسم بالإنجليزي'),x.label_en||'','text',true)+field('label_ar',t('Arabic name','الاسم بالعربي'),x.label_ar||'','text',true)+
    field('position',t('Display order','الترتيب'),x.position??0,'number')+check('active',t('Available as a filter','متاح في الفلاتر'),x.active??true)+
    '<div class="wte-buttons"><button class="wte-primary" type="submit">'+t('Save category','حفظ التصنيف')+'</button><button type="button" data-action="reset-term">'+t('New category','تصنيف جديد')+'</button></div></form>'+
    '<div class="wte-term-list">'+state.terms.map(x=>'<div><strong>'+esc(x.kind)+' · '+esc(x.label_en)+' / '+esc(x.label_ar)+'</strong><span><button data-action="edit-term" data-id="'+x.id+'">'+t('Edit','تعديل')+'</button> <button data-action="delete-term" data-id="'+x.id+'">'+t('Delete','حذف')+'</button></span></div>').join('')+'</div>');
}
function placeEditor(){
  const p=state.editing||{};
  const note=state.notes.find(n=>n.place_id===p.id)||{};
  const terms=kind=>state.terms.filter(x=>x.kind===kind).sort((a,b)=>a.position-b.position).map(x=>[x.id,termName(x)]);
  const checked=key=>Boolean(p[key]);
  return panel(t('Restaurant / food entry','مطعم أو مكان أكل'),
    '<p class="wte-hint">'+t('Save as draft until the collaboration is approved. No made-up locations or photography.','احفظ كمسودة لحد الموافقة النهائية. من غير أماكن أو صور مولّدة.')+'</p>'+
    '<form id="wte-place-form" class="wte-form"><input type="hidden" name="id" value="'+esc(p.id||'')+'">'+
    '<div class="wte-form-grid">'+
    field('slug',t('URL code','الكود'),p.slug||'','text',true)+
    selectField('city_id',t('City','المدينة'),terms('city'),p.city_id,true)+
    selectField('cuisine_id',t('Cuisine','نوع الأكل'),terms('cuisine'),p.cuisine_id,true)+
    selectField('price_band',t('Price band','فئة السعر'),[['budget',priceLabel('budget')],['mid',priceLabel('mid')],['premium',priceLabel('premium')]],p.price_band||'mid')+
    field('name_en',t('Name in English','الاسم بالإنجليزي'),p.name_en||'','text',true)+field('name_ar',t('Name in Arabic','الاسم بالعربي'),p.name_ar||'','text',true)+
    field('district_en',t('District (English)','المنطقة بالإنجليزي'),p.district_en)+field('district_ar',t('District (Arabic)','المنطقة بالعربي'),p.district_ar)+
    field('address_en',t('Address (English)','العنوان بالإنجليزي'),p.address_en)+field('address_ar',t('Address (Arabic)','العنوان بالعربي'),p.address_ar)+
    '</div><div class="wte-form-grid">'+area('summary_en',t('Review / description (English)','الوصف بالإنجليزي'),p.summary_en)+area('summary_ar',t('Review / description (Arabic)','الوصف بالعربي'),p.summary_ar)+
    area('must_try_en',t('Must try (English)','أهم طلب بالإنجليزي'),p.must_try_en)+area('must_try_ar',t('Must try (Arabic)','أهم طلب بالعربي'),p.must_try_ar)+
    '</div><div class="wte-form-grid">'+
    field('website_url',t('Official website URL','رابط الموقع'),p.website_url||'','url')+
    field('instagram_url','Instagram URL',p.instagram_url||'','url')+
    field('booking_url',t('Booking URL','رابط الحجز'),p.booking_url||'','url')+
    field('image_url',t('Image URL or uploaded storage path','رابط الصورة أو مسار الصورة'),p.image_url||'')+
    field('image_alt_en',t('Image alt text English','وصف الصورة بالإنجليزي'),p.image_alt_en)+field('image_alt_ar',t('Image alt text Arabic','وصف الصورة بالعربي'),p.image_alt_ar)+
    field('image_credit',t('Photographer credit','حقوق المصور'),p.image_credit)+
    field('tags',t('Tags (comma separated)','وسوم مفصولة بفواصل'),(p.tags||[]).join(', '))+
    field('position',t('Display order','الترتيب'),p.position??0,'number')+
    selectField('status',t('Publishing status','حالة النشر'),[['draft',t('Draft','مسودة')],['ready',t('Ready for review','جاهز للمراجعة')],['published',t('Published after approval','منشور بعد الموافقة')]],p.status||'draft')+
    '</div><div class="wte-form-grid">'+check('featured',t('Featured entry','ترشيح مميز'),checked('featured'))+
    check('partner_reviewed',t('Partner approved this entry','الشريك وافق على المكان'),checked('partner_reviewed'))+
    check('image_rights_confirmed',t('I own or have permission to use this image','أملك حقوق استخدام الصورة أو حصلت على إذن'),checked('image_rights_confirmed'))+'</div>'+
    '<div class="wte-upload"><label>'+t('Upload original food photo (JPG/PNG/WebP/AVIF, up to 5 MB)','ارفع صورتك الأصلية (بحد أقصى ٥ ميجا)')+'<input id="wte-upload-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label><button type="button" data-action="upload">'+t('Upload photo','ارفع الصورة')+'</button></div>'+
    area('editorial_notes',t('Private editor notes','ملاحظات تحريرية خاصة'),note.editorial_notes||'')+
    area('source_reference',t('Private evidence / sources','المصادر والمراجع الخاصة'),note.source_reference||'')+
    '<div class="wte-buttons"><button class="wte-primary" type="submit">'+t('Save entry','حفظ المكان')+'</button><button type="button" data-action="reset-place">'+t('New entry','مكان جديد')+'</button></div></form>');
}
function launchEditor(){
  const s=state.settings||{};
  if(!admin())return panel(t('Launch settings','إعدادات الإطلاق'),
    '<p>'+t('Only an administrator can open this guide publicly.','مدير الموقع فقط يقدر يفتح الدليل للجمهور.')+'</p>');
  return panel(t('Collaboration launch controls','التحكم في إطلاق التعاون'),
    '<p class="wte-private">'+t('Keep both switches OFF until the partnership is finalized. Public access requires BOTH switches.','سيب الزرين مقفولين لحد ما الاتفاق يخلص. النشر العام محتاج الاتنين مع بعض.')+'</p>'+
    '<form id="wte-settings-form" class="wte-form">'+
    check('partner_approved',t('Final collaboration approval received','تمت الموافقة النهائية على التعاون'),s.partner_approved)+
    check('site_enabled',t('Make approved entries publicly accessible','فتح الأماكن المعتمدة للزوار'),s.site_enabled)+
    field('pdf_url',t('PDF link (add only when finalized)','رابط ملف PDF بعد الاتفاق'),s.pdf_url||'','url')+
    '<button type="submit" class="wte-primary">'+t('Save launch settings','حفظ إعدادات الإطلاق')+'</button></form>');
}
function renderEditor(){
  if(!staff()){denied();return;}
  root.innerHTML='<div class="wte-intro"><p class="wte-eyebrow">'+t('Editorial desk / Private workspace','مكتب التحرير / مساحة خاصة')+'</p><h1>'+t('What to Eat · Editor','ناكل إيه؟ · التحرير')+'</h1><p>'+t('A complete editable directory, ready to be reviewed without making it public.','دليل قابل للتحرير بالكامل، جاهز للمراجعة من غير نشر للجمهور.')+'</p>'+
  '<div class="wte-private">'+(live()?t('PUBLIC LAUNCH ENABLED','النشر العام مفتوح'):t('HIDDEN & LIVE IN PRIVATE MODE','القسم شغال وخاص لحد الموافقة'))+'</div></div>'+
  '<div class="wte-buttons"><a class="wte-button" href="'+esc(cfg.basePath+(ar?'ar/':'')+'what-to-eat/')+'">'+t('Open visitor preview','معاينة صفحة الزائر')+'</a><a class="wte-button" href="'+esc(cfg.basePath+(ar?'ar/':'')+'editorial-desk/')+'">'+t('Back to Editorial Desk','العودة لمكتب التحرير')+'</a></div>'+
  '<p id="wte-status" class="wte-status" role="status" aria-live="polite"></p>'+
  launchEditor()+'<div class="wte-editor-columns">'+termEditor()+placeEditor()+'</div>'+
  panel(t('Current entries','الأماكن المضافة'),'<p class="wte-hint">'+state.places.length+' '+t('entries saved','مكان محفوظ')+'</p><div class="wte-list">'+
  state.places.map(p=>'<div><span><strong>'+esc(placeName(p))+'</strong><small>'+esc(p.status)+' · '+esc(p.slug)+'</small></span><span><button data-action="edit-place" data-id="'+p.id+'">'+t('Edit','تعديل')+'</button> <button data-action="delete-place" data-id="'+p.id+'">'+t('Delete','حذف')+'</button></span></div>').join('')+'</div>');
}
function render(){
  if(editor){if(staff())renderEditor();else if(state.user)denied();else login();return;}
  if(!live()&&!staff()){notFound();return;}
  browse();
}
async function refresh(){
  const {data:who}=await state.client.auth.getUser();
  state.user=who?.user||null;
  state.role=null;
  if(state.user){
    const {data}=await state.client.from('be_profiles').select('role').eq('id',state.user.id).maybeSingle();
    state.role=data?.role||null;
  }
  const settings=await state.client.from('be_wte_settings').select('*').eq('id',1).maybeSingle();
  if(settings.error)throw settings.error;
  state.settings=settings.data;
  if(!staff()&&!live()){state.terms=[];state.places=[];state.notes=[];render();return;}
  const [terms,places]=await Promise.all([
    state.client.from('be_wte_terms').select('*').order('position',{ascending:true}),
    state.client.from('be_wte_places').select('*').order('position',{ascending:true})
  ]);
  if(terms.error)throw terms.error;if(places.error)throw places.error;
  state.terms=terms.data||[];state.places=places.data||[];
  if(editor&&staff()){
    const notes=await state.client.from('be_wte_place_notes').select('*');
    if(notes.error)throw notes.error;state.notes=notes.data||[];
  }
  render();
}
function payload(form,names){
  const fd=new FormData(form),out={};
  for(const name of names)out[name]=String(fd.get(name)||'').trim();
  return out;
}
const getForm=name=>document.getElementById(name);
async function saveTerm(form){
  const data=payload(form,['kind','slug','label_en','label_ar']);
  data.slug=data.slug.toLowerCase();
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug))throw Error(t('Use a lowercase hyphenated code.','الكود لازم حروف إنجليزي صغيرة أو أرقام وشرطات.'));
  data.position=Number(new FormData(form).get('position'))||0;
  data.active=form.elements.active.checked;
  const id=new FormData(form).get('id');
  const q=id?state.client.from('be_wte_terms').update(data).eq('id',id):state.client.from('be_wte_terms').insert(data);
  const {error}=await q;if(error)throw error;
  state.editingTerm=null;await refresh();message(t('Category saved.','تم حفظ التصنيف.'));
}
async function savePlace(form){
  const names=['slug','name_en','name_ar','city_id','cuisine_id','district_en','district_ar','summary_en','summary_ar','must_try_en','must_try_ar','address_en','address_ar','price_band','image_url','image_alt_en','image_alt_ar','image_credit','website_url','instagram_url','booking_url','status'];
  const data=payload(form,names);data.slug=data.slug.toLowerCase();
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug))throw Error(t('The URL code must be lowercase, letters, numbers and hyphens.','الكود لازم حروف صغيرة وأرقام وشرطات.'));
  for(const x of ['website_url','instagram_url','booking_url']){if(data[x]&&!validUrl(data[x]))throw Error(t('Use a secure https:// URL for '+x,'استخدم رابط https صحيح: '+x));if(!data[x])data[x]=null;}
  if(data.image_url&&!data.image_url.startsWith('storage:')&&!validUrl(data.image_url))throw Error(t('Image must be an https URL or uploaded file path.','الصورة لازم رابط https أو ملف مرفوع.'));
  if(!data.image_url)data.image_url=null;
  data.tags=String(new FormData(form).get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,20);
  data.position=Number(new FormData(form).get('position'))||0;
  for(const x of ['featured','partner_reviewed','image_rights_confirmed'])data[x]=form.elements[x].checked;
  if(data.status==='published'&&!data.partner_reviewed)throw Error(t('Partner approval is required to publish an entry.','لازم موافقة الشريك قبل نشر المكان.'));
  if(data.status==='published'&&data.image_url&&!data.image_rights_confirmed)throw Error(t('Confirm photo rights before publishing.','أكّد حقوق الصورة قبل النشر.'));
  const id=new FormData(form).get('id');
  const q=id?state.client.from('be_wte_places').update({...data,updated_at:new Date().toISOString()}).eq('id',id).select('id').single():
    state.client.from('be_wte_places').insert(data).select('id').single();
  const {data:record,error}=await q;if(error)throw error;
  const note={place_id:record.id,editorial_notes:String(new FormData(form).get('editorial_notes')||''),source_reference:String(new FormData(form).get('source_reference')||''),updated_by:state.user.id,updated_at:new Date().toISOString()};
  const result=await state.client.from('be_wte_place_notes').upsert(note,{onConflict:'place_id'});
  if(result.error)throw Error(t('Entry saved, but private notes failed: ','المكان اتحفظ لكن الملاحظات لم تُحفظ: ')+result.error.message);
  state.editing=null;await refresh();message(t('Entry saved privately.','تم حفظ المكان في الدليل الخاص.'));
}
async function uploadPhoto(form){
  const file=document.getElementById('wte-upload-file')?.files?.[0];
  if(!file)throw Error(t('Choose a photo first.','اختار صورة الأول.'));
  const allowed={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};
  if(!allowed[file.type]||file.size>5242880)throw Error(t('Use JPG, PNG, WebP or AVIF, under 5 MB.','الصورة لازم JPG أو PNG أو WebP أو AVIF وأقل من ٥ ميجا.'));
  const slug=String(new FormData(form).get('slug')||'').toLowerCase();
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))throw Error(t('Enter a valid URL code first.','اكتب الكود الصحيح الأول.'));
  const path=slug+'/'+crypto.randomUUID()+'.'+allowed[file.type];
  const {error}=await state.client.storage.from('be-wte-media').upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw error;
  form.elements.image_url.value='storage:'+path;
  message(t('Photo uploaded privately. Save the entry to attach it.','الصورة اترفعت بشكل خاص. احفظ المكان علشان تربطها بيه.'));
}
root.addEventListener('submit',async ev=>{
  const form=ev.target;if(!['wte-login','wte-settings-form','wte-term-form','wte-place-form'].includes(form.id))return;
  ev.preventDefault();const b=form.querySelector('button[type=submit]');if(b)b.disabled=true;
  try{
    if(form.id==='wte-login'){
      const {error}=await state.client.auth.signInWithPassword({email:form.elements.email.value,password:form.elements.password.value});
      if(error)throw error;await refresh();return;
    }
    if(!staff())throw Error(t('Editor access required.','مطلوب صلاحية محرر.'));
    if(form.id==='wte-settings-form'){
      if(!admin())throw Error(t('Admin access required.','مطلوب صلاحية مدير.'));
      const data={site_enabled:form.elements.site_enabled.checked,partner_approved:form.elements.partner_approved.checked,pdf_url:validUrl(form.elements.pdf_url.value)||null,updated_at:new Date().toISOString()};
      if(form.elements.pdf_url.value&&!data.pdf_url)throw Error(t('Use an https URL for the final PDF.','استخدم رابط https للملف النهائي.'));
      const {error}=await state.client.from('be_wte_settings').update(data).eq('id',1);if(error)throw error;
      await refresh();message(t('Launch settings saved.','تم حفظ إعدادات الإطلاق.'));return;
    }
    if(form.id==='wte-term-form')await saveTerm(form);
    if(form.id==='wte-place-form')await savePlace(form);
  }catch(e){message(e.message||t('Request failed.','فيه مشكلة في الطلب.'),true);}
  finally{if(b&&b.isConnected)b.disabled=false;}
});
root.addEventListener('change',e=>{
  const el=e.target;if(!el.name||!['city','cuisine','price'].includes(el.name)||editor)return;
  state[el.name]=el.value;updateCards();
});
root.addEventListener('input',e=>{
  if(!editor&&e.target.dataset.filter==='search'){state.search=e.target.value;updateCards();}
});
root.addEventListener('click',async e=>{
  const b=e.target.closest('button[data-action]');if(!b||!staff())return;
  const action=b.dataset.action,id=b.dataset.id;
  try{
    if(action==='edit-place'){state.editing=state.places.find(x=>x.id===id);renderEditor();getForm('wte-place-form')?.scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(action==='edit-term'){state.editingTerm=state.terms.find(x=>x.id===id);renderEditor();getForm('wte-term-form')?.scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(action==='reset-place'){state.editing=null;renderEditor();return;}
    if(action==='reset-term'){state.editingTerm=null;renderEditor();return;}
    if(action==='upload'){b.disabled=true;await uploadPhoto(getForm('wte-place-form'));return;}
    if(action==='delete-place'){
      if(!confirm(t('Permanently delete this entry and its private notes?','حذف المكان وملاحظاته الخاصة نهائياً؟')))return;
      const {error}=await state.client.from('be_wte_places').delete().eq('id',id);if(error)throw error;
      state.editing=null;await refresh();message(t('Entry deleted.','تم حذف المكان.'));return;
    }
    if(action==='delete-term'){
      if(!confirm(t('Delete this filter category? Referenced terms cannot be deleted.','حذف التصنيف؟ لا يمكن حذف تصنيف مرتبط بأماكن.')))return;
      const {error}=await state.client.from('be_wte_terms').delete().eq('id',id);if(error)throw error;
      state.editingTerm=null;await refresh();message(t('Category deleted.','تم حذف التصنيف.'));return;
    }
  }catch(ex){message(ex.message||t('Action failed.','تعذر التنفيذ.'),true);}
  finally{if(b.isConnected)b.disabled=false;}
});
async function main(){
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.url||'')||!/^sb_publishable_/.test(cfg.publishableKey||'')){denied();return;}
  try{
    const lib=await import('https://esm.sh/@supabase/supabase-js@2.119.0?bundle');
    state.client=lib.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
    await refresh();
  }catch(e){denied();message(t('The guide is temporarily unavailable.','الدليل غير متاح مؤقتاً.'),true);}
}
main();
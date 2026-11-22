// Boudie Eats members can propose content, not publish it.
// All reads/writes use the signed-in member's JWT and server-side RLS.
// Source content and image uploads remain private until editorial approval.
const tr=(ar,en,arabic)=>ar?arabic:en;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds={
  recipe:['Your recipe','وصفتك'],
  place:['A place for the City Guide','مكان لدليل المدن'],
  review:['Restaurant or café review','تجربة مطعم أو كافيه'],
  mama_pick:['Nominate a Mama Pick','رشّح اختيار ماما'],
  dish_idea:['Suggest a dish','اقترح أكلة'],
  gallery_photo:['Contribute a food photo','شارك صورة أكل'],
  spotlight_story:['Nominate a food maker','رشّح حد ورا حكاية أكل'],
  passport_idea:['Suggest a Passport challenge','اقترح تحدّي لجواز بودي'],
  food_lab_idea:['A fusion idea for Food Lab','فكرة فيوجن لمعمل الأكل']
};
const defaults={
  home:'recipe','mama-picks':'mama_pick','dish-finder':'dish_idea',
  'city-guide':'place',gallery:'gallery_photo',spotlight:'spotlight_story',
  passport:'passport_idea','food-lab':'food_lab_idea'
};
const statuses={
  pending:['Pending','قيد المراجعة'],
  in_review:['In review','تحت المراجعة'],
  approved:['Approved','تمت الموافقة'],
  declined:['Not approved','لم تُقبل']
};
function field(name,en,arLabel,locale,extra={}){
  const required=extra.required!==false;
  const type=extra.type||'text';
  const max=Number(extra.max||140);
  const attributes=' name="'+name+'" '+(required?'required ':'')+
    'maxlength="'+max+'" type="'+type+'" '+(extra.placeholder?'placeholder="'+esc(tr(locale,extra.placeholder[0],extra.placeholder[1]))+'" ':'');
  return '<label class="be-share-field"><span>'+tr(locale,en,arLabel)+'</span>'+
    '<input'+attributes+'></label>';
}
function textarea(name,en,arLabel,locale,{min=15,max=6000,rows=3}={}){
  return '<label class="be-share-field"><span>'+tr(locale,en,arLabel)+'</span>'+
    '<textarea name="'+name+'" required minlength="'+min+'" maxlength="'+max+'" rows="'+rows+'"></textarea></label>';
}
function description(locale,labelEn='Tell us the details',labelAr='احكيلنا التفاصيل'){
  return textarea('description',labelEn,labelAr,locale,{rows:4});
}
function details(kind,ar){
  switch(kind){
    case 'recipe':return field('title','Recipe name','اسم الوصفة',ar)+
      description(ar,'What makes this recipe yours?','إيه اللي بيميز وصفتك؟')+
      textarea('ingredients','Ingredients and amounts','المكونات والمقادير',ar,{min:3,rows:4})+
      textarea('instructions','How to prepare it, step by step','طريقة التحضير خطوة بخطوة',ar,{rows:5});
    case 'place':return field('title','Place name','اسم المكان',ar)+
      field('city','City','المدينة',ar,{max:120})+
      field('cuisine','Type of food (optional)','نوع الأكل (اختياري)',ar,{max:100,required:false})+
      description(ar,'Location, what to order and why it deserves a visit','المنطقة ونطلب إيه وليه يستحق الزيارة');
    case 'review':return field('restaurant_name','Restaurant or café','المطعم أو الكافيه',ar)+
      field('title','Review headline','عنوان تجربتك',ar)+
      field('city','City (optional)','المدينة (اختياري)',ar,{max:120,required:false})+
      '<label class="be-share-field"><span>'+tr(ar,'Rating','تقييمك')+'</span><select name="rating" required>'+
        '<option value="">'+tr(ar,'Choose a rating','اختار التقييم')+'</option>'+
        [1,2,3,4,5].map(n=>'<option value="'+n+'">'+n+'/5</option>').join('')+'</select></label>'+
      '<label class="be-share-field"><span>'+tr(ar,'Visit date (optional)','تاريخ الزيارة (اختياري)')+
        '</span><input type="date" name="visited_on" max="'+new Date().toISOString().slice(0,10)+'"></label>'+
      description(ar,'What did you order? Taste, service, price and context','طلبت إيه؟ الطعم والخدمة والسعر وظروف الزيارة');
    case 'mama_pick':return field('title','Name of your family favourite','اسم أكلة أو مكان مفضل عند العيلة',ar)+
      field('city','City (optional)','المدينة (اختياري)',ar,{max:120,required:false})+
      description(ar,'Why would your family recommend it? Share a real experience.','ليه العيلة بترشحه؟ احكيلنا عن تجربة حقيقية.');
    case 'dish_idea':return field('title','What dish are you craving?','نفسك في أنهي أكلة؟',ar)+
      field('cuisine','Cuisine (optional)','المطبخ (اختياري)',ar,{max:100,required:false})+
      description(ar,'How do you like it? Ingredients, mood or flavour','بتحبها إزاي؟ المكونات والمود والطعم');
    case 'gallery_photo':return field('title','Photo title','عنوان الصورة',ar)+
      description(ar,'Where and when was it taken, and what does it show?','اتصورت فين وإمتى؟ وإيه حكايتها؟')+
      '<label class="be-share-field"><span>'+tr(ar,'Your original food photo (JPEG, PNG, WEBP — up to 3 MB)','صورة أكل أصلية (JPG أو PNG أو WEBP لحد ٣ ميجابايت)')+
      '</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required></label>';
    case 'spotlight_story':return field('title','Food maker, chef or storyteller','اسم الشخص اللي بترشحه',ar)+
      description(ar,'What is their food story? Only share information you have permission to share.','إيه حكايتهم مع الأكل؟ شارك معلومات مسموح لك تنشرها.')+
      field('source_url','Public link (optional)','رابط عام (اختياري)',ar,{type:'url',max:500,required:false});
    case 'passport_idea':return field('title','A food challenge or discovery','تحدّي أو اكتشاف جديد',ar)+
      description(ar,'Suggest a journey, activity or stamp idea. Badges are awarded by the platform after review.','اقترح رحلة أكل أو نشاط أو فكرة ختم. الشارات بتتمنح من المنصة بعد المراجعة.');
    case 'food_lab_idea':return field('title','Your surprising flavour combination','اسم التركيبة الغريبة',ar)+
      field('ingredients','Ingredients (optional)','المكونات (اختياري)',ar,{max:140,required:false})+
      description(ar,'How does your fusion work? What should we test?','الفيوجن ده بيشتغل إزاي؟ تحبنا نجرب إيه؟');
    default:return '';
  }
}
const kindLabel=(ar,k)=>tr(ar,...(kinds[k]||[k,k]));
const statusLabel=(ar,k)=>tr(ar,...(statuses[k]||[k,k]));
const value=(form,k)=>String(new FormData(form).get(k)||'').trim();
function payload(form,user){
 const data=new FormData(form);
 const k=String(data.get('kind')||'');
 if(!kinds[k])throw Error('Invalid contribution type');
 const get=key=>String(data.get(key)||'').trim();
 const payload={author_id:user.id,kind:k,title:get('title'),description:get('description')};
 if(k==='recipe'){payload.ingredients=get('ingredients');payload.instructions=get('instructions');}
 if(k==='place'||k==='mama_pick'||k==='review')payload.city=get('city');
 if(k==='place'||k==='dish_idea')payload.cuisine=get('cuisine');
 if(k==='food_lab_idea')payload.ingredients=get('ingredients');
 if(k==='review'){
   payload.restaurant_name=get('restaurant_name');payload.rating=Number(get('rating'));
   if(get('visited_on'))payload.visited_on=get('visited_on');
 }
 if(k==='spotlight_story')payload.source_url=get('source_url');
 return payload;
}
async function uploadOriginal(client,user,file){
 if(!(file instanceof File)||file.size===0)throw Error('Select a photo');
 if(file.size>3145728)throw Error('Photo must be at most 3 MB');
 const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
 if(!types[file.type])throw Error('Unsupported image type');
 const name=user.id+'/'+crypto.randomUUID()+'.'+types[file.type];
 const {error}=await client.storage.from('be-member-contributions').upload(name,file,{
   upsert:false,contentType:file.type,cacheControl:'0'
 });
 if(error)throw error;
 return name;
}
function ui(ar,kind){
 const options=Object.keys(kinds).map(key=>
  '<option value="'+key+'"'+(kind===key?' selected':'')+'>'+esc(kindLabel(ar,key))+'</option>').join('');
 return '<div class="be-share-shell">'+
   '<div class="be-share-heading"><span class="be-share-kicker">'+tr(ar,'FROM YOUR TABLE','من سفرتك')+'</span>'+
    '<h2 id="be-share-title">'+tr(ar,'Add your voice.','شاركنا.')+'</h2>'+
    '<p>'+tr(ar,'Suggest something in this experience, or choose another type. Everything is reviewed before publication.','شارك حاجة في القسم ده، أو اختار نوع تاني. كل المشاركات بتتراجع قبل النشر.')+'</p></div>'+
   '<details class="be-share-expander"><summary class="be-share-toggle">'+tr(ar,'Write a contribution','اكتب مشاركة')+
     ' <span aria-hidden="true">＋</span></summary>'+
    '<form class="be-share-form" id="be-share-form">'+
      '<label class="be-share-field"><span>'+tr(ar,'I want to share','عايز أشارك')+'</span>'+
      '<select name="kind" id="be-share-kind">'+options+'</select></label>'+
      '<div id="be-share-fields">'+details(kind,ar)+'</div>'+
      '<label class="be-share-consent"><input type="checkbox" name="rights" required> '+
        tr(ar,'I own this submission or have permission to share it, including any photo.','المشاركة بتاعتي أو معايا إذن إني أشاركها، بما فيها أي صورة.')+'</label>'+
      '<button class="be-share-submit" type="submit">'+tr(ar,'Send for review','ابعت للمراجعة')+'</button>'+
      '<p class="be-share-status" role="status" aria-live="polite"></p></form></details>'+
   '<div class="be-share-queue"><div class="be-share-queue-head"><h3>'+tr(ar,'My submissions','مشاركاتي')+'</h3>'+
     '<button type="button" class="be-share-refresh">'+tr(ar,'Refresh','تحديث')+'</button></div>'+
     '<div class="be-share-queue-list" aria-live="polite">'+tr(ar,'Loading…','بنحمّل…')+'</div></div>'+
  '</div>';
}
function mount(target,{client,user,ar,kind}){
 target.innerHTML=ui(ar,kind);
 const form=target.querySelector('#be-share-form');
 const kindControl=target.querySelector('#be-share-kind');
 const fields=target.querySelector('#be-share-fields');
 const result=target.querySelector('.be-share-status');
 const list=target.querySelector('.be-share-queue-list');
 const refresh=target.querySelector('.be-share-refresh');
 let submitting=false;
 kindControl.addEventListener('change',()=>{fields.innerHTML=details(kindControl.value,ar);result.textContent='';});
 async function load(){
   list.textContent=tr(ar,'Checking your submissions…','بنراجع المشاركات…');
   try{
     const {data,error}=await client.from('be_member_submissions')
       .select('id,kind,title,status,created_at,staff_note').eq('author_id',user.id)
       .order('created_at',{ascending:false}).limit(35);
     if(error)throw error;
     if(!data?.length){
       list.innerHTML='<p class="be-share-empty">'+tr(ar,'Nothing submitted yet. Your ideas will show up here.','مفيش مشاركات لسه. أفكارك هتظهر هنا.')+'</p>';return;
     }
     list.innerHTML=data.map(entry=>
       '<div class="be-share-queue-item"><div><strong>'+esc(entry.title)+'</strong><small>'+
       esc(kindLabel(ar,entry.kind))+' · '+esc(new Date(entry.created_at).toLocaleDateString(ar?'ar-EG':'en-GB'))+
       '</small></div><span class="be-share-status-pill" data-status="'+esc(entry.status)+'">'+
       esc(statusLabel(ar,entry.status))+'</span></div>'+
       (entry.staff_note?'<p class="be-share-editor-note">'+esc(entry.staff_note)+'</p>':'')
     ).join('');
   }catch{
     list.textContent=tr(ar,'Unable to load submissions. Try Refresh.','مش قادرين نحمّل المشاركات. جرّب تحديث.');
   }
 }
 refresh.addEventListener('click',load);
 form.addEventListener('submit',async event=>{
   event.preventDefault();
   if(submitting||!form.reportValidity())return;
   submitting=true;
   const send=form.querySelector('.be-share-submit');send.disabled=true;
   result.dataset.error='false';
   result.textContent=tr(ar,'Sending…','بنبعت…');
   let photoPath='';
   try{
     if(!new FormData(form).get('rights'))throw Error('Permissions confirmation required');
     const item=payload(form,user);
     if(item.kind==='gallery_photo'){
       const file=form.querySelector('[name="photo"]').files[0];
       photoPath=await uploadOriginal(client,user,file);
       item.photo_path=photoPath;
     }
     const {error}=await client.from('be_member_submissions').insert(item);
     if(error)throw error;
     const oldKind=item.kind;
     form.reset();kindControl.value=oldKind;fields.innerHTML=details(oldKind,ar);
     result.textContent=tr(ar,'Submitted. It is now pending editorial review.','وصلتنا مشاركتك، وهي دلوقتي قيد المراجعة.');
     target.querySelector('.be-share-expander').open=false;
     await load();
   }catch(error){
     if(photoPath){try{await client.storage.from('be-member-contributions').remove([photoPath]);}catch{}}
     result.dataset.error='true';
     result.textContent=/hourly/i.test(String(error?.message))?
       tr(ar,'Submission limit reached. Try later.','وصلت لحد المشاركات، جرّب بعد شوية.'):
       tr(ar,'Could not submit. Check the required fields and try again.','مقدرناش نبعت المشاركة. راجع البيانات وجرّب تاني.');
     target.querySelector('.be-share-expander').open=true;
   }finally{send.disabled=false;submitting=false;}
 });
 load();
}
export function mountMemberSubmissions({client,user,ar,view}){
 if(!client||!user)return;
 const target=document.getElementById('be-member-contributions');
 if(!target)return;
 const kind=defaults[view]||'recipe';
 mount(target,{client,user,ar,kind});
}

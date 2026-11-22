// Boudie Eats signed-in member contributions. This module is NOT an editor.
// All inserts and reads run as the authenticated member through Supabase RLS.
const text=(ar,en,arabic)=>ar?arabic:en;
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const descriptions={
 recipe:{en:'Share your own recipe',ar:'شارك وصفتك'},
 place:{en:'Suggest a place',ar:'رشّح مكان'},
 review:{en:'Write a restaurant review',ar:'اكتب تجربة مطعم'}
};
const labels={
 pending:['Pending','قيد المراجعة'],
 in_review:['Being reviewed','تحت المراجعة'],
 approved:['Approved','تمت الموافقة'],
 declined:['Not approved','لم تُقبل']
};
function input(name,label,{type='text',min='',max='',required=true,placeholder=''}={}){
 return '<label class="be-share-field"><span>'+label+'</span><input name="'+name+'" type="'+type+'" '+
  (required?'required ':'')+(min?'min="'+min+'" ':'')+(max?'max="'+max+'" ':'')+
  (placeholder?'placeholder="'+safe(placeholder)+'" ':'')+'></label>';
}
function area(name,label,{rows=3,min=15,max=6000,placeholder=''}={}){
 return '<label class="be-share-field"><span>'+label+'</span><textarea name="'+name+'" required rows="'+rows+
  '" minlength="'+min+'" maxlength="'+max+'"'+(placeholder?' placeholder="'+safe(placeholder)+'"':'')+'></textarea></label>';
}
function fields(kind,ar){
 switch(kind){
 case 'recipe':
  return input('title',text(ar,'Name of your dish','اسم الطبق'),{max:140})+
   area('description',text(ar,'Tell us what makes it special','احكيلنا إيه اللي بيميزه'),{rows:2})+
   area('ingredients',text(ar,'Ingredients and amounts','المكونات والمقادير'),{rows:4,min:3})+
   area('instructions',text(ar,'How you prepare it, step by step','طريقة التحضير خطوة بخطوة'),{rows:5});
 case 'place':
  return input('title',text(ar,'Place name','اسم المكان'),{max:140})+
   input('city',text(ar,'City','المدينة'),{max:120})+
   input('cuisine',text(ar,'Cuisine (optional)','نوع الأكل (اختياري)'),{max:100,required:false})+
   area('description',text(ar,'Why should we visit? Add neighbourhood and what to order.','ليه نروح؟ قولنا المنطقة ونجرب إيه هناك'),{rows:5});
 case 'review':
  return input('restaurant_name',text(ar,'Restaurant or café','المطعم أو الكافيه'),{max:140})+
   input('title',text(ar,'Review headline','عنوان التجربة'),{max:140})+
   input('city',text(ar,'City (optional)','المدينة (اختياري)'),{max:120,required:false})+
   '<label class="be-share-field"><span>'+text(ar,'Your rating','تقييمك')+'</span><select name="rating" required>'+
    '<option value="">'+text(ar,'Choose a rating','اختار تقييم')+'</option>'+
    [1,2,3,4,5].map(n=>'<option value="'+n+'">'+n+' / 5</option>').join('')+'</select></label>'+
   input('visited_on',text(ar,'Date visited (optional)','تاريخ الزيارة (اختياري)'),{type:'date',required:false,max:new Date().toISOString().slice(0,10)})+
   area('description',text(ar,'What did you order? Taste, service and value.','طلبت إيه؟ والطعم والخدمة والقيمة مقابل السعر؟'),{rows:5});
 }
 return '';
}
function statusLabel(ar,status){
 const l=labels[status]||[status,status];
 return text(ar,l[0],l[1]);
}
function layout(ar,initial){
 const options=Object.entries(descriptions).map(([key,d])=>
  '<option value="'+key+'"'+(key===initial?' selected':'')+'>'+safe(text(ar,d.en,d.ar))+'</option>').join('');
 return '<div class="be-share-shell">'+
  '<div class="be-share-heading"><span class="be-share-kicker">'+text(ar,'YOUR VOICE, YOUR FOOD','صوتك وطعمك')+'</span>'+
   '<h2 id="be-share-title">'+text(ar,'Share something good.','شاركنا حاجة حلوة.')+'</h2>'+
   '<p>'+text(ar,'A recipe, a place worth visiting, or a real meal you tried. Your submission goes to review first.','وصفة من مطبخك، مكان يستاهل يتزار، أو أكلة جرّبتها. اللي هتبعته بيتراجع الأول.')+'</p></div>'+
  '<form class="be-share-form" id="be-share-form">'+
   '<label class="be-share-field"><span>'+text(ar,'I want to submit','أنا عايز أشارك')+'</span><select name="kind" id="be-share-kind">'+options+'</select></label>'+
   '<div id="be-share-fields">'+fields(initial,ar)+'</div>'+
   '<label class="be-share-consent"><input type="checkbox" name="rights" required> '+
    text(ar,'This is my own experience or recipe, and I give permission for Boudie Eats to review it.','دي وصفتي أو تجربتي الشخصية، وموافق إن بودي إيتس يراجعها.')+
   '</label>'+
   '<button class="be-share-submit" type="submit">'+text(ar,'Send for review','ابعت للمراجعة')+'</button>'+
   '<p class="be-share-status" role="status" aria-live="polite"></p>'+
  '</form>'+
  '<div class="be-share-queue"><div class="be-share-queue-head"><h3>'+text(ar,'My submissions','مشاركاتي')+'</h3>'+
   '<button type="button" class="be-share-refresh">'+text(ar,'Refresh','تحديث')+'</button></div>'+
   '<div class="be-share-queue-list" aria-live="polite">'+text(ar,'Loading your submissions…','بنحمّل مشاركاتك…')+'</div>'+
  '</div></div>';
}
function payloadFromForm(data,kind,uid){
 const val=k=>String(data.get(k)||'').trim();
 const payload={author_id:uid,kind,title:val('title'),description:val('description')};
 if(kind==='recipe'){payload.ingredients=val('ingredients');payload.instructions=val('instructions');}
 else if(kind==='place'){payload.city=val('city');payload.cuisine=val('cuisine');}
 else if(kind==='review'){
  payload.restaurant_name=val('restaurant_name');
  payload.city=val('city');
  payload.rating=Number(val('rating'));
  if(val('visited_on'))payload.visited_on=val('visited_on');
 }
 return payload;
}
function setupOne(target,{client,user,ar,initial}){
 target.innerHTML=layout(ar,initial);
 const form=target.querySelector('#be-share-form');
 const selector=target.querySelector('#be-share-kind');
 const fieldsSlot=target.querySelector('#be-share-fields');
 const msg=target.querySelector('.be-share-status');
 const queue=target.querySelector('.be-share-queue-list');
 const refresh=target.querySelector('.be-share-refresh');
 let busy=false;
 selector.addEventListener('change',()=>{fieldsSlot.innerHTML=fields(selector.value,ar);msg.textContent='';});
 async function readQueue(){
  queue.textContent=text(ar,'Loading submissions…','بنحمّل المشاركات…');
  try{
   const {data,error}=await client.from('be_member_submissions')
    .select('id,kind,title,status,created_at,staff_note').eq('author_id',user.id)
    .order('created_at',{ascending:false}).limit(25);
   if(error)throw error;
   if(!Array.isArray(data)||!data.length){
    queue.innerHTML='<p class="be-share-empty">'+text(ar,'Nothing submitted yet. Your ideas will appear here.','لسه مفيش مشاركات. هتظهر هنا أول ما تبعت حاجة.')+'</p>';
    return;
   }
   queue.innerHTML=data.map(item=>
    '<div class="be-share-queue-item"><div><strong>'+safe(item.title)+'</strong>'+
    '<small>'+safe(text(ar,descriptions[item.kind]?.en||item.kind,descriptions[item.kind]?.ar||item.kind))+
    ' · '+safe(new Date(item.created_at).toLocaleDateString(ar?'ar-EG':'en-GB'))+'</small></div>'+
    '<span class="be-share-status-pill" data-status="'+safe(item.status)+'">'+
    safe(statusLabel(ar,item.status))+'</span></div>'+
    (item.staff_note?'<p class="be-share-editor-note">'+safe(item.staff_note)+'</p>':'')
   ).join('');
  }catch{queue.textContent=text(ar,'Could not load submissions. Try Refresh.','مش قادرين نحمّل مشاركاتك. جرّب تحديث.');}
 }
 refresh.addEventListener('click',readQueue);
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(busy||!form.reportValidity())return;
  busy=true;
  const button=form.querySelector('button[type="submit"]');
  button.disabled=true;
  msg.dataset.error='';
  msg.textContent=text(ar,'Sending for review…','بنبعت للمراجعة…');
  try{
   const data=new FormData(form),kind=String(data.get('kind')||'');
   if(!['recipe','place','review'].includes(kind))throw Error('Invalid submission type');
   if(data.get('rights')!=='on')throw Error(text(ar,'Please confirm ownership.','لازم تأكد إن التجربة أو الوصفة بتاعتك.'));
   const payload=payloadFromForm(data,kind,user.id);
   const {error}=await client.from('be_member_submissions').insert(payload);
   if(error)throw error;
   form.reset();selector.value=kind;fieldsSlot.innerHTML=fields(kind,ar);
   msg.textContent=text(ar,'Received! It is now pending editorial review.','وصلتنا! مشاركتك دلوقتي قيد المراجعة.');
   await readQueue();
  }catch(err){
   msg.dataset.error='true';
   const message=String(err?.message||'');
   msg.textContent=/hourly/i.test(message)?
    text(ar,'Too many submissions. Please try again later.','بعت مشاركات كتير. جرّب بعد شوية.'):
    text(ar,'Could not send. Check your details and try again.','الإرسال ما تمش. راجع البيانات وجرّب تاني.');
  }finally{button.disabled=false;busy=false;}
 });
 readQueue();
}
export function mountMemberSubmissions({client,user,ar,view}){
 if(!client||!user)return;
 const slot=document.getElementById('be-member-contributions');
 if(!slot)return;
 const initial=(view==='city-guide'||view==='mama-picks')?'place':
   (view==='spotlight'?'review':'recipe');
 setupOne(slot,{client,user,ar,initial});
}

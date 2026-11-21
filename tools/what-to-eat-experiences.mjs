// Private What to Eat experience hub. Relies on the existing authenticated, RLS-gated guide.
const modules=[
 ['mama','MAMA APPROVED','ماما أبروڤد'],['what-map','WHAT TO EAT MAP','خريطة ناكل إيه'],
 ['where-map','WHERE TO EAT MAP','خريطة ناكل فين'],['album','THE ALBUM','الألبوم'],
 ['spotlight','SPOTLIGHT','سبوتلايت'],['badge','THE BADGE','البادج'],
 ['food-lab','FOOD PERSONALITY LAB','معمل شخصية الأكل']
];
const modes=[['all','All modes','كل الأنواع'],['classics','The Classics','الكلاسيك'],['fusion','Fusion Explorer','فيوجن'],['weird','Weird But It Works','غريب بس حلو'],['chaos','Culinary Chaos','فوضى الأكل']];
let view='home',mode='all',meter=3,answer=null,ranking=[],selected=null,previous=[],profile=null,query='',city='',spot=0,selectedFood='',feedback='',busy=false;
let context=null,source=null;
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=(en,ar)=>context?.ar?ar:en;
const loc=(x,name)=>x?.[name+(context?.ar?'_ar':'_en')]||x?.[name+'_en']||'';
const label=x=>loc(x,'name')||loc(x,'title')||x?.slug||'';
const rule=(key,fallback)=>{const val=Number(context?.state?.lab?.rules?.[key]);return Number.isFinite(val)&&val>=0&&val<=20?val:fallback;};
const isPrivate=()=>context?.staff||context?.reviewer;
const allowedFoods=()=> (context?.state?.foods||[]).filter(f=>isPrivate()?['draft','preview','published'].includes(f.status):f.status==='published'&&f.partner_reviewed);
const verifyUrl=x=>{try{const u=new URL(x);return u.protocol==='https:'?u.href:'';}catch{return '';}};
const options=(rows,chosen)=>rows.map(([id,text])=>'<option value="'+h(id)+'" '+(String(id)===String(chosen)?'selected':'')+'>'+h(text)+'</option>').join('');
const asArray=x=>String(x||'').split(',').map(v=>v.trim()).filter(Boolean).slice(0,30);
const archetypes=[
 ['comfort','The Comfort Seeker','باحث عن الراحة'],
 ['explorer','The Culinary Explorer','مستكشف الأكل'],
 ['fusion','The Fusion Fanatic','عاشق الفيوجن'],
 ['fearless','The Fearless Foodie','الأكّيل الجريء'],
 ['rebel','The Sweet-and-Savoury Rebel','متمرد الحلو والحادق'],
 ['street','The Street Food Loyalist','عاشق أكل الشارع'],
 ['experimental','The Experimental Eater','المجرب المجنون'],
 ['traditional','The Nostalgic Traditionalist','عاشق الأكل الأصيل']
];
function archetype(a){
 if(a.mode==='chaos')return archetypes[6];
 if(a.mode==='fusion')return archetypes[2];
 if(a.mode==='weird'&&Number(a.sweet)>=4)return archetypes[4];
 if(Number(a.adventure)>=5&&Number(a.weirdness)>=4)return archetypes[3];
 if(a.mode==='classics'&&Number(a.comfort)>=4)return archetypes[7];
 if(Number(a.adventure)>=4)return archetypes[1];
 if(a.mood==='nostalgic'||Number(a.comfort)>=4)return archetypes[0];
 return archetypes[5];
}
function scoreFood(food,a){
 const prefWeird=Number(a.weirdness)||3;
 const targetComfort=Number(a.comfort)||3;
 const prefAdventure=Number(a.adventure)||3;
 const sweet=Number(a.sweet)||3;
 const spice=Number(a.spice)||0;
 const f=(k,n)=>Number.isFinite(Number(food[k]))?Number(food[k]):n;
 let score=100-Math.abs(f('weirdness',3)-prefWeird)*rule('weirdness',5);
 score-=Math.abs(f('adventurous',3)-prefAdventure)*rule('adventure',3);
 score-=Math.abs(f('comfort',3)-targetComfort)*rule('comfort',2);
 score-=Math.abs(f('sweet',3)-sweet)*rule('flavour',3);
 score-=Math.abs(f('spice',1)-spice)*rule('spice',4);
 if(a.mode!=='all'&&food.mode===a.mode)score+=25;
 if(a.flavour&&Array.isArray(food.flavours)&&food.flavours.includes(a.flavour))score+=8;
 if(a.texture&&Array.isArray(food.textures)&&food.textures.includes(a.texture))score+=7;
 if(a.hunger==='large'&&f('comfort',3)>3)score+=3;
 if(a.mood==='tired'&&f('comfort',3)>3)score+=4;
 if(a.mood==='curious'&&f('adventurous',3)>=4)score+=4;
 if(a.social==='group'&&Array.isArray(food.dietary_tags)&&food.dietary_tags.includes('shareable'))score+=3;
 return score;
}
export function rankFoods(foods,answers,weights={}){
 const a=answers||{};
 const allergies=asArray(a.allergies).map(s=>s.toLowerCase());
 const disliked=asArray(a.disliked).map(s=>s.toLowerCase());
 const restrictions=asArray(a.restrictions).map(s=>s.toLowerCase());
 const target=Number(a.weirdness)||3;
 const maxTime=Number(a.time)||0;
 return (foods||[]).filter(f=>{
   if(!['draft','preview','published'].includes(f.status))return false;
   if(a.mode&&a.mode!=='all'&&f.mode!==a.mode)return false;
   if(Number(f.weirdness)>target && target<5)return false;
   if(f.spice>Number(a.spice||0)+1)return false;
   if((allergies.length||disliked.length||restrictions.length)&&!f.ingredients_verified)return false;
   const ing=(f.ingredients||[]).map(s=>String(s).toLowerCase());
   const allerg=(f.allergens||[]).map(s=>String(s).toLowerCase());
   if(allergies.some(s=>allerg.includes(s)||ing.some(t=>t.includes(s))))return false;
   if(disliked.some(s=>ing.some(t=>t.includes(s))))return false;
   if(restrictions.some(s=>!(f.dietary_tags||[]).map(x=>String(x).toLowerCase()).includes(s)))return false;
   if(maxTime&&(f.prep_minutes===null||f.prep_minutes===undefined||f.prep_minutes>maxTime))return false;
   if(a.budget&&a.budget!=='any'&&f.price_band!==a.budget)return false;
   return true;
 }).map(f=>({...f,_score:Math.round(100-
 Math.abs((Number(f.weirdness)||3)-target)*(weights.weirdness??5)-
 Math.abs((Number(f.adventurous)||3)-Number(a.adventure||3))*(weights.adventure??3)-
 Math.abs((Number(f.comfort)||3)-Number(a.comfort||3))*(weights.comfort??2)-
 Math.abs((Number(f.sweet)||3)-Number(a.sweet||3))*(weights.flavour??3)-
 Math.abs((Number(f.spice)||1)-Number(a.spice||0))*(weights.spice??4)+
 (a.mode!=='all'&&a.mode===f.mode?25:0)+
 (a.mood==='tired'&&Number(f.comfort)>=4?4:0)+
 (a.mood==='curious'&&Number(f.adventurous)>=4?4:0)+
 (a.hunger==='large'&&Number(f.comfort)>=4?3:0)+
 (a.flavour&&(f.flavours||[]).includes(a.flavour)?8:0)+
 (a.texture&&(f.textures||[]).includes(a.texture)?7:0))}))
 .sort((x,y)=>y._score-x._score||x.slug.localeCompare(y.slug));
}
const state=()=>context.state;
const feature=x=>(state().features||[]).find(y=>y.slug===x);
const approvedPlace=p=>p&&p.status==='published'&&p.partner_reviewed&&(!p.image_url||p.image_rights_confirmed);
const pageMeta=key=>{
 const f=feature(key),fallback=modules.find(x=>x[0]===key);
 return {title:f?loc(f,'title'):txt(fallback?.[1]||key,fallback?.[2]||key),intro:f?loc(f,'intro'):''};
};
function shell(key,content){
 const m=pageMeta(key);
 return '<header class="wte-x-page-head"><span class="wte-x-over">what to eat? / '+h(key.toUpperCase())+'</span><h2>'+h(m.title)+'</h2><p>'+h(m.intro)+'</p></header>'+content;
}
function intro(){
 return '<section class="wte-x-home"><div class="wte-x-over">'+txt('PRIVATE COLLABORATION EXPERIMENTS','تجارب التعاون الخاصة')+'</div>'+
 '<h2 lang="en">WHAT TO<br>EAT<span>?</span></h2><p>'+txt('Seven connected experiences, from family favourites and restaurant discovery to playful food experiments.','سبع تجارب مترابطة من الأكل المفضل وترشيحات المطاعم لتجارب الأكل المبتكرة.')+'</p>'+
 '<button class="wte-x-primary" data-x-go="food-lab">'+txt('Take the Food Personality Test ↗','اختبر شخصية أكلك ↗')+'</button></section>'+
 '<div class="wte-x-grid">'+modules.map((m,i)=>'<button class="wte-x-module" data-x-go="'+m[0]+'"><small>0'+(i+1)+' / '+(feature(m[0])?.status||'draft').toUpperCase()+'</small><strong>'+h(txt(m[1],m[2]))+'</strong><span>↗</span></button>').join('')+'</div>';
}
function foodCard(f){
 return '<article class="wte-x-food"><small>'+h(f.mode.toUpperCase())+' / '+h(loc(f,'cuisine')||'')+' / W'+h(f.weirdness)+'</small><strong>'+h(label(f))+'</strong><p>'+h(loc(f,'description')||'')+'</p>'+
 '<span class="wte-x-state">'+h(f.tested?txt('Tested claim — verify source','مذكور إنه مجرب؛ تحقق من المصدر'):txt('Untested / hypothetical','تجربة افتراضية غير مؤكدة'))+'</span>'+
 '<button class="wte-x-secondary" data-x-food="'+h(f.id)+'">'+txt('Details ↗','التفاصيل ↗')+'</button></article>';
}
function foodDetails(f){
 const ing=(f.ingredients||[]).join(', '),al=(f.allergens||[]).join(', ');
 const related=(state().places||[]).find(p=>p.id===f.place_id&&approvedPlace(p));
 const recipe=verifyUrl(f.recipe_url);
 return '<section class="wte-x-detail"><button class="wte-x-back" data-x-back="1">← '+txt('Back','رجوع')+'</button><small>'+h(f.mode.toUpperCase())+' / '+h(loc(f,'cuisine')||'')+'</small><h3>'+h(label(f))+'</h3>'+
 '<div class="wte-x-columns"><div><p>'+h(loc(f,'description'))+'</p>'+
 '<p><b>'+txt('Weirdness','درجة الغرابة')+':</b> '+h(f.weirdness)+'/5</p>'+
 '<p><b>'+txt('Ingredients','المكونات')+':</b> '+h(ing||txt('Not verified','غير موثقة'))+'</p>'+
 '<p><b>'+txt('Allergens','مسببات الحساسية')+':</b> '+h(f.ingredients_verified?(al||txt('No listed allergens; cross-contact not verified','لا توجد مسببات حساسية مذكورة؛ التلامس غير موثق')):txt('UNKNOWN — verify before eating','غير معروفة — تحقق قبل الأكل'))+'</p>'+
 '<p><b>'+txt('Flavour / texture','النكهة / القوام')+':</b> '+h((f.flavours||[]).join(', ')||txt('Not documented','غير موثق'))+' / '+h((f.textures||[]).join(', ')||txt('Not documented','غير موثق'))+'</p>'+
 '<p class="wte-x-warning">'+txt('Never assume an allergen-safe dish. Ingredients and cross-contact must be confirmed with the preparer.','لا تفترض أبدًا خلو الطبق من مسببات الحساسية؛ لازم تتأكد من المكونات والتلامس مع الطاهي.')+'</p></div><div>'+
 (f.image_url&&f.image_rights_confirmed&&verifyUrl(f.image_url)?'<img class="wte-x-detail-photo" src="'+h(verifyUrl(f.image_url))+'" alt="'+h(label(f))+'">':'<div class="wte-x-photo-empty">'+txt('Original photograph pending','الصورة الأصلية لم تُرفق')+'</div>')+
 (recipe?'<p><a href="'+h(recipe)+'" target="_blank" rel="noopener">'+txt('Boudie Eats recipe ↗','وصفة بودي إيتس ↗')+'</a></p>':'<p>'+txt('Verified recipe not yet linked.','لسه مفيش وصفة موثقة مرتبطة.')+'</p>')+
 (related?'<p><button class="wte-x-secondary" data-x-go="where-map">'+txt('Verified place','المكان الموثق')+': '+h(label(related))+'</button></p>':'<p>'+txt('No verified restaurant match. Explore the Where to Eat directory.','لا يوجد مطعم موثق مطابق. جرّب دليل ناكل فين.')+'</p>')+
 '</div></div><div class="wte-x-actions"><button class="wte-x-primary" data-x-save="'+h(f.id)+'">♡ '+txt('Save to Passport','احفظ في الباسبور')</button><button class="wte-x-secondary" data-x-tried="'+h(f.id)+'">'+txt('I tried it','جرّبتها')</button><button class="wte-x-secondary" data-x-share="'+h(f.id)+'">'+txt('Share ↗','شارك ↗')+'</button></div></section>';
}
function quizQuestion(name,en,arabic,opts,defaultValue){
 return '<label class="wte-x-field"><span>'+txt(en,arabic)+'</span><select name="'+name+'">'+options(opts,defaultValue)+'</select></label>';
}
function renderLab(){
 const foods=allowedFoods().filter(f=>mode==='all'||f.mode===mode);
 let content='<div class="wte-x-modes">'+modes.map(m=>'<button class="'+(mode===m[0]?'on':'')+'" data-x-mode="'+m[0]+'">'+h(txt(m[1],m[2]))+'</button>').join('')+'</div>';
 content+='<section class="wte-x-meter"><label for="wte-x-meter">'+txt('Weirdness Meter','مقياس الغرابة')+' <b>'+meter+'/5</b></label><input id="wte-x-meter" type="range" min="1" max="5" value="'+meter+'" step="1"><p>'+txt('1 = familiar • 3 = unexpected • 5 = absolute culinary chaos','١ مألوف • ٣ غير متوقع • ٥ فوضى كاملة')+'</p></section>';
 if(selected){
 content+=foodDetails(selected);
 content+='<div class="wte-x-actions"><button class="wte-x-primary" data-x-surprise="1">'+txt('Surprise Me — another eligible dish ↻','فاجئني بطبق تاني ↻')+'</button><button class="wte-x-secondary" data-x-retake="1">'+txt('Retake test','إعادة الاختبار')+'</button></div>';
 }else{
 content+='<div class="wte-x-columns"><div><h3>'+txt('What is your food mood?','مزاجك إيه النهارده؟')+'</h3><p>'+txt('A playful preference quiz, not a scientifically validated personality assessment.','اختبار ترفيهي للتفضيلات، مش مقياس شخصية علمي.')+'</p><form id="wte-x-quiz" class="wte-x-form">'+
 quizQuestion('mood','Your mood','مزاجك', [['tired',txt('Tired / stressed','مرهق / مضغوط')],['curious',txt('Curious','فضولي')],['nostalgic',txt('Nostalgic','حنين للماضي')],['celebrating',txt('Celebrating','بتحتفل')]],'curious')+
 quizQuestion('hunger','Your hunger','درجة الجوع',[['small',txt('A small bite','لقمة صغيرة')],['regular',txt('Normal meal','وجبة عادية')],['large',txt('Very hungry','جعان جدًا')]],'regular')+
 quizQuestion('adventure','How adventurous? (1–5)','قد إيه بتغامر؟',Array.from({length:5},(_,i)=>[i+1,String(i+1)]),3)+
 quizQuestion('comfort','Comfort food preference (1–5)','بتحب أكل الراحة؟',Array.from({length:5},(_,i)=>[i+1,String(i+1)]),3)+
 quizQuestion('sweet','Sweet preference (1–5)','ميّال للحلو قد إيه؟',Array.from({length:5},(_,i)=>[i+1,String(i+1)]),3)+
 quizQuestion('spice','Spice tolerance (0–5)','تحمل الشطة',Array.from({length:6},(_,i)=>[i,String(i)]),2)+
 quizQuestion('flavour','Favourite flavour','الطعم المفضل',[['',txt('No preference','مفيش تفضيل')],['salty',txt('Salty','مالح')],['sour',txt('Tangy','حامض')],['umami','Umami'],['sweet',txt('Sweet','حلو')]],'')+
 quizQuestion('texture','Favourite texture','القوام المفضل',[['',txt('No preference','مفيش تفضيل')],['crunchy',txt('Crunchy','مقرمش')],['creamy',txt('Creamy','كريمي')],['soft',txt('Soft','طري')]],'')+
 quizQuestion('social','Dining company','هتاكل مع مين؟',[['alone',txt('Alone','لوحدي')],['group',txt('With friends / family','مع ناس')]],'alone')+
 quizQuestion('budget','Budget','الميزانية',[['any',txt('No fixed budget','مفتوحة')],['budget',txt('Budget','اقتصادي')],['mid',txt('Mid-range','متوسط')],['premium',txt('Premium','مرتفع')]],'any')+
 quizQuestion('time','Available time','الوقت المتاح',[['0',txt('Flexible / unknown','مرن')],['20','20 minutes'],['45','45 minutes'],['90','90 minutes']],'0')+
 '<label class="wte-x-field"><span>'+txt('Allergies (comma-separated)','حساسية الطعام (بالفواصل)')+'</span><input name="allergies" autocomplete="off" placeholder="'+txt('e.g. sesame, peanuts','مثال: سمسم، فول سوداني')+'"></label>'+
 '<label class="wte-x-field"><span>'+txt('Dietary requirements (comma-separated)','نظام غذائي (بالفواصل)')+'</span><input name="restrictions" placeholder="'+txt('e.g. vegan, vegetarian','مثال: vegan, vegetarian')+'"></label>'+
 '<label class="wte-x-field"><span>'+txt('Disliked ingredients','مكونات مش بتحبها')+'</span><input name="disliked"></label>'+
 '<button class="wte-x-primary" type="submit">'+txt('Find my food personality ↗','اكتشف شخصية أكلك ↗')+'</button></form></div>'+
 '<aside class="wte-x-aside"><div class="wte-x-over">THE PERSONALITY LAB</div><div class="wte-x-number">08</div><h3>'+txt('Eight food personalities. A hundred possibilities.','٨ شخصيات للأكل. واحتمالات كتير.')+'</h3><p>'+txt('Dietary exclusions are enforced before scoring. Unknown ingredient information is never treated as allergy-safe.','القيود الغذائية بتتطبق قبل التقييم، والمكونات المجهولة مش بنعتبرها آمنة للحساسية.')+'</p></aside></div>';
 }
 if(profile)content+='<div class="wte-x-personality"><small>'+txt('YOUR ARCHETYPE','شخصيتك')+'</small><h3>'+h(txt(profile[1],profile[2]))+'</h3><p>'+txt('This name describes your quiz preferences, not a psychological assessment.','الاسم بيعبر عن تفضيلات إجاباتك، مش تقييم نفسي.')+'</p></div>';
 content+='<section class="wte-x-food-list"><h3>'+txt('Explore the modes','استكشف الأنواع')+'</h3><p>'+foods.length+' '+txt('editorial concepts','فكرة تحريرية')+'</p><div class="wte-x-grid">'+foods.slice(0,12).map(foodCard).join('')+'</div></section>';
 return shell('food-lab',content);
}
function renderMap(dishes){
 const places=(state().places||[]).filter(p=>approvedPlace(p)||isPrivate());
 const terms=(state().terms||[]).filter(t=>t.kind==='city');
 let heading= dishes?txt('Find a dish','دور على الأكلة'):txt('Find a place','دور على مكان');
 const list=dishes?allowedFoods():places;
 const results=list.filter(p=>(!city||String(p.city_id||'')===city)&&(!query||JSON.stringify(p).toLowerCase().includes(query.toLowerCase())));
 const pin=results.find(p=>!dishes&&p.latitude!==null&&p.longitude!==null&&p.latitude!==undefined&&p.longitude!==undefined);
 let map='<div class="wte-x-mapempty"><b>'+txt('No verified geographic pins yet','مفيش نقاط جغرافية موثقة لسه')+'</b><p>'+txt('Coordinates are added through the Editorial Desk. No locations are invented.','الإحداثيات بتتضاف من مكتب التحرير، ومفيش أماكن وهمية.')+'</p></div>';
 if(pin&&!dishes){
  const lat=Number(pin.latitude),lon=Number(pin.longitude);
  if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180){
   const bbox=[lon-.025,lat-.02,lon+.025,lat+.02].join(',');
   map='<iframe title="'+txt('OpenStreetMap view of a verified location','خريطة لمكان موثق')+'" loading="lazy" referrerpolicy="no-referrer" src="https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(bbox)+'&layer=mapnik&marker='+lat+'%2C'+lon+'"></iframe>';
  }
 }
 return shell(dishes?'what-map':'where-map','<section class="wte-x-section"><h3>'+heading+'</h3>'+
 '<div class="wte-x-filters"><input id="wte-x-search" type="search" value="'+h(query)+'" placeholder="'+txt('Search the directory','ابحث في الدليل')+'"><select id="wte-x-city">'+options([['',txt('All cities','كل المدن')],...terms.map(y=>[y.id,loc(y,'label')])],city)+'</select></div>'+
 '<div class="wte-x-map">'+map+'</div><h3>'+results.length+' '+txt('entries','عنصر')+'</h3><div class="wte-x-grid">'+(results.length?results.map(p=>dishes?foodCard(p):'<article class="wte-x-food"><strong>'+h(label(p))+'</strong><p>'+h(loc(p,'summary'))+'</p><small>'+h(p.status)+' / '+h(p.price_band)+'</small>'+(p.latitude!==null&&p.longitude!==null?'<p>'+txt('Coordinates recorded','إحداثيات مسجلة')+'</p>':'')+'</article>').join(''):'<p class="wte-x-empty">'+txt('No matching editorial records. Add approved content in the studio.','مفيش بيانات مطابقة. أضف المحتوى من مكتب التحرير.')+'</p>')+'</div></section>');
}
function renderAlbum(){
 const photos=(state().photos||[]).filter(p=>isPrivate()||p.image_rights_confirmed);
 return shell('album','<section class="wte-x-section"><h3>'+txt('Original food photography','صور أكل أصلية')+'</h3><div class="wte-x-album">'+(photos.length?photos.map(p=>'<figure><div class="wte-x-photo-empty" data-x-photo="'+h(p.id)+'">'+txt('Loading approved original photograph…','تحميل الصورة الأصلية…')+'</div><figcaption>'+h(loc(p,'caption'))+' <small>'+h(p.image_credit||'')+'</small></figcaption></figure>').join(''):'<p class="wte-x-empty">'+txt('No original photographs uploaded or approved yet.','مفيش صور أصلية مرفوعة أو معتمدة لسه.')+'</p>')+'</div></section>');
}
function renderRecognition(kind){
 const entries=(state().recognitions||[]).filter(r=>r.kind===kind&&(isPrivate()||r.status==='approved'&&r.partner_reviewed));
 const badgeData=(state().badges||[]).filter(b=>isPrivate()||b.status==='published'&&b.partner_reviewed);
 const content='<section class="wte-x-section"><div class="wte-x-seal">WHAT<br>TO EAT?<small>'+h(kind==='mama'?'MAMA APPROVED':'THE BADGE')+'<br>'+txt('DESIGN CONCEPT','تصور مبدئي')+'</small></div><p class="wte-x-warning">'+txt('This graphic is not an official approval, endorsement, or issued badge.','التصميم ده مش اعتماد أو ترشيح رسمي أو شارة ممنوحة.')+'</p><h3>'+txt('Verified recognitions','الاعتمادات الموثقة')+': '+entries.filter(e=>e.status==='approved'&&e.partner_reviewed).length+'</h3>'+
 (entries.length?entries.map(e=>'<p class="wte-x-record">'+h(label(state().places.find(p=>p.id===e.place_id)))+' — '+h(e.status)+'</p>').join(''):'<p class="wte-x-empty">'+txt('No verified recognition records yet.','مفيش سجلات اعتماد موثقة لسه.')+'</p>')+
 (kind==='badge'?'<h3>'+txt('Passport badge catalogue','شارات باسبور الأكل')+'</h3><div class="wte-x-grid">'+badgeData.map(b=>'<div class="wte-x-food"><strong>'+h(loc(b,'label'))+'</strong><p>'+h(loc(b,'description'))+'</p><small>'+h(b.status)+'</small></div>').join('')+'</div>':'')+'</section>';
 return shell(kind==='mama'?'mama':'badge',content);
}
function renderSpotlight(){
 const featured=(state().places||[]).filter(p=>p.featured&&(approvedPlace(p)||isPrivate()));
 const sections=(state().sections||[]).filter(p=>isPrivate()||p.status==='published'&&p.partner_reviewed).filter(p=>p.kind==='editorial');
 return shell('spotlight','<section class="wte-x-spot"><h3>'+txt('Stories in focus','حكايات تحت الضوء')+'</h3><p>'+txt('Only actual editorial records are shown.','بنعرض هنا المحتوى التحريري الحقيقي بس.')+'</p><div class="wte-x-grid">'+(featured.length?featured.map(p=>'<article class="wte-x-food"><strong>'+h(label(p))+'</strong><p>'+h(loc(p,'summary'))+'</p></article>').join(''):'<p class="wte-x-empty">'+txt('No verified venue spotlight yet.','مفيش سبوتلايت موثق لسه.')+'</p>')+'</div><h3>'+txt('Editorial notes','المقالات التحريرية')+'</h3>'+sections.map(s=>'<article class="wte-x-note"><h4>'+h(loc(s,'title'))+'</h4><p>'+h(loc(s,'body'))+'</p><small>'+h(s.status)+'</small></article>').join('')+'</section>');
}
function renderPassport(){
 const p=state().passport||{saved_food_ids:[],tried_food_ids:[],explored_cuisines:[]};
 const saved=Array.isArray(p.saved_food_ids)?p.saved_food_ids:[];
 const tried=Array.isArray(p.tried_food_ids)?p.tried_food_ids:[];
 return '<section class="wte-x-passport"><h3>'+txt('Taste Passport','باسبور الطعم')+'</h3><p>'+txt('Saved foods','الأكلات المحفوظة')+': '+saved.length+' · '+txt('Tried dishes','الأكلات المجربة')+': '+tried.length+' · '+txt('Cuisines explored','المطابخ المكتشفة')+': '+(p.explored_cuisines||[]).length+'</p><p>'+txt('The Passport is private to your signed-in account. Guest exploration does not create a saved record.','الباسبور خاص بحسابك المسجل. التصفح كضيف مش بيحفظ بيانات.')+'</p></section>';
}
function renderCommunity(){
 const ideas=(state().ideas||[]).filter(x=>x.status==='approved');
 let html='<section class="wte-x-community"><h3>'+txt('Would You Try It?','تجربها ولا لأ؟')+'</h3><p>'+txt('Original food ideas are moderated before publication.','أفكار الأكل بتتراجع قبل النشر.')+'</p>';
 html+=(ideas.length?ideas.map(i=>'<article class="wte-x-note"><h4>'+h(i.title)+'</h4><p>'+h(i.description)+'</p><small>'+h(i.tested?txt('Submitted as tried','مذكور إنها مجربة'):txt('Hypothetical','افتراضية'))+'</small><div class="wte-x-actions"><button data-x-vote="'+h(i.id)+':yes" class="wte-x-secondary">'+txt('Yes','آه')+'</button><button data-x-vote="'+h(i.id)+':no" class="wte-x-secondary">'+txt('No','لأ')+'</button><button data-x-vote="'+h(i.id)+':tried" class="wte-x-secondary">'+txt('Already tried','جربتها')+'</button></div></article>').join(''):'<p class="wte-x-empty">'+txt('No community experiments approved yet.','مفيش تجارب مجتمعية معتمدة لسه.')+'</p>');
 html+='<h3>'+txt('Submit a food experiment','ابعت تجربة أكل')+'</h3><form class="wte-x-form" id="wte-x-idea"><label class="wte-x-field">'+txt('Combination title','عنوان الفكرة')+'<input name="title" maxlength="120" minlength="4" required></label><label class="wte-x-field">'+txt('Describe the idea','اشرح الفكرة')+'<textarea name="description" maxlength="2000" rows="3"></textarea></label>'+
 '<label class="wte-x-field">'+txt('Experiment type','نوع التجربة')+'<select name="mode">'+options(modes.filter(m=>['fusion','weird','chaos'].includes(m[0])).map(m=>[m[0],txt(m[1],m[2])]),'chaos')+'</select></label>'+
 '<label class="wte-x-field">'+txt('Main ingredients','المكونات')+'<input name="ingredients" maxlength="500"></label>'+
 '<label class="wte-x-field">'+txt('Original photo (optional; 5 MB max)','صورة أصلية اختيارية (٥ ميجا)')+'<input type="file" name="photo" accept="image/jpeg,image/png,image/webp"></label>'+
 '<label class="wte-x-check"><input name="photo_rights_confirmed" type="checkbox">'+txt('I own or have permission to use the photograph','عندي حقوق استخدام الصورة')+'</label>'+
 '<button type="submit" class="wte-x-primary">'+txt('Send for moderation','ابعت للمراجعة')+'</button></form></section>';
 return html;
}
function home(){return intro()+'<div class="wte-x-homeend">'+renderPassport()+'</div>';}
function current(){
 let html='<nav class="wte-x-tabs" aria-label="'+txt('What to Eat experiences','أقسام وات تو إيت')+'"><button data-x-go="home" class="'+(view==='home'?'active':'')+'">'+txt('HOME','الرئيسية')+'</button>'+
 modules.map(m=>'<button data-x-go="'+m[0]+'" class="'+(view===m[0]?'active':'')+'">'+h(txt(m[1],m[2]))+'</button>').join('')+'</nav>';
 if(view==='home')html+=home();
 else if(view==='food-lab')html+=renderLab()+renderCommunity()+renderPassport();
 else if(view==='what-map')html+=renderMap(true);
 else if(view==='where-map')html+=renderMap(false);
 else if(view==='album')html+=renderAlbum();
 else if(view==='spotlight')html+=renderSpotlight();
 else if(view==='mama'||view==='badge')html+=renderRecognition(view);
 return html+'<p class="wte-x-feedback" role="status" aria-live="polite">'+h(feedback)+'</p>';
}
async function hydrate(){
 for(const node of source.querySelectorAll('[data-x-photo]')){
   const photo=state().photos.find(p=>p.id===node.dataset.xPhoto);
   if(!photo)continue;
   let url=verifyUrl(photo.image_url);
   if(photo.image_url?.startsWith('storage:')){
     const {data}=await state().client.storage.from('be-wte-media').createSignedUrl(photo.image_url.slice(8),90);
     url=data?.signedUrl||'';
   }
   if(url){node.textContent='';const img=document.createElement('img');img.src=url;img.alt=loc(photo,'image_alt')||loc(photo,'caption')||txt('Original food photograph','صورة أكل أصلية');img.loading='lazy';node.appendChild(img);}
 }
}
function paint(){
 if(!source||!source.isConnected)return;
 source.innerHTML=current();
 if(view==='album')hydrate();
}
function findFood(id){return allowedFoods().find(f=>f.id===id);}
function suggest(another=false){
 if(!answer)return;
 ranking=rankFoods(allowedFoods(),answer,state().lab?.rules||{});
 const remaining=ranking.filter(f=>!previous.includes(f.id));
 const eligible=remaining.length?remaining:ranking.filter(f=>f.id!==selected?.id);
 const next=eligible[0]||ranking[0]||null;
 if(!next){selected=null;feedback=txt('No eligible recommendations. Food with unverified ingredients is excluded when you enter allergies, disliked ingredients or dietary restrictions.','مفيش ترشيحات مناسبة. الأكلات بمكونات غير موثقة مستبعدة عند وجود حساسية أو مكونات مرفوضة أو نظام غذائي محدد.');}
 else{selected=next;previous.push(next.id);feedback=txt('Ranked by your preferences. Exact ingredients and allergens may still be unverified.','النتائج محسوبة حسب تفضيلاتك. المكونات ومسببات الحساسية ممكن تفضل غير موثقة.');}
 profile=archetype(answer);
}
async function savePassport(foodId,field){
 if(!state().user){feedback=txt('Sign in with your own account to save your Taste Passport.','سجّل بحسابك عشان تحفظ باسبور الطعم.');paint();return;}
 const p=state().passport||{saved_food_ids:[],tried_food_ids:[],explored_cuisines:[]};
 const food=findFood(foodId);
 if(!food)return;
 const saved=new Set(p.saved_food_ids||[]),tried=new Set(p.tried_food_ids||[]),cuisines=new Set(p.explored_cuisines||[]);
 if(field==='saved')saved.add(foodId);
 else{tried.add(foodId);if(food.cuisine_en)cuisines.add(food.cuisine_en);}
 const data={owner_id:state().user.id,saved_food_ids:[...saved],tried_food_ids:[...tried],explored_cuisines:[...cuisines],last_archetype:profile?.[0]||p.last_archetype||null,updated_at:new Date().toISOString()};
 const {error}=await state().client.from('be_wte_passports').upsert(data,{onConflict:'owner_id'});
 if(error)throw error;
 state().passport=data;feedback=txt('Saved privately to your Taste Passport.','اتحفظ في باسبور الطعم الخاص بيك.');paint();
}
function shareFood(f){
 const copy='what to eat? × Boudie Eats — '+label(f)+' / '+f.mode+' / Weirdness '+f.weirdness+'/5';
 if(navigator.share)navigator.share({title:'what to eat?',text:copy}).catch(()=>{});
 else if(navigator.clipboard?.writeText)navigator.clipboard.writeText(copy).then(()=>{feedback=txt('Copied to clipboard.','اتنسخ.');paint();});
 else{feedback=copy;paint();}
}
async function submitIdea(form){
 if(!state().user){throw Error(txt('You need to sign in with an account before submitting.','لازم تسجّل دخولك قبل ما تبعت.'));}
 if(!isPrivate()&&!context.live)throw Error(txt('Community submissions are not open yet.','المشاركات مش مفتوحة للجمهور لسه.'));
 const fd=new FormData(form),title=String(fd.get('title')||'').trim(),description=String(fd.get('description')||'').trim();
 const file=fd.get('photo');let photoPath=null;
 if(file&&file.size){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5242880)throw Error(txt('Photo must be JPG, PNG or WebP up to 5 MB.','الصورة لازم JPG أو PNG أو WebP بحد أقصى ٥ ميجا.'));
  if(!fd.has('photo_rights_confirmed'))throw Error(txt('Confirm your rights to the photograph.','أكّد حقوق استخدام الصورة.'));
  photoPath=state().user.id+'/'+crypto.randomUUID()+'.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type]);
  const {error:uploadError}=await state().client.storage.from('be-wte-ideas').upload(photoPath,file,{contentType:file.type,upsert:false});
  if(uploadError)throw uploadError;
 }
 const {error}=await state().client.from('be_wte_ideas').insert({
  title,description,mode:String(fd.get('mode')||'chaos'),ingredients:asArray(fd.get('ingredients')),
  photo_path:photoPath,photo_rights_confirmed:Boolean(photoPath),status:'pending'
 });
 if(error)throw error;
 form.reset();feedback=txt('Submitted privately for editorial review.','اتبعت للمراجعة بشكل خاص.');paint();
}
async function vote(ideaId,voteValue){
 if(!state().user)throw Error(txt('Sign in to vote.','سجّل دخولك عشان تصوّت.'));
 const idea=(state().ideas||[]).find(i=>i.id===ideaId&&i.status==='approved');
 if(!idea)throw Error(txt('Only moderated ideas can receive votes.','التصويت متاح للتجارب المعتمدة بس.'));
 const {error}=await state().client.from('be_wte_votes').upsert({idea_id:ideaId,owner_id:state().user.id,vote:voteValue,taste_rating:null,review:''},{onConflict:'idea_id,owner_id'});
 if(error)throw error;
 feedback=txt('Your response was recorded.','اتسجل ردك.');paint();
}
function setStatus(message){feedback=String(message||'');paint();}
function controls(ev){
 const button=ev.target.closest('button');
 if(!button||!source?.contains(button))return;
 const d=button.dataset;
 if(d.xGo){view=d.xGo;query='';city='';selected=null;feedback='';paint();source.scrollIntoView({block:'start',behavior:'smooth'});return;}
 if(d.xMode){mode=d.xMode;selected=null;previous=[];paint();return;}
 if(d.xFood){selected=findFood(d.xFood)||null;view='food-lab';paint();return;}
 if(d.xBack){selected=null;paint();return;}
 if(d.xSurprise){suggest(true);paint();return;}
 if(d.xRetake){answer=null;selected=null;profile=null;previous=[];paint();return;}
 if(d.xSave){savePassport(d.xSave,'saved').catch(setStatus);return;}
 if(d.xTried){savePassport(d.xTried,'tried').catch(setStatus);return;}
 if(d.xShare){const f=findFood(d.xShare);if(f)shareFood(f);return;}
 if(d.xVote){const [id,v]=d.xVote.split(':');vote(id,v).catch(setStatus);return;}
}
function changes(e){
 if(e.target.id==='wte-x-meter'){meter=Number(e.target.value);const label=source.querySelector('.wte-x-meter b');if(label)label.textContent=meter+'/5';return;}
 if(e.target.id==='wte-x-city'){city=e.target.value;paint();return;}
 if(e.target.id==='wte-x-search'){query=e.target.value;return;}
}
async function formSubmit(e){
 if(e.target.id==='wte-x-quiz'){
  e.preventDefault();const fd=new FormData(e.target);
  answer=Object.fromEntries(fd.entries());answer.mode=mode;answer.weirdness=meter;
  previous=[];suggest();paint();return;
 }
 if(e.target.id==='wte-x-idea'){e.preventDefault();if(busy)return;busy=true;try{await submitIdea(e.target);}catch(err){setStatus(err.message||err);}finally{busy=false;}}
}
export function mountExperienceGuide(ctx){
 context=ctx;const root=ctx.root;
 if(!root.querySelector('#wte-guide'))return;
 const host=document.createElement('section');host.id='wte-experiences';host.className='wte-x';
 root.insertBefore(host,root.querySelector('#wte-guide'));
 source=host;
 host.addEventListener('click',controls);
 host.addEventListener('input',changes);
 host.addEventListener('change',changes);
 host.addEventListener('submit',formSubmit);
 paint();
}
function field(name,title,value='',type='text'){
 return '<label class="wte-x-field"><span>'+h(title)+'</span><input name="'+name+'" type="'+type+'" value="'+h(value??'')+'"></label>';
}
function multi(name,title,value){
 return '<label class="wte-x-field"><span>'+h(title)+'</span><textarea name="'+name+'" rows="2">'+h(value||'')+'</textarea></label>';
}
function select(name,title,entries,value){
 return '<label class="wte-x-field"><span>'+h(title)+'</span><select name="'+name+'">'+options(entries,value)+'</select></label>';
}
function editorMarkup(){
 const s=state(),foods=s.foods||[],chosen=foods.find(x=>x.id===selectedFood)||null,features=s.features||[];
 let html='<div class="wte-x-editor"><div class="wte-x-over">PRIVATE CONTENT STUDIO / SUPABASE RLS</div><h2>'+txt('Seven experiences and Food Lab','السبع تجارب ومعمل الأكل')+'</h2><p>'+txt('All data is private by default. Draft, preview, published, archived and hidden states are editable. Global public switches remain separate.','كل البيانات خاصة. يمكن تعديل المسودة والمعاينة والمنشور والمؤرشف والمخفي. مفاتيح النشر العام منفصلة.')+'</p>';
 html+='<section class="wte-x-editorpanel"><h3>'+txt('Feature controls','التحكم في الأقسام')+'</h3><div class="wte-x-editrows">'+features.map(f=>'<form class="wte-x-editrow" data-x-form="feature" data-id="'+h(f.slug)+'"><strong>'+h(loc(f,'title'))+'</strong>'+
 select('status',txt('State','الحالة'),[['draft','Draft'],['preview','Preview'],['published','Published'],['archived','Archived'],['hidden','Hidden']],f.status)+
 '<label><input type="checkbox" name="partner_reviewed" '+(f.partner_reviewed?'checked':'')+'> '+txt('Partner reviewed','مراجعة الشريك')+'</label><button type="submit" class="wte-x-secondary">'+txt('Save','حفظ')+'</button></form>').join('')+'</div></section>';
 html+='<section class="wte-x-editorpanel"><h3>'+txt('Manage food recommendations','إدارة ترشيحات الأكل')+'</h3><label class="wte-x-field"><span>'+txt('Select food to edit','اختار أكلة للتعديل')+'</span><select id="wte-x-food-select">'+options([['',txt('Create new food record','إضافة أكلة جديدة')],...foods.map(x=>[x.id,x.name_en])],selectedFood)+'</select></label>'+
 '<form id="wte-x-food-editor" data-x-form="food" class="wte-x-form">'+
 field('slug','Slug',chosen?.slug)+field('name_en','Name EN',chosen?.name_en)+field('name_ar','Name AR',chosen?.name_ar)+
 multi('description_en','Description EN',chosen?.description_en)+multi('description_ar','Description AR',chosen?.description_ar)+
 select('mode','Mode',modes.filter(m=>m[0]!=='all').map(m=>[m[0],m[1]]),chosen?.mode||'classics')+
 field('cuisine_en','Cuisine EN',chosen?.cuisine_en)+field('cuisine_ar','Cuisine AR',chosen?.cuisine_ar)+
 field('ingredients','Ingredients (comma separated)',(chosen?.ingredients||[]).join(', '))+
 field('allergens','Allergens (comma separated)',(chosen?.allergens||[]).join(', '))+
 field('dietary_tags','Dietary tags (comma separated)',(chosen?.dietary_tags||[]).join(', '))+
 field('flavours','Flavours (comma separated)',(chosen?.flavours||[]).join(', '))+
 field('textures','Textures (comma separated)',(chosen?.textures||[]).join(', '))+
 field('weirdness','Weirdness 1–5',chosen?.weirdness??1,'number')+
 field('adventurous','Adventure 1–5',chosen?.adventurous??2,'number')+
 field('comfort','Comfort 1–5',chosen?.comfort??3,'number')+
 field('sweet','Sweetness 1–5',chosen?.sweet??3,'number')+
 field('spice','Spice 0–5',chosen?.spice??1,'number')+
 field('prep_minutes','Prep minutes (optional)',chosen?.prep_minutes??'','number')+
 select('price_band','Price',[['','Unknown'],['budget','Budget'],['mid','Mid-range'],['premium','Premium']],chosen?.price_band||'')+
 field('recipe_url','Verified recipe HTTPS URL',chosen?.recipe_url||'')+
 select('place_id','Verified place',[['','No place linked'],...(s.places||[]).map(p=>[p.id,p.name_en])],chosen?.place_id||'')+
 field('image_url','Licensed image HTTPS URL / storage path',chosen?.image_url||'')+
 field('image_credit','Photo credit',chosen?.image_credit||'')+
 '<label><input type="checkbox" name="image_rights_confirmed" '+(chosen?.image_rights_confirmed?'checked':'')+'> Photo rights confirmed</label>'+
 '<label><input type="checkbox" name="ingredients_verified" '+(chosen?.ingredients_verified?'checked':'')+'> Exact ingredient list verified</label>'+
 '<label><input type="checkbox" name="tested" '+(chosen?.tested?'checked':'')+'> Tested (evidence required)</label>'+
 '<label><input type="checkbox" name="partner_reviewed" '+(chosen?.partner_reviewed?'checked':'')+'> Partner reviewed</label>'+
 select('status','Status',[['draft','Draft'],['preview','Preview'],['published','Published'],['archived','Archived'],['hidden','Hidden']],chosen?.status||'draft')+
 '<button type="submit" class="wte-x-primary">'+txt('Save food record','احفظ الأكلة')+'</button></form></section>';
 const lab=s.lab||{questions:[],archetypes:[],rules:{}};
 html+='<section class="wte-x-editorpanel"><h3>'+txt('Recommendation weights and question configuration','أوزان الترشيح وإعدادات الأسئلة')+'</h3><p>'+txt('Rules JSON controls live weighted ranking. Question and archetype JSON are editable reference data. Built-in quiz questions remain the safe fallback.','ملف الأوزان بيتحكم في التقييم. الأسئلة والأنماط قابلة للتعديل كبيانات مرجعية؛ الأسئلة الأساسية بتفضل متاحة.')+'</p><form data-x-form="lab" class="wte-x-form">'+multi('rules','Scoring weights (JSON)',JSON.stringify(lab.rules||{}))+
 multi('questions','Question definitions (JSON)',JSON.stringify(lab.questions||[]))+
 multi('archetypes','Archetypes (JSON)',JSON.stringify(lab.archetypes||[]))+
 '<button type="submit" class="wte-x-primary">'+txt('Save lab configuration','حفظ إعدادات المعمل')+'</button></form></section>';
 html+='<section class="wte-x-editorpanel"><h3>'+txt('Moderation queue','طابور المراجعة')+'</h3>'+
 (s.ideas||[]).filter(i=>i.status==='pending'||i.status==='approved').map(i=>'<div class="wte-x-note"><strong>'+h(i.title)+'</strong><p>'+h(i.description)+'</p><small>'+h(i.status)+'</small><div class="wte-x-actions"><button class="wte-x-secondary" data-x-moderate="'+h(i.id)+':approved" type="button">Approve</button><button class="wte-x-secondary" data-x-moderate="'+h(i.id)+':rejected" type="button">Reject</button></div></div>').join('')+
 '<p>'+txt('No community submissions are automatically published.','مفيش مشاركات بتنشر أوتوماتيك.')+'</p></section>';
 html+='<section class="wte-x-editorpanel"><h3>'+txt('Passport badge management','إدارة شارات الباسبور')+'</h3><form data-x-form="badge" class="wte-x-form">'+field('slug','Badge slug')+field('label_en','Label EN')+field('label_ar','Label AR')+
 field('description_en','Description EN')+field('description_ar','Description AR')+
 select('kind','Kind',[['passport','Taste passport'],['recognition','Recognition']],'passport')+
 field('criteria','Criteria (manual / saved / tried / cuisines)','manual')+field('threshold','Threshold',1,'number')+
 select('status','Status',[['draft','Draft'],['preview','Preview'],['published','Published'],['archived','Archived'],['hidden','Hidden']],'draft')+
 '<label><input type="checkbox" name="partner_reviewed"> Partner reviewed</label><button class="wte-x-primary" type="submit">Create badge</button></form>'+
 '<div class="wte-x-editrows">'+(s.badges||[]).map(b=>'<form data-x-form="badge-edit" data-id="'+h(b.id)+'" class="wte-x-editrow"><strong>'+h(loc(b,'label'))+'</strong>'+
 select('status','Status',[['draft','Draft'],['preview','Preview'],['published','Published'],['archived','Archived'],['hidden','Hidden']],b.status)+
 '<label><input type="checkbox" name="partner_reviewed" '+(b.partner_reviewed?'checked':'')+'> Partner reviewed</label><button class="wte-x-secondary" type="submit">Save</button></form>').join('')+'</div></section>';
 html+='<section class="wte-x-editorpanel"><h3>'+txt('Mama Approved / recognition records','سجلات الاعتماد')+'</h3>'+
 '<form data-x-form="recognition" class="wte-x-form">'+select('place_id','Verified venue',[['','Choose venue'],...(s.places||[]).map(p=>[p.id,p.name_en])],'')+
 select('kind','Recognition',[['mama','Mama Approved'],['badge','The Badge']],'mama')+
 field('evidence','Internal verification evidence')+field('display_note_en','Public note EN')+field('display_note_ar','Public note AR')+
 select('status','Status',[['draft','Draft'],['approved','Approved'],['revoked','Revoked']],'draft')+
 '<label><input type="checkbox" name="partner_reviewed"> Partner approved this specific recognition</label><button class="wte-x-primary" type="submit">Save recognition</button></form></section>';
 html+='<p role="status" id="wte-x-editor-status" class="wte-x-feedback">'+h(feedback)+'</p></div>';
 return html;
}
async function saveEditorial(form){
 const fd=new FormData(form),data=Object.fromEntries(fd.entries()),table=form.dataset.xForm;
 const client=state().client;
 if(table==='feature'){
  const body={status:data.status,partner_reviewed:fd.has('partner_reviewed'),updated_at:new Date().toISOString()};
  const {error}=await client.from('be_wte_features').update(body).eq('slug',form.dataset.id);if(error)throw error;
 }else if(table==='food'){
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug||''))throw Error('Use a lowercase slug.');
  for(const x of ['ingredients','allergens','dietary_tags','flavours','textures'])data[x]=asArray(data[x]);
  for(const x of ['weirdness','adventurous','comfort','sweet','spice']){data[x]=Number(data[x]);if(data[x]<0||data[x]>5)throw Error(x+' out of range.');}
  data.prep_minutes=data.prep_minutes?Number(data.prep_minutes):null;
  data.price_band=data.price_band||null;data.place_id=data.place_id||null;
  data.image_url=data.image_url||null;data.recipe_url=data.recipe_url||null;
  for(const x of ['tested','partner_reviewed','image_rights_confirmed','ingredients_verified'])data[x]=fd.has(x);
  if(data.recipe_url&&!verifyUrl(data.recipe_url))throw Error('Only HTTPS recipe URLs are allowed.');
  if(data.image_url&&!data.image_url.startsWith('storage:')&&!verifyUrl(data.image_url))throw Error('Only approved image paths or HTTPS URLs are allowed.');
  if(data.tested&&!data.ingredients_verified)throw Error('Verify ingredients before marking a food tested.');
  if(data.status==='published'&&!data.partner_reviewed)throw Error('Partner review required.');
  const q=selectedFood?client.from('be_wte_foods').update(data).eq('id',selectedFood):client.from('be_wte_foods').insert(data);
  const {error}=await q;if(error)throw error;
 }else if(table==='lab'){
  const body={rules:JSON.parse(data.rules),questions:JSON.parse(data.questions),archetypes:JSON.parse(data.archetypes),updated_at:new Date().toISOString()};
  if(!body.rules||typeof body.rules!=='object'||!Array.isArray(body.questions)||!Array.isArray(body.archetypes))throw Error('Invalid Lab JSON.');
  const {error}=await client.from('be_wte_lab_settings').update(body).eq('id',1);if(error)throw error;
 }else if(table==='badge'||table==='badge-edit'){
  if(table==='badge-edit'){
   const {error}=await client.from('be_wte_badges').update({status:data.status,partner_reviewed:fd.has('partner_reviewed')}).eq('id',form.dataset.id);if(error)throw error;
  }else{
   data.partner_reviewed=fd.has('partner_reviewed');data.threshold=Number(data.threshold)||1;
   const {error}=await client.from('be_wte_badges').insert(data);if(error)throw error;
  }
 }else if(table==='recognition'){
  if(!context.admin)throw Error('Administrator role required for recognition issuance.');
  if(!data.place_id)throw Error('Choose a verified venue.');
  data.partner_reviewed=fd.has('partner_reviewed');data.approved_at=data.status==='approved'?new Date().toISOString():null;
  if(data.status==='approved'&&!data.partner_reviewed)throw Error('Documented partner review is required.');
  const {error}=await client.from('be_wte_recognitions').upsert(data,{onConflict:'place_id,kind'});if(error)throw error;
 }
 await context.refresh();
 context.root.querySelector('#wte-x-studio')?.scrollIntoView({block:'start'});
 feedback=txt('Saved privately. Global publication remains controlled separately.','اتحفظ بشكل خاص. النشر العام منفصل.');
}
function editorEvents(e){
 const b=e.target.closest('button[data-x-moderate]');
 if(!b)return;
 const [id,status]=b.dataset.xModerate.split(':');
 if(!context.staff)return;
 b.disabled=true;
 state().client.from('be_wte_ideas').update({status,reviewed_by:state().user.id}).eq('id',id)
 .then(async r=>{if(r.error)throw r.error;await context.refresh();feedback=txt('Moderation updated.','المراجعة اتحدثت.');})
 .catch(err=>{feedback=String(err.message||err);})
 .finally(()=>{if(b.isConnected)b.disabled=false;});
}
function editorChange(e){
 if(e.target.id==='wte-x-food-select'){selectedFood=e.target.value;const el=context.root.querySelector('#wte-x-studio');if(el)el.innerHTML=editorMarkup();}
}
async function editorSubmit(e){
 const form=e.target.closest('form[data-x-form]');if(!form)return;e.preventDefault();if(busy)return;busy=true;
 const b=form.querySelector('button[type=submit]');if(b)b.disabled=true;
 try{await saveEditorial(form);}
 catch(err){feedback=String(err.message||err);const status=context.root.querySelector('#wte-x-editor-status');if(status)status.textContent=feedback;}
 finally{busy=false;if(b&&b.isConnected)b.disabled=false;}
}
export function mountExperienceStudio(ctx){
 context=ctx;if(!ctx.staff)return;
 const host=document.createElement('div');host.id='wte-x-studio';host.className='wte-x';
 const target=ctx.root.querySelector('.wte-editor-columns');if(!target)return;
 target.parentNode.insertBefore(host,target);
 host.innerHTML=editorMarkup();
 host.addEventListener('click',editorEvents);
 host.addEventListener('change',editorChange);
 host.addEventListener('submit',editorSubmit);
}

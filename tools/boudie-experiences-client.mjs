// Boudie Eats independent seven-experience prototype.
// No external brand assets, copyrighted partner content, or invented venues.
// This is a public-data-free interactive preview; persistence awaits launch wiring.
const root=document.getElementById('be-exp-app');
const ar=document.documentElement.lang==='ar';
const lang=(en,arabic)=>ar?arabic:en;
const base=document.body.dataset.base||'/';
const slug=document.body.dataset.view||'home';
const path=(view)=>base+(ar?'ar/':'')+'discover/'+(view==='home'?'':view+'/');
const features=[
 {key:'mama-picks',number:'01',en:'Boudie’s Mama Picks',ar:'اختيارات ماما عند بودي',de:'Independently selected family favourites, with transparent criteria.',da:'ترشيحات عائلية مستقلة بمعايير واضحة.'},
 {key:'dish-finder',number:'02',en:'Boudie’s Dish Finder',ar:'دور على أكلة',de:'Start with a craving, not a restaurant name.',da:'ابدأ بالأكلة اللي نفسك فيها.'},
 {key:'city-guide',number:'03',en:'Boudie’s City Guide',ar:'دليل بودي للمدن',de:'Explore by city, neighbourhood, cuisine and budget.',da:'اكتشف الأماكن حسب المدينة والمنطقة ونوع الأكل والسعر.'},
 {key:'gallery',number:'04',en:'Boudie Gallery',ar:'ألبوم بودي',de:'Food in original photographs, not generated images.',da:'صور أكل أصلية، من غير صور مولدة.'},
 {key:'spotlight',number:'05',en:'Boudie Spotlight',ar:'بودي سبوتلايت',de:'A home for the people behind the food.',da:'مساحة للناس اللي ورا حكايات الأكل.'},
 {key:'passport',number:'06',en:'Boudie Passport',ar:'جواز سفر بودي',de:'Save discoveries and collect earned achievements.',da:'احفظ اكتشافاتك واجمع شارات تستحقها.'},
 {key:'food-lab',number:'07',en:'Boudie Food Personality Lab',ar:'معمل شخصية الأكل من بودي',de:'A playful food quiz, fusion experiments and a weirdness meter.',da:'اختبار ذوقك في الأكل وتجارب فيوجن ومقياس للغرابة.'}
];
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(label,url,secondary=false)=>'<a class="be-exp-action'+(secondary?' be-exp-outline':'')+'" href="'+esc(url)+'">'+esc(label)+'</a>';
const eyebrow=(num)=>'<p class="be-exp-small">'+esc(lang('BOUDIE EATS · EXPERIENCE '+num,'بودي إيتس · تجربة '+num))+'</p>';
function home(){
 return '<section class="be-exp-hero"><div><p class="be-exp-small">'+lang('FOOD, THE BOUDIE WAY','الأكل على طريقة بودي')+'</p><h1>'+lang('Good food deserves a good story.','كل أكلة وراها حكاية.')+'</h1><p>'+lang('Seven new ways to discover dishes, places, people and your own appetite. Built independently for Boudie Eats.','سبع طرق جديدة تكتشف بيها أكلات وأماكن وناس وذوقك أنت في الأكل. كلها من بودي إيتس.')+'</p>'+link(lang('Start exploring','ابدأ الاستكشاف'),path('dish-finder'))+'</div><aside class="be-exp-hero-side"><strong>07</strong><p>'+lang('Experiences designed to connect original reviews, recipes and community contributions.','تجارب تجمع المراجعات والوصفات والمساهمات الأصلية.')+'</p></aside></section><section><p class="be-exp-small">'+lang('EXPLORE ALL SEVEN','استكشف السبع تجارب')+'</p><div class="be-exp-grid">'+features.map(x=>'<a class="be-exp-card" href="'+path(x.key)+'"><span class="number">'+x.number+'</span><h2>'+esc(lang(x.en,x.ar))+'</h2><p>'+esc(lang(x.de,x.da))+'</p><span class="arrow" aria-hidden="true">↗</span></a>').join('')+'</div></section><section class="be-exp-box be-exp-box--burgundy"><h2>'+lang('Our editorial promise','وعدنا التحريري')+'</h2><p>'+lang('Every published photograph, recommendation and creator story will need an original or properly licensed source and an editorial review. The preview does not represent a live restaurant directory.','كل صورة وترشيح وحكاية هتتنشر لازم يكون مصدرها أصلي أو مرخص ويتراجع تحريرياً. المعاينة مش دليل مطاعم منشور.')+'</p></section>';
}
function standard(title,copy,num,body){
 return '<section class="be-exp-section">'+eyebrow(num)+'<h1>'+esc(title)+'</h1><p>'+esc(copy)+'</p>'+body+'</section>';
}
const empty=(title,copy)=>'<div class="be-exp-empty"><strong>'+esc(title)+'</strong><p>'+esc(copy)+'</p></div>';
function mama(){
 return standard(lang('Boudie’s Mama Picks','اختيارات ماما عند بودي'),lang('Food you would happily put on the family table. The badge is editorial, not a paid endorsement.','أكل تحبه على سفرة البيت. الترشيح قرار تحريري مش إعلان مدفوع.'),'01',
 '<div class="be-exp-box"><h2>'+lang('How a pick earns its place','إزاي بنختار')+'</h2><p>'+lang('Original tasting notes, consistency, value, disclosure of any commercial relationship, and final editorial approval. No restaurant currently carries this label.','تجربة أصلية، جودة ثابتة، قيمة مقابل سعر، إعلان واضح عن أي علاقة تجارية، وموافقة تحريرية. مفيش مكان واخد العلامة دي دلوقتي.')+'</p></div>'+empty(lang('First picks are under review','الترشيحات الأولى قيد المراجعة'),lang('Nothing is awarded or implied before verification.','مش هنمنح أي علامة قبل التحقق.')));
}
function finder(){
 return standard(lang('What are you craving?','نفسك في إيه؟'),
  lang('Search Boudie Eats dishes that have passed editorial review. Nothing is presented as tested until it is approved.','دور على أكلات بودي إيتس اللي اتراجعت تحريرياً. مش هنقدم تجربة على إنها متجربة قبل المراجعة.'),'02',
  '<div class="be-exp-box"><div class="be-exp-filters">'+
  '<label>'+lang('Dish or ingredient','أكلة أو مكون')+'<input id="be-dish-q" placeholder="'+lang('Search dishes…','دور على أكلة…')+'"></label>'+
  '<label>'+lang('Cuisine','نوع المطبخ')+'<select id="be-dish-type"><option value="all">'+lang('All cuisines','كل المطابخ')+'</option><option value="egyptian">'+lang('Egyptian','مصري')+'</option><option value="dessert">'+lang('Desserts','حلويات')+'</option></select></label>'+
  '<label>'+lang('Mood','المود')+'<select id="be-dish-mood"><option value="all">'+lang('Any','أي مود')+'</option><option value="comfort">'+lang('Comfort','راحة')+'</option><option value="sweet">'+lang('Sweet','حلو')+'</option><option value="savory">'+lang('Savoury','حادق')+'</option></select></label>'+
  '</div></div><div class="be-exp-ideas" id="be-dish-results" role="status" aria-live="polite"></div>'+
  link(lang('Explore all recipes','شوف الوصفات'),base+(ar?'ar/':'')+'recipes/',true));
}
function city(){
 return standard(lang('Find your next food stop.','اختار مكان أكلتك الجاية.'),
 lang('Verified first-hand reviews, organized by city and cuisine. A place appears only after editorial approval.','تجارب حقيقية متراجعة حسب المدينة والمطبخ. المكان مش بيظهر قبل موافقة التحرير.'),'03',
 '<div class="be-exp-box"><div class="be-exp-filters"><label>'+lang('City','المدينة')+'<select id="be-city"><option value="all">'+lang('All cities','كل المدن')+'</option></select></label>'+
 '<label>'+lang('Cuisine','المطبخ')+'<select id="be-cuisine"><option value="all">'+lang('All cuisines','كل المطابخ')+'</option></select></label>'+
 '<label>'+lang('Budget','الميزانية')+'<select id="be-price"><option value="all">'+lang('Any budget','كل الأسعار')+'</option><option value="budget">'+lang('Budget','اقتصادي')+'</option><option value="mid">'+lang('Moderate','متوسط')+'</option><option value="premium">'+lang('Premium','مرتفع')+'</option></select></label>'+
 '</div></div><div id="be-city-results" class="be-exp-ideas" role="status" aria-live="polite"></div>'+
 link(lang('Read original reviews','اقرأ التجارب الأصلية'),base+(ar?'ar/':'')+'reviews/',true));
}
function gallery(){
 return standard(lang('Food looks better when it is real.','الأكل الحقيقي أحلى في الصور.'),
 lang('Original Boudie Eats and contributor photography, shown only after permission and editorial review.','صور أصلية من بودي إيتس والمشاركين، بتظهر بعد الإذن والمراجعة.'),'04',
 '<div class="be-exp-gallery" id="be-gallery-results" aria-live="polite"></div>');
}
function spotlight(){
 return standard(lang('The people behind the plate.','الناس اللي ورا الطبق.'),
 lang('A place for independently reviewed stories of food makers and home cooks.','مساحة لحكايات الطهاة وأصحاب الأكل بعد المراجعة المستقلة.'),'05',
 '<div id="be-spotlight-results" aria-live="polite"></div>'+link(lang('Pitch a story','ابعت حكاية'),base+(ar?'ar/':'')+'account/',true));
}
function passport(){
 return standard(lang('A passport for your appetite.','جواز سفر لذوقك في الأكل.'),
 lang('Sign in to save approved dishes in your private Boudie Eats passport. Every change is stored under your own account.','سجّل دخولك عشان تحفظ الأكلات المتراجعة في جواز سفر بودي إيتس، وكل حساب بيشوف بياناته بس.'),'06',
 '<div class="be-exp-passport" id="be-passport-results" aria-live="polite"><p>'+lang('Checking your account…','بنفحص حسابك…')+'</p></div>');
}

function lab(){
 const q=(name,title,opts)=>'<fieldset class="be-exp-question"><legend>'+esc(title)+'</legend><div class="be-exp-options">'+opts.map((o,i)=>'<label><input type="radio" name="'+name+'" value="'+esc(o[0])+'" '+(i===0?'checked':'')+'>'+esc(o[1])+'</label>').join('')+'</div></fieldset>';
 return standard(lang('Boudie Food Personality Lab','معمل شخصية الأكل من بودي'),lang('A playful quiz about how you eat, not a validated psychological assessment. Try the working recommendation engine below.','اختبار خفيف عن ذوقك في الأكل، مش تقييم نفسي علمي. جرب محرك الترشيحات ده.'),'07',
 '<form id="be-lab-form">'+q('mood',lang('What sounds good today?','نفسك في إيه النهارده؟'),[['comfort',lang('A familiar favourite','أكلة مضمونة')],['new',lang('Something new','حاجة جديدة')]])+q('flavour',lang('Pick a flavour.','اختار طعم.') ,[['savory',lang('Savoury','حادق')],['sweet',lang('Sweet','حلو')]])+q('adventure',lang('How adventurous are you?','قد إيه بتحب التجارب؟'),[['low',lang('Keep it classic','خليك في الكلاسيك')],['high',lang('Surprise me','فاجئني')]])+q('mix',lang('Sweet + savoury in one bite?','حلو وحادق مع بعض؟'),[['no',lang('Not today','مش النهارده')],['yes',lang('I am curious','ممكن أجرب')]])+'<button class="be-exp-action" type="submit">'+lang('Reveal my food type','اكتشف نوعي')+'</button></form><div id="be-lab-result" class="be-exp-result" role="status" aria-live="polite"></div><div class="be-exp-box"><h2>'+lang('Explore later in the lab','تجارب جاية في المعمل')+'</h2><p>'+lang('Fusion Explorer · Weirdness Meter · Culinary Chaos · Community voting. These require moderated, rights-cleared content before public activation.','فيوجن إكسبلورر · مقياس الغرابة · فوضى الأكل · تصويت المجتمع. محتاجة محتوى متراجع قبل الإطلاق.')+'</p></div>');
}
const render={home,mama: mama,'mama-picks':mama,'dish-finder':finder,'city-guide':city,gallery,spotlight,passport,'food-lab':lab};
root.innerHTML=(render[slug]||home)();
// All published records are retrieved through Supabase RLS; unpublished
// venue, food, contributor, or photo records cannot appear in this UI.
const cfg=window.BE_DISCOVER_CONFIG||{};
const store={foods:[],places:[],terms:[],photos:[],sections:[],badges:[],loaded:false,failed:false};
let updateDishes=()=>{};
const dishQuery=document.getElementById('be-dish-q');
if(dishQuery){
 const refresh=()=>{
  const q=dishQuery.value.trim().toLocaleLowerCase();
  const type=document.getElementById('be-dish-type').value,mood=document.getElementById('be-dish-mood').value;
  const dishes=store.foods.map(d=>({
   id:d.id,en:d.name_en,ar:d.name_ar,desc:lang(d.description_en,d.description_ar),
   type:Number(d.sweet)>=4?'dessert':/egyptian/i.test(d.cuisine_en)?'egyptian':'other',
   mood:Number(d.sweet)>=4?'sweet':Number(d.comfort)>=4?'comfort':'savory',
   href:d.recipe_url
  }));
  const list=dishes.filter(d=>(!q||(d.en+' '+d.ar+' '+d.desc).toLocaleLowerCase().includes(q))&&(type==='all'||d.type===type)&&(mood==='all'||d.mood===mood));
  document.getElementById('be-dish-results').innerHTML=list.length?list.map(d=>
   '<article class="be-exp-idea"><strong>'+esc(lang(d.en,d.ar))+'</strong><p>'+esc(d.desc)+'</p>'+
   (safeUrl(d.href)?link(lang('Read verified recipe','اقرأ الوصفة الأصلية'),d.href,true):'')+'</article>'
  ).join(''):empty(store.loaded?lang('No approved dishes match','مفيش أكلات متراجعة مطابقة'):lang('Loading approved dishes…','جاري تحميل الأكلات المتراجعة…'),
   store.loaded?lang('Try a different search or browse our original recipes.','جرب بحث تاني أو شوف وصفاتنا الأصلية.'):lang('Only approved records appear here.','المحتوى المتراجع بس هو اللي بيظهر.'));
 };
 ['be-dish-q','be-dish-type','be-dish-mood'].forEach(id=>document.getElementById(id).addEventListener('input',refresh));
 updateDishes=refresh;refresh();
}
const form=document.getElementById('be-lab-form');if(form){
 form.addEventListener('submit',(e)=>{
 e.preventDefault();const d=new FormData(form);
 const mood=d.get('mood'),flavour=d.get('flavour'),adventure=d.get('adventure'),mix=d.get('mix');
 let type,food;
 if(adventure==='high'&&mix==='yes'){type=lang('Fearless Fusion Explorer','مستكشف الفيوجن الجريء');food=lang('Try a sweet-savoury combination with ingredients you already enjoy.','جرب تركيبة حلو وحادق من مكونات بتحبها.');}
 else if(mood==='comfort'){type=lang('Comfort Food Loyalist','عاشق أكل البيت');food=flavour==='sweet'?lang('Vermicelli with milk might hit the spot.','شعرية باللبن ممكن تكون اختيارك.'):lang('Classic ful or taameya might suit you.','الفول أو الطعمية ممكن يعجبوك.');}
 else {type=lang('Curious Food Explorer','مستكشف الأكل الفضولي');food=lang('Explore a new dish in your preferred flavour family.','جرب أكلة جديدة في طابع النكهات اللي بتحبه.');}
 const out=document.getElementById('be-lab-result');out.dataset.show='yes';
 out.innerHTML='<p class="be-exp-small">'+lang('YOUR PLAYFUL RESULT','نتيجتك للتسلية')+'</p><h2>'+esc(type)+'</h2><p>'+esc(food)+'</p><small>'+lang('No answers were saved or sent to a server.','إجاباتك مش اتسجلت ومش اتبعتت لأي سيرفر.')+'</small>';out.scrollIntoView({behavior:'smooth',block:'nearest'});
 });
}

// Boudie Eats staff-only discovery content editor.
// Loaded ONLY by the existing account desk after the Supabase be_staff() check.
// Supabase RLS protects all records and operations independently of this UI.
const SCHEMAS={
 places:{label:['Places & restaurants','المطاعم والأماكن'],table:'be_wte_places',key:'id',title:'name_en',write:'staff',
  columns:'slug name_en name_ar city_id cuisine_id district_en district_ar summary_en summary_ar must_try_en must_try_ar address_en address_ar price_band tags image_url image_alt_en image_alt_ar image_credit image_rights_confirmed website_url instagram_url booking_url featured position latitude longitude status editorial_approved',
  required:'slug name_en name_ar city_id cuisine_id',defaults:{price_band:'mid',status:'draft'}},
 foods:{label:['Dishes & recipes','الأكلات والوصفات'],table:'be_wte_foods',key:'id',title:'name_en',write:'staff',
  columns:'slug name_en name_ar description_en description_ar mode cuisine_en cuisine_ar ingredients allergens ingredients_verified flavours textures weirdness adventurous comfort sweet spice prep_minutes price_band tested image_url image_credit image_rights_confirmed recipe_url place_id status editorial_approved dietary_tags texture_profile testing_notes',
  required:'slug name_en name_ar mode',defaults:{mode:'classics',status:'draft',weirdness:1,adventurous:2,comfort:3,sweet:3,spice:1}},
 sections:{label:['Editorial collections & spotlight','المجموعات وسبوتلايت'],table:'be_wte_sections',key:'id',title:'title_en',write:'staff',
  columns:'kind slug title_en title_ar body_en body_ar filter_tag active position status editorial_approved',required:'kind slug title_en title_ar',defaults:{kind:'editorial',active:true,status:'draft'}},
 photos:{label:['Original photography','الصور الأصلية'],table:'be_wte_photos',key:'id',title:'caption_en',write:'staff',
  columns:'place_id image_url caption_en caption_ar image_alt_en image_alt_ar image_credit image_rights_confirmed position',required:'place_id image_url',defaults:{image_rights_confirmed:false}},
 badges:{label:['Passport badges','شارات جواز السفر'],table:'be_wte_badges',key:'id',title:'label_en',write:'staff',
  columns:'slug label_en label_ar description_en description_ar kind criteria threshold status editorial_approved',required:'slug label_en label_ar',defaults:{kind:'passport',criteria:'manual',threshold:1,status:'draft'}},
 recognitions:{label:['Awards & Mama approvals','الجوائز واختيارات ماما'],table:'be_wte_recognitions',key:'id',title:'display_note_en',write:'admin',
  columns:'place_id kind status editorial_approved evidence display_note_en display_note_ar approved_at',required:'place_id kind',defaults:{kind:'mama',status:'draft'}},
 terms:{label:['Cities & cuisines','المدن وأنواع الأكل'],table:'be_wte_terms',key:'id',title:'label_en',write:'staff',
  columns:'kind slug label_en label_ar active position',required:'kind slug label_en label_ar',defaults:{kind:'city',active:true}},
 features:{label:['Seven feature descriptions','وصف التجارب السبعة'],table:'be_wte_features',key:'slug',title:'title_en',write:'staff',fixed:true,
  columns:'title_en title_ar intro_en intro_ar status editorial_approved position',required:'title_en title_ar',defaults:{}},
 ideas:{label:['Community food ideas','أفكار الأكل من القراء'],table:'be_wte_ideas',key:'id',title:'title',write:'staff',fixed:true,
  columns:'title description mode ingredients photo_path photo_rights_confirmed tested status',required:'title',defaults:{}},
 lab:{label:['Food Personality Lab settings','إعدادات معمل شخصية الأكل'],table:'be_wte_lab_settings',key:'id',title:'id',write:'staff',fixed:true,
  columns:'questions archetypes rules',required:'questions archetypes rules',defaults:{}},
 settings:{label:['Launch & site settings','إعدادات النشر والموقع'],table:'be_wte_settings',key:'id',title:'id',write:'admin',fixed:true,
  columns:'guide_intro_en guide_intro_ar pdf_url brand_hero_url brand_hero_rights_confirmed site_enabled editorial_launch_approved',
  required:'',defaults:{}}
};
const SETS={
 kind:['city','cuisine'],mode:['classics','fusion','weird','chaos'],price_band:['budget','mid','premium'],
 status:['draft','ready','preview','published','approved','pending','rejected','revoked','hidden','archived'],
};
const BOOL=new Set('image_rights_confirmed ingredients_verified editorial_approved featured tested active photo_rights_confirmed brand_hero_rights_confirmed site_enabled editorial_launch_approved'.split(' '));
const NUMBER=new Set('position latitude longitude weirdness adventurous comfort sweet spice prep_minutes threshold'.split(' '));
const ARRAY=new Set('tags ingredients allergens flavours textures dietary_tags'.split(' '));
const JSONCOL=new Set('questions archetypes rules'.split(' '));
const MULTI=new Set('summary_en summary_ar description_en description_ar body_en body_ar must_try_en must_try_ar testing_notes evidence guide_intro_en guide_intro_ar'.split(' '));
const URLS=new Set('image_url website_url instagram_url booking_url recipe_url pdf_url brand_hero_url'.split(' '));
const KEY_UUID=new Set(['id','place_id','city_id','cuisine_id']);
const PER_TABLE_OPTIONS={sections:{kind:['editorial','faq','collection'],status:['draft','ready','published']},
 foods:{mode:['classics','fusion','weird','chaos'],status:['draft','preview','published','archived','hidden']},
 places:{status:['draft','ready','published']},
 badges:{kind:['passport','recognition'],status:['draft','preview','published','archived','hidden']},
 features:{status:['draft','preview','published','archived','hidden']},
 recognitions:{kind:['mama','badge'],status:['draft','approved','revoked']},
 ideas:{mode:['fusion','weird','chaos'],status:['pending','approved','rejected','hidden']},
 terms:{kind:['city','cuisine']}};
const h=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fieldsFor=key=>SCHEMAS[key].columns.split(' ');
const human=s=>s.replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const fromComma=v=>String(v||'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
const safeImage=v=>{try{const u=new URL(v);return u.protocol==='https:'?u.href:'';}catch{return '';}};
export async function mountExperienceEditor({client,target,locale,role}){
 if(!target||!client)return;
 const ar=locale==='ar',t=(en,arabic)=>ar?arabic:en;
 const [session,staff]=await Promise.all([client.auth.getUser(),client.rpc('be_staff')]);
 if(!session.data?.user?.email_confirmed_at||staff.error||staff.data!==true||!['editor','admin'].includes(role)){
  target.textContent=t('Access denied: verified editor or administrator account required.','الدخول للمحررين والمديرين الموثقين فقط.');return;
 }
 const state={category:'places',list:[],selected:null,terms:[],places:[],working:false};
 const message=(text,bad=false)=>{const el=target.querySelector('#be-content-status');if(el){el.textContent=text;el.dataset.error=bad?'true':'false';}};
 const header='<style>.be-content-desk{--accent:#72253f;color:#33232b}.be-content-desk .be-content-tools{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;margin-block:15px}.be-content-desk select,.be-content-desk input,.be-content-desk textarea{width:100%;min-height:42px;max-width:100%;padding:9px;border:1px solid #d9bdc7;background:#fffaf2;color:#33232b;border-radius:0}.be-content-desk .be-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.be-content-desk .be-wide{grid-column:1/-1}.be-content-desk label{display:grid;gap:5px;font-size:.9rem;font-weight:600}.be-content-desk .be-check{display:flex;align-items:center;gap:10px}.be-content-desk .be-check input{width:20px;min-height:20px}.be-content-desk .be-items{display:grid;gap:7px;max-height:350px;overflow:auto;padding:6px;background:#f5e9e7}.be-content-desk .be-items button{background:white;text-align:start;border:1px solid #decbd0;padding:10px;cursor:pointer}.be-content-desk .be-items button[aria-current=true]{border-color:var(--accent);font-weight:700}.be-content-desk .be-commands{display:flex;flex-wrap:wrap;gap:9px;margin-block:15px}.be-content-desk button{min-height:42px;padding:9px 14px;cursor:pointer}.be-content-desk .be-save{background:var(--accent);color:#fffaf2;border:1px solid var(--accent)}.be-content-desk small{font-size:.8rem;color:#685961}.be-content-desk .be-two-panel{display:grid;grid-template-columns:minmax(220px,.8fr) minmax(0,1.2fr);gap:18px}.be-content-desk .be-hint{padding:12px 14px;border-inline-start:3px solid var(--accent);background:#faf0f0}.be-content-desk [hidden]{display:none!important}@media(max-width:790px){.be-content-desk .be-two-panel,.be-content-desk .be-grid,.be-content-desk .be-content-tools{grid-template-columns:minmax(0,1fr)}.be-content-desk .be-wide{grid-column:auto}}</style>';
 target.innerHTML=header+'<div class="be-content-desk"><p class="be-hint">'+t('Add real content when you are ready. Drafts stay private until you explicitly approve and publish them. All changes require editor/admin permission.','ضيف المحتوى الأصلي وقت ما تحب. المسودات خاصة لحد ما توافق وتنشر بنفسك. كل التعديلات للمحررين والمديرين فقط.')+'</p>'+
 '<label>'+t('Content section','القسم')+'<select id="be-catalog-type">'+Object.entries(SCHEMAS).filter(([,v])=>v.write!=='admin'||role==='admin').map(([k,v])=>'<option value="'+k+'">'+h(t(...v.label))+'</option>').join('')+'</select></label>'+
 '<p id="be-content-status" role="status" aria-live="polite"></p><div class="be-two-panel"><aside><div class="be-content-tools"><strong>'+t('Saved entries','السجلات المحفوظة')+'</strong><button id="be-content-new" type="button">'+t('Add new','إضافة')+'</button></div><div class="be-items" id="be-content-list"></div></aside><div id="be-content-editor"></div></div></div>';
 const listEl=target.querySelector('#be-content-list'),editEl=target.querySelector('#be-content-editor');
 const refreshReference=async()=>{
  const [terms,places]=await Promise.all([
   client.from('be_wte_terms').select('id,kind,label_en,label_ar').order('position'),
   client.from('be_wte_places').select('id,name_en,name_ar').order('name_en')]);
  if(!terms.error)state.terms=terms.data||[];
  if(!places.error)state.places=places.data||[];
 };
 const formatReference=(name,value)=>{
  const opts=name==='place_id'?state.places:
     name==='city_id'?state.terms.filter(x=>x.kind==='city'):
     name==='cuisine_id'?state.terms.filter(x=>x.kind==='cuisine'):[];
  return '<select name="'+name+'"'+(SCHEMAS[state.category].required.split(' ').includes(name)?' required':'')+'><option value="">'+t('Select…','اختر…')+'</option>'+
   opts.map(o=>'<option value="'+h(o.id)+'"'+(o.id===value?' selected':'')+'>'+h(t(o.name_en||o.label_en,o.name_ar||o.label_ar))+'</option>').join('')+'</select>';
 };
 const field=(name,entry)=>{
  const schema=SCHEMAS[state.category],required=schema.required.split(' ').includes(name);
  const val=entry?.[name]??schema.defaults[name]??(BOOL.has(name)?false:'');
  const title=human(name)+(required?' *':'');
  if(BOOL.has(name))return '<label class="be-check"><input type="checkbox" name="'+name+'"'+(val?' checked':'')+'><span>'+h(title)+'</span></label>';
  if(['place_id','city_id','cuisine_id'].includes(name))return '<label>'+h(title)+formatReference(name,val)+'</label>';
  const possible=PER_TABLE_OPTIONS[state.category]?.[name]||SETS[name];
  if(possible)return '<label>'+h(title)+'<select name="'+name+'">'+possible.map(x=>'<option value="'+h(x)+'"'+(x===val?' selected':'')+'>'+h(human(x))+'</option>').join('')+'</select></label>';
  const wide=MULTI.has(name)||JSONCOL.has(name)||ARRAY.has(name);
  const raw=ARRAY.has(name)?(Array.isArray(val)?val.join(', '):''):JSONCOL.has(name)?JSON.stringify(val,null,2):String(val??'');
  if(wide)return '<label class="be-wide">'+h(title)+'<textarea name="'+name+'" rows="'+(JSONCOL.has(name)?10:4)+'" '+(required?'required':'')+'>'+h(raw)+'</textarea>'+
   (ARRAY.has(name)?'<small>'+t('Separate values with commas','افصل القيم بفواصل')+'</small>':'')+'</label>';
  return '<label>'+h(title)+'<input name="'+name+'" type="'+(NUMBER.has(name)?'number':URLS.has(name)?'url':'text')+'" '+
   (NUMBER.has(name)&&['latitude','longitude'].includes(name)?'step="any" ':'')+
   (required?'required ':'')+'value="'+h(raw)+'"></label>';
 };
 const editor=()=>{
  const key=state.category,schema=SCHEMAS[key],entry=state.selected;
  const addAllowed=!schema.fixed;
  const readonly=role!=='admin'&&schema.write==='admin';
  editEl.innerHTML='<h3>'+h(entry?t('Edit record','تعديل السجل'):t('New record','سجل جديد'))+'</h3>'+
   '<p>'+h(t('English and Arabic fields are saved together. You control when the content becomes public.','النسختين الإنجليزية والعربية بيتحفظوا مع بعض. وإنت بتختار إمتى تنشر.'))+'</p>'+
   (!entry&&!addAllowed?'<p>'+t('Select an existing record to edit.','اختر سجل موجود لتعديله.')+'</p>':
   '<form id="be-content-form" class="be-grid" novalidate>'+fieldsFor(key).map(x=>field(x,entry)).join('')+
   '<div class="be-commands be-wide"><button class="be-save" type="submit"'+(readonly?' disabled':'')+'>'+t('Save changes','احفظ التعديلات')+'</button>'+
   (entry&&!schema.fixed?'<button type="button" id="be-content-delete">'+t('Delete record','احذف السجل')+'</button>':'')+
   (entry?'<button type="button" id="be-content-preview">'+t('Preview content','معاينة المحتوى')+'</button>':'')+'</div></form>');
 };
 const title=(item)=>String(item[SCHEMAS[state.category].title]||item.slug||item.id||t('Untitled','بدون عنوان'));
 const entries=()=>{
  const schema=SCHEMAS[state.category];
  listEl.innerHTML=state.list.length?state.list.map((item,i)=>
    '<button data-item="'+i+'" type="button" aria-current="'+(item[schema.key]===state.selected?.[schema.key])+'">'+h(title(item))+
    '<br><small>'+h(item.status||item.kind||item.slug||'')+'</small></button>').join(''):
    '<p>'+t('No entries yet. Use Add new when ready.','لسه مفيش سجلات. ابدأ بإضافة سجل وقت ما تحب.')+'</p>';
  const btn=target.querySelector('#be-content-new');
  if(btn)btn.disabled=schema.fixed;
 };
 const reload=async()=>{
  const schema=SCHEMAS[state.category];
  message(t('Loading…','جارٍ التحميل…'));
  const {data,error}=await client.from(schema.table).select('*').limit(200);
  if(error){message(error.message,true);return;}
  state.list=data||[];
  state.selected=null;entries();editor();message(t('Ready for your content.','جاهز لإضافة المحتوى.'));
 };
 const parse=(form)=>{
  const schema=SCHEMAS[state.category],row={};
  for(const name of fieldsFor(state.category)){
   const el=form.elements.namedItem(name);if(!el)continue;
   if(BOOL.has(name))row[name]=el.checked;
   else if(ARRAY.has(name))row[name]=fromComma(el.value);
   else if(JSONCOL.has(name))row[name]=JSON.parse(el.value.trim()||'null');
   else if(NUMBER.has(name))row[name]=el.value.trim()===''?null:Number(el.value);
   else row[name]=el.value.trim()||(['place_id','city_id','cuisine_id'].includes(name)||URLS.has(name)?null:'');
  }
  // Publish gates must be deliberate. A status update alone cannot bypass approval.
  if(row.status==='published'||row.status==='approved'){
   if(!row.editorial_approved)throw Error(t('Approve this record before publishing.','لازم توافق على السجل قبل النشر.'));
   if(row.image_url&&!row.image_rights_confirmed)throw Error(t('Confirm photo rights before publishing.','لازم تؤكد حقوق نشر الصورة قبل النشر.'));
   if(row.kind==='mama'&&schema.table==='be_wte_recognitions'&&!row.approved_at)
    throw Error(t('Set an approval timestamp for recognition records.','حدد تاريخ الموافقة لسجلات الاختيارات.'));
  }
  if((row.image_url||row.photo_path)&&row.image_rights_confirmed!==true&&schema.table==='be_wte_photos')
   throw Error(t('Only upload photographs with confirmed rights.','مش مسموح برفع صور بدون تأكيد حقوق النشر.'));
  return row;
 };
 target.querySelector('#be-catalog-type').addEventListener('change',async e=>{
  state.category=e.target.value;
  await refreshReference();await reload();
 });
 target.addEventListener('click',async e=>{
  const item=e.target.closest('[data-item]');
  if(item){state.selected=state.list[Number(item.dataset.item)];entries();editor();return;}
  if(e.target.closest('#be-content-new')){state.selected=null;entries();editor();return;}
  if(e.target.closest('#be-content-preview')){
   const record=state.selected;
   if(!record)return;
   const preview=Object.entries(record).filter(([key])=>!['id','created_at','updated_at'].includes(key))
     .map(([key,val])=>human(key)+': '+(typeof val==='object'?JSON.stringify(val):String(val??''))).join('\n');
   window.alert(preview||t('No preview available.','مفيش معاينة متاحة.'));return;
  }
  if(e.target.closest('#be-content-delete')){
   if(!state.selected||role!=='admin'&&SCHEMAS[state.category].write==='admin')return;
   if(!window.confirm(t('Delete this entry permanently?','هل تريد حذف السجل نهائيًا؟')))return;
   const schema=SCHEMAS[state.category];
   const {error}=await client.from(schema.table).delete().eq(schema.key,state.selected[schema.key]);
   if(error){message(error.message,true);return;}
   await reload();
  }
 });
 target.addEventListener('submit',async e=>{
  if(e.target.id!=='be-content-form')return;
  e.preventDefault();if(state.working)return;
  if(!isVerified())return;
  state.working=true;
  const submit=e.target.querySelector('[type=submit]');if(submit)submit.disabled=true;
  try{
   const schema=SCHEMAS[state.category],row=parse(e.target);
   if(schema.write==='admin'&&role!=='admin')throw Error(t('Administrator only.','للمدير فقط.'));
   const query=state.selected?
      client.from(schema.table).update(row).eq(schema.key,state.selected[schema.key]):
      client.from(schema.table).insert(row);
   const {error}=await query.select(schema.key).single();
   if(error)throw error;
   message(t('Saved successfully.','تم حفظ البيانات بنجاح.'));await reload();
  }catch(error){message(error.message||t('Save failed.','تعذّر الحفظ.'),true);}
  finally{state.working=false;if(submit)submit.disabled=false;}
 });
 const isVerified=()=>role==='admin'||role==='editor';
 await refreshReference();
 await reload();
}

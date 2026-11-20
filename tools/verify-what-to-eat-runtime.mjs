import {readFileSync} from 'node:fs';
import {runInNewContext,createContext,runInContext} from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('./what-to-eat-client.mjs',import.meta.url),'utf8').replace(/\nmain\(\);\s*$/,'');
assert(!source.endsWith('main();'),'Must remove startup before isolated tests.');
const els=new Map(),el=id=>{if(!els.has(id))els.set(id,{innerHTML:'',textContent:'',dataset:{}});return els.get(id);};
const root=el('wte-root');root.addEventListener=()=>{};
const sandbox={window:{BE_WTE_CONFIG:{basePath:'/'}},document:{
  documentElement:{lang:'en'},body:{dataset:{wteMode:'editor'}},
  getElementById:el,querySelectorAll:()=>[]
 },URL,console};
const ctx=createContext(sandbox);
runInContext(source,ctx,{timeout:3000});
const fixture=String.raw`state.user={id:'owner'};state.role='admin';state.settings={site_enabled:false,partner_approved:false,pdf_url:null};
state.terms=[{id:'city',kind:'city',slug:'cairo',label_en:'Cairo',label_ar:'القاهرة',active:true,position:0},{id:'food',kind:'cuisine',slug:'egyptian',label_en:'Egyptian',label_ar:'مصري',active:true,position:0}];
state.places=[{id:'place',slug:'test-place',name_en:'Sample Private',name_ar:'مثال خاص',city_id:'city',cuisine_id:'food',status:'draft',partner_reviewed:false,summary_en:'Editorial preview only',summary_ar:'معاينة',tags:['breakfast'],position:0,image_url:null}];
state.photos=[{id:'photo',place_id:'place',image_url:'storage:original.jpg',caption_en:'Photo draft',caption_ar:'صورة',position:0}];
state.sections=[{id:'s1',kind:'editorial',slug:'intro',title_en:'Intro draft',title_ar:'مقدمة',body_en:'Private description',body_ar:'وصف',status:'draft',partner_reviewed:false,active:true,position:0},{id:'s2',kind:'faq',slug:'faq',title_en:'FAQ draft',title_ar:'سؤال',body_en:'Not launched',body_ar:'غير متاح',status:'draft',partner_reviewed:false,active:true,position:1},{id:'s3',kind:'collection',slug:'collection',title_en:'Breakfast collection',title_ar:'فطار',body_en:'Category',body_ar:'مجموعة',filter_tag:'breakfast',status:'draft',partner_reviewed:false,active:true,position:2}];
state.notes=[];state.editing=state.places[0];
`;
runInContext(fixture,ctx,{timeout:3000});
runInContext('renderEditor()',ctx,{timeout:3000});
for(const marker of ['wte-place-form','wte-section-form','wte-photo-form','wte-term-form','wte-settings-form','wte-brand-form','Launch readiness','Sample Private']){
 assert(root.innerHTML.includes(marker),'Editor missing '+marker);
}
// Authenticated staff can preview the FULL branded visitor view on the same private URL.
sandbox.window.location={search:'?preview=1'};
runInContext('render()',ctx,{timeout:3000});
assert.equal(runInContext('previewMode()',ctx),true,'Secure preview mode was not recognized.');
for(const marker of ['wte-preview-toolbar','wte-brand-hero','wte-filters','wte-results','wte-sections','Sample Private','Back to content studio']){
 assert(root.innerHTML.includes(marker),'Private branded preview missing '+marker);
}
assert(!root.innerHTML.includes('wte-card-actions'),'Visitor preview should not expose edit/delete buttons.');
sandbox.window.location={search:''};
runInContext('render()',ctx,{timeout:3000});
assert(root.innerHTML.includes('wte-brand-form'),'Leaving preview did not return to Editorial Desk');
// Anonymous users trying to guess ?preview=1 must see a sign-in, not draft data.
const anonymousEditorRoot={innerHTML:'',addEventListener:()=>{}};
const anonymousEditorCtx=createContext({
 window:{BE_WTE_CONFIG:{basePath:'/'},location:{search:'?preview=1'}},
 document:{documentElement:{lang:'en'},body:{dataset:{wteMode:'editor'}},
   getElementById:()=>anonymousEditorRoot,querySelectorAll:()=>[]},
 URL,console
});
runInContext(source,anonymousEditorCtx,{timeout:3000});
runInContext("state.role=null;state.user=null;state.settings={site_enabled:false,partner_approved:false};state.sections=[{title_en:'Secret Draft'}];render()",anonymousEditorCtx,{timeout:3000});
assert(anonymousEditorRoot.innerHTML.includes('Editorial sign-in'),'Preview must require authentication.');
assert(!anonymousEditorRoot.innerHTML.includes('Secret Draft'),'Anonymous editor preview leaked private content.');
const html=runInContext('sectionHTML()',ctx,{timeout:3000});
assert(root.innerHTML.includes('brand_hero_url'),'Admin branding controls missing');
for(const marker of ['Intro draft','FAQ draft','Breakfast collection','Sample Private']){
 assert(html.includes(marker),'Private preview section missing '+marker);
}
runInContext("state.search='nonexistent'",ctx,{timeout:3000});
assert.equal(runInContext('visiblePlaces().length',ctx),0,'Search must filter the result list.');
// Reinitialize the module in guest mode; the editor flag is captured at startup.
const guestRoot={innerHTML:'',addEventListener:()=>{}};
const guestDocument={documentElement:{lang:'en'},body:{dataset:{wteMode:'guide'}},
 getElementById:()=>guestRoot,querySelectorAll:()=>[]};
const guestCtx=createContext({window:{BE_WTE_CONFIG:{basePath:'/'}},document:guestDocument,URL,console});
runInContext(source,guestCtx,{timeout:3000});
runInContext("state.settings={site_enabled:false,partner_approved:false};state.role=null;state.user=null;state.places=[{name_en:'Sample Private'}];state.sections=[{title_en:'Private description'}];render()",guestCtx,{timeout:3000});
assert(guestRoot.innerHTML.includes('Page not found'),'Guest must see unavailable page.');
assert(!guestRoot.innerHTML.includes('Sample Private'),'Guest HTML leaked private entries.');
assert(!guestRoot.innerHTML.includes('Private description'),'Guest HTML leaked private sections.');
assert.equal(runInContext('sectionHTML()',guestCtx),'','Unauthenticated guest must not see draft sections.');
console.log('PASS: Admin tools, editable sections, galleries, category filters, collection matching and private guest visibility.');

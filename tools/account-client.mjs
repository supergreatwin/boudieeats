// BoudieEats private accounts. The publishable key is intentionally public;
// authorization ALWAYS comes from Supabase Auth + database RLS, not this UI.
// Never embed a service role / secret key here.
const config=window.BE_AUTH_CONFIG||{};
const language=document.documentElement.lang.startsWith('ar')?'ar':'en';
const ar=language==='ar';
const tr=(en,arabic)=>ar?arabic:en;
const root=document.getElementById('be-account-app');
const status=document.getElementById('be-account-status');
const base=config.basePath||'/';
const here=location.origin+base+(ar?'ar/':'')+(document.body.dataset.mode==='desk'?'editorial-desk/':'account/');
let client=null, user=null, profile=null, tab=document.body.dataset.mode==='desk'?'articles':'profile', authMode='login', recovery=false, refreshing=false;

const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roleLabel=r=>({
 reader:tr('Reader','قارئ'),
 contributor:tr('Contributor','مساهم'),
 editor:tr('Editor','محرر'),
 admin:tr('Administrator','مدير')
})[r]||r;
function say(message,error=false){status.textContent=message||'';status.dataset.error=error?'true':'false';}
function button(label,action,klass=''){return '<button type="button" class="'+klass+'" data-action="'+action+'">'+label+'</button>';}
const showProfile=()=>tab==='profile';
const isStaff=()=>profile&&['editor','admin'].includes(profile.role);
const canWrite=()=>profile&&['contributor','editor','admin'].includes(profile.role);
const value=(form,name)=>String(new FormData(form).get(name)||'').trim();
function formFrame(type,fields,buttonText){
 return '<form data-form="'+type+'" class="be-form">'+fields+'<button class="be-primary" type="submit">'+buttonText+'</button></form>';
}
const input=(name,label,options={})=>'<label class="be-field"><span>'+label+'</span><input name="'+name+'" '+(options.type?'type="'+options.type+'"':'type="text"')+' '+(options.required?'required ':'')+
 (options.minlength?'minlength="'+options.minlength+'" ':'')+(options.maxlength?'maxlength="'+options.maxlength+'" ':'')+
 (options.autocomplete?'autocomplete="'+options.autocomplete+'" ':'')+
 (options.pattern?'pattern="'+options.pattern+'" ':'')+
 (options.value!==undefined?'value="'+escapeHtml(options.value)+'" ':'')+
 'placeholder="'+escapeHtml(options.placeholder||'')+'"></label>';
const area=(name,label,content,min=20)=>'<label class="be-field"><span>'+label+'</span><textarea name="'+name+'" required minlength="'+min+'" maxlength="100000">'+escapeHtml(content||'')+'</textarea></label>';
const select=(name,label,options)=>'<label class="be-field"><span>'+label+'</span><select name="'+name+'">'+options.map(([id,text])=>'<option value="'+id+'">'+text+'</option>').join('')+'</select></label>';
const kindOptions=[['recipe',tr('Recipe','وصفة')],['review',tr('Review','تجربة')],['story',tr('Food story','حكاية أكل')]];
function authPanel(){
 const email=input('email',tr('Email address','البريد الإلكتروني'),{type:'email',required:true,autocomplete:'email'});
 const password=input('password',tr('Password (at least 12 characters)','كلمة المرور (١٢ حرف على الأقل)'),{type:'password',required:true,minlength:12,autocomplete:authMode==='signup'?'new-password':'current-password'});
 if(authMode==='signup')return '<section class="be-panel"><h2>'+tr('Create your BoudieEats account','إنشاء حساب جديد في بودي إيتس')+'</h2><p>'+tr('A username is public-facing; email stays private. Your account must be confirmed by email.','اسم المستخدم ممكن يظهر للقراء، لكن بريدك خاص. لازم تأكد حسابك من رسالة البريد.')+'</p>'+
  formFrame('signup',input('username',tr('Unique username','اسم مستخدم فريد'),{required:true,pattern:'[a-z][a-z0-9_]{2,23}',minlength:3,maxlength:24,autocomplete:'username',placeholder:'boudiefan'})+
  input('display_name',tr('Display name (optional)','اسم العرض (اختياري)'),{maxlength:80})+email+password,tr('Create account','إنشاء الحساب'))+
  '<p class="be-muted">'+button(tr('Already registered? Sign in','عندك حساب؟ سجّل دخولك'),'login')+'</p></section>';
 if(authMode==='forgot')return '<section class="be-panel"><h2>'+tr('Reset your password','إعادة تعيين كلمة المرور')+'</h2>'+
 formFrame('forgot',email,tr('Email me a reset link','إرسال رابط الاستعادة'))+
 '<p class="be-muted">'+button(tr('Back to sign in','الرجوع لتسجيل الدخول'),'login')+'</p></section>';
 if(authMode==='recovery')return '<section class="be-panel"><h2>'+tr('Choose a new password','اختيار كلمة مرور جديدة')+'</h2>'+
 formFrame('recovery',input('password',tr('New password','كلمة المرور الجديدة'),{type:'password',required:true,minlength:12,autocomplete:'new-password'}),tr('Update password','تحديث كلمة المرور'))+'</section>';
 return '<section class="be-panel"><h2>'+tr('Sign in','تسجيل الدخول')+'</h2>'+
  formFrame('login',email+password,tr('Sign in','دخول'))+
  '<div class="be-actions">'+button(tr('Create account','إنشاء حساب'),'signup')+button(tr('Forgot password?','نسيت كلمة المرور؟'),'forgot')+'</div></section>';
}
function nav(){
 const items=[['profile',tr('My account','حسابي')],['desk',tr('Editorial desk','مكتب التحرير')],['pitches',tr('Ideas & pitches','الأفكار والاقتراحات')]];
 if(canWrite())items.push(['drafts',tr('My drafts','مسوداتي')]);
 if(isStaff())items.push(['review',tr('Review queue','المراجعة')]);
 if(profile?.role==='admin')items.push(['applications',tr('Applications','طلبات المساهمة')]);
 return '<nav class="be-tabs" aria-label="'+tr('Account sections','أقسام الحساب')+'">'+items.map(([k,l])=>button(l,'tab:'+k,tab===k?'be-active':'')).join('')+'</nav>';
}
function profileView(){
 return '<section class="be-panel"><h2>'+tr('Profile & username','الملف الشخصي واسم المستخدم')+'</h2><p class="be-muted">'+
 tr('Your email is only used for signing in: ','بريدك يستخدم لتسجيل الدخول فقط: ')+escapeHtml(user.email)+'</p>'+
 formFrame('profile',
 input('username',tr('Username','اسم المستخدم'),{value:profile.username||'',pattern:'[a-z][a-z0-9_]{2,23}',minlength:3,maxlength:24,required:true})+
 input('display_name',tr('Display name','الاسم الظاهر'),{value:profile.display_name,maxlength:80})+
 area('bio',tr('Short bio','نبذة قصيرة'),profile.bio||'',0).replace('required minlength="0"','maxlength="500"'),
 tr('Save profile','حفظ الملف الشخصي'))+
 '<p class="be-muted">'+tr('Usernames use 3–24 lowercase Latin letters, numbers and underscores.','اسم المستخدم من ٣ إلى ٢٤ حرف إنجليزي صغير أو رقم أو شرطة سفلية، ويبدأ بحرف.')+'</p></section>';
}
function pitchView(){
 return '<div class="be-columns"><section class="be-panel"><h2>'+tr('Send an idea','شاركنا فكرة')+'</h2><p>'+tr('Suggest a place, recipe, product or food story. Submissions stay private.','اقترح مطعم أو وصفة أو منتج أو حكاية أكل. اقتراحك مش بيتنشر علنًا.')+'</p>'+
 formFrame('pitch',select('kind',tr('Type','النوع'),[...kindOptions,['other',tr('Other','غير ذلك')]])+
 input('title',tr('Working title','عنوان الفكرة'),{required:true,minlength:4,maxlength:160})+
 area('description',tr('Tell us about it','احكيلنا التفاصيل'),'',20),tr('Send idea','إرسال الفكرة'))+
 '</section><section class="be-panel"><h2>'+tr('My submissions','اقتراحاتي')+'</h2><div id="be-pitch-list" aria-live="polite">'+tr('Loading…','جارٍ التحميل…')+'</div></section></div>';
}
function applyView(){
 return '<section class="be-panel"><h2>'+tr('Become a contributor','انضم لفريق المساهمين')+'</h2><p>'+tr('Apply to write recipes, reviews and food stories. An administrator reviews applications.','قدّم طلب مساهمة لكتابة وصفات وتجارب وحكايات عن الأكل. مدير الموقع بيراجع الطلبات.')+'</p>'+
 formFrame('apply',area('statement',tr('Why would you like to contribute?','ليه حابب تساهم؟'),'',30),tr('Apply','إرسال الطلب'))+
 '<div id="be-application-state" class="be-muted"></div></section>';
}
function deskView(){
 return '<div class="be-metrics">'+
 '<section><span>'+tr('Your role','صلاحيتك')+'</span><strong>'+roleLabel(profile.role)+'</strong></section>'+
 '<section><span>'+tr('Your username','اسم المستخدم')+'</span><strong dir="ltr">@'+escapeHtml(profile.username||tr('not set','غير محدد'))+'</strong></section></div>'+
 '<div class="be-columns"><section class="be-panel"><h2>'+tr('Editorial workflow','سير عمل التحرير')+'</h2><p>'+
 tr('Ideas → drafts → review → approval. Approved content is not automatically published to the website until publishing integration is enabled.',
 'أفكار ← مسودات ← مراجعة ← موافقة. الموافقة مش معناها نشر تلقائي على الموقع لحد ربط نظام النشر.')+'</p>'+
 (canWrite()?button(tr('Open drafts','افتح المسودات'),'tab:drafts','be-primary'):button(tr('Apply to contribute','قدّم طلب مساهمة'),'tab:apply','be-primary'))+
 '</section><section class="be-panel"><h2>'+tr('Incoming ideas','الأفكار الواردة')+'</h2><p>'+tr('Your ideas are private; editors can review them.','أفكارك خاصة، والمحررين يقدروا يراجعوها.')+'</p>'+
 button(tr('View ideas','عرض الأفكار'),'tab:pitches')+'</section></div>';
}
function draftView(){
 return '<div class="be-columns"><section class="be-panel"><h2>'+tr('Write a draft','كتابة مسودة')+'</h2><p>'+tr('Create a private recipe, review or story draft. Publishing remains an editor-controlled process.','اكتب مسودة خاصة لوصفة أو مراجعة أو حكاية. النشر تحت مسؤولية التحرير.')+'</p>'+
 formFrame('draft',select('kind',tr('Section','القسم'),kindOptions)+select('language',tr('Language','اللغة'),[['ar','العربية'],['en','English']])+
 input('title',tr('Title','العنوان'),{required:true,minlength:4,maxlength:160})+
 input('slug',tr('URL slug (Latin letters and hyphens)','الرابط المختصر (حروف إنجليزية وشرطة)'),{required:true,pattern:'[a-z0-9]+(-[a-z0-9]+)*',maxlength:90,placeholder:'my-food-story'})+
 area('body',tr('Article text','نص المقال'),'',50),tr('Save draft','حفظ المسودة'))+
 '</section><section class="be-panel"><h2>'+tr('Saved drafts','المسودات المحفوظة')+'</h2><div id="be-draft-list" aria-live="polite">'+tr('Loading…','جارٍ التحميل…')+'</div></section></div>';
}
function staffView(){
 return '<section class="be-panel"><h2>'+tr('Editorial review queue','قائمة مراجعة التحرير')+'</h2><p class="be-muted">'+tr('Review and approve submitted drafts; approval does not publish to the public site.','راجع المسودات ووافق عليها؛ الموافقة مش بتنشر المقال تلقائيًا على الموقع.')+'</p><div id="be-review-list">'+tr('Loading…','جارٍ التحميل…')+'</div></section>';
}
function applicationView(){
 return '<section class="be-panel"><h2>'+tr('Contributor applications','طلبات المساهمة')+'</h2><div id="be-admin-apps">'+tr('Loading…','جارٍ التحميل…')+'</div></section>';
}

const deskMode=document.body.dataset.mode==='desk';
const statusLabel=state=>({
 draft:tr('Draft','مسودة'),submitted:tr('Submitted','اتبعثت'),
 needs_changes:tr('Changes requested','تعديلات مطلوبة'),
 approved:tr('Approved','اتوافقت'),
 received:tr('Received','وصلت'),in_review:tr('In review','قيد المراجعة'),
 accepted:tr('Accepted','اتقبلت'),declined:tr('Declined','اعتذرنا عنها'),
 pending:tr('Pending','قيد المراجعة')
})[state]||state;
const formatDate=date=>date?new Date(date).toLocaleDateString(ar?'ar-EG':'en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
function deskNav(){
 const items=[
  ...(canWrite()?[['articles',tr('Articles','المقالات')]]:[['apply',tr('Contribute','المساهمة')]]),
  ['alerts',tr('Notifications','الإشعارات')],
  ['profile',tr('Profile','الملف الشخصي')],
  ['pitches',tr('Pitches','الأفكار الواردة')],
  ...(isStaff()?[
   ['review',tr('Review queue','المراجعة')],
   ['analytics',tr('Analytics','الإحصائيات')],
   ['activity',tr('Recent activity','النشاط الأخير')]
  ]:[]),
  ...(profile?.role==='admin'?[['accounts',tr('Accounts','الحسابات')]]:[])
 ];
 return '<nav class="be-tabs" aria-label="'+tr('Editorial desk sections','أقسام مكتب التحرير')+'">'+
  items.map(([key,label])=>button(label,'tab:'+key,tab===key?'be-active':'')).join('')+'</nav>';
}
const deskHeading=(title,desc)=>'<header class="be-view-heading"><div><h2>'+title+'</h2><p>'+desc+'</p></div></header>';
function deskArticles(){
 return deskHeading(tr('Articles & drafts','المقالات والمسودات'),
   tr('Prepare recipes, reviews and food stories. Review is required before approval.',
      'حضّر الوصفات والتجارب وحكايات الأكل، وابعث المسودات للمراجعة.'))+
   draftView()+(isStaff()?staffView():'')+
   '<p class="be-workflow-note">'+tr('Approval does not publish content to the public website until publishing integration is enabled.',
     'الموافقة على المقال مش معناها نشره تلقائيًا على الموقع لحد تفعيل ربط النشر.')+'</p>';
}
function deskPitches(){
 return deskHeading(tr('Pitches & ideas','الأفكار والاقتراحات'),
   tr('Review incoming food ideas and keep your own submissions in one place.',
      'راجع أفكار الأكل الواردة وتابع الاقتراحات اللي بعتهـا.'))+
   (isStaff()?'<section class="be-panel"><h2>'+tr('Incoming pitches','الأفكار الواردة')+
     '</h2><div id="be-incoming-pitches" aria-live="polite">'+tr('Loading…','جارٍ التحميل…')+'</div></section>':'')+
   pitchView();
}
function deskAlerts(){
 return deskHeading(tr('Notifications','الإشعارات'),
  tr('Live editorial items that need attention, drawn from your Boudie Eats records.',
     'متابعة مباشرة للمسودات والاقتراحات اللي محتاجة اهتمام في بودي إيتس.'))+
  '<section class="be-panel"><h2>'+tr('Items requiring attention','حاجات محتاجة متابعة')+
  '</h2><div id="be-desk-alerts" aria-live="polite">'+tr('Loading…','جارٍ التحميل…')+'</div></section>';
}
function deskAnalytics(){
 return deskHeading(tr('Editorial analytics','إحصائيات التحرير'),
 tr('Counts of editorial records, not website traffic or newsletter performance.',
    'أعداد السجلات التحريرية فقط، مش زيارات الموقع أو أداء النشرة.'))+
 '<div id="be-analytics-metrics" class="be-metrics" aria-live="polite">'+tr('Loading…','جارٍ التحميل…')+'</div>';
}
function deskActivity(){
 return deskHeading(tr('Recent editorial activity','النشاط التحريري الأخير'),
 tr('Recent drafts and pitches; this is not a security audit log.',
    'آخر المسودات والأفكار، وده مش سجل تدقيق أمني.'))+
 '<section class="be-panel"><div id="be-activity-list" aria-live="polite">'+tr('Loading…','جارٍ التحميل…')+'</div></section>';
}
function deskAccounts(){
 return deskHeading(tr('Accounts & contributors','الحسابات والمساهمين'),
 tr('Review contributor requests and view account roles. Existing permissions remain unchanged.',
    'راجع طلبات المساهمة واطلع على صلاحيات الحسابات من غير تغيير الأذونات الحالية.'))+
 '<div class="be-columns">'+applicationView()+
 '<section class="be-panel"><h2>'+tr('Team accounts','حسابات الفريق')+
 '</h2><div id="be-team-accounts" aria-live="polite">'+tr('Loading…','جارٍ التحميل…')+'</div></section></div>';
}
function renderDesk(){
 if(!['articles','apply','alerts','profile','pitches','review','analytics','activity','accounts'].includes(tab))
   tab=canWrite()?'articles':'apply';
 if(tab==='articles'&&!canWrite())tab='apply';
 if(tab==='review'&&!isStaff())tab=canWrite()?'articles':'apply';
 if(['analytics','activity'].includes(tab)&&!isStaff())tab='profile';
 if(tab==='accounts'&&profile.role!=='admin')tab='profile';
 if(tab==='apply'&&profile.role!=='reader')tab=canWrite()?'articles':'profile';
 const who=escapeHtml(profile.display_name||profile.username||tr('contributor','مساهم'));
 const handle=profile.username?'@'+escapeHtml(profile.username):tr('Username not set','اسم المستخدم غير محدد');
 root.innerHTML='<div class="be-workspace"><div class="be-workspace-head">'+
 '<div class="be-greeting"><div><div class="be-workspace-meta"><span>'+who+
 '</span><span>'+roleLabel(profile.role)+'</span><span dir="ltr">'+handle+'</span></div>'+
 '<h2>'+tr('Welcome to your editorial desk','أهلاً بيك في مكتب التحرير')+'</h2></div></div>'+
 button(tr('Sign out','تسجيل الخروج'),'logout')+'</div>'+
 deskNav()+'<div class="be-dashboard" id="be-editorial-view">'+(
 tab==='articles'?deskArticles():tab==='apply'?applyView():tab==='alerts'?deskAlerts():
 tab==='profile'?profileView():tab==='pitches'?deskPitches():tab==='review'?staffView():
 tab==='analytics'?deskAnalytics():tab==='activity'?deskActivity():deskAccounts()
 )+'</div></div>';
 if(tab==='articles'){loadDrafts();if(isStaff())loadReview();}
 if(tab==='apply')loadApplicationState();
 if(tab==='pitches'){loadPitches();if(isStaff())loadIncomingPitches();}
 if(tab==='review')loadReview();
 if(tab==='accounts'){loadApplications();loadTeamAccounts();}
 if(tab==='alerts')loadDeskAlerts();
 if(tab==='analytics')loadDeskMetrics();
 if(tab==='activity')loadDeskActivity();
}
async function loadIncomingPitches(){
 const target=document.getElementById('be-incoming-pitches');if(!target||!isStaff())return;
 const {data,error}=await client.from('be_pitches').select('id,title,kind,state,created_at').order('created_at',{ascending:false}).limit(70);
 if(!target.isConnected)return;
 if(error){target.textContent=error.message;return;}
 const actions=item=>item.state==='received'?
  pitchOption(tr('Start review','ابدأ المراجعة'),'in_review',item.id)+pitchOption(tr('Decline','اعتذار'),'declined',item.id):
  item.state==='in_review'?
  pitchOption(tr('Accept','موافقة'),'accepted',item.id)+pitchOption(tr('Decline','اعتذار'),'declined',item.id):'';
 target.innerHTML=data.length?data.map(x=>row(x.title,x.kind+' · '+statusLabel(x.state)+' · '+formatDate(x.created_at),actions(x))).join(''):
  '<p>'+tr('No incoming pitches.','مفيش أفكار واردة دلوقتي.')+'</p>';
}
function pitchOption(label,decision,id){
 return '<button type="button" data-action="pitch-decision" data-decision="'+decision+'" data-id="'+escapeHtml(id)+'">'+label+'</button>';
}
async function loadDeskAlerts(){
 const target=document.getElementById('be-desk-alerts');if(!target)return;
 const q=client.from('be_drafts').select('id,title,state,updated_at').in('state',isStaff()?['submitted','needs_changes']:['submitted','needs_changes']);
 const draftQuery=isStaff()?q:q.eq('author_id',user.id);
 const results=await Promise.all([
  draftQuery.order('updated_at',{ascending:false}).limit(20),
  isStaff()?client.from('be_pitches').select('id,title,state,created_at').in('state',['received','in_review']).order('created_at',{ascending:false}).limit(12):
   client.from('be_pitches').select('id,title,state,created_at').eq('author_id',user.id).order('created_at',{ascending:false}).limit(8)
 ]);
 if(!target.isConnected)return;
 for(const x of results)if(x.error){target.textContent=x.error.message;return;}
 const items=[
  ...results[0].data.map(x=>({title:x.title,meta:tr('Article','مقال')+' · '+statusLabel(x.state),date:x.updated_at})),
  ...results[1].data.map(x=>({title:x.title,meta:tr('Pitch','فكرة')+' · '+statusLabel(x.state),date:x.created_at}))
 ].sort((a,b)=>new Date(b.date)-new Date(a.date));
 target.innerHTML=items.length?items.map(x=>row(x.title,x.meta+' · '+formatDate(x.date))).join(''):
 '<p>'+tr('No items need attention right now.','مفيش حاجات محتاجة متابعة دلوقتي.')+'</p>';
}
async function loadDeskMetrics(){
 const target=document.getElementById('be-analytics-metrics');if(!target||!isStaff())return;
 const queries=[
  [tr('All drafts','كل المسودات'),client.from('be_drafts').select('id',{head:true,count:'exact'})],
  [tr('Submitted for review','بانتظار المراجعة'),client.from('be_drafts').select('id',{head:true,count:'exact'}).eq('state','submitted')],
  [tr('Approved','الموافق عليها'),client.from('be_drafts').select('id',{head:true,count:'exact'}).eq('state','approved')],
  [tr('Incoming pitches','الأفكار الواردة'),client.from('be_pitches').select('id',{head:true,count:'exact'})],
  [tr('Contributors','المساهمين'),client.from('be_profiles').select('id',{head:true,count:'exact'}).in('role',['contributor','editor','admin'])]
 ];
 const results=await Promise.all(queries.map(([,q])=>q));
 if(!target.isConnected)return;
 target.innerHTML=results.map((r,i)=>'<section><span>'+queries[i][0]+'</span><strong>'+(
 r.error?tr('Unavailable','غير متاح'):String(r.count??0))+'</strong></section>').join('');
}
async function loadDeskActivity(){
 const target=document.getElementById('be-activity-list');if(!target||!isStaff())return;
 const rr=await Promise.all([
 client.from('be_drafts').select('title,state,updated_at').order('updated_at',{ascending:false}).limit(20),
 client.from('be_pitches').select('title,state,created_at').order('created_at',{ascending:false}).limit(20)
 ]);
 if(!target.isConnected)return;
 for(const r of rr)if(r.error){target.textContent=r.error.message;return;}
 const items=[
  ...rr[0].data.map(x=>({title:x.title,meta:tr('Article','مقال')+' · '+statusLabel(x.state),date:x.updated_at})),
  ...rr[1].data.map(x=>({title:x.title,meta:tr('Pitch','فكرة')+' · '+statusLabel(x.state),date:x.created_at}))
 ].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,30);
 target.innerHTML=items.length?items.map(x=>row(x.title,x.meta+' · '+formatDate(x.date))).join(''):
 '<p>'+tr('No editorial records yet.','لسه مفيش سجلات تحريرية.')+'</p>';
}
async function loadTeamAccounts(){
 const target=document.getElementById('be-team-accounts');if(!target||profile?.role!=='admin')return;
 const {data,error}=await client.from('be_profiles').select('username,display_name,role,joined_at').order('joined_at',{ascending:false}).limit(80);
 if(!target.isConnected)return;
 if(error){target.textContent=error.message;return;}
 target.innerHTML=data.length?data.map(x=>row(x.display_name||x.username||tr('Unnamed account','حساب من غير اسم'),
  roleLabel(x.role)+' · '+formatDate(x.joined_at))).join(''):
 '<p>'+tr('No team accounts found.','مفيش حسابات ظاهرة.')+'</p>';
}

function render(){
 if(!root)return;
 if(!client){
  root.innerHTML='<section class="be-panel be-disabled"><h2>'+tr('Accounts are being configured','بنجهّز نظام الحسابات')+'</h2><p>'+
  tr('The independent BoudieEats account backend is not connected yet. Registration is disabled until email verification and database permissions have been tested.',
  'لسه ما تمش ربط قاعدة بيانات الحسابات المستقلة. إنشاء الحسابات متوقف لحد ما نختبر تأكيد البريد وصلاحيات البيانات.')+
  '</p></section>';return;
 }
 if(recovery){root.innerHTML=authPanel();return;}
 if(!user||!profile){root.innerHTML=authPanel();return;}
 if(deskMode){renderDesk();return;}
 if(!['profile','desk','pitches','drafts','review','applications','apply'].includes(tab))tab='profile';
 if(tab==='drafts'&&!canWrite())tab='desk';
 if(tab==='review'&&!isStaff())tab='desk';
 if(tab==='applications'&&profile.role!=='admin')tab='desk';
 if(tab==='apply'&&profile.role!=='reader')tab='desk';
 root.innerHTML='<div class="be-greeting"><div><p class="be-eyebrow">'+tr('YOUR SPACE','مساحتك الخاصة')+'</p><h2>'+
 tr('Welcome, ','أهلاً، ')+escapeHtml(profile.display_name||profile.username||tr('reader','يا قارئ'))+'</h2></div>'+
 button(tr('Sign out','تسجيل الخروج'),'logout')+'</div>'+
 nav()+'<div class="be-dashboard">'+(
 tab==='profile'?profileView():tab==='desk'?deskView():tab==='pitches'?pitchView():
 tab==='drafts'?draftView():tab==='review'?staffView():tab==='applications'?applicationView():applyView())+'</div>';
 if(tab==='pitches')loadPitches();
 if(tab==='drafts')loadDrafts();
 if(tab==='review')loadReview();
 if(tab==='applications')loadApplications();
 if(tab==='apply')loadApplicationState();
}
async function loadProfile(){
 const {data:auth,error}=await client.auth.getUser();
 if(error&&!/session missing/i.test(error.message||''))say(error.message,true);
 user=auth?.user||null;
 if(!user){profile=null;return;}
 const {data,error:loadError}=await client.from('be_profiles').select('id,username,display_name,bio,role').eq('id',user.id).single();
 if(loadError){profile=null;say(tr('Your profile is unavailable. Please contact the editor.','ملفك الشخصي مش متاح دلوقتي. تواصل مع التحرير.')+' '+loadError.message,true);return;}
 profile=data;
 // Initial profile preferences are only display data. Never trust user metadata for roles.
 const initial={};
 if(!profile.username&&user.user_metadata?.requested_username){
   const username=String(user.user_metadata.requested_username).toLowerCase();
   if(/^[a-z][a-z0-9_]{2,23}$/.test(username))initial.username=username;
 }
 if(!profile.display_name&&user.user_metadata?.display_name){
   initial.display_name=String(user.user_metadata.display_name).slice(0,80);
 }
 if(Object.keys(initial).length){
   const {data:saved,error:saveError}=await client.from('be_profiles')
     .update(initial).eq('id',user.id)
     .select('id,username,display_name,bio,role').maybeSingle();
   if(saved)profile=saved;
   if(saveError&&initial.username){
     // A username may already be taken. Preserve the profile and allow a new choice.
     if(initial.display_name){
       const fallback=await client.from('be_profiles')
         .update({display_name:initial.display_name}).eq('id',user.id)
         .select('id,username,display_name,bio,role').maybeSingle();
       if(fallback.data)profile=fallback.data;
     }
     say(tr('That username is taken. Choose a different one in your profile.','اسم المستخدم ده محجوز. اختار اسم تاني من الملف الشخصي.'),true);
   }
 }
}
async function refresh(){
 if(refreshing)return;refreshing=true;
 try{await loadProfile();render();}
 catch(error){say(error.message||tr('Unable to load the account.','تعذّر تحميل الحساب.'),true);}
 finally{refreshing=false;}
}
function row(title,description,actions=''){
 return '<div class="be-list-row"><div><strong>'+escapeHtml(title)+'</strong><small>'+escapeHtml(description)+'</small></div><div class="be-list-actions">'+actions+'</div></div>';
}
function option(label,action,id){return '<button type="button" data-action="'+action+'" data-id="'+escapeHtml(id)+'">'+label+'</button>';}
async function loadPitches(){
 const target=document.getElementById('be-pitch-list');if(!target)return;
 const {data,error}=await client.from('be_pitches').select('id,title,kind,state,created_at').eq('author_id',user.id).order('created_at',{ascending:false}).limit(30);
 if(!target.isConnected)return;
 target.textContent=error?error.message:'';
 if(!error)target.innerHTML=data.length?data.map(x=>row(x.title,x.kind+' · '+x.state)).join(''):'<p>'+tr('Nothing submitted yet.','لسه ما بعتش أفكار.')+'</p>';
}
async function loadDrafts(){
 const target=document.getElementById('be-draft-list');if(!target)return;
 const {data,error}=await client.from('be_drafts').select('id,title,kind,language,state,created_at').eq('author_id',user.id).order('created_at',{ascending:false}).limit(40);
 if(!target.isConnected)return;
 target.textContent=error?error.message:'';
 if(!error)target.innerHTML=data.length?data.map(x=>row(x.title,x.kind+' · '+x.language+' · '+x.state,
 (x.state==='draft'||x.state==='needs_changes')?option(tr('Edit','تعديل'),'edit-draft',x.id)+' '+option(tr('Submit for review','إرسال للمراجعة'),'submit-draft',x.id):'')).join(''):'<p>'+tr('No drafts saved yet.','مفيش مسودات محفوظة لسه.')+'</p>';
}
async function loadReview(){
 const target=document.getElementById('be-review-list');if(!target)return;
 const {data,error}=await client.from('be_drafts').select('id,title,kind,language,state,body,created_at').eq('state','submitted').order('created_at',{ascending:true}).limit(40);
 if(!target.isConnected)return;
 target.textContent=error?error.message:'';
 if(!error)target.innerHTML=data.length?data.map(x=>row(x.title,x.kind+' · '+x.language+' · '+x.body.slice(0,120),
 option(tr('Approve draft','الموافقة'),'review-approve',x.id)+' '+option(tr('Request changes','طلب تعديل'),'review-change',x.id))).join(''):'<p>'+tr('Review queue is empty.','مفيش مسودات للمراجعة.')+'</p>';
}
async function loadApplications(){
 const target=document.getElementById('be-admin-apps');if(!target)return;
 const {data,error}=await client.from('be_applications').select('user_id,statement,state,created_at').eq('state','pending').order('created_at',{ascending:true}).limit(40);
 if(!target.isConnected)return;
 target.textContent=error?error.message:'';
 if(!error)target.innerHTML=data.length?data.map(x=>row(x.statement.slice(0,145),tr('Pending contributor application','طلب مساهمة قيد المراجعة'),
 option(tr('Approve contributor','قبول المساهم'),'approve-application',x.user_id)+' '+option(tr('Decline','رفض'),'decline-application',x.user_id))).join(''):'<p>'+tr('No pending applications.','مفيش طلبات انتظار.')+'</p>';
}
async function loadApplicationState(){
 const target=document.getElementById('be-application-state');if(!target)return;
 const {data,error}=await client.from('be_applications').select('state').eq('user_id',user.id).maybeSingle();
 if(error)target.textContent=error.message;
 if(data){target.textContent=tr('Application status: ','حالة الطلب: ')+data.state;const form=root.querySelector('[data-form="apply"]');if(form)form.hidden=true;}
}
root.addEventListener('click',async event=>{
 const button=event.target.closest('[data-action]');
 if(!button)return;
 const action=button.dataset.action;
 if(action.startsWith('tab:')){tab=action.slice(4);say('');render();return;}
 if(['login','signup','forgot','recovery'].includes(action)){authMode=action;say('');render();return;}
 if(action==='logout'){await client.auth.signOut();user=profile=null;say(tr('Signed out.','تم تسجيل الخروج.'));render();return;}
 if(action==='cancel-edit'){say('');render();return;}

 const id=button.dataset.id;if(!id)return;
 if(action==='edit-draft'){
   button.disabled=true;
   try{
     const {data,error}=await client.from('be_drafts')
       .select('id,title,kind,language,slug,body,state').eq('id',id).eq('author_id',user.id).single();
     if(error)throw error;
     if(!['draft','needs_changes'].includes(data.state))throw Error(tr('This draft is no longer editable.','المسودة دي مبقتش قابلة للتعديل.'));
     if(deskMode){tab='articles';}else{tab='drafts';}
     render();
     const form=root.querySelector('[data-form="draft"]');
     if(!form)throw Error(tr('The draft editor is unavailable.','محرر المسودات مش متاح.'));
     form.dataset.draftId=data.id;
     for(const name of ['title','kind','language','slug','body']){
       const field=form.elements.namedItem(name);
       if(field)field.value=data[name]||'';
     }
     const save=form.querySelector('[type="submit"]');
     if(save)save.textContent=tr('Update draft','حفظ تعديل المسودة');
     const controls=document.createElement('div');
     controls.className='be-actions';
     controls.innerHTML='<button type="button" data-action="cancel-edit">'+tr('Cancel editing','إلغاء التعديل')+'</button>';
     form.append(controls);
     form.querySelector('[name="title"]')?.focus();
     say(tr('Editing your draft. Changes are saved when you submit.', 'بتعدّل مسودتك. التغييرات بتتحفظ لما تضغط حفظ.'));
   }catch(error){say(error.message,true);}
   finally{button.disabled=false;}
   return;
 }
 button.disabled=true;
 try{
  let response;
  if(action==='submit-draft')response=await client.rpc('be_submit_draft',{_id:id});
  if(action==='review-approve')response=await client.rpc('be_review_draft',{_id:id,_decision:'approved'});
  if(action==='review-change')response=await client.rpc('be_review_draft',{_id:id,_decision:'needs_changes'});
  if(action==='approve-application')response=await client.rpc('be_review_application',{_user:id,_approve:true});
  if(action==='decline-application')response=await client.rpc('be_review_application',{_user:id,_approve:false});
  if(action==='pitch-decision'&&isStaff()&&['in_review','accepted','declined'].includes(button.dataset.decision))response=await client.rpc('be_review_pitch',{_id:id,_decision:button.dataset.decision});
  if(response?.error)throw response.error;
  say(tr('Updated successfully.','تم التحديث بنجاح.'));render();
 }catch(error){say(error.message,true);}finally{button.disabled=false;}
});
root.addEventListener('submit',async event=>{
 const form=event.target.closest('[data-form]');if(!form)return;event.preventDefault();
 const action=form.dataset.form;
 const submit=form.querySelector('button[type="submit"]');submit.disabled=true;say('');
 try{
  if(action==='login'){
    const {error}=await client.auth.signInWithPassword({email:value(form,'email'),password:value(form,'password')});
    if(error)throw error;await refresh();say(tr('Signed in.','تم تسجيل الدخول.'));return;
  }
  if(action==='signup'){
    const username=value(form,'username').toLowerCase();
    if(!/^[a-z][a-z0-9_]{2,23}$/.test(username))throw Error(tr('Use a valid username.','اسم المستخدم غير صالح.'));
    const password=value(form,'password');if(password.length<12)throw Error(tr('Password must be at least 12 characters.','كلمة المرور لازم تكون ١٢ حرف على الأقل.'));
    const {data,error}=await client.auth.signUp({email:value(form,'email'),password,options:{emailRedirectTo:here,data:{requested_username:username,display_name:value(form,'display_name')}}});
    if(error)throw error;
    if(data?.session){await refresh();}
    else{authMode='login';render();}
    say(tr('Check your email for a confirmation link before signing in.','راجع بريدك لتأكيد الحساب قبل تسجيل الدخول.'));return;
  }
  if(action==='forgot'){
    const {error}=await client.auth.resetPasswordForEmail(value(form,'email'),{redirectTo:here+'?mode=reset'});
    if(error)throw error;
    say(tr('If the address is registered, a reset message will be sent.','لو البريد مسجّل، هتوصلك رسالة استعادة كلمة المرور.'));return;
  }
  if(action==='recovery'){
    const pass=value(form,'password');if(pass.length<12)throw Error(tr('Password is too short.','كلمة المرور قصيرة.'));
    const {error}=await client.auth.updateUser({password:pass});if(error)throw error;
    recovery=false;authMode='login';await refresh();say(tr('Password updated.','تم تحديث كلمة المرور.'));return;
  }
  if(!user||!profile)throw Error(tr('Please sign in.','سجّل دخولك الأول.'));
  if(action==='profile'){
    const username=value(form,'username').toLowerCase();
    if(!/^[a-z][a-z0-9_]{2,23}$/.test(username))throw Error(tr('Use a valid username.','اسم المستخدم غير صالح.'));
    const {data,error}=await client.from('be_profiles').update({username,display_name:value(form,'display_name'),bio:value(form,'bio')}).eq('id',user.id).select('id,username,display_name,bio,role').single();
    if(error)throw error;profile=data;render();say(tr('Profile saved.','تم حفظ الملف الشخصي.'));return;
  }
  if(action==='pitch'){
    const {error}=await client.from('be_pitches').insert({author_id:user.id,kind:value(form,'kind'),title:value(form,'title'),description:value(form,'description')});
    if(error)throw error;render();say(tr('Your idea was received.','وصلنا اقتراحك.'));return;
  }
  if(action==='apply'){
    const {error}=await client.from('be_applications').insert({user_id:user.id,statement:value(form,'statement')});
    if(error)throw error;render();say(tr('Application sent.','تم إرسال الطلب.'));return;
  }
  if(action==='draft'){
    if(!canWrite())throw Error(tr('Contributor access required.','لازم صلاحية مساهم.'));
    const payload={kind:value(form,'kind'),language:value(form,'language'),title:value(form,'title'),slug:value(form,'slug'),body:value(form,'body')};
    const draftId=form.dataset.draftId;
    const response=draftId
      ?await client.from('be_drafts').update(payload).eq('id',draftId).eq('author_id',user.id).select('id').single()
      :await client.from('be_drafts').insert({...payload,author_id:user.id}).select('id').single();
    if(response.error)throw response.error;render();say(draftId?tr('Draft updated.','تم تعديل المسودة.'):tr('Draft saved privately.','تم حفظ المسودة بشكل خاص.'));return;
  }
 }catch(error){say(error?.message||tr('Please try again.','جرّب تاني.'),true);}
 finally{submit.disabled=false;}
});
async function init(){
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url||'')||!/^sb_publishable_/.test(config.publishableKey||'')){render();return;}
 try{
   const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.119.0?bundle');
   client=createClient(config.url,config.publishableKey,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true,flowType:'pkce'}});
   if(location.search.includes('mode=reset')){authMode='recovery';}
   client.auth.onAuthStateChange((event)=>{
    if(event==='PASSWORD_RECOVERY'){recovery=true;authMode='recovery';render();}
    if(event==='SIGNED_OUT'){user=profile=null;render();}
   });
   await refresh();
 }catch(error){client=null;say(tr('Could not connect to accounts.','تعذّر الاتصال بنظام الحسابات.'),true);render();}
}
init();

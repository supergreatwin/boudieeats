// Boudie Eats first-party member UI. Authorization always belongs to
// Supabase Auth + RLS, never username labels or client-side classes.
const cfg=window.BE_MEMBER_CONFIG||{};
const ar=document.documentElement.lang.toLowerCase().startsWith('ar');
const tr=(en,arabic)=>ar?arabic:en;
const base=cfg.basePath||'/';
const route=s=>base+(ar?'ar/':'')+(s||'');
const accountRoute=route('account/'),discoverRoute=route('discover/');
let supabase=null,user=null,username='',mode='login',dialog=null,notice=null,busy=false,seq=0;
const safeUsername=s=>/^[a-z][a-z0-9_]{2,23}$/.test(s||'');
const buttonLabel={login:tr('Sign in','تسجيل الدخول'),signup:tr('Create account','إنشاء حساب'),reset:tr('Reset password','استعادة كلمة المرور')};
function makeDialog(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='be-member-dialog';dialog.className='be-member-dialog';
 dialog.setAttribute('aria-labelledby','be-member-title');
 dialog.innerHTML="<div class=\"be-member-surface\"><button type=\"button\" class=\"be-member-close\" data-close aria-label=\"Close\">×</button><div class=\"be-member-brand\">BOUDIE EATS · بودي إيتس</div><h2 id=\"be-member-title\"></h2><p class=\"be-member-description\"></p><div class=\"be-member-tabs\" role=\"group\"><button type=\"button\" data-mode=\"login\"></button><button type=\"button\" data-mode=\"signup\"></button></div><form id=\"be-member-form\"><div class=\"be-member-fields\"></div><button type=\"submit\" class=\"be-member-submit\"></button></form><div class=\"be-member-options\"><button type=\"button\" data-mode=\"reset\" data-mode-alt></button></div><p id=\"be-member-status\" class=\"be-member-status\" role=\"status\" aria-live=\"polite\"></p><p class=\"be-member-privacy\">Free account / حساب مجاني · <a href=\"__PRIVACY__\">Privacy / الخصوصية</a></p></div>".replace('__PRIVACY__',route('privacy/'));
 document.body.append(dialog);
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('click',event=>{const el=event.target.closest('[data-mode]');if(el)draw(el.dataset.mode)});
 dialog.querySelector('form').addEventListener('submit',submit);
 return dialog;
}
function note(message,error=false){
 if(!notice?.isConnected){
  notice=document.createElement('div');notice.className='be-member-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const text=document.createElement('span'),close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label',tr('Dismiss','إغلاق'));close.addEventListener('click',()=>notice.remove());
  notice.append(text,close);document.body.appendChild(notice);
 }
 notice.querySelector('span').textContent=message;notice.dataset.error=String(error);
}
function status(message,error=false){
 const el=dialog?.querySelector('#be-member-status');if(!el)return;
 el.textContent=message||'';el.dataset.error=String(error);
}
function field(name,label,type,extras=''){
 const auto={email:'email',username:'username',password:mode==='signup'?'new-password':'current-password'};
 return '<label class="be-member-field"><span>'+label+'</span><input required name="'+name+'" type="'+type+'" autocomplete="'+auto[name]+'" '+extras+'></label>';
}
function draw(next){
 if(!['login','signup','reset'].includes(next))next='login';mode=next;
 const d=makeDialog(),f=d.querySelector('.be-member-fields'),tabs=d.querySelector('.be-member-tabs');
 tabs.querySelector('[data-mode="login"]').textContent=buttonLabel.login;
 tabs.querySelector('[data-mode="signup"]').textContent=buttonLabel.signup;
 tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===next)));
 tabs.hidden=next==='reset';
 d.querySelector('#be-member-title').textContent=next==='login'?tr('Welcome back.','أهلاً برجوعك.'):next==='signup'?tr('Pull up a chair.','تعالى على السفرة.'):tr('Recover your account.','ارجع لحسابك.');
 d.querySelector('.be-member-description').textContent=next==='login'?tr('Sign in to unlock Boudie Eats Discover.','سجّل دخولك علشان تفتح استكشف بودي إيتس.'):next==='signup'?tr('A free reader account. Email confirmation is required.','حساب قارئ مجاني، ولازم تأكد بريدك الإلكتروني.'):tr('We will email a reset link if your account is eligible.','هنبعت رابط استعادة لو حسابك مؤهل.');
 f.innerHTML=(next==='signup'?field('username',tr('Username','اسم المستخدم'),'text','pattern="[a-z][a-z0-9_]{2,23}" minlength="3" maxlength="24" placeholder="boudiefan"'):'')+
 field('email',tr('Email address','البريد الإلكتروني'),'email','inputmode="email"')+
 (next==='reset'?'':field('password',tr('Password (12+ characters)','كلمة السر (١٢ حرف أو أكتر)'),'password','minlength="12"'));
 d.querySelector('.be-member-submit').textContent=next==='reset'?tr('Email reset link','ابعت رابط الاستعادة'):buttonLabel[next];
 const alt=d.querySelector('[data-mode-alt]');alt.dataset.mode=next==='reset'?'login':'reset';
 alt.textContent=next==='reset'?tr('Back to sign in','الرجوع لتسجيل الدخول'):tr('Forgot password?','نسيت كلمة السر؟');
 status('');
}
function open(modeName='login'){
 const d=makeDialog();const newsletter=document.getElementById('be-letter-dialog');
 if(newsletter?.open)newsletter.close();
 try{sessionStorage.setItem('be-member-auth-opened','1')}catch{}
 draw(modeName);
 if(!d.open)d.showModal();
 d.querySelector('input')?.focus();
}
async function getUsername(current){
 try{
  const {data,error}=await supabase.from('be_profiles').select('username').eq('id',current.id).maybeSingle();
  if(!error&&safeUsername(data?.username))return data.username;
 }catch{}
 const backup=String(current.user_metadata?.requested_username||'');
 return safeUsername(backup)?backup:tr('Member','عضو');
}
function updateUI(){
 const signed=Boolean(user);
 document.documentElement.classList.toggle('be-member-signed-in',signed);
 document.querySelectorAll('a.be-account-nav').forEach(el=>{
  el.textContent=signed?'@'+username:tr('Sign in / Sign up','دخول / حساب جديد');
  el.href=accountRoute;
  el.setAttribute('aria-label',signed?tr('My account','حسابي'):tr('Sign in or create an account','تسجيل الدخول أو إنشاء حساب'));
 });
 document.querySelectorAll('.be-discover-nav,.be-discover-teaser a,.be-discover-footer').forEach(a=>a.href=signed?discoverRoute:accountRoute);
 document.querySelectorAll('.be-member-logout').forEach(el=>el.remove());
 if(signed){
  const anchor=document.querySelector('header a.be-account-nav');
  if(anchor){
   const logout=document.createElement('button');logout.className='be-member-logout';logout.type='button';logout.textContent=tr('Sign out','خروج');
   logout.addEventListener('click',async()=>{
    logout.disabled=true;
    try{const {error}=await supabase.auth.signOut();if(error)throw error;
      user=null;username='';updateUI();note(tr('Signed out.','تم تسجيل الخروج.'));
    }catch{logout.disabled=false;note(tr('Could not sign out.','تعذّر الخروج.'),true)}
   });
   anchor.insertAdjacentElement('afterend',logout);
  }
 }
}
async function synchronize(){
 const n=++seq;if(!supabase)return;
 try{
  const {data,error}=await supabase.auth.getUser();
  if(n!==seq)return;
  const u=error?null:data?.user;
  if(!u?.email_confirmed_at){user=null;username='';updateUI();return;}
  const label=await getUsername(u);if(n!==seq)return;
  user=u;username=label;updateUI();
  if(dialog?.open)dialog.close();
 }catch{if(n!==seq)return;user=null;username='';updateUI();}
}
async function submit(event){
 event.preventDefault();if(busy)return;
 if(!supabase){status(tr('Account service unavailable. Please retry.','الحسابات مش متاحة حاليًا. جرّب تاني.'),true);return;}
 const form=event.currentTarget;if(!form.reportValidity())return;
 const data=new FormData(form),email=String(data.get('email')||'').trim(),password=String(data.get('password')||'');
 const action=mode,submitButton=form.querySelector('[type="submit"]');busy=true;submitButton.disabled=true;status('');
 try{
  if(action==='login'){
   const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;
   await synchronize();
   if(!user){status(tr('Confirm your email first.','أكد بريدك الإلكتروني الأول.'),true);return;}
   if(dialog?.open)dialog.close();
   note(tr('Welcome back!','أهلاً برجوعك!'));
  }else if(action==='signup'){
   const requested=String(data.get('username')||'').trim().toLowerCase();
   if(!safeUsername(requested)||password.length<12)throw Error(tr('Use a valid username and a password of at least 12 characters.','اختار اسم مستخدم صالح وكلمة سر من ١٢ حرف على الأقل.'));
   const {data:signup,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:location.origin+route(''),data:{requested_username:requested}}});
   if(error)throw error;
   if(signup?.session&&signup?.user?.email_confirmed_at){await synchronize();if(user){dialog.close();note(tr('Account created!','الحساب اتعمل!'));return;}}
   dialog.close();
   note(tr('Check your inbox to confirm your account. Your username appears after verification and sign-in.','راجع بريدك لتأكيد الحساب. اسم المستخدم هيظهر بعد التأكيد والدخول.'));
  }else{
   const response=await fetch(String(cfg.url).replace(/\/$/,'')+'/functions/v1/be-request-password-reset',{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.publishableKey},body:JSON.stringify({email,locale:ar?'ar':'en'}),cache:'no-store'});
   if(!response.ok)throw Error(tr('Reset service temporarily unavailable.','الاستعادة مش متاحة حاليًا.'));
   dialog.close();note(tr('If the email is eligible, a reset link will be sent.','لو الإيميل مؤهل، هنبعت رابط استعادة.'));
  }
 }catch(err){status(err?.message||tr('Please try again.','حاول تاني.'),true)}
 finally{busy=false;submitButton.disabled=false}
}
function bind(){
 document.addEventListener('click',event=>{
  const account=event.target.closest('a.be-account-nav');
  if(account&&!user){event.preventDefault();open('login');return}
  const explore=event.target.closest('.be-discover-nav,.be-discover-teaser a,.be-discover-footer');
  if(explore&&!user){event.preventDefault();open('login');}
 });
 const openMode=new URLSearchParams(location.search).get('auth');
 if(openMode==='signin'||openMode==='signup')open(openMode==='signup'?'signup':'login');
}
async function init(){
 bind();updateUI();
 if(!String(cfg.url||'').startsWith('https://')||!/^sb_publishable_/.test(cfg.publishableKey||''))return;
 try{
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.119.0?bundle');
  supabase=createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
  supabase.auth.onAuthStateChange(ev=>{
   if(['SIGNED_IN','SIGNED_OUT','TOKEN_REFRESHED','USER_UPDATED','INITIAL_SESSION'].includes(ev)&&!busy)
    setTimeout(()=>synchronize(),0);
  });
  await synchronize();
 }catch{ /* The normal account route is the progressive-enhancement fallback. */ }
}
init();
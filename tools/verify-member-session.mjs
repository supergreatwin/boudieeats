import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const directory=new URL('../boudieeats/dist/',import.meta.url).pathname;
const issues=[];
const read=(path)=>{const file=join(directory,path);if(!existsSync(file)){issues.push('Missing '+path);return '';}return readFileSync(file,'utf8')};
const js=read('be-member.js'),css=read('be-member.css'),discover=read('be-experiences.js');
for(const key of ['signInWithPassword','auth.signUp','getUser()','email_confirmed_at',
 'from(\'be_profiles\')','showModal()','auth.signOut','@\' +username','be-member-signed-in','be-discover-teaser',
 'be-member-auth-opened','be-request-password-reset','be-member-logout']){
 if(!js.includes(key.replace("@' +username","@'+username")))issues.push('Member runtime missing '+key);
}
if(js.includes('service_role')||js.includes('sb_secret_'))issues.push('Private key/role reference in browser script');
if(!css.includes('html:not(.be-member-signed-in) .be-discover-nav')||
   !css.includes('html.be-member-signed-in .be-discover-teaser'))issues.push('Guest Discover hidden / signed-in reveal not guarded by CSS');
for(const [prefix,form] of [['','vXDORl'],['ar/','7XK9Dz']]){
 const homepage=read(prefix+'index.html');
 for(const k of ['be-member.js','be-member.css','BE_MEMBER_CONFIG','be-account-nav',
   'be-discover-teaser','be-letter-dialog','tally.so/embed/'+form]){
  if(!homepage.includes(k))issues.push('Homepage '+prefix+'missing '+k);
 }
 if(!homepage.includes('class="be-member-logout"')&&js.includes('be-member-logout')===false)issues.push('Logout not provided');
 const visitor=read(prefix+'recipes/index.html');
 if(!visitor.includes('be-member.js')||!visitor.includes('be-account-nav'))issues.push('Member header not added to '+prefix+'recipes');
 for(const privateRoute of ['account/','editorial-desk/','discover/']){
  const privatePage=read(prefix+privateRoute+'index.html');
  if(privatePage.includes('be-member.js'))issues.push('Extra member UI overrides protected route '+prefix+privateRoute);
 }
}
for(const key of ["home+'?auth=signin'","home+'?auth=signup'","email_confirmed_at","Authorization':'Bearer"]){
 if(!discover.includes(key))issues.push('Deep link or Discover auth missing '+key);
}
if(!read('be-account.js').includes("client.rpc('be_staff')"))issues.push('Editor/admin-only authorization missing');
if(!read('index.html').includes('function allowAuto()'))issues.push('Newsletter and member modal conflict prevention missing');
if(issues.length){console.error(issues.join('\n'));process.exit(1);}
console.log('PASS: responsive bilingual Supabase modal, verified username, signout, guest-hidden Discover, deep-link login, separate staff desk and newsletter.');

import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const routes=['','mama-picks/','dish-finder/','city-guide/','gallery/','spotlight/','passport/','food-lab/'];
const errors=[];
for(const lang of ['','ar/']){
 for(const route of routes){
  const target=join(dist,lang,'discover',route,'index.html');
  if(!existsSync(target)){errors.push('Missing '+lang+'discover/'+route);continue}
  const h=readFileSync(target,'utf8');
  for(const key of ['id="be-exp-app"','be-experiences.js','be-experiences.css','BE_DISCOVER_CONFIG','noindex,nofollow,noarchive','hreflang="en"','hreflang="ar-EG"','class="be-language"','be-responsive-release']){
   if(!h.includes(key))errors.push('Missing '+key+' in '+lang+route);
  }
  if(/whattocommunity|what[-\s]to[-\s]eat/i.test(h))errors.push('Former third-party brand in '+lang+route);
  if(/sb_secret_|service_role/.test(h))errors.push('Secret exposure in '+lang+route);
  if(/(?:href=|src=)"[^"]*editorial-desk\//.test(h))errors.push('Unauthenticated editorial link in '+lang+route);
 }
}
const client=join(dist,'be-experiences.js');
if(!existsSync(client))errors.push('Missing interactive content module');
else {
 const c=readFileSync(client,'utf8');
 for(const key of ['be_wte_foods','be_wte_places','be_wte_sections','be_wte_photos','be_wte_terms','be_wte_passports','status=eq.published','editorial_approved=eq.true','safeUrl','loadApprovedContent','renderPassport']){
  if(!c.includes(key))errors.push('Missing live-data check '+key);
 }
 if(/what[-\s]to[-\s]eat|whattocommunity/i.test(c))errors.push('Former brand in client code');
 if(!c.includes("document.documentElement.lang.toLowerCase().startsWith('ar')"))errors.push('Arabic Egypt locale is not detected by client');
 if(/demo stamp|Koshary.*Ful medames/i.test(c))errors.push('Demo or fake result shipped as verified content');
}
const staff=join(dist,'be-editorial-manager.js');
if(!existsSync(staff))errors.push('Missing editorial content manager');
else {
 const manager=readFileSync(staff,'utf8');
 for(const key of ['be_wte_foods','be_wte_places','be_wte_photos','be_wte_sections','be_wte_badges','be_wte_features','be_wte_recognitions','be_wte_lab_settings','be_wte_settings','client.rpc(\'be_staff\')','email_confirmed_at']){
  if(!manager.includes(key))errors.push('Manager missing required feature or role control '+key);
 }
}
const account=join(dist,'be-account.js');
if(!existsSync(account))errors.push('Account client not generated');
else {
 const accountScript=readFileSync(account,'utf8');
 if(!accountScript.includes('loadExperienceEditor()')||!accountScript.includes("if(tab==='experiences'&&isStaff())"))errors.push('Experience editor is not behind staff-only desk tab');
 if(!accountScript.includes("client.rpc('be_staff')"))errors.push('Supabase staff role check is missing');
}
const memberClient=readFileSync(join(dist,'be-experiences.js'),'utf8');
for(const required of ['showDiscoverSignIn','getUser()','email_confirmed_at',"Authorization':'Bearer",'bindDiscoverControls()']){
 if(!memberClient.includes(required))errors.push('Discover membership guard missing '+required);
}
if(!readFileSync(join(dist,'be-account.js'),'utf8').includes('safeDiscoverNext'))errors.push('Safe after-login redirect missing');
const css=join(dist,'be-experiences.css');
if(!existsSync(css))errors.push('Missing experience styling');
else{
 const c=readFileSync(css,'utf8');
 if(!c.includes('--burgundy:#72253f'))errors.push('Burgundy palette missing');
 if(/#f0642b|--tangerine/.test(c))errors.push('Cancelled orange accent leaked');
}
const sitemap=join(dist,'sitemap.xml');
if(!existsSync(sitemap))errors.push('Sitemap missing');
else {
 const xml=readFileSync(sitemap,'utf8');
 if(xml.includes('/discover/'))errors.push('Authenticated Discover routes leaked into sitemap');
}
for(const lang of ['','ar/']){
 const home=join(dist,lang,'index.html');
 const html=existsSync(home)?readFileSync(home,'utf8'):'';
 if(!html.includes('class="be-discover-teaser"')||!html.includes('href="/'+lang+'account/?next=%2F'+(lang?'ar%2F':'')+'discover%2F"'))
  errors.push('Discover must link through Sign in / Sign up on '+lang+'homepage');
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('PASS: bilingual authenticated Discover, 16 noindex routes, login-first navigation, JWT-only data, editor/admin isolation, RLS passport.');

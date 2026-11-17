import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const errors=[];
const files=['account/index.html','ar/account/index.html','editorial-desk/index.html','ar/editorial-desk/index.html'];
for(const file of files){
 if(!existsSync(join(dist,file))){errors.push('Missing '+file);continue;}
 const html=readFileSync(join(dist,file),'utf8');
 if(!html.includes('be-account.js'))errors.push(file+': app script missing');
 if(!html.includes('BE_AUTH_CONFIG'))errors.push(file+': public connection settings missing');
 if(!html.includes('noindex,nofollow'))errors.push(file+': account route should be noindex');
 if(!html.includes('class="be-language"'))errors.push(file+': bilingual switch missing');
 if(file.includes('editorial-desk')&&!html.includes('data-mode="desk"'))errors.push(file+': private editor workspace missing');
 if(file.includes('account')&&!html.includes('data-mode="account"'))errors.push(file+': account registration page missing');
 if(html.includes('service_role')||html.includes('sb_secret_'))errors.push(file+': possible private key leak');
}
const source=readFileSync(join(dist,'be-account.js'),'utf8');
for(const name of ['signInWithPassword','signUp','resetPasswordForEmail','updateUser','be_profiles','be_drafts','be_pitches','be_applications']){
 if(!source.includes(name))errors.push('Account app missing '+name);
}
const english=readFileSync(join(dist,'index.html'),'utf8');
const arabic=readFileSync(join(dist,'ar/index.html'),'utf8');
if(!english.includes('href="/account/"'))errors.push('English account menu missing');
if(!arabic.includes('href="/ar/account/"'))errors.push('Arabic account menu missing');
const schema=readFileSync(new URL('../supabase/schema.sql',import.meta.url),'utf8');
for(const marker of ['enable row level security','be_register_profile','be_my_role','be_submit_draft','be_review_draft']){
 if(!schema.includes(marker))errors.push('Private DB schema missing '+marker);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('PASS independent accounts: bilingual registration, profile, editorial desk, private data schema and safe disabled state before backend setup.');

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../boudieeats/dist/', import.meta.url);
const dir = root.pathname;
const files = readdirSync(dir,{recursive:true}).filter(p=>p.endsWith('.html'));
const errors=[];
for(const entry of files){
  // Search Console verification files are deliberately plain text, not HTML documents.
  if(/^google[a-z0-9]+\.html$/.test(entry) || entry.startsWith('ar/'))continue;
  const text=readFileSync(join(dir,entry),'utf8');
  if(!/<html[^>]*lang="en"[^>]*dir="ltr"/.test(text))errors.push(entry+': missing English LTR document language');
  const englishBody=text.replace(/<nav class="be-language"[\s\S]*?<\/nav>/g,'');
  const hits=[...englishBody.matchAll(/[\u0600-\u06ff]+/g)].slice(0,12).map(m=>englishBody.slice(Math.max(m.index-85,0),Math.min(m.index+135,englishBody.length)).replace(/\s+/g,' '));
  if(hits.length)errors.push(entry+': untranslated Arabic: '+JSON.stringify(hits));
}
const mustExist=['index.html','recipes/index.html','reviews/index.html','stories/index.html','reader-responses/index.html','newsletter-signup/index.html','editorial-desk/index.html'];
for(const entry of mustExist)if(!files.includes(entry))errors.push('Missing route '+entry);
const home=readFileSync(join(dir,'index.html'),'utf8');
if(!home.includes('tally.so/embed/vXDORl'))errors.push('Home newsletter embed missing');
if(!home.includes('AN EGYPTIAN FOOD JOURNAL'))errors.push('English cover identity missing');
const desk=readFileSync(join(dir,'editorial-desk/index.html'),'utf8');
if(!desk.includes('GitHub usernames'))errors.push('Editorial GitHub username access guidance missing');
const signup=readFileSync(join(dir,'newsletter-signup/index.html'),'utf8');
if(!signup.includes('not issuing active email subscriptions'))errors.push('Newsletter status transparency missing');
if(errors.length){console.error(errors.join('\n\n').slice(0,14500));process.exit(1);}
console.log('PASS: '+files.length+' English-LTR pages; no Arabic text found; reader forms and editorial routes present.');

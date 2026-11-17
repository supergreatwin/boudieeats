import {readFileSync,readdirSync,writeFileSync,appendFileSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';
import {ENGLISH_ARTICLES} from './english-articles.mjs';
import {ENGLISH_CONTENT,VERMICELLI_FRONTMATTER} from './english-content.mjs';
import {ENGLISH_STRINGS} from './english-strings.mjs';

const format=value=>JSON.stringify(value);
const arabic=/[\u0600-\u06ff]/;
const replacements=[...ENGLISH_STRINGS].sort((a,b)=>b[0].length-a[0].length);
function translateText(text){
 let out=text;
 for(const [from,to] of replacements)out=out.replaceAll(from,to);
 return out;
}
function editField(header,field,value){
 const line=field+': '+format(value);
 const rex=new RegExp('^'+field+':.*$','m');
 return rex.test(header)?header.replace(rex,line):header.trimEnd()+'\n'+line;
}
function imageCopy(text,alt){
 return text.replace(/"alt"\s*:\s*"[^"]*"/g,'"alt":'+format(alt))
  .replace(/"caption"\s*:\s*"[^"]*"/g,'"caption":"Photo from Boudie’s journal"');
}
function patchMarkdown(path,meta,body){
 const original=readFileSync(path,'utf8');
 const match=original.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
 if(!match)throw new Error('Missing YAML frontmatter: '+path);
 let header=match[1];
 for(const [key,value] of Object.entries(meta)){
  if(key==='alt'||key==='body')continue;
  header=editField(header,key,value);
 }
 header=imageCopy(header,meta.alt||'Photograph from Boudie’s personal food journal');
 const text=body===undefined?(match[2]||''):body;
 writeFileSync(path,'---\n'+header+'\n---\n\n'+text.trim()+'\n');
}
function patchVermicelli(file){
 const original=readFileSync(file,'utf8');
 const heroLine=original.match(/^hero:\s*(.*)$/m)?.[1];
 if(!heroLine)throw new Error('Existing vermicelli photograph is missing');
 const hero=imageCopy(heroLine,'Oven-browned Egyptian vermicelli pudding with a golden cream top')
 .replace(/"caption":"Photo from Boudie’s journal"/g,'"caption":"Oven-browned pudding"');
 const front=VERMICELLI_FRONTMATTER.trimEnd()+'\n  image: '+hero+'\nhero: '+hero;
 const body="I love vermicelli pudding thick, not runny: creamy milk and tender strands, never mushy. I want it rich enough to eat with a spoon—or even a fork. That is why I rely more on my eyes, taste and texture than on fixed quantities.";
 writeFileSync(file,'---\n'+front+'\n---\n\n'+body+'\n');
}
function files(dir){
 return readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.name.startsWith('._')?[]:x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]);
}
export function localizeSource(project){
 const content=join(project,'src/content');
 for(const [collection,entries] of Object.entries(ENGLISH_CONTENT)){
  for(const [slug,metadata] of Object.entries(entries)){
   const file=join(content,collection,slug+'.md');
   const body=ENGLISH_ARTICLES[collection+'/'+slug]??metadata.body;
   patchMarkdown(file,metadata,body);
  }
 }
 patchVermicelli(join(content,'recipes/shaareya-bel-laban.md'));

 for(const file of files(join(project,'src')).filter(x=>/\.(astro|ts|js)$/i.test(x)&&!x.includes('/styles/'))){
  let source=translateText(readFileSync(file,'utf8'));
  if(file.endsWith('/layouts/Base.astro'))
   source=source.replace('<html lang="ar-EG" dir="rtl">','<html lang="en" dir="ltr">')
    .replace('content="ar_EG"','content="en_US"');
  if(file.endsWith('.astro'))source=source.replaceAll('dir="rtl"','dir="ltr"');
  if(file.endsWith('/components/Archive.astro'))source=source.replace("a.localeCompare(b, 'ar')","a.localeCompare(b, 'en')");
  source=source.replaceAll("new Intl.NumberFormat('ar-EG'","new Intl.NumberFormat('en-EG'");
  writeFileSync(file,source);
 }
 copyFileSync(new URL('./english-newsletter.astro',import.meta.url),join(project,'src/components/Newsletter.astro'));

 const contact=join(project,'src/pages/contact.astro');
 let source=readFileSync(contact,'utf8');
 if(!source.includes('reader-responses')){
  source=source.replace('    </section>','      <p><a class="button" href={pathFor("/reader-responses/")}>Send feedback or recommend a place</a></p>\n    </section>');
  source=source.replace("import { formAction } from '../lib/site';","import { formAction, pathFor } from '../lib/site';");
 }
 writeFileSync(contact,source);

 appendFileSync(join(project,'src/styles/global.css'),'\n/* English layout: keep the existing palette and photography. */\nhtml[dir="ltr"],html[dir="ltr"] body{direction:ltr;text-align:left}\nhtml[dir="ltr"] .mobile-nav nav,html[dir="ltr"] .desktop-nav{direction:ltr}\n');

 const errors=[];
 for(const file of files(join(project,'src/content')).filter(p=>p.endsWith('.md'))){
  const text=readFileSync(file,'utf8');
  if(arabic.test(text))errors.push(file+': '+text.split('\n').filter(line=>arabic.test(line)).slice(0,6).join(' | '));
 }
 if(errors.length)throw new Error('Untranslated editorial text: '+errors.slice(0,7).join('\n').slice(0,3500));
}

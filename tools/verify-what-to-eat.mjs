import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const errors=[];
for(const prefix of ['', 'ar/']){
  for(const mode of ['what-to-eat','editorial-desk/what-to-eat']){
    const file=join(dist,prefix,mode,'index.html');
    if(!existsSync(file)){errors.push('Missing '+prefix+mode);continue;}
    const html=readFileSync(file,'utf8');
    for(const marker of ['noindex,nofollow,noarchive','BE_WTE_CONFIG','be-what-to-eat.js','be-what-to-eat.css','class="be-language"']){
      if(!html.includes(marker))errors.push(prefix+mode+' missing '+marker);
    }
    if(!html.includes('what to eat?')||!html.includes('wte-logotype'))errors.push(prefix+mode+' wrong What to Eat wordmark');
    if(html.includes('sb_secret_')||html.includes('service_role'))errors.push(prefix+mode+' exposes private key');
    if(mode==='what-to-eat'&&html.includes('data-wte-mode="editor"'))errors.push('Public guide must not be an editor page');
  }
  const desk=readFileSync(join(dist,prefix,'editorial-desk','index.html'),'utf8');
  if(!desk.includes(prefix+'editorial-desk/what-to-eat/'))errors.push('Editor nav missing '+prefix);
}
const imagePath=join(dist,'be-what-to-eat-brand.jpg');
if(!existsSync(imagePath))errors.push('Original What to Eat photo artwork missing');
const script=readFileSync(join(dist,'be-what-to-eat.js'),'utf8');
if(!script.includes('brandHero()')||!script.includes('s.slug===\'community\''))errors.push('What to Eat brand or community preview missing');
for(const marker of ['be_wte_settings','be_wte_terms','be_wte_places','be_wte_place_notes','be_wte_sections','be_wte_photos','signInWithPassword','createSignedUrl','partner_approved','site_enabled','image_rights_confirmed','city_id','cuisine_id']){
  if(!script.includes(marker))errors.push('Guide client missing '+marker);
}
for(const marker of ['service_role','sb_secret_']){
  if(script.includes(marker))errors.push('Guide client contains private key marker '+marker);
}
const sql=readFileSync(new URL('../supabase/what-to-eat.sql',import.meta.url),'utf8');
for(const marker of ['enable row level security','wte live places public','wte places staff insert','be_wte_place_notes','partner_approved','site_enabled','be-wte-media']){
  if(!sql.includes(marker))errors.push('Schema missing '+marker);
}
const site=readFileSync(join(dist,'sitemap.xml'),'utf8');
if(site.includes('boudieeats.com/what-to-eat/'))errors.push('Private guide incorrectly included in sitemap');
const phaseTwo=readFileSync(new URL('../supabase/what-to-eat-phase-two.sql',import.meta.url),'utf8');
for(const marker of ['be_wte_sections','be_wte_photos','wte images live read','site_enabled and s.partner_approved'])if(!phaseTwo.includes(marker))errors.push('Phase two schema missing '+marker);
const builder=readFileSync(new URL('./build-pages.mjs',import.meta.url),'utf8');
if(!builder.includes('working fallback when the Cloudflare'))errors.push('Private fallback is not retained');
for(const marker of ['function sectionEditor()','function photoEditor()','function readiness()','async function saveSection(','async function savePhoto('])if(!script.includes(marker))errors.push('Editorial feature missing '+marker);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('PASS: bilingual guide and editorial editor routes are hidden, noindexed and backed by RLS-gated metadata.');

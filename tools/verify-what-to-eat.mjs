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
    for(const marker of ['manifest.webmanifest','be-what-to-eat-newsletter.js','apple-touch-icon'])if(!html.includes(marker))errors.push(prefix+mode+' missing app/newsletter '+marker);
    const manifestFile=join(dist,prefix,mode,'manifest.webmanifest');
    if(!existsSync(manifestFile))errors.push(prefix+mode+' PWA manifest missing');
    else {
      const manifest=JSON.parse(readFileSync(manifestFile,'utf8'));
      if(manifest.display!=='standalone'||!manifest.start_url.includes(mode+'/')||manifest.icons.length<2)errors.push(prefix+mode+' PWA metadata incorrect');
      if(![192,512].every(size=>manifest.icons.some(icon=>icon.sizes===size+'x'+size)))errors.push(prefix+mode+' PWA icons missing');
    }
    if(mode==='editorial-desk/what-to-eat'&&!html.includes('editorial-desk/what-to-eat/?preview=1'))errors.push('Editor route has no private preview navigation: '+prefix);
    for(const brandMarker of ['be-what-to-eat-favicon.svg','<nav class="be-language"','what to eat?</span>'])if(!html.includes(brandMarker))errors.push(prefix+mode+' missing independent brand marker '+brandMarker);
    if(html.includes('<title>what to eat? | Boudie Eats</title>'))errors.push(prefix+mode+' uses parent brand title');
    if(html.includes('sb_secret_')||html.includes('service_role'))errors.push(prefix+mode+' exposes private key');
    if(mode==='what-to-eat'&&html.includes('data-wte-mode="editor"'))errors.push('Public guide must not be an editor page');
  }
  const desk=readFileSync(join(dist,prefix,'editorial-desk','index.html'),'utf8');
  if(!desk.includes(prefix+'editorial-desk/what-to-eat/'))errors.push('Editor nav missing '+prefix);
}
const imagePath=join(dist,'be-what-to-eat-brand.jpg');
if(!existsSync(imagePath))errors.push('Original What to Eat photo artwork missing');
if(!existsSync(join(dist,'be-what-to-eat-favicon.svg')))errors.push('What to Eat favicon missing');
const css=readFileSync(join(dist,'be-what-to-eat.css'),'utf8');
for(const token of ['--orange:#f36e2d','wte-brand-hero','wte-community','grayscale(1)','wte-footer-wordmark'])if(!css.includes(token))errors.push('Brand stylesheet missing '+token);
if(css.includes('burgundy')||css.includes('Fraunces')||css.includes('Lalezar'))errors.push('Inherited Boudie Eats styling remains');
if(/wte-brand-hero img\{[^}]*grayscale\(1\)/.test(css))errors.push('Brand hero incorrectly desaturates the orange original artwork');
for(const size of [192,512]){
  const icon=join(dist,'be-what-to-eat-app-'+size+'.png');
  if(!existsSync(icon))errors.push('Missing '+size+'px PWA icon');
  else {
    const bin=readFileSync(icon);
    if(bin.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bin.readUInt32BE(16)!==size||bin.readUInt32BE(20)!==size)errors.push('Invalid '+size+'px PWA PNG icon');
  }
}
const letter=readFileSync(join(dist,'be-what-to-eat-newsletter.js'),'utf8');
for(const marker of ['tally.so/embed','tally.so/r/','vXDORl','7XK9Dz','showModal','canAuto','wte-guide'])if(!letter.includes(marker))errors.push('Newsletter popup missing '+marker);
const script=readFileSync(join(dist,'be-what-to-eat.js'),'utf8');
if(!script.includes('brandHero()')||!script.includes('s.slug===\'community\''))errors.push('What to Eat brand or community preview missing');
for(const marker of ['be_wte_settings','be_wte_terms','be_wte_places','be_wte_place_notes','be_wte_sections','be_wte_photos','signInWithPassword','createSignedUrl','partner_approved','site_enabled','image_rights_confirmed','city_id','cuisine_id']){
  if(!script.includes(marker))errors.push('Guide client missing '+marker);
}
for(const marker of ['wte-preview-toolbar','previewMode()','editorial-desk/what-to-eat/?preview=1'])if(!script.includes(marker))errors.push('Private preview client missing '+marker);
for(const marker of ['wte-brand-form','community_instagram_url','brand_hero_url','brand_hero_rights_confirmed','function brandHero(compact=false)','wte-community-link'])if(!script.includes(marker))errors.push('Full brand client missing '+marker);
for(const marker of ['service_role','sb_secret_']){
  if(script.includes(marker))errors.push('Guide client contains private key marker '+marker);
}
const sql=readFileSync(new URL('../supabase/what-to-eat.sql',import.meta.url),'utf8');
for(const marker of ['enable row level security','wte live places public','wte places staff insert','be_wte_place_notes','partner_approved','site_enabled','be-wte-media']){
  if(!sql.includes(marker))errors.push('Schema missing '+marker);
}
const brandSQL=readFileSync(new URL('../supabase/what-to-eat-brand-settings.sql',import.meta.url),'utf8');
for(const marker of ['guide_intro_en','community_instagram_url','brand_hero_rights_confirmed'])if(!brandSQL.includes(marker))errors.push('Brand settings migration missing '+marker);
const site=readFileSync(join(dist,'sitemap.xml'),'utf8');
if(site.includes('boudieeats.com/what-to-eat/'))errors.push('Private guide incorrectly included in sitemap');
const phaseTwo=readFileSync(new URL('../supabase/what-to-eat-phase-two.sql',import.meta.url),'utf8');
for(const marker of ['be_wte_sections','be_wte_photos','wte images live read','site_enabled and s.partner_approved'])if(!phaseTwo.includes(marker))errors.push('Phase two schema missing '+marker);
const builder=readFileSync(new URL('./build-pages.mjs',import.meta.url),'utf8');
if(!builder.includes('working fallback when the Cloudflare'))errors.push('Private fallback is not retained');
for(const marker of ['function sectionEditor()','function photoEditor()','function readiness()','async function saveSection(','async function savePhoto('])if(!script.includes(marker))errors.push('Editorial feature missing '+marker);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('PASS: bilingual guide and editorial editor routes are hidden, noindexed and backed by RLS-gated metadata.');

import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const pages=readdirSync(dist,{recursive:true}).filter(p=>p.endsWith('index.html'));
const errors=[];
for(const path of pages){
 const arabic=path.startsWith('ar/');
 const language=arabic?'ar-EG':'en';
 const html=readFileSync(join(dist,path),'utf8');
 if(!html.includes('lang="'+language+'"'))errors.push(path+': incorrect html language');
 if(!html.includes('dir="'+(arabic?'rtl':'ltr')+'"'))errors.push(path+': incorrect text direction');
 if(!html.includes('class="be-language"'))errors.push(path+': language selector missing');
 if(!html.includes('hreflang="en"')||!html.includes('hreflang="ar-EG"'))errors.push(path+': hreflang missing');
 const local=arabic?path.slice(3):path;
 const equivalent=(arabic?'':'ar/')+local;
 if(!existsSync(join(dist,equivalent)))errors.push(path+': missing equivalent page '+equivalent);
 if(arabic&&!/[\u0600-\u06FF]/.test(html))errors.push(path+': Arabic text not restored');
 if(arabic&&html.includes('tally.so/embed/vXDORl'))errors.push(path+': English newsletter form embedded in Arabic page');
 if(!arabic&&path==='index.html'&&!html.includes('tally.so/embed/vXDORl'))errors.push(path+': English newsletter form missing');
 if(arabic&&path==='ar/index.html'&&!html.includes('tally.so/embed/7XK9Dz'))errors.push(path+': Arabic newsletter form missing');
}
for(const required of ['ar/index.html','ar/recipes/shaareya-bel-laban/index.html','ar/reviews/takeaway-bowls/index.html','ar/stories/cilantro-betna-el-tany/index.html','ar/reader-responses/index.html','ar/newsletter-signup/index.html','ar/editorial-desk/index.html']){
 if(!pages.includes(required))errors.push('missing '+required);
}
// Brand regression checks: the Arabic identity must never be replaced by the English SVG.
const englishHome=readFileSync(join(dist,'index.html'),'utf8');
const arabicHomepage=readFileSync(join(dist,'ar/index.html'),'utf8');
const englishAbout=readFileSync(join(dist,'about/index.html'),'utf8');
const arabicAbout=readFileSync(join(dist,'ar/about/index.html'),'utf8');
if(!englishHome.includes('class="be-wordmark-image"'))errors.push('English header SVG wordmark missing');
if(!englishHome.includes('media/boudieeats-wordmark-cream-gold-v2.svg'))errors.push('English header points to stale wordmark asset');
if(!englishAbout.includes('media/boudieeats-wordmark-cream-gold-v2.svg'))errors.push('English About points to stale wordmark asset');
if(!englishAbout.includes('class="be-exact-about-logo"'))errors.push('English About SVG wordmark missing');
if(!arabicHomepage.includes('be-arabic-wordmark'))errors.push('Arabic header wordmark missing');
if(arabicHomepage.includes('class="be-wordmark-image"'))errors.push('Arabic header incorrectly replaced with English logo');
if(!arabicAbout.includes('class="be-arabic-about-logo"'))errors.push('Arabic About logo missing');
if(arabicAbout.includes('class="be-exact-about-logo"'))errors.push('Arabic About incorrectly replaced with English logo');
if(!existsSync(join(dist,'media/boudieeats-wordmark-cream-gold-v2.svg')))errors.push('Shared English wordmark SVG missing');
const logo=existsSync(join(dist,'media/boudieeats-wordmark-cream-gold-v2.svg')) ? readFileSync(join(dist,'media/boudieeats-wordmark-cream-gold-v2.svg'),'utf8') : '';
if(!logo.includes('fill="#fffaf2"')||!logo.includes('fill="#ebc57b"'))errors.push('English SVG cream lettering and gold dot missing');
if(englishHome.includes('background:#c6003d')||arabicHomepage.includes('background:#c6003d'))errors.push('Erroneous red background reintroduced');

// Preserve the independent Arabic homepage identity in every production build.
const arabicHome=readFileSync(join(dist,'ar/index.html'),'utf8');
for(const [label,required] of [
 ['Arabic SEO title','<title>بودي إيتس — يومية أكل مصرية</title>'],
 ['Arabic description','يومية أكل مصرية من بودي: وصفات بيتية، مراجعات صريحة للمطاعم والكافيهات، وحكايات عن الأكل اللي بنحبه.'],
 ['Arabic canonical','<link rel="canonical" href="https://boudieeats.com/ar/">'],
 ['Arabic hreflang','hreflang="ar-EG" href="https://boudieeats.com/ar/"'],
 ['English hreflang','hreflang="en" href="https://boudieeats.com/"']
]) {
 if(!arabicHome.includes(required))errors.push(label+' missing from Arabic homepage');
}
const sitemap=readFileSync(join(dist,'sitemap.xml'),'utf8');
for(const path of ['https://boudieeats.com/ar/','https://boudieeats.com/ar/reader-responses/','https://boudieeats.com/ar/newsletter-signup/']){
 if(!sitemap.includes('<loc>'+path+'</loc>'))errors.push('Arabic sitemap missing '+path);
}
const arabicFeedback=readFileSync(join(dist,'ar/reader-responses/index.html'),'utf8');
if(!arabicFeedback.includes('tally.so/embed/aO4rxy'))errors.push('Arabic feedback form missing');
const english=pages.filter(x=>!x.startsWith('ar/')),arabic=pages.filter(x=>x.startsWith('ar/'));
if(english.length!==arabic.length)errors.push('Page coverage mismatch '+english.length+' vs '+arabic.length);
if(errors.length){console.error(errors.join('\n').slice(0,13000));process.exit(1);}
console.log('PASS bilingual: '+english.length+' English and '+arabic.length+' Arabic pages with matching routes, language toggle, forms and sitemap.');

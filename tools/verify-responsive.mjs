import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const issues=[];
const legacy=readFileSync(new URL('./responsive-finish.css',import.meta.url),'utf8');
const current=readFileSync(new URL('./minimal-layout.css',import.meta.url),'utf8');
const experience=readFileSync(new URL('./member-experiences-refresh.css',import.meta.url),'utf8');
for(const marker of ['@media(max-width:760px)','@media(max-width:480px)','@media(prefers-reduced-motion:reduce)','--be-burgundy:#72253f']){
  if(!legacy.includes(marker))issues.push('Responsive layer missing '+marker);
}
for(const marker of ['.be-home-welcome','.be-welcome-inner','.be-feature-grid','.be-home-newsletter','.be-review-side-layout',
  'footer.be-compact-footer','text-align:justify',
  '@media(max-width:1100px)','@media(max-width:700px)','@media(max-width:430px)',
  '@media(prefers-reduced-motion:reduce)']){
  if(!current.includes(marker))issues.push('New shared layout missing '+marker);
}
for(const marker of ['--be-orange:','#be-member-contributions','.be-exp-member-layout','.be-exp-detail-layout','.be-share-shell']){
  if(!experience.includes(marker))issues.push('Member responsive layout missing '+marker);
}
for(const locale of ['','ar/']){
  const home=join(dist,locale,'index.html');
  if(!existsSync(home)){issues.push('Homepage missing '+locale);continue;}
  const html=readFileSync(home,'utf8');
  for(const marker of ['id="be-responsive-release"','data-be-layout="minimal-home"','class="be-home-welcome"',
    'class="be-featured-recipes"','class="be-home-newsletter"','be-discover-teaser',
    'be-letter-dialog','be-minimal.css']){
    if(!html.includes(marker))issues.push(locale+' homepage missing '+marker);
  }
  if(html.includes('be-photo-grid') || html.includes('be-photo-cell'))issues.push(locale+' still contains retired homepage cover');
  if((html.match(/class="be-feature-card"/g)||[]).length!==2)issues.push(locale+' should have exactly two featured recipes');
  if(html.includes('Recipes, food notes and stories, delivered as a letter.'))issues.push(locale+' still contains removed newsletter sentence');
  const footer=html.match(/<footer class="be-compact-footer">([\s\S]*?)<\/footer>/);
  if(!footer)issues.push(locale+' missing compact footer');
  else {
    if(/Sign in|Sign up|دخول \/ حساب|be-reader-links|be-discover-footer/i.test(footer[1]))issues.push(locale+' footer has redundant account or participation links');
    for(const route of ['contact/','privacy/','terms/','cookies/']){
      if(!footer[1].includes(locale+route))issues.push(locale+' footer missing '+route);
    }
  }

  if(/(?:what[- ]to[- ]eat|whattocommunity)/i.test(html))issues.push(locale+' includes withdrawn brand');
  const discover=join(dist,locale,'discover','index.html');
  const d=existsSync(discover)?readFileSync(discover,'utf8'):'';
  if(!d.includes('be-experiences-refresh.css')||!d.includes('be-experiences.js'))
    issues.push(locale+' member homepage missing shared experience styles/client');
  for(const route of ['mama-picks/','dish-finder/','city-guide/','gallery/',
    'spotlight/','passport/','food-lab/']){
    const page=join(dist,locale,'discover',route,'index.html');
    const s=existsSync(page)?readFileSync(page,'utf8'):'';
    if(!s.includes('be-experiences-refresh.css'))issues.push(locale+'discover/'+route+' has mismatched styling');
  }
}
for(const route of ['recipes/','reviews/','stories/','account/','editorial-desk/',
  'privacy/','cookies/','terms/']){
 for(const locale of ['','ar/']){
  const file=join(dist,locale,route,'index.html');
  if(!existsSync(file))issues.push('Missing '+locale+route);
  else if(!readFileSync(file,'utf8').includes('id="be-responsive-release"'))
    issues.push(locale+route+' missing common responsive styles');
 }
}
if(issues.length){console.error(issues.join('\n'));process.exit(1);}
console.log('PASS: bilingual welcome homepage, two featured recipes, compact public layout, and 7 responsive member pages per language.');

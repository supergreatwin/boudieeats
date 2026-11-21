import {existsSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

// Public release of independent Boudie Eats discovery experiences.
// This deliberately does NOT open the Supabase staff desk or publish unapproved data.
const ORIGIN='https://boudieeats.com/';
const routes=['','mama-picks/','dish-finder/','city-guide/','gallery/','spotlight/','passport/','food-lab/'];

export function launchBoudieDiscovery({directory}){
 let homeCount=0,updated=0;
 const files=readdirSync(directory,{recursive:true}).filter(x=>x.endsWith('.html'));
 for(const entry of files){
  const full=join(directory,entry);
  let html=readFileSync(full,'utf8');
  const isArabic=entry.startsWith('ar/');
  const locale=isArabic?'ar/':'';
  const discoveryUrl='/'+locale+'discover/';
  const accountEntry='/'+locale+'account/?next='+encodeURIComponent(discoveryUrl);
  const label=isArabic?'اكتشف تجارب بودي إيتس':'Discover Boudie Eats';
  if(/^(?:ar\/)?discover\//.test(entry)){
    // Discover is members-only; keep its HTML shell out of search results.
    html=html.replace('<meta name="robots" content="index,follow,max-image-preview:large">','<meta name="robots" content="noindex,nofollow,noarchive">');
    if(!html.includes('content="noindex,nofollow,noarchive"'))throw new Error('Discover noindex missing: '+entry);
  }else if(!/^(?:ar\/)?editorial-desk\//.test(entry)&&!/^google[a-z0-9]+\.html$/.test(entry)){
    // Public navigation. Never insert public links to the staff-only desk.
    const anchor='<a class="be-discover-nav" href="'+accountEntry+'">'+label+'</a>';
    if(html.includes('class="desktop-nav"')&&!html.includes('class="be-discover-nav"')){
      html=html.replace(/(<nav\b[^>]*class="[^"]*\bdesktop-nav\b[^"]*"[^>]*>)/i,'$1'+anchor);
    }
    if(entry==='index.html'||entry==='ar/index.html'){
      const teaser='<p class="be-discover-teaser"><span>'+(isArabic?'سبع طرق جديدة لاكتشاف الأكل':'Seven new ways to explore food')+'</span><a href="'+accountEntry+'">'+label+' <span aria-hidden="true">↗</span></a></p>';
      // Recipe-led native home has a short welcome panel; keep Discover
      // hidden for guests and show it only after member login as before.
      const anchor=/<section class="be-home-intro"[\s\S]*?<\/section>/i;
      if(!anchor.test(html))throw new Error('Original Boudie Eats homepage intro missing: '+entry);
      html=html.replace(anchor,match=>match+teaser);
      homeCount++;
    }
    if(html.includes('</footer>')&&!html.includes('class="be-discover-footer"')){
      html=html.replace('</footer>','<a class="be-discover-footer" href="'+accountEntry+'">'+label+'</a></footer>');
    }
  }
  writeFileSync(full,html);updated++;
 }
 if(homeCount!==2)throw new Error('Expected two public bilingual home teasers, got '+homeCount);
 // Member-only routes are intentionally absent from the public sitemap.
 console.log('Boudie Eats Discover requires sign-in on 16 English/Arabic routes; updated '+updated+' pages.');
}

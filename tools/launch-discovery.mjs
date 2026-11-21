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
  const label=isArabic?'اكتشف تجارب بودي إيتس':'Discover Boudie Eats';
  if(/^(?:ar\/)?discover\//.test(entry)){
    // Make ONLY the public discovery pages indexable.
    html=html.replace('<meta name="robots" content="noindex,nofollow,noarchive">','<meta name="robots" content="index,follow,max-image-preview:large">');
    if(!html.includes('content="index,follow,max-image-preview:large"'))throw new Error('Public discovery meta missing: '+entry);
  }else if(!/^(?:ar\/)?editorial-desk\//.test(entry)&&!/^google[a-z0-9]+\.html$/.test(entry)){
    // Public navigation. Never insert public links to the staff-only desk.
    const anchor='<a class="be-discover-nav" href="'+discoveryUrl+'">'+label+'</a>';
    if(html.includes('class="desktop-nav"')&&!html.includes('class="be-discover-nav"')){
      html=html.replace(/(<nav\b[^>]*class="[^"]*\bdesktop-nav\b[^"]*"[^>]*>)/i,'$1'+anchor);
    }
    if((entry==='index.html'||entry==='ar/index.html')&&html.includes('class="be-landing-directories"')){
      const teaser='<p class="be-discover-teaser"><span>'+(isArabic?'سبع طرق جديدة لاكتشاف الأكل':'Seven new ways to explore food')+'</span><a href="'+discoveryUrl+'">'+label+' <span aria-hidden="true">↗</span></a></p>';
      html=html.replace(/(<nav class="be-landing-directories"[\s\S]*?<\/nav>)/i,'$1'+teaser);
      homeCount++;
    }
    if(html.includes('</footer>')&&!html.includes('class="be-discover-footer"')){
      html=html.replace('</footer>','<a class="be-discover-footer" href="'+discoveryUrl+'">'+label+'</a></footer>');
    }
  }
  writeFileSync(full,html);updated++;
 }
 if(homeCount!==2)throw new Error('Expected two public bilingual home teasers, got '+homeCount);
 const sitemapFile=join(directory,'sitemap.xml');
 if(!existsSync(sitemapFile))throw new Error('No sitemap to publish');
 let xml=readFileSync(sitemapFile,'utf8');
 if(!xml.includes('</urlset>'))throw new Error('Invalid sitemap');
 for(const locale of ['','ar/']){
  for(const route of routes){
   const url=ORIGIN+locale+'discover/'+route;
   if(!xml.includes('<loc>'+url+'</loc>'))xml=xml.replace('</urlset>','<url><loc>'+url+'</loc></url></urlset>');
  }
 }
 writeFileSync(sitemapFile,xml);
 console.log('Launched 16 public Boudie Eats discovery routes with bilingual navigation; processed '+updated+' HTML pages.');
}
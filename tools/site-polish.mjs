import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

// Non-destructive presentation changes applied to both independently built editions.
// Preserve BoudieEats brand colours, photography, editorial articles and existing routes.
const arabicUiLabels = [
  ['AN EGYPTIAN FOOD JOURNAL', 'يومية أكل مصرية'],
  ['THE RECIPE ISSUE', 'عدد الوصفات'],
  ['FROM BOUDIE’S KITCHEN', 'من مطبخ بودي'],
  ["FROM BOUDIE'S KITCHEN", 'من مطبخ بودي'],
  ['THE RECIPE BOX', 'دفتر الوصفات'],
  ['AT THE TABLE', 'على السفرة'],
  ['FOOD & MEMORY', 'الأكل والذكريات'],
  ['A NOTE FROM BOUDIE', 'رسالة من بودي'],
  ['BOUDIE’S PICK', 'اختيار بودي'],
  ["BOUDIE'S PICK", 'اختيار بودي'],
  ['Egyptian appetite. Unfiltered opinions.', 'نَفَس مصري. رأي من الآخر.'],
  ['An Egyptian food journal.', 'يومية أكل مصرية.'],
  ['An Egyptian food journal', 'يومية أكل مصرية'],
  ['The recipe box', 'دفتر الوصفات'],
  ['The review desk', 'دفتر التجارب'],
  ['The story archive', 'أرشيف الحكايات'],
  ['THE BOUDIE LETTER', 'جواب من بودي'],
  ['TASTE TEST', 'اختبار الطعم'],
  ['RESTAURANTS &amp; CAFÉS', 'المطاعم والكافيهات'],
  ['RESTAURANTS & CAFÉS', 'المطاعم والكافيهات'],
  ['Food &amp; memory', 'الأكل والذكريات'],
  ['Food & memory', 'الأكل والذكريات'],
  ['At the table', 'على السفرة'],
  ['Behind the journal', 'وراء اليومية'],
  ['Write to Boudie', 'اكتب لبودي'],
  ['Search the journal', 'دوّر في اليومية']
];

const css = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet">',
  '<style id="be-visitor-polish">',
  '.masthead .header-inner .utilities{display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
  '.be-language,.masthead .be-language{display:inline-flex!important;align-items:center!important;gap:10px!important;margin:0!important;padding:0!important;direction:ltr!important;font:600 13px/1.5 "DM Sans",Arial,sans-serif!important}',
  '.be-language a,.be-language a[aria-current="page"]{display:inline-block!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:inherit!important;padding:3px 2px!important;text-decoration:none!important;outline:0!important}',
  '.be-language a[aria-current="page"]{font-weight:800!important;opacity:1}',
  '.be-language a:not([aria-current="page"]){opacity:.73}',
  '.be-language a:focus-visible{outline:2px solid currentColor!important;outline-offset:3px!important}',
  '.masthead .utilities>.be-account-nav{margin:0 2px!important;padding:7px 10px!important;font-size:13px!important}',
  '.desktop-nav a[aria-current="page"][href="/"],.desktop-nav a[aria-current="page"][href="/ar/"]{text-decoration:none!important;border-bottom:0!important;background-image:none!important;box-shadow:none!important}',
  '.desktop-nav a[aria-current="page"][href="/"]::after,.desktop-nav a[aria-current="page"][href="/ar/"]::after,.desktop-nav a[aria-current="page"][href="/"]::before,.desktop-nav a[aria-current="page"][href="/ar/"]::before{display:none!important;content:none!important;border:0!important}',
  'html[lang^="ar"] .be-arabic-wordmark,html[lang^="ar"] .be-brand{font-family:"Aref Ruqaa",serif!important;font-weight:700!important;letter-spacing:0!important;line-height:1.4!important}',
  'html[lang^="ar"] .be-arabic-wordmark{font-size:clamp(27px,2.8vw,39px)!important;white-space:nowrap!important;direction:rtl!important}',
  'html[lang^="ar"] header strong{font-family:"Aref Ruqaa",serif;font-weight:700}',
  '.be-home-intro{box-sizing:border-box;width:min(1200px,calc(100% - 48px));margin:26px auto 24px;padding:20px 0 23px;display:flex;justify-content:space-between;align-items:end;gap:22px;flex-wrap:wrap;border-bottom:1px solid currentColor}',
  '.be-home-intro .be-home-copy{max-width:700px}',
  '.be-home-intro .be-home-eyebrow{display:block;letter-spacing:.12em;font-size:12px;font-weight:800;text-transform:uppercase;opacity:.72}',
  '.be-home-intro h2{font-size:clamp(25px,3.2vw,43px);line-height:1.3;margin:7px 0 8px}',
  '.be-home-intro p{margin:0;font-size:clamp(15px,1.45vw,18px);line-height:1.65}',
  '.be-home-intro .be-home-links{display:flex;gap:18px;flex-wrap:wrap;font-size:15px;font-weight:700}',
  '.be-home-intro .be-home-links a{color:inherit;text-decoration:underline;text-underline-offset:5px}',
  'html[lang^="ar"] .be-home-intro h2{font-family:"Aref Ruqaa",serif}',
  '@media(max-width:800px){.be-home-intro{width:calc(100% - 32px);margin:12px auto 20px;padding:12px 0 18px}.masthead .header-inner .utilities{gap:9px}.be-language{gap:8px!important}}',
  "/* Responsive three-column editorial cards; preserve the existing color palette. */",
  "@media (min-width:1100px){.entry-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}",
  "@media (min-width:700px) and (max-width:1099px){.entry-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}",
  "@media (max-width:699px){.entry-grid{grid-template-columns:minmax(0,1fr)!important}}",
  ".entry-grid{display:grid!important;gap:clamp(15px,2vw,25px)!important;align-items:stretch!important}",
  ".entry-grid>.entry-card{min-width:0!important;height:100%!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}",
  ".entry-grid>.entry-card>.entry-image-link{display:block!important;max-width:100%!important}",
  ".entry-grid>.entry-card .editorial-image{width:100%!important;max-width:100%!important;margin:0!important;overflow:hidden!important}",
  ".entry-grid>.entry-card .entry-image-link img{display:block!important;width:100%!important;height:clamp(160px,17vw,225px)!important;object-fit:cover!important}",
  ".entry-grid>.entry-card .entry-copy{min-width:0!important;flex:1;display:flex!important;flex-direction:column!important;gap:8px!important;padding:clamp(12px,1.4vw,19px)!important}",
  ".entry-grid>.entry-card h3{font-size:clamp(1.18rem,1.55vw,1.48rem)!important;line-height:1.35!important;overflow-wrap:anywhere!important;margin:0!important;letter-spacing:normal!important}",
  ".entry-grid>.entry-card .entry-label{font-size:.79rem!important;line-height:1.5!important;margin:0!important}",
  ".entry-grid>.entry-card .entry-description{font-size:clamp(.87rem,1vw,.97rem)!important;line-height:1.55!important;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;margin:0!important}",
  ".entry-grid>.entry-card .preview-note{font-size:.83rem!important;margin:0!important}",
  ".entry-grid>.entry-card .text-link{font-size:.87rem!important;margin-top:auto!important;align-self:flex-start}",
  "html[dir=\"rtl\"] .entry-grid>.entry-card .text-link{align-self:flex-start}",
  ".page-headline h1{font-size:clamp(2.3rem,5vw,4.8rem)!important;line-height:1.15!important;letter-spacing:normal!important}",
  ".page-dek{font-size:clamp(1rem,1.32vw,1.16rem)!important;line-height:1.65!important;max-width:66ch!important}",
  ".page-headline .eyebrow,.section-heading .eyebrow,.home-intro .eyebrow{font-size:clamp(.72rem,.9vw,.85rem)!important;line-height:1.4!important}",
  ".section-heading h2,.home-intro h2{font-size:clamp(1.75rem,2.7vw,2.65rem)!important;line-height:1.34!important}",
  ".section-heading{align-items:end!important;gap:15px!important;flex-wrap:wrap!important}",
  ".home-intro{align-items:start!important;gap:clamp(18px,3vw,38px)!important}",
  ".home-intro p{font-size:clamp(1rem,1.35vw,1.12rem)!important;line-height:1.7!important}",
  ".cover-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr)!important;align-items:center!important;gap:clamp(15px,2.4vw,36px)!important}",
  ".cover-copy,.cover-picture{min-width:0!important}",
  ".cover-copy h1{font-size:clamp(2.4rem,5.2vw,5.4rem)!important;line-height:1.16!important;max-width:15ch!important;letter-spacing:normal!important;text-wrap:balance}",
  ".cover-copy .cover-phrase{font-size:clamp(1.22rem,2vw,1.75rem)!important;line-height:1.38!important;text-wrap:balance}",
  ".cover-copy .cover-dek{font-size:clamp(.97rem,1.25vw,1.13rem)!important;line-height:1.66!important;max-width:57ch!important;text-wrap:pretty}",
  ".cover-copy .kicker{font-size:clamp(.75rem,1.05vw,.94rem)!important;line-height:1.4!important;flex-wrap:wrap!important;gap:8px}",
  ".cover-picture .editorial-image{max-width:100%!important}",
  ".cover-picture .editorial-image img{display:block;max-width:100%;width:100%;object-fit:cover;max-height:600px}",
  ".edition-line{display:flex!important;justify-content:space-between!important;align-items:center!important;flex-wrap:wrap!important;gap:8px!important;font-size:clamp(.69rem,.84vw,.78rem)!important}",
  ".manifesto-inner{display:flex;align-items:center;justify-content:space-between;gap:clamp(12px,2vw,25px);flex-wrap:wrap}",
  ".manifesto-inner>p{min-width:0!important;flex:1 1 260px!important;font-size:clamp(1.05rem,1.55vw,1.35rem)!important;line-height:1.45!important}",
  ".manifesto-inner>span{max-width:27ch!important;white-space:normal!important;font-size:clamp(.76rem,1vw,.91rem)!important;line-height:1.45!important}",
  "html[lang=\"en\"] .cover-copy,html[lang=\"en\"] .page-headline,html[lang=\"en\"] .home-intro{direction:ltr!important;text-align:left!important}",
  "html[lang^=\"ar\"] .cover-copy,html[lang^=\"ar\"] .page-headline,html[lang^=\"ar\"] .home-intro{direction:rtl!important;text-align:right!important}",
  "html[lang^=\"ar\"] .entry-grid>.entry-card h3{font-size:clamp(1.32rem,1.7vw,1.63rem)!important;line-height:1.55!important}",
  "html[lang^=\"ar\"] .entry-grid>.entry-card .entry-description{font-size:clamp(.96rem,1.12vw,1.1rem)!important;line-height:1.6!important}",
  "html[lang^=\"ar\"] .cover-copy h1{font-size:clamp(2.9rem,5.6vw,5.5rem)!important;line-height:1.5!important}",
  "html[lang^=\"ar\"] .cover-copy .cover-dek{font-size:clamp(1.02rem,1.26vw,1.19rem)!important;line-height:1.75!important}",
  "html[lang^=\"ar\"] .be-home-eyebrow{letter-spacing:normal!important}",
  "@media(max-width:1099px){.cover-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}.entry-grid>.entry-card .entry-image-link img{height:clamp(180px,24vw,240px)!important}}",
  "@media(max-width:699px){.cover-grid{grid-template-columns:1fr!important;gap:16px!important}.cover-copy h1{max-width:none!important}.cover-picture .editorial-image img{max-height:450px}.entry-grid>.entry-card .entry-image-link img{height:clamp(190px,55vw,275px)!important}.manifesto-inner{align-items:start!important}.be-home-intro .be-home-links{gap:13px}}",
  '</style>'
].join('');

function homeIntroduction(isArabic,base){
  const path=base+(isArabic?'ar/':'');
  const title=isArabic?'أهلاً بيك في بودي إيتس':'Welcome to Boudie Eats';
  const desc=isArabic
    ?'يومية أكل مصرية فيها وصفات من مطبخ بودي، وتجارب مطاعم وكافيهات، وحكايات عن الأكل اللي بنحبه.'
    :'An Egyptian food journal of recipes from Boudie’s kitchen, restaurant reviews, and stories about the food we love.';
  const links=isArabic
    ?[['recipes/','الوصفات'],['reviews/','التجارب'],['stories/','حكايات أكل']]
    :[['recipes/','Recipes'],['reviews/','Reviews'],['stories/','Food stories']];
  const items=links.map(([slug,label])=>'<a href="'+path+slug+'">'+label+'</a>').join('');
  return '<section class="be-home-intro" aria-label="'+(isArabic?'أهلاً بيك':'Welcome')+'">'+
    '<div class="be-home-copy"><span class="be-home-eyebrow">'+(isArabic?'الرئيسية':'HOME')+'</span>'+
    '<h2>'+title+'</h2><p>'+desc+'</p></div><nav class="be-home-links" aria-label="'+(isArabic?'استكشف اليومية':'Explore the journal')+'">'+items+'</nav></section>';
}

function removeBookmarkUi(html){
  // Remove the existing bookmark feature from all navigation and article controls.
  // Do not touch the underlying recipe copy, share buttons, or cooking-mode controls.
  return html
    .replace(/<a\b(?=[^>]*\bclass="[^"]*\bsaved-link\b)[^>]*>[\s\S]*?<\/a>/g,'')
    .replace(/<button\b(?=[^>]*\bdata-save(?:=|\s))[^>]*>[\s\S]*?<\/button>/g,'');
}

function putHeaderControlsTogether(html){
  const account=html.match(/<a class="be-account-nav"[^>]*>[\s\S]*?<\/a>/);
  if(account && html.includes('<details class="mobile-nav">')){
    html=html.replace(account[0],'');
    html=html.replace('<details class="mobile-nav">',account[0]+'<details class="mobile-nav">');
  }
  const language=html.match(/<nav class="be-language"[\s\S]*?<\/nav>/);
  if(language && html.includes('<details class="mobile-nav">')){
    html=html.replace(language[0],'');
    html=html.replace('<details class="mobile-nav">',language[0]+'<details class="mobile-nav">');
  }
  return html;
}

function polishPage(html,{isArabic,isHome,base}){
  html=removeBookmarkUi(html);
  html=html.replace(/<div\b(?=[^>]*\bclass="[^"]*\bcover-seal\b)[^>]*>[\s\S]*?<\/div>/g,'');
  if(isArabic){
    for(const [english,arabic] of arabicUiLabels)html=html.replaceAll(english,arabic);
    html=html.replace(
      /<a\b(?=[^>]*\bclass="[^"]*\bwordmark\b)[^>]*>[\s\S]*?<\/a>/g,
      match=>{
        const href=match.match(/\bhref="([^"]+)"/)?.[1];
        if(!href)throw new Error('Arabic wordmark link lost its target');
        return '<a class="wordmark be-arabic-wordmark" dir="rtl" href="'+href+'" lang="ar">بودي إيتس<span>.</span></a>';
      }
    );
    html=html.replace(/(<a class="be-brand"[^>]*>)BoudieEats\.(<\/a>)/g,'$1بودي إيتس.$2');
    html=html.replace(/(<(?:span|p)\b[^>]*?)dir="ltr" lang="en"([^>]*>)(?=[\u0600-\u06ff])/g,'$1dir="rtl" lang="ar"$2');
  }
  html=putHeaderControlsTogether(html);
  html=html.replace('</head>',css+'</head>');
  if(isHome){
    if(!html.includes('<main'))throw new Error('Home page has no main landmark');
    if(!html.includes('<div class="manifesto">'))throw new Error('Home manifesto landmark missing');
    html=html.replace('<div class="manifesto">',homeIntroduction(isArabic,base)+'<div class="manifesto">');
  }
  return html;
}

export function polishVisitorPages({directory,basePath='/'}){
  const base=basePath.endsWith('/')?basePath:basePath+'/';
  const entries=readdirSync(directory,{recursive:true})
    .filter(path=>path.endsWith('.html')&&!/^google[a-z0-9]+\.html$/i.test(path));
  const count={english:0,arabic:0,home:0};
  for(const path of entries){
    const file=join(directory,path);
    const isArabic=path.startsWith('ar/');
    const isHome=path==='index.html'||path==='ar/index.html';
    const before=readFileSync(file,'utf8');
    if(!before.includes('</head>')||!before.includes('</body>'))throw new Error('Malformed HTML page: '+path);
    const after=polishPage(before,{isArabic,isHome,base});
    if(after.includes('class="icon-button saved-link"'))throw new Error('Bookmark still in header: '+path);
    if(after.includes(' data-save='))throw new Error('Bookmark still in article: '+path);
    if(isHome && /class="[^"]*\bcover-seal\b/.test(after))throw new Error('Akil badge still shown: '+path);
    if(isArabic && /class="[^"]*\bwordmark\b/.test(before) && !after.includes('be-arabic-wordmark'))
      throw new Error('Arabic wordmark not rendered: '+path);
    if(isHome && !after.includes('be-home-intro'))throw new Error('Home intro missing: '+path);
    writeFileSync(file,after);
    count[isArabic?'arabic':'english']++;
    if(isHome)count.home++;
  }
  if(count.home!==2)throw new Error('Expected two bilingual homepages, found '+count.home);
  console.log('Polished bilingual visitor experience: '+count.english+' English, '+count.arabic+' Arabic, '+count.home+' homepages.');
}

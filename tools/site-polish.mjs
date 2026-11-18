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
  ['The story archive', 'أرشيف الحكايات']
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
  if(isArabic){
    for(const [english,arabic] of arabicUiLabels)html=html.replaceAll(english,arabic);
    html=html.replace(
      /<a class="wordmark" dir="ltr" href="([^"]+)" lang="en">boudieeats<span>\.<\/span><\/a>/g,
      '<a class="wordmark be-arabic-wordmark" dir="rtl" href="$1" lang="ar">بودي إيتس<span>.</span></a>'
    );
    html=html.replace(/(<a class="be-brand"[^>]*>)BoudieEats\.(<\/a>)/g,'$1بودي إيتس.$2');
  }
  html=putHeaderControlsTogether(html);
  html=html.replace('</head>',css+'</head>');
  if(isHome){
    if(!html.includes('<main'))throw new Error('Home page has no main landmark');
    html=html.replace(/<main\b[^>]*>/,match=>match+homeIntroduction(isArabic,base));
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
    if(isArabic && before.includes('class="wordmark"') && !after.includes('be-arabic-wordmark'))
      throw new Error('Arabic wordmark not rendered: '+path);
    if(isHome && !after.includes('be-home-intro'))throw new Error('Home intro missing: '+path);
    writeFileSync(file,after);
    count[isArabic?'arabic':'english']++;
    if(isHome)count.home++;
  }
  if(count.home!==2)throw new Error('Expected two bilingual homepages, found '+count.home);
  console.log('Polished bilingual visitor experience: '+count.english+' English, '+count.arabic+' Arabic, '+count.home+' homepages.');
}

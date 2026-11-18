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
  "/* Site-wide layout rhythm: shared across both language editions. No brand color changes. */",
  ".page-intro{min-height:0!important;height:auto!important;overflow:visible!important;padding:0!important}",
  ".page-intro>.shell{display:block!important;min-height:0!important;height:auto!important;max-height:none!important;padding-block:clamp(22px,3vw,40px) clamp(27px,3.8vw,49px)!important}",
  ".page-intro .breadcrumbs{display:block!important;position:static!important;margin:0 0 clamp(19px,2.2vw,29px)!important;padding:0!important}",
  ".page-intro .breadcrumbs ol{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:7px!important;margin:0!important;padding:0!important}",
  ".page-intro .page-headline{display:block!important;position:static!important;min-height:0!important;height:auto!important;max-height:none!important;width:100%!important;margin:0!important;padding:0!important;grid-template:none!important;transform:none!important;text-align:start!important}",
  ".page-intro .page-headline>.eyebrow,.page-intro .page-headline>h1,.page-intro .page-headline>.page-dek{position:static!important;float:none!important;display:block!important;grid-area:auto!important;inset:auto!important;transform:none!important;align-self:auto!important;text-align:start!important;max-width:100%!important}",
  ".page-intro .page-headline>.eyebrow{font-size:clamp(.73rem,.85vw,.83rem)!important;line-height:1.45!important;margin:0 0 9px!important;letter-spacing:.08em!important}",
  ".page-intro .page-headline>h1{font-size:clamp(2.55rem,4.6vw,4.25rem)!important;line-height:1.14!important;letter-spacing:-.012em!important;margin:0 0 9px!important;max-width:18ch!important;text-wrap:balance}",
  ".page-intro .page-headline>.page-dek{font-size:clamp(.98rem,1.15vw,1.13rem)!important;line-height:1.62!important;margin:0!important;max-width:66ch!important;text-wrap:pretty}",
  ".page-intro .page-headline>a.text-link{display:inline-flex!important;vertical-align:middle!important;position:static!important;margin:clamp(12px,1.7vw,18px) 17px 0 0!important;font-size:.9rem!important;line-height:1.4!important}",
  ".archive-body{padding-top:clamp(25px,3vw,41px)!important;padding-bottom:clamp(55px,6vw,90px)!important}",
  ".archive-section{margin-top:clamp(32px,4vw,56px)!important}",
  ".archive-heading{font-size:clamp(1.85rem,2.8vw,2.65rem)!important;line-height:1.3!important;margin:clamp(18px,2.2vw,27px) 0 14px!important}",
  ".archive-feature{box-sizing:border-box!important;position:relative!important;display:flex!important;align-items:center!important;gap:clamp(13px,2vw,25px)!important;width:100%!important;min-width:0!important;min-height:0!important;height:auto!important;padding:clamp(17px,2vw,25px)!important;margin:0 0 clamp(25px,3.1vw,40px)!important;text-align:start!important}",
  ".archive-feature>bdi{flex:none!important;font-size:clamp(1.24rem,2vw,1.78rem)!important;line-height:1.15!important;font-weight:700!important}",
  ".archive-feature>div{min-width:0!important;flex:1 1 auto!important}",
  ".archive-feature>div>span{display:block!important;font-size:clamp(.84rem,1.05vw,.96rem)!important;line-height:1.45!important;margin-bottom:5px!important}",
  ".archive-feature h2{position:static!important;max-width:100%!important;font-size:clamp(1.38rem,2.45vw,2.32rem)!important;line-height:1.3!important;margin:0!important;letter-spacing:0!important;overflow-wrap:anywhere!important;text-wrap:pretty}",
  ".archive-feature>svg{flex:none!important;width:21px!important;height:21px!important;margin-inline-start:auto!important}",
  ".catalog{min-width:0!important}",
  ".catalog .filter-form{box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:clamp(12px,1.6vw,18px)!important;padding:clamp(16px,2.2vw,28px)!important;margin:0 0 clamp(20px,2.6vw,32px)!important;min-width:0!important}",
  ".catalog .filter-search{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:7px!important;min-width:0!important}",
  ".catalog .filter-search>label,.catalog .filter-controls>label{font-size:clamp(.88rem,.98vw,.97rem)!important;line-height:1.45!important;min-width:0!important}",
  ".catalog .search-input{display:flex!important;align-items:center!important;min-width:0!important;max-width:100%!important;width:100%!important}",
  ".catalog .search-input input{box-sizing:border-box!important;width:100%!important;min-width:0!important;min-height:44px!important;font-size:clamp(.92rem,1vw,1rem)!important}",
  ".catalog .filter-controls{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;align-items:end!important;gap:clamp(10px,1.5vw,18px)!important;min-width:0!important}",
  ".catalog .filter-controls>label{display:grid!important;gap:6px!important}",
  ".catalog .filter-controls select{box-sizing:border-box!important;min-width:0!important;max-width:100%!important;width:100%!important;min-height:43px!important;font-size:clamp(.89rem,.98vw,.99rem)!important}",
  ".catalog .filter-controls .reset-filter{align-self:end!important;justify-self:start!important;margin:0!important;font-size:.89rem!important}",
  ".catalog .results-status{font-size:clamp(.83rem,.93vw,.95rem)!important}",
  ".section-heading{margin-bottom:clamp(16px,2vw,24px)!important}",
  ".section-heading h2{font-size:clamp(1.74rem,2.6vw,2.46rem)!important;line-height:1.3!important}",
  ".section-heading .eyebrow{margin-bottom:5px!important}",
  ".home-section,.home-intro,.home-departments{margin-block:clamp(26px,4vw,57px)!important}",
  ".entry-grid>.entry-card{max-width:100%!important}",
  ".entry-grid>.entry-card .entry-copy{box-sizing:border-box!important}",
  ".entry-grid>.entry-card h3{hyphens:auto;overflow-wrap:break-word}",
  ".entry-list{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:16px!important;min-width:0!important}",
  ".entry-list>.entry-card{box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(130px,210px) minmax(0,1fr)!important;gap:clamp(12px,2vw,22px)!important;align-items:stretch!important;min-width:0!important}",
  ".entry-list>.entry-card .entry-image-link{width:100%!important;height:100%!important;min-width:0!important}",
  ".entry-list>.entry-card .entry-image-link img{display:block!important;width:100%!important;height:100%!important;max-height:210px!important;min-height:150px!important;object-fit:cover!important}",
  ".entry-list>.entry-card .entry-copy{min-width:0!important;padding:clamp(13px,1.8vw,20px)!important}",
  ".editorial-article,.recipe{min-width:0!important;padding-top:clamp(22px,3vw,42px)!important;padding-bottom:clamp(52px,6vw,90px)!important}",
  ".editorial-article .breadcrumbs,.recipe .breadcrumbs{margin-bottom:clamp(23px,3vw,38px)!important}",
  ".article-header{display:grid!important;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr)!important;align-items:start!important;gap:clamp(19px,3vw,42px)!important;margin-bottom:clamp(24px,3vw,43px)!important}",
  ".article-header>div,.article-header>.editorial-image{min-width:0!important;max-width:100%!important;margin:0!important}",
  ".article-header .editorial-image img{display:block!important;width:100%!important;height:auto!important;max-height:430px!important;object-fit:cover!important}",
  ".article-header h1,.recipe-heading h1{font-size:clamp(2.2rem,4.2vw,4.15rem)!important;line-height:1.2!important;letter-spacing:normal!important;overflow-wrap:break-word!important;text-wrap:balance}",
  ".article-header .page-dek,.recipe-heading .recipe-subtitle{font-size:clamp(1rem,1.3vw,1.18rem)!important;line-height:1.6!important;max-width:62ch!important}",
  ".article-header .byline{font-size:clamp(.83rem,.97vw,.96rem)!important;line-height:1.5!important}",
  ".recipe-heading{min-width:0!important}",
  ".recipe-body,.article-body,.reading{max-width:100%!important}",
  ".reading{font-size:clamp(1rem,1.16vw,1.12rem)!important;line-height:1.78!important}",
  ".recipe-body .steps h2,.recipe-body .ingredient-heading h2,.recipe-tips h2,.related-section h2,.reading h2{font-size:clamp(1.65rem,2.6vw,2.48rem)!important;line-height:1.35!important}",
  ".contact-body h2,.about-body h2{font-size:clamp(1.65rem,2.45vw,2.45rem)!important;line-height:1.35!important}",
  ".contact-channels{min-width:0!important}",
  ".contact-channels>li{min-width:0!important;overflow-wrap:anywhere!important}",
  ".about-insignia{max-width:100%!important}",
  "html[lang^=\"ar\"] .page-intro .page-headline>.eyebrow,html[lang^=\"ar\"] .section-heading .eyebrow{direction:rtl!important;letter-spacing:0!important;text-align:right!important}",
  "html[lang^=\"ar\"] .page-intro .page-headline>h1,html[lang^=\"ar\"] .archive-heading{font-family:\"Aref Ruqaa\",serif!important;line-height:1.55!important}",
  "html[lang^=\"ar\"] .page-intro .page-headline>h1{font-size:clamp(2.65rem,4.4vw,4.25rem)!important;margin-bottom:3px!important}",
  "html[lang^=\"ar\"] .archive-feature h2{font-family:\"Aref Ruqaa\",serif!important;line-height:1.6!important;font-size:clamp(1.55rem,2.45vw,2.35rem)!important}",
  "html[lang^=\"ar\"] .page-intro .page-headline>.page-dek{font-size:clamp(1.02rem,1.23vw,1.18rem)!important;line-height:1.76!important}",
  "html[lang^=\"ar\"] .article-header h1,html[lang^=\"ar\"] .recipe-heading h1{font-size:clamp(2.4rem,4.25vw,4.4rem)!important;line-height:1.55!important}",
  "html[lang^=\"ar\"] .reading{font-size:clamp(1.08rem,1.24vw,1.22rem)!important;line-height:1.9!important}",
  "html[dir=\"rtl\"] .page-intro .page-headline>a.text-link{margin:clamp(12px,1.7vw,18px) 0 0 17px!important}",
  "@media(max-width:950px){.article-header{grid-template-columns:minmax(0,1fr)!important}.article-header .editorial-image img{max-height:500px!important}.catalog .filter-controls{grid-template-columns:repeat(2,minmax(0,1fr))!important}}",
  "@media(max-width:640px){.page-intro>.shell{padding-block:16px 24px!important}.page-intro .breadcrumbs{margin-bottom:17px!important}.page-intro .page-headline>h1{font-size:clamp(2.15rem,9vw,2.9rem)!important}.page-intro .page-headline>.page-dek{font-size:1rem!important}.archive-feature{gap:12px!important;padding:15px!important}.archive-feature h2{font-size:clamp(1.25rem,5.8vw,1.7rem)!important}.archive-feature>bdi{font-size:1.16rem!important}.archive-heading{font-size:clamp(1.6rem,7vw,2.15rem)!important}.catalog .filter-form{padding:15px!important}.catalog .filter-controls{grid-template-columns:minmax(0,1fr)!important}.entry-list>.entry-card{grid-template-columns:110px minmax(0,1fr)!important;gap:8px!important}.entry-list>.entry-card .entry-image-link img{max-height:175px!important;min-height:125px!important}.entry-list>.entry-card .entry-copy{padding:10px!important}.entry-list>.entry-card h3{font-size:1.12rem!important}.article-header h1,.recipe-heading h1{font-size:clamp(2rem,8vw,3rem)!important}html[lang^=\"ar\"] .page-intro .page-headline>h1{font-size:clamp(2.3rem,9vw,3.3rem)!important}}",
  "@media(max-width:390px){.entry-list>.entry-card{grid-template-columns:1fr!important}.entry-list>.entry-card .entry-image-link img{height:190px!important;max-height:190px!important}}",
  "/* Compact browse-first layouts, preserving the existing BoudieEats palette. */",
  ".page-intro>.shell{padding-block:clamp(12px,1.3vw,19px) clamp(16px,1.85vw,26px)!important}",
  ".page-intro .breadcrumbs{margin-bottom:clamp(9px,1.1vw,15px)!important}",
  ".page-intro .page-headline>.eyebrow{font-size:clamp(.69rem,.77vw,.78rem)!important;line-height:1.3!important;margin:0 0 3px!important}",
  ".page-intro .page-headline>h1{font-size:clamp(2.15rem,3.65vw,3.4rem)!important;line-height:1.12!important;margin:0 0 5px!important}",
  ".page-intro .page-headline>.page-dek{font-size:clamp(.91rem,1vw,1.02rem)!important;line-height:1.46!important;max-width:63ch!important}",
  ".page-intro .page-headline>a.text-link{font-size:.84rem!important;margin:8px 14px 0 0!important}",
  ".archive-body{padding-top:clamp(13px,1.7vw,23px)!important}",
  ".archive-feature{padding:clamp(11px,1.35vw,17px)!important;gap:clamp(10px,1.4vw,18px)!important;margin-bottom:clamp(14px,1.7vw,22px)!important}",
  ".archive-feature>bdi{font-size:clamp(1.15rem,1.55vw,1.48rem)!important}",
  ".archive-feature>div>span{font-size:clamp(.76rem,.9vw,.88rem)!important;line-height:1.25!important;margin:0 0 2px!important}",
  ".archive-feature h2{font-size:clamp(1.24rem,1.8vw,1.74rem)!important;line-height:1.23!important}",
  ".archive-feature>svg{height:18px!important;width:18px!important}",
  ".archive-heading{font-size:clamp(1.65rem,2.15vw,2.1rem)!important;margin:clamp(9px,1.2vw,15px) 0 8px!important;line-height:1.22!important}",
  ".archive-section{margin-top:clamp(18px,2.5vw,30px)!important}",
  ".section-heading{margin-bottom:clamp(8px,1.2vw,15px)!important}",
  ".section-heading h2{font-size:clamp(1.55rem,2.05vw,2rem)!important;line-height:1.27!important}",
  ".section-heading .eyebrow{font-size:.73rem!important;margin-bottom:2px!important}",
  ".catalog .filter-form{gap:clamp(9px,1vw,13px)!important;padding:clamp(11px,1.15vw,16px)!important;margin-bottom:clamp(10px,1.3vw,16px)!important;align-items:end!important}",
  ".catalog .filter-search{gap:4px!important}",
  ".catalog .filter-search>label,.catalog .filter-controls>label{font-size:clamp(.77rem,.84vw,.86rem)!important;line-height:1.28!important;font-weight:600!important}",
  ".catalog .filter-controls>label{gap:4px!important}",
  ".catalog .filter-controls{gap:10px!important}",
  ".catalog .search-input{height:38px!important;min-height:38px!important}",
  ".catalog .search-input input{height:38px!important;min-height:38px!important;padding-block:7px!important;font-size:clamp(.83rem,.9vw,.92rem)!important}",
  ".catalog .search-input svg{width:17px!important;height:17px!important}",
  ".catalog .filter-controls select{height:38px!important;min-height:38px!important;padding-block:5px!important;font-size:clamp(.82rem,.88vw,.91rem)!important}",
  ".catalog .results-status{font-size:.79rem!important;line-height:1.3!important;margin:0 0 8px!important;min-height:0!important}",
  ".entry-grid{grid-auto-flow:row dense!important;grid-auto-rows:auto!important;align-items:stretch!important;gap:clamp(12px,1.45vw,20px)!important}",
  ".entry-grid>.entry-card{box-sizing:border-box!important;grid-column:auto!important;grid-row:auto!important;min-width:0!important;max-width:100%!important}",
  ".entry-grid>.entry-card[hidden]{display:none!important}",
  ".entry-grid>.entry-card .entry-image-link img{height:clamp(140px,13.8vw,188px)!important;max-height:188px!important;object-fit:cover!important}",
  ".entry-grid>.entry-card .entry-copy{padding:clamp(10px,1.05vw,14px)!important;gap:5px!important}",
  ".entry-grid>.entry-card .entry-label{font-size:.75rem!important;line-height:1.3!important}",
  ".entry-grid>.entry-card h3{font-size:clamp(1.03rem,1.3vw,1.27rem)!important;line-height:1.3!important}",
  ".entry-grid>.entry-card .entry-description{font-size:clamp(.83rem,.9vw,.94rem)!important;line-height:1.46!important;-webkit-line-clamp:2!important}",
  ".entry-grid>.entry-card .text-link{font-size:.81rem!important;margin-top:auto!important}",
  "html[lang^=\"ar\"] .page-intro .page-headline>h1{font-size:clamp(2.27rem,3.8vw,3.6rem)!important;line-height:1.42!important;margin-bottom:0!important}",
  "html[lang^=\"ar\"] .page-intro .page-headline>.page-dek{font-size:clamp(.96rem,1.07vw,1.1rem)!important;line-height:1.57!important}",
  "html[lang^=\"ar\"] .archive-feature h2{font-size:clamp(1.4rem,1.95vw,1.9rem)!important;line-height:1.38!important}",
  "html[lang^=\"ar\"] .archive-heading{font-size:clamp(1.73rem,2.2vw,2.25rem)!important;line-height:1.48!important}",
  "html[lang^=\"ar\"] .entry-grid>.entry-card h3{font-size:clamp(1.2rem,1.45vw,1.48rem)!important;line-height:1.45!important}",
  "html[lang^=\"ar\"] .entry-grid>.entry-card .entry-description{font-size:clamp(.91rem,1vw,1.02rem)!important;line-height:1.5!important}",
  "html[dir=\"rtl\"] .page-intro .page-headline>a.text-link{margin:8px 0 0 14px!important}",
  "@media(min-width:1080px){",
  " .catalog .filter-form{grid-template-columns:minmax(190px,1.55fr) repeat(4,minmax(0,1fr))!important;column-gap:clamp(9px,1.1vw,15px)!important}",
  " .catalog .filter-controls{display:contents!important}",
  " .catalog .filter-controls>label{min-width:0!important}",
  " .catalog .filter-controls>.reset-filter{justify-self:start!important;grid-column:1/-1!important}",
  " .entry-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}",
  "}",
  "@media(min-width:660px) and (max-width:1079px){",
  " .catalog .filter-form{grid-template-columns:1fr!important}",
  " .catalog .filter-controls{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important}",
  " .entry-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}",
  " .entry-grid>.entry-card .entry-image-link img{height:clamp(155px,20vw,215px)!important}",
  "}",
  "@media(max-width:659px){",
  " .page-intro>.shell{padding-block:10px 16px!important}",
  " .page-intro .breadcrumbs{margin-bottom:8px!important}",
  " .page-intro .page-headline>h1{font-size:clamp(2.02rem,8vw,2.75rem)!important}",
  " .archive-body{padding-top:12px!important}",
  " .archive-feature{padding:10px!important;margin-bottom:13px!important}",
  " .archive-feature h2{font-size:clamp(1.18rem,5vw,1.52rem)!important}",
  " .catalog .filter-form{padding:11px!important;gap:10px!important}",
  " .catalog .filter-controls{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}",
  " .entry-grid{grid-template-columns:1fr!important;gap:13px!important}",
  " .entry-grid>.entry-card .entry-image-link img{height:clamp(190px,51vw,270px)!important;max-height:270px!important}",
  " html[lang^=\"ar\"] .page-intro .page-headline>h1{font-size:clamp(2.24rem,8vw,3rem)!important}",
  "}",
  "@media(max-width:360px){.catalog .filter-controls{grid-template-columns:1fr!important}}",
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
    html=html.replace(/<p class="eyebrow" dir="ltr" lang="en">([\s\S]*?)<\/p>/g,(whole,label)=>/[\u0600-\u06ff]/.test(label)?whole.replace('dir="ltr" lang="en"','dir="rtl" lang="ar"'):whole);
    html=html.replace(/(<(?:span|p)\b[^>]*?)dir="ltr" lang="en"([^>]*>)(?=[\u0600-\u06ff])/g,'$1dir="rtl" lang="ar"$2');
  }
  html=html.replace(/(<div class="about-insignia">[\s\S]*?<span>)(?:أكيل\.|Always hungry\.)(<\/span>)/g,'$1'+(isArabic?'بودي إيتس.':'Boudie Eats.')+'$2');
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

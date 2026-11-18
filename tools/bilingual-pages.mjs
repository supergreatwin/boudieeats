import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const canonical='https://boudieeats.com/';
const theme='<style>@import url("https://fonts.googleapis.com/css2?family=Lalezar&family=Aref+Ruqaa:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap");*{box-sizing:border-box}body{margin:0;background:#fffaf2;color:#33232b;font:19px/1.65 "Lalezar",Arial,sans-serif}a{color:#8f3152}header,main,footer{max-width:980px;margin:auto;padding:20px 26px}header{border-bottom:1px solid #ecdfe0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}header a{text-decoration:none}h1,h2{font-family:"Aref Ruqaa",serif;line-height:1.45}h1{font-size:clamp(2.25rem,5vw,3.75rem);margin:10px 0 14px}h2{font-size:1.6rem}main{padding-top:32px;padding-bottom:70px}.eyebrow{font:700 .8rem/1.5 "DM Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8f3152}.muted{color:#685961}.panel{border:1px solid #ecdfe0;background:#fff;border-radius:18px;padding:22px;margin:18px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.grid .panel{margin:0}.grid a{display:block;margin:8px 0}.button{display:inline-block;background:#8f3152;color:#fff;text-decoration:none;border-radius:11px;padding:10px 16px}iframe{display:block;border:none;width:100%;min-height:600px;margin-top:14px}.fallback{font-size:.95rem}footer{border-top:1px solid #ecdfe0;color:#685961;font-size:.9rem}a:focus-visible{outline:3px solid #8f3152;outline-offset:4px}@media(max-width:580px){header,main,footer{padding:18px}body{font-size:18px}}</style>';
function htmlPage({base,slug,title,description,content,noindex=false}){
 const path=tail=>base+(tail||'');
 const head='<!doctype html><html lang="ar-EG" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>'+title+' | BoudieEats</title><meta name="description" content="'+description+'"><link rel="canonical" href="'+canonical+'ar/'+slug+'/">'+(noindex?'<meta name="robots" content="noindex,nofollow">':'')+theme+'</head>';
 return head+'<body><header><a href="'+path()+'"><strong>بودي إيتس.</strong></a><nav><a href="'+path('recipes/')+'">الوصفات</a> · <a href="'+path('reviews/')+'">التجارب</a> · <a href="'+path()+'">الرئيسية</a></nav></header>'+
 '<main><div class="eyebrow">An Egyptian food journal</div><h1>'+title+'</h1><p class="muted">'+description+'</p>'+content+'</main>'+
 '<footer><a href="'+path('reader-responses/')+'">شاركنا رأيك</a> · <a href="'+path('newsletter-signup/')+'">النشرة البريدية</a> · <a href="'+path('editorial-desk/')+'">مكتب التحرير</a></footer></body></html>';
}
function form(id,name){return '<iframe title="'+name+'" src="https://tally.so/embed/'+id+'?alignLeft=0&hideTitle=1&transparentBackground=1&dynamicHeight=1" loading="lazy" width="100%" height="600" frameborder="0"></iframe>'+
 '<script defer src="https://tally.so/widgets/embed.js"></script><p class="fallback">لو الاستمارة ما ظهرتش، <a href="https://tally.so/r/'+id+'" target="_blank" rel="noopener noreferrer">افتحها من هنا</a>.</p>';}
const pages=[
 {slug:'reader-responses',title:'شاركنا رأيك',description:'رشّح مطعم أو كافيه، اطلب وصفة، أو احكيلنا عن تجربة منتج.',
  content:'<div class="panel"><h2>رأيك يهمّنا</h2><p>شاركنا تجربتك باسمك أو من غيره. تقدر تضيف اسم مستخدم للعرض، لكن ده مش حساب تسجيل دخول. أي اقتباس هيتنشر بموافقتك.</p>'+form('aO4rxy','استمارة اقتراحات وتجارب القراء')+'</div>'},
 {slug:'newsletter-signup',title:'جواب من بودي',description:'وصفات وتجارب وحكايات عن الأكل في مصر، في بريدك بعد إطلاق النشرة.',
  content:'<div class="panel"><h2>سجّل اهتمامك</h2><p>دي قائمة انتظار، مش اشتراك نشط في نشرة بريدية. لسه بنجهّز نشرة منفصلة لبودي إيتس، ومش هنضيف بريدك لأي مشروع تاني.</p>'+form('7XK9Dz','قائمة انتظار النشرة البريدية')+'</div>'},
 {slug:'editorial-desk',title:'مكتب التحرير',description:'بوابة فريق تحرير بودي إيتس لتنظيم الأفكار والمقالات والمراجعات والنشر.',noindex:true,
  content:'<div class="panel"><h2>صلاحيات الفريق</h2><p>النسخة الحالية بتستخدم حسابات GitHub وصلاحيات المستودع، مش حسابات مستقلة جوه الموقع. الدخول للملفات الخاصة بيتم من GitHub نفسه.</p><a class="button" href="https://github.com/login">دخول GitHub</a></div>'+
   '<div class="grid"><div class="panel"><h2>الأفكار الواردة</h2><a href="https://github.com/supergreatwin/boudieeats/issues">مهام التحرير</a><a href="https://tally.so/forms">وارد Tally (الدخول مطلوب)</a></div>'+
   '<div class="panel"><h2>المقالات والمراجعات</h2><a href="https://github.com/supergreatwin/boudieeats/pulls">مراجعة التعديلات</a><a href="https://github.com/supergreatwin/boudieeats/tree/main/editorial">أرشيف التحرير</a></div>'+
   '<div class="panel"><h2>النشرة البريدية</h2><a href="https://github.com/supergreatwin/boudieeats/tree/main/editorial/newsletter">مسودات النشرة</a><p>الإرسال الفعلي مش مفعّل قبل إنشاء نشرة منفصلة للمشروع.</p></div></div>'}
];
export function restoreArabicVisitorPages({directory,basePath}){
 const base=basePath.endsWith('/')?basePath:basePath+'/';
 const nav='<nav class="be-reader-links" aria-label="مشاركة القراء"><a href="'+base+'reader-responses/">شاركنا رأيك</a><a href="'+base+'newsletter-signup/">النشرة البريدية</a><a href="'+base+'editorial-desk/">مكتب التحرير</a></nav>';
 for(const entry of readdirSync(directory,{recursive:true})){
  if(!entry.endsWith('.html'))continue;
  const file=join(directory,entry);let html=readFileSync(file,'utf8');
  html=html.replace(/<nav class="be-reader-links"[\s\S]*?<\/nav>/g,nav);
  writeFileSync(file,html);
 }
 for(const page of pages){const dir=join(directory,page.slug);mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'index.html'),htmlPage({...page,base}));}
 const sitemap=join(directory,'sitemap.xml');let data=readFileSync(sitemap,'utf8');
 for(const slug of ['reader-responses/','newsletter-signup/'])data=data.replaceAll(canonical+slug,canonical+'ar/'+slug);
 writeFileSync(sitemap,data);
}
export function finishLanguageLinks({directory,basePath}){
 const base=basePath.endsWith('/')?basePath:basePath+'/';
 const entries=readdirSync(directory,{recursive:true}).filter(p=>p.endsWith('.html')&&!/^google[a-z0-9]+\.html$/.test(p));
 const paths=new Set(entries);
 const css='<style>.be-language{display:flex;align-items:center;gap:7px;margin-inline:12px;font-family:"DM Sans",Arial,sans-serif;font-size:13px;direction:ltr}.be-language a{border:1px solid currentColor;color:inherit;border-radius:6px;padding:5px 8px;text-decoration:none}.be-language a[aria-current="page"]{background:#51283e;color:white;border-color:#51283e}</style>';
 for(const path of entries){
  const isArabic=path.startsWith('ar/');
  const local=isArabic?path.slice(3):path;
  const other=(isArabic?'':'ar/')+local;
  if(!paths.has(other))continue;
  const slug=local==='index.html'?'':local.replace(/index\.html$/,'');
  const enLink=base+slug,arLink=base+'ar/'+slug;
  const widget='<nav class="be-language" aria-label="'+(isArabic?'اللغة':'Language')+'"><a href="'+enLink+'" lang="en"'+(!isArabic?' aria-current="page"':'')+'>EN</a><a href="'+arLink+'" lang="ar"'+(isArabic?' aria-current="page"':'')+'>العربية</a></nav>';
  const metadata='<link rel="alternate" hreflang="en" href="'+canonical+slug+'"><link rel="alternate" hreflang="ar-EG" href="'+canonical+'ar/'+slug+'"><link rel="alternate" hreflang="x-default" href="'+canonical+slug+'">';
  const file=join(directory,path);let html=readFileSync(file,'utf8');
  if(!html.includes('<header'))throw new Error('Page missing header: '+path);
  html=html.replace('</head>',metadata+css+'</head>');
  html=html.replace('</header>',widget+'</header>');
  writeFileSync(file,html);
 }
 const sitemap=join(directory,'sitemap.xml');let data=readFileSync(sitemap,'utf8');
 const arabic=entries.filter(p=>p.startsWith('ar/')&&p.endsWith('index.html')).map(p=>p.replace(/^ar\//,'').replace(/index\.html$/,''));
 const urls=arabic.map(slug=>canonical+'ar/'+slug);
 const additions=urls.filter(url=>!data.includes('<loc>'+url+'</loc>')).map(url=>'<url><loc>'+url+'</loc></url>').join('');
 if(additions){if(!data.includes('</urlset>'))throw new Error('Invalid English sitemap');data=data.replace('</urlset>',additions+'</urlset>');writeFileSync(sitemap,data);}
}

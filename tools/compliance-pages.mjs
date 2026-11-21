import {mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';

// These are truthful launch notices, not a claim of legal certification.
// The independent food journal remains the single public content destination.
const origin='https://boudieeats.com/';
const pages={
 en:{
  privacy:{
   title:'Privacy Notice',
   intro:'How Boudie Eats handles the information you choose to share.',
   body:[
    ['Who operates this website','Boudie Eats is an independent food journal operating from Egypt. To contact the publication or ask about your data, use the <a href="/reader-responses/">reader contact form</a>. Do not include identification documents or sensitive financial information in that form.'],
    ['What we collect','If you create an account we collect your email, authentication details and the display name or username you provide. We may store food preferences, your saved discoveries, submissions and moderation records when those features are activated. The newsletter signup collects the email address and the consent choices you submit. Technical hosts may process security logs and device/network information.'],
    ['Why we process it','To secure your account, provide requested features, handle your submissions, send the free newsletter only when you expressly opt in, prevent abuse, and comply with applicable obligations. Optional analytics run only after your choice to allow them. We do not sell subscriber lists.'],
    ['Service providers','Boudie Eats currently uses Supabase for account and database services, Cloudflare for hosting, Tally for reader forms, beehiiv for newsletter subscriptions and email distribution, and email delivery services for account messages. Google Analytics is optional and requires permission. These services may handle data outside Egypt. Review their individual privacy terms for details.'],
    ['Your choices and requests','You can unsubscribe using the link in each newsletter email. You can decline or change analytics consent using the site analytics controls. To ask for access, correction or deletion of your personal information, contact us using the reader contact form and include the email associated with your account; we may need to verify that you control that address before processing the request.'],
    ['Retention and security','We keep account and submission records while needed for the requested service and legitimate security or editorial needs, subject to applicable law. Newsletter data is retained according to subscription status and necessary records of consent. Automatic deletion schedules have not yet been implemented for all data categories. Authentication, restricted staff access and database row-level permissions are used to reduce unauthorized access; no online system can guarantee perfect security.'],
    ['Changes to this notice','We will update this page if our data collection, providers or capabilities materially change. Last updated: 21 November 2026.']
   ]
  },
  cookies:{
   title:'Cookies and Analytics',
   intro:'Essential sign-in functions are separate from optional analytics.',
   body:[
    ['Necessary account data','Supabase Auth uses browser storage and session credentials to keep you signed in. These are required for optional account features. You can browse recipes and reviews without an account.'],
    ['Optional Google Analytics','We load Google Analytics only after you choose to allow analytics. If you decline, the Google Analytics script is not loaded by our consent manager. You may change this choice using the Analytics Settings control near the site footer. Analytics consent is stored in your browser.'],
    ['Tally and third-party forms','Embedded Tally forms may use their own necessary service technologies. Opening an embedded form may connect your browser to Tally even if you decline Google Analytics. You may access the form separately or choose not to use it.'],
    ['Your choices','You may reject analytics and still use the editorial website. Clearing browser storage may sign you out and reset your analytics choice. Last updated: 21 November 2026.']
   ]
  },
  terms:{
   title:'Website Terms',
   intro:'A straightforward guide to using and contributing to Boudie Eats.',
   body:[
    ['Editorial independence','Boudie Eats publishes original recipes, restaurant and café reviews, photography and food stories. Opinions, menus and prices may change. A recommendation is not a guarantee of service, availability or safety.'],
    ['Your account','Keep your login credentials confidential. Reader and contributor accounts cannot enter the staff Editorial Desk. Only verified editors and administrators are authorized to edit or publish official content. We may moderate abusive conduct and restrict access to protect the service.'],
    ['Food safety and allergens','Recipes and food suggestions are informational, not individualized medical or dietary advice. Ingredients, allergens and restaurant practices may vary. Verify them directly before eating, especially when allergies or dietary restrictions matter.'],
    ['Original material and submissions','Do not copy, republish or commercially use original Boudie Eats photography or editorial work without permission. Submit only content, photos and stories you have permission to share. Submitting an idea does not guarantee publication; the Editorial Desk reviews material before publication.'],
    ['Free access','The site currently publishes free editorial content. There is no required paid subscription to read it or join the free email newsletter.'],
    ['Contact and updates','Use the <a href="/reader-responses/">reader contact form</a> for questions or reports. We may revise this notice as features change. Last updated: 21 November 2026.']
   ]
  }
 },
 ar:{
  privacy:{
   title:'إشعار الخصوصية',intro:'إزاي بودي إيتس بيتعامل مع البيانات اللي بتختار تشاركها.',
   body:[
    ['مين مسؤول عن الموقع','بودي إيتس يومية أكل مستقلة بتعمل من مصر. تقدر تتواصل معانا وتطلب معلومات عن بياناتك من <a href="/ar/reader-responses/">نموذج التواصل</a>. بلاش تبعت مستندات هوية أو بيانات مالية حساسة في النموذج.'],
    ['البيانات اللي بنجمعها','لو عملت حساب، بنحتفظ ببريدك الإلكتروني وبيانات تسجيل الدخول واسم العرض أو المستخدم اللي بتختاره. وممكن نحتفظ بتفضيلات الأكل والمحفوظات والمشاركات وسجلات المراجعة لما المميزات دي تشتغل. نموذج النشرة بيجمع البريد واختيارات الموافقة. خدمات الاستضافة ممكن تعالج بيانات تقنية للحماية.'],
    ['ليه بنستخدم البيانات','عشان نحمي الحساب، ونقدّم الخدمات المطلوبة، ونتعامل مع المشاركات، ونبعت النشرة المجانية بس بعد موافقة صريحة، ونمنع إساءة الاستخدام ونلتزم بالقانون. التحليلات الاختيارية مش بتشتغل غير بموافقتك. مش بنبيع قوائم المشتركين.'],
    ['مقدمو الخدمة','بودي إيتس بيستخدم Supabase للحسابات والبيانات، وCloudflare للاستضافة، وTally للنماذج، وbeehiiv للنشرة البريدية، وخدمات إرسال رسائل الحساب. Google Analytics اختياري. بعض الخدمات دي ممكن تعالج بيانات خارج مصر.'],
    ['اختياراتك وحقوقك','تقدر تلغي الاشتراك من الرابط الموجود في كل رسالة. وتقدر ترفض التحليلات أو تغيّر اختيارك من إعداداتها في الموقع. لطلب الوصول لبياناتك أو تصحيحها أو حذفها استخدم نموذج التواصل مع ذكر البريد المرتبط بحسابك. ممكن نطلب تأكيد ملكيتك للبريد قبل تنفيذ الطلب.'],
    ['الاحتفاظ والحماية','بنحتفظ ببيانات الحساب والمشاركات طالما محتاجينها لتقديم الخدمة أو لأسباب تحريرية وأمنية مشروعة، وفق القانون. بيانات النشرة بتتعلق بحالة الاشتراك وسجلات الموافقة. الحذف التلقائي لكل أنواع البيانات لسه مش مكتمل. بنستخدم تسجيل دخول وصلاحيات محددة وسياسات على مستوى قاعدة البيانات لتقليل الوصول غير المصرح به. مفيش نظام إلكتروني بيضمن أمان كامل.'],
    ['التحديثات','هنحدّث الإشعار لو طرق جمع البيانات أو الخدمات اتغيرت بشكل مهم. آخر تحديث: ٢١ نوفمبر ٢٠٢٦.']
   ]
  },
  cookies:{
   title:'ملفات الارتباط والتحليلات',intro:'تسجيل الدخول الضروري منفصل عن التحليلات الاختيارية.',
   body:[
    ['تسجيل الدخول','Supabase Auth بيستخدم تخزين المتصفح وبيانات الجلسة عشان يفضل حسابك مفتوح. تقدر تتصفح الوصفات والتجارب من غير حساب.'],
    ['تحليلات Google الاختيارية','مش بنحمّل Google Analytics قبل ما توافق على التحليلات. لو رفضت، أداة التحليلات مش بتشتغل من خلال نظام الموافقة عندنا. تقدر تغيّر اختيارك من إعدادات التحليلات في آخر الصفحة.'],
    ['نماذج Tally','نماذج Tally المضمنة ممكن تستخدم تقنيات ضرورية خاصة بالخدمة. فتح النموذج ممكن يوصّل المتصفح بخدمة Tally حتى لو رفضت تحليلات Google.'],
    ['اختياراتك','تقدر ترفض التحليلات وتستخدم الموقع عادي. مسح بيانات المتصفح ممكن يخرجك من حسابك ويمسح اختيارك السابق. آخر تحديث: ٢١ نوفمبر ٢٠٢٦.']
   ]
  },
  terms:{
   title:'شروط استخدام الموقع',intro:'قواعد بسيطة للقراءة والمشاركة في بودي إيتس.',
   body:[
    ['الاستقلال التحريري','بودي إيتس بينشر وصفات ومراجعات وصور وحكايات أصلية. الآراء والأسعار والقوائم قابلة للتغيير. الترشيح مش ضمان للخدمة أو التوافر أو السلامة.'],
    ['حسابك','حافظ على كلمة المرور. حسابات القراء والمساهمين مش مسموح لها تدخل مكتب التحرير. التحرير والنشر للمحررين والمديرين الموثقين فقط. بنراجع التجاوزات وممكن نقيّد الحسابات المسيئة.'],
    ['سلامة الأكل والحساسية','الوصفات والمقترحات معلومات عامة، مش نصيحة طبية أو غذائية شخصية. المكونات ومسببات الحساسية ممكن تختلف. اتأكد منها بنفسك قبل الأكل خصوصًا لو عندك حساسية.'],
    ['الصور والمساهمات','ما تعيدش نشر صور أو محتوى بودي إيتس الأصلي تجاريًا من غير إذن. شارك بس محتوى وصور تملك حق مشاركتها. إرسال اقتراح مش معناه إنه هيتنشر، لأن النشر بعد المراجعة التحريرية.'],
    ['المحتوى مجاني','المحتوى التحريري والنشرة البريدية المجانية مش محتاجين اشتراك مدفوع.'],
    ['التواصل والتحديثات','للأسئلة والبلاغات استخدم <a href="/ar/reader-responses/">نموذج التواصل</a>. ممكن نحدّث الشروط مع تطور المميزات. آخر تحديث: ٢١ نوفمبر ٢٠٢٦.']
   ]
  }
 }
};
const escapeText=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const link=(lang,slug)=>'/'+(lang==='ar'?'ar/':'')+slug+'/';
function buildPage(lang,key){
 const article=pages[lang][key],ar=lang==='ar';
 const base=ar?'/ar/':'/';
 const sections=article.body.map(([title,body])=>'<section><h2>'+escapeText(title)+'</h2><p>'+body+'</p></section>').join('');
 const menu='<nav aria-label="'+(ar?'تصفح الإشعارات':'Policies')+'">'+
 [['privacy',ar?'الخصوصية':'Privacy'],['cookies',ar?'ملفات الارتباط':'Cookies'],['terms',ar?'شروط الاستخدام':'Terms']]
 .map(([slug,title])=>'<a href="'+link(lang,slug)+'">'+title+'</a>').join(' · ')+'</nav>';
 return '<!doctype html><html lang="'+lang+'" dir="'+(ar?'rtl':'ltr')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#72253f">'+
 '<title>'+escapeText(article.title)+' | Boudie Eats</title><meta name="description" content="'+escapeText(article.intro)+'">'+
 '<link rel="canonical" href="'+origin+(ar?'ar/':'')+key+'/"><link rel="alternate" hreflang="'+(ar?'en':'ar')+'" href="'+origin+(ar?'':'ar/')+key+'/">'+
 '<style>@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Fraunces:wght@500;700&family=Aref+Ruqaa:wght@400;700&family=Lalezar&display=swap");*{box-sizing:border-box}body{background:#fffaf2;color:#33232b;font:17px/1.75 "DM Sans",sans-serif;margin:0}html[lang=ar] body{font:21px/1.75 "Lalezar",sans-serif}header{background:#72253f;color:#fffaf2;padding:18px 5vw}header a{color:inherit}main{max-width:860px;margin:0 auto;padding:50px 22px 100px}h1,h2{font-family:"Fraunces",serif;line-height:1.35}html[lang=ar] h1,html[lang=ar] h2{font-family:"Aref Ruqaa",serif}h1{font-size:clamp(36px,5vw,60px)}h2{font-size:26px;margin:0 0 10px}p{max-width:75ch}a{color:#72253f}section{border-top:1px solid #dcc9ce;padding:24px 0}footer{border-top:1px solid #dcc9ce;padding:25px 5vw}footer a{margin-inline:8px}nav a{color:inherit;margin-inline:6px}</style></head><body>'+
 '<header><a href="'+base+'">'+(ar?'بودي إيتس.':'boudieeats.')+'</a></header><main><p>'+escapeText(ar?'معلومات الموقع':'SITE INFORMATION')+'</p><h1>'+escapeText(article.title)+'</h1><p>'+escapeText(article.intro)+'</p>'+sections+
 '<p><a href="'+base+'">'+(ar?'الرجوع للموقع':'Return to Boudie Eats')+'</a></p></main><footer>'+menu+'</footer></body></html>';
}
export function addCompliancePages({directory}){
 for(const lang of ['en','ar']){
  for(const key of Object.keys(pages[lang])){
   const folder=join(directory,...(lang==='ar'?['ar',key]:[key]));
   mkdirSync(folder,{recursive:true});
   writeFileSync(join(folder,'index.html'),buildPage(lang,key));
  }
 }
 const footerLinks=(ar)=>'<nav class="be-legal-links" aria-label="'+(ar?'معلومات قانونية':'Legal information')+'">'+
 [['privacy',ar?'الخصوصية':'Privacy'],['cookies',ar?'الكوكيز':'Cookies'],['terms',ar?'شروط الاستخدام':'Terms']]
 .map(([slug,title])=>'<a href="'+link(ar?'ar':'en',slug)+'">'+title+'</a>').join(' · ')+'</nav>';
 for(const entry of readdirSync(directory,{recursive:true})){
  if(!entry.endsWith('.html')||/^google[a-z0-9]+\.html$/.test(entry))continue;
  const file=join(directory,entry);
  let html=readFileSync(file,'utf8');
  // No public navigation may advertise the restricted staff route.
  if(!/^(ar\/)?editorial-desk\/index\.html$/.test(entry)){
   html=html.replace(/<a\b[^>]*href=["'][^"']*editorial-desk\/?[^"']*["'][^>]*>[\s\S]*?<\/a>/gi,'');
  }
  if(!/^(ar\/)?(?:privacy|cookies|terms)\/index\.html$/.test(entry)){
   const links=footerLinks(entry.startsWith('ar/'));
   if(html.includes('</footer>'))html=html.replace('</footer>',links+'</footer>');
   else if(html.includes('</body>'))html=html.replace('</body>',links+'</body>');
  }
  writeFileSync(file,html);
 }
 const sitemap=join(directory,'sitemap.xml');
 if(existsSync(sitemap)){
  let xml=readFileSync(sitemap,'utf8');
  const extras=['','ar/'].flatMap(prefix=>['privacy','cookies','terms'].map(key=>origin+prefix+key+'/'));
  for(const url of extras){if(!xml.includes(url))xml=xml.replace('</urlset>','<url><loc>'+url+'</loc></url></urlset>');}
  writeFileSync(sitemap,xml);
 }
 // Cloudflare Pages consumes _headers on the branded domain. GitHub Pages
 // does not honor this file and remains a redirect-only mirror.
 const file=join(directory,'_headers');
 const initial=existsSync(file)?readFileSync(file,'utf8').trim()+'\n\n':'';
 const policy='/*\n'+
 '  X-Content-Type-Options: nosniff\n'+
 '  Referrer-Policy: strict-origin-when-cross-origin\n'+
 '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n'+
 '  X-Frame-Options: DENY\n'+
 "  Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'\n"+
 '  Strict-Transport-Security: max-age=31536000\n'+
 '  X-Permitted-Cross-Domain-Policies: none\n';
 if(!initial.includes('X-Content-Type-Options: nosniff'))writeFileSync(file,initial+policy);
}

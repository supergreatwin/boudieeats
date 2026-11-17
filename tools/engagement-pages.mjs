import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Add reader engagement pages to the compiled Astro site.
 * The source archive remains unchanged; these pages are generated at build time.
 * No privileged keys, credentials, or subscriber records are stored in the output.
 */
export function addEngagementPages({ directory, basePath = '/' }) {
  const normalizedBase = '/' + String(basePath).replace(/^\/+|\/+$/g, '');
  const base = normalizedBase === '/' ? '/' : normalizedBase + '/';
  const link = path => base + path;
  const canonical = 'https://boudieeats.pages.dev/';
  const formUrl = id => 'https://tally.so/r/' + id;
  const embed = (id, title) => '<iframe title="' + title + '" src="https://tally.so/embed/' + id +
    '?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" loading="lazy" width="100%" height="500" frameborder="0" marginheight="0" marginwidth="0"></iframe>' +
    '<script src="https://tally.so/widgets/embed.js" defer></script>' +
    '<p class="fallback">لو النموذج ما ظهرش عندك، <a href="' + formUrl(id) + '" rel="noopener noreferrer">افتحه مباشرة من Tally</a>.</p>';

  const footerLinks = '<nav class="be-reader-links" aria-label="روابط المشاركة في BoudieEats">' +
    '<a href="' + link('reader-responses/') + '">شاركنا تجربتك أو اقتراحك</a>' +
    '<a href="' + link('newsletter-signup/') + '">نشرة BoudieEats</a></nav>';
  const footerStyle = '<style>.be-reader-links{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center;direction:rtl;padding:18px 12px;font-family:Lalezar,Tahoma,sans-serif;font-size:1.05rem}.be-reader-links a{color:inherit;text-decoration:underline;text-underline-offset:4px}</style>';

  // Insert links in existing compiled pages, without replacing their designs or content.
  for (const entry of readdirSync(directory, { recursive: true })) {
    if (!entry.endsWith('.html')) continue;
    const path = join(directory, entry);
    let html = readFileSync(path, 'utf8');
    if (html.includes('class="be-reader-links"') || !/<\/body>/i.test(html)) continue;
    html = html.replace(/<\/head>/i, footerStyle + '</head>');
    if (/<\/footer>/i.test(html)) html = html.replace(/<\/footer>/i, footerLinks + '</footer>');
    else html = html.replace(/<\/body>/i, footerLinks + '</body>');
    writeFileSync(path, html);
  }

  const css = '<style>' +
    '@import url("https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Lalezar&display=swap");' +
    ':root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#fffcf6;color:#222;font:20px/1.7 Lalezar,Tahoma,sans-serif}a{color:#a43d16}header,main,footer{max-width:960px;margin:0 auto;padding:18px 24px}header{border-bottom:1px solid #ecdcd0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}header a{text-decoration:none}main{padding-top:34px;padding-bottom:60px}h1,h2{font-family:"Aref Ruqaa",serif;line-height:1.5}h1{font-size:clamp(2.1rem,5vw,3.4rem);margin:0 0 12px}h2{font-size:1.65rem}p{max-width:760px}iframe{display:block;width:100%;border:0;min-height:550px;background:transparent;margin-top:20px}.kicker{color:#9e451f;font-size:.95rem}.muted{color:#555}.panel{border:1px solid #ecdcd0;background:#fff;border-radius:20px;padding:22px;margin:18px 0}.actions{display:flex;flex-wrap:wrap;gap:14px}.actions a{display:inline-block;border-radius:12px;padding:9px 14px;background:#f0642b;color:white;text-decoration:none}.fallback{font-size:.95rem}footer{border-top:1px solid #ecdcd0;font-size:.9rem}.desk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}.desk-grid a{display:block}.desk-grid .panel{margin:0}a:focus-visible{outline:3px solid #f0642b;outline-offset:3px}@media(max-width:580px){header,main,footer{padding:18px}body{font-size:18px}}</style>';

  function page({ slug, title, intro, content, noindex = false }) {
    const dir = join(directory, slug);
    mkdirSync(dir, { recursive: true });
    const html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + title + ' | BoudieEats</title><meta name="description" content="' + intro + '">' +
      '<link rel="canonical" href="' + canonical + slug + '/">' +
      (noindex ? '<meta name="robots" content="noindex,nofollow">' : '') +
      css + '</head><body><header><a href="' + link('') + '"><b>BoudieEats — أكّيل</b></a><a href="' + link('') + '">الصفحة الرئيسية</a></header>' +
      '<main><p class="kicker">BoudieEats · بودي إيتس</p><h1>' + title + '</h1><p class="muted">' + intro + '</p>' + content + '</main>' +
      '<footer><a href="' + link('reader-responses/') + '">ارسل لنا رأيك</a> · <a href="' + link('newsletter-signup/') + '">النشرة البريدية</a> · <a href="' + link('') + '">الموقع</a></footer></body></html>';
    writeFileSync(join(dir, 'index.html'), html);
  }

  page({
    slug: 'reader-responses', title: 'شاركنا تجربتك',
    intro: 'من هنا تقدر تبعت ترشيحات المطاعم والكافيهات، اقتراحات الوصفات، تجارب السوبرماركت، وملاحظاتك على المقالات.',
    content: '<div class="panel"><h2>رأيك مهم</h2><p>تقدر تسيب اسمك وإيميلك أو تبعت من غير بيانات تواصل. لو سمحت باقتباس تجربتك، هنراجعها ونتواصل معاك قبل النشر.</p>' +
      embed('kbG7Lo', 'BoudieEats reader responses') + '</div>'
  });

  page({
    slug: 'newsletter-signup', title: 'نشرة BoudieEats',
    intro: 'وصفات، ريڤيوهات، ومقارنات منتجات — هتوصلك في نشرة BoudieEats لما نطلقها.',
    content: '<div class="panel"><h2>سجّل اهتمامك</h2><p>دي قائمة انتظار قبل إطلاق النشرة، وليست اشتراكًا فعالًا أو تأكيدًا بوصول رسائل حالياً. عند الإطلاق هنتواصل معاك، ومش هنضيفك لنشرة تانية.</p>' +
      embed('vXDORl', 'BoudieEats newsletter interest list') + '</div>'
  });

  page({
    slug: 'editorial-desk', title: 'غرفة تحرير BoudieEats',
    intro: 'بوابة عمل تحريرية لإدارة الأفكار والمسودات والمراجعات والنشر. الحسابات والأذونات تدار من GitHub وTally، وليست من هذه الصفحة.',
    noindex: true,
    content: '<div class="panel"><h2>مسار النشر</h2><p>فكرة ← مسودة ← مراجعة تحريرية ← موافقة عبر Pull Request ← نشر تلقائي من الفرع main.</p><p>البوابة دي مش لوحة إدارة محمية في حد ذاتها؛ فتح المحتوى الخاص والتعديل عليه يتطلب تسجيل الدخول والأذونات في كل خدمة.</p></div>' +
      '<div class="desk-grid">' +
      '<div class="panel"><h2>الأفكار والتكليفات</h2><a href="https://github.com/supergreatwin/boudieeats/issues/new/choose">افتح تكليفًا جديدًا</a><a href="https://github.com/supergreatwin/boudieeats/issues">تابع المهام</a></div>' +
      '<div class="panel"><h2>المراجعة والنشر</h2><a href="https://github.com/supergreatwin/boudieeats/pulls">راجع المسودات وطلبات الدمج</a><a href="https://github.com/supergreatwin/boudieeats/actions/workflows/pages.yml">حالة النشر</a></div>' +
      '<div class="panel"><h2>الردود والاقتراحات</h2><a href="https://tally.so/forms">لوحة نماذج Tally (تسجيل دخول مطلوب)</a><a href="' + formUrl('kbG7Lo') + '">جرّب نموذج الردود</a></div>' +
      '<div class="panel"><h2>النشرة البريدية</h2><a href="' + formUrl('vXDORl') + '">جرّب قائمة الاهتمام</a><a href="https://github.com/supergreatwin/boudieeats/tree/main/editorial/newsletter">مسودات الأعداد</a><p>Beehiiv: نشرة BoudieEats المنفصلة لم تُنشأ بعد.</p></div></div>' +
      '<p class="muted">بيانات القراء محفوظة داخل Tally وليست معروضة في صفحة عامة. لا تضع مفاتيح GitHub أو Supabase هنا.</p>'
  });

  // Include public reader pages in the canonical Cloudflare sitemap. Admin gateway is private to search engines.
  const sitemapFile = join(directory, 'sitemap.xml');
  const sitemap = readFileSync(sitemapFile, 'utf8');
  if (!sitemap.includes(canonical + 'reader-responses/')) {
    const urls = ['reader-responses/', 'newsletter-signup/']
      .map(slug => '<url><loc>' + canonical + slug + '</loc></url>').join('');
    if (!sitemap.includes('</urlset>')) throw new Error('Expected an XML sitemap closing tag');
    writeFileSync(sitemapFile, sitemap.replace('</urlset>', urls + '</urlset>'));
  }
}

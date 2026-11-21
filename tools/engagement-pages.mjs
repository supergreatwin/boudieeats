import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function addEngagementPages({ directory, basePath = '/' }) {
  const normalized = '/' + String(basePath).replace(/^\/+|\/+$/g, '');
  const base = normalized === '/' ? '/' : normalized + '/';
  const link = slug => base + slug;
  const origin = 'https://boudieeats.com/';
  const feedback = 'https://tally.so/r/kbG7Lo';
  const waitlist = 'https://tally.so/r/vXDORl';
  const menu = '<nav class="be-reader-links" aria-label="Reader participation">' +
    '<a href="' + link('reader-responses/') + '">Send feedback</a>' +
    '<a href="' + link('newsletter-signup/') + '">Newsletter</a>' +
    '<a href="' + link('account/') + '">Editorial desk</a></nav>';
  const menuCss = '<style>.be-reader-links{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;align-items:center;padding:20px;font:600 15px/1.5 "DM Sans",sans-serif}.be-reader-links a{color:inherit;text-decoration:underline;text-underline-offset:4px}</style>';

  for (const entry of readdirSync(directory, { recursive: true })) {
    if (!entry.endsWith('.html')) continue;
    const path = join(directory, entry);
    let html = readFileSync(path, 'utf8');
    if (html.includes('class="be-reader-links"') || !html.includes('</body>')) continue;
    html = html.replace('</head>', menuCss + '</head>');
    if (html.includes('</footer>')) html = html.replace('</footer>', menu + '</footer>');
    else html = html.replace('</body>', menu + '</body>');
    writeFileSync(path, html);
  }

  const styles = '<style>@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@500;600;700&display=swap");' +
    '*{box-sizing:border-box}body{margin:0;background:#fffaf2;color:#33232b;font:17px/1.7 "DM Sans",sans-serif}a{color:#8f3152}' +
    'header,main,footer{max-width:980px;margin:auto;padding:20px 26px}header{border-bottom:1px solid #ecdfe0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}header a{text-decoration:none}' +
    'h1,h2{font-family:"Fraunces",serif;line-height:1.3}h1{font-size:clamp(2.25rem,5vw,3.75rem);margin:10px 0 14px}h2{font-size:1.6rem}main{padding-top:32px;padding-bottom:70px}p{max-width:800px}' +
    '.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:.78rem;font-weight:700;color:#8f3152}.muted{color:#685961}.panel{border:1px solid #ecdfe0;background:#fff;border-radius:18px;padding:22px;margin:18px 0}' +
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.grid .panel{margin:0}.grid a{display:block;margin:8px 0}.button{display:inline-block;background:#8f3152;color:#fff;text-decoration:none;border-radius:11px;padding:10px 16px}' +
    'iframe{display:block;border:none;width:100%;min-height:600px;margin-top:14px}.fallback{font-size:.95rem}footer{border-top:1px solid #ecdfe0;color:#685961;font-size:.9rem}a:focus-visible{outline:3px solid #8f3152;outline-offset:4px}@media(max-width:580px){header,main,footer{padding:18px}body{font-size:16px}}</style>';

  function embed(id, label) {
    return '<iframe title="' + label + '" src="https://tally.so/embed/' + id + '?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" loading="lazy" width="100%" height="600" frameborder="0"></iframe>' +
      '<script defer src="https://tally.so/widgets/embed.js"></script>' +
      '<p class="fallback">Trouble loading? <a href="https://tally.so/r/' + id + '" rel="noopener noreferrer">Open the form directly</a>.</p>';
  }
  function page({ slug, title, description, content, noindex = false }) {
    const folder = join(directory,slug);
    mkdirSync(folder,{recursive:true});
    const head = '<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + title + ' | BoudieEats</title><meta name="description" content="' + description.replaceAll('"','&quot;') + '">' +
      '<link rel="canonical" href="' + origin + slug + '/">' + (noindex?'<meta name="robots" content="noindex,nofollow">':'') + styles + '</head>';
    const html = head + '<body><header><a href="' + link('') + '"><strong>BoudieEats.</strong></a><nav><a href="' + link('recipes/') + '">Recipes</a> · <a href="' + link('reviews/') + '">Reviews</a> · <a href="' + link('') + '">Home</a></nav></header>' +
      '<main><div class="eyebrow">An Egyptian food journal</div><h1>' + title + '</h1><p class="muted">' + description + '</p>' + content + '</main>' +
      '<footer><a href="' + link('reader-responses/') + '">Feedback</a> · <a href="' + link('newsletter-signup/') + '">Newsletter</a> · <a href="' + link('account/') + '">Editorial desk</a></footer></body></html>';
    writeFileSync(join(folder,'index.html'),html);
  }

  page({
    slug:'reader-responses', title:'Share your experience',
    description:'Recommend a restaurant, suggest a recipe, comment on a review, or tell us what you would like BoudieEats to cover.',
    content:'<div class="panel"><h2>Your opinion matters</h2><p>Share your thoughts with or without a name. You may choose a public display username, but it does not create an account. We will never publish your contribution without permission.</p>' + embed('kbG7Lo','Reader feedback form') + '</div>'
  });
  page({
    slug:'newsletter-signup', title:'The Boudie Letter',
    description:'Original recipes, restaurant reviews, and food stories from Egypt — delivered when the newsletter launches.',
    content:'<div class="panel"><h2>Join the launch list</h2><p>This is the free Boudie Eats newsletter and launch signup. Subscribing to emails is optional, separate from other submissions, and requires your explicit choice and email confirmation. Read our Privacy Notice before signing up.</p>' +
      embed('vXDORl','BoudieEats newsletter launch list') + '</div>'
  });

  // Editorial routes are rendered ONLY by account-pages.mjs with Supabase Auth.
  // Do not publish a GitHub-based public alternate desk or any staff-only links.

  const sitemapFile=join(directory,'sitemap.xml');
  const sitemap=readFileSync(sitemapFile,'utf8');
  if (!sitemap.includes(origin+'reader-responses/')){
    if (!sitemap.includes('</urlset>')) throw new Error('Sitemap has no closing urlset tag');
    writeFileSync(sitemapFile,sitemap.replace('</urlset>',['reader-responses/','newsletter-signup/'].map(s=>'<url><loc>'+origin+s+'</loc></url>').join('')+'</urlset>'));
  }
}

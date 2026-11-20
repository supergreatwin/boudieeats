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
    '<a href="' + link('editorial-desk/') + '">Editorial desk</a></nav>';
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
      '<footer><a href="' + link('reader-responses/') + '">Feedback</a> · <a href="' + link('newsletter-signup/') + '">Newsletter</a> · <a href="' + link('editorial-desk/') + '">Editorial desk</a></footer></body></html>';
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
    content:'<div class="panel"><h2>Join the launch list</h2><p>We are collecting launch interest, not issuing active email subscriptions yet. A dedicated BoudieEats Beehiiv publication is required before newsletter deliveries can start. Your email will not be added to any other publication.</p>' +
      embed('vXDORl','BoudieEats newsletter launch list') + '</div>'
  });
  page({
    slug:'editorial-desk',title:'Editorial desk',
    description:'Manage BoudieEats ideas, drafts, reviews, and publishing. Editor permissions and authentication are handled by GitHub.',
    noindex:true,
    content:'<div class="panel"><h2>Editor sign-in</h2><p>Editorial access uses <strong>GitHub usernames and repository permissions</strong>. The authenticated repository owner is <strong>@supergreatwin</strong>. A username displayed here is not proof of authorization; GitHub enforces access when you open the links below.</p><a class="button" href="https://github.com/login">Sign in to GitHub</a></div>' +
      '<div class="grid"><section class="panel"><h2>Pitch board</h2><a href="https://github.com/supergreatwin/boudieeats/issues/new/choose">Create an assignment</a><a href="https://github.com/supergreatwin/boudieeats/issues">Browse assignments</a></section>' +
      '<section class="panel"><h2>Review & publish</h2><a href="https://github.com/supergreatwin/boudieeats/pulls">Review pull requests</a><a href="https://github.com/supergreatwin/boudieeats/actions/workflows/pages.yml">Check deploy status</a></section>' +
      '<section class="panel"><h2>Reader inbox</h2><a href="https://tally.so/forms">Open Tally dashboard (login required)</a><a href="' + feedback + '">View feedback form</a></section>' +
      '<section class="panel"><h2>Site analytics</h2><a href="https://analytics.google.com/analytics/web/" target="_blank" rel="noopener noreferrer">Open Google Analytics (authorized editors)</a><p>Visitor reports are private and require the connected Google account. Consent is required for tracking.</p></section><section class="panel"><h2>Newsletter</h2><a href="' + waitlist + '">Launch interest form</a><a href="https://github.com/supergreatwin/boudieeats/tree/main/editorial/newsletter">Newsletter drafts</a><p>Beehiiv sending is not connected to BoudieEats yet.</p></section></div>' +
      '<p class="muted">Workflow: idea → draft → editorial review → approved pull request → deployment. No passwords, API keys, or private reader submissions are stored on this public page.</p>'
  });

  const sitemapFile=join(directory,'sitemap.xml');
  const sitemap=readFileSync(sitemapFile,'utf8');
  if (!sitemap.includes(origin+'reader-responses/')){
    if (!sitemap.includes('</urlset>')) throw new Error('Sitemap has no closing urlset tag');
    writeFileSync(sitemapFile,sitemap.replace('</urlset>',['reader-responses/','newsletter-signup/'].map(s=>'<url><loc>'+origin+s+'</loc></url>').join('')+'</urlset>'));
  }
}

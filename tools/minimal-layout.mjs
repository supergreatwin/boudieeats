import { readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Final HTML pass for the owner's minimalist bilingual layout. Deliberately
// leaves the newsletter dialog, member auth, protected routes and content DB intact.
function escapeHtml(value) {
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function pageClass(html, value) {
  return html.replace(/<html\b([^>]*)>/i, (all, attrs) =>
    '<html' + attrs + ' data-be-layout="' + value + '">');
}
function homepage(html, base, ar) {
  const path = base + (ar ? 'ar/' : '');
  const welcome = ar ? {
    kicker: 'رسالة صغيرة من بودي',
    heading: 'أهلًا بيك في بودي إيتس',
    copy: 'وصفات نجربها، أماكن نكتشفها، وحكايات أكل تستاهل تتحكي.',
    recipes: 'شوف الوصفات',
    reviews: 'اقرأ التجارب'
  } : {
    kicker: 'A little note from Boudie',
    heading: 'Welcome to Boudie Eats',
    copy: 'Food worth making, places worth trying, and stories worth sharing.',
    recipes: 'Browse recipes',
    reviews: 'Read reviews'
  };
  const featured = [
    ['vermicelli-oven.webp','recipes/shaareya-bel-laban/',
      ar ? 'شعرية باللبن' : 'Vermicelli milk pudding'],
    ['chocolate-brownies.webp','recipes/chocolate-brownies/',
      ar ? 'براونيز بالشوكولاتة' : 'Chocolate brownies']
  ].map(([img,slug,title]) =>
    '<a class="be-feature-card" href="' + path + slug + '">' +
      '<img loading="lazy" decoding="async" src="' + path + 'media/' + img + '" alt="">' +
      '<h3>' + escapeHtml(title) + '</h3></a>').join('');
  const intro = '<div class="be-minimal-home">' +
    '<section class="be-home-welcome" aria-labelledby="be-welcome-title">' +
    '<div class="be-welcome-inner">' +
    '<p class="be-welcome-kicker">' + escapeHtml(welcome.kicker) + '</p>' +
    '<h1 id="be-welcome-title">' + escapeHtml(welcome.heading) +
    '<span class="be-welcome-dot" aria-hidden="true">.</span></h1>' +
    '<p class="be-welcome-copy">' + escapeHtml(welcome.copy) + '</p>' +
    '<div class="be-welcome-actions">' +
    '<a class="be-welcome-primary" href="' + path + 'recipes/">' +
    escapeHtml(welcome.recipes) + '</a>' +
    '<a class="be-welcome-secondary" href="' + path + 'reviews/">' +
    escapeHtml(welcome.reviews) + '</a></div></div></section>' +
    '<section class="be-featured-recipes" aria-labelledby="be-featured-title">' +
    '<h2 id="be-featured-title">' + (ar ? 'وصفتين مختارتين' : 'Two featured recipes') +
    '</h2><div class="be-feature-grid">' + featured + '</div></section>' +
    '<section class="be-home-newsletter" aria-labelledby="be-news-title">' +
    '<div><h2 id="be-news-title">' + (ar ? 'جواب من بودي' : 'The Boudie Letter') +
    '</h2><p>' + (ar ? 'وصفات وتجارب أكل وحكايات، في جواب يوصلّك.' :
    'Recipes, food notes and stories, delivered as a letter.') + '</p></div>' +
    '<button type="button" data-be-letter-open>' +
    (ar ? 'اشترك في الجواب' : 'Join the letter') + '</button></section>' +
    // Retain the authenticated Discover deep link required by account routing
    // without displaying another homepage section.
    '<p class="be-discover-teaser" hidden aria-hidden="true">' +
    '<span>' + (ar ? 'اكتشف تجارب بودي إيتس' : 'Discover Boudie Eats') + '</span>' +
    '<a href="' + path + 'account/?next=' +
    encodeURIComponent('/' + (ar ? 'ar/' : '') + 'discover/') + '">' +
    (ar ? 'اكتشف تجارب بودي إيتس' : 'Discover Boudie Eats') + '</a></p>' +
    '</div>';
  if (!/<main\b[^>]*>[\s\S]*?<\/main>/i.test(html)) {
    throw new Error('Missing main markup on Boudie Eats homepage');
  }
  html = html.replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/i, '$1' + intro + '$2');
  if (!html.includes('be-letter-dialog') || !html.includes('data-be-letter-open')) {
    throw new Error('Newsletter popup was lost during homepage reduction');
  }
  return pageClass(html, 'minimal-home');
}

function recipes(html, ar) {
  const data = {
    'shaareya-bel-laban': ['25', 'beginner', 'medium'],
    'seared-steak': ['25', 'intermediate', 'high'],
    'pasta-with-sauce': ['30', 'beginner', 'low'],
    'iced-milk-coffee': ['5', 'beginner', 'low'],
    'chocolate-brownies': ['45', 'beginner', 'medium'],
    'skillet-chocolate-cookie': ['30', 'beginner', 'medium']
  };
  const labels = ar ? {
    time: 'الوقت التقريبي', skill: 'المهارة', focus: 'التركيز',
    beginner: 'مبتدئ', intermediate: 'متوسط', low: 'بسيط', medium: 'متوسط', high: 'عالي'
  } : {
    time: 'Estimated time', skill: 'Skill', focus: 'Focus',
    beginner: 'Beginner', intermediate: 'Intermediate', low: 'Low', medium: 'Medium', high: 'High'
  };
  let count = 0;
  html = html.replace(/<article\b[^>]*class="[^"]*\bentry-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
    block => {
      if (!/<h3\b[^>]*>[\s\S]*?<\/h3>/i.test(block)) return block;
      const key = Object.keys(data).find(k => block.includes(k));
      if (!key) return block;
      const [time,skill,focus] = data[key];
      const items = [[labels.time, time + (ar ? ' دقيقة' : ' min')], 
        [labels.skill, labels[skill]], [labels.focus, labels[focus]]];
      const facts = '<dl class="be-recipe-facts">' +
        items.map(([label,value])=>'<div><dt>' + label + '</dt><dd>' + value + '</dd></div>').join('') +
        '</dl>';
      count++;
      return block.replace(/<\/h3>/i, '</h3>' + facts);
    });
  if (count < 5) throw new Error('Found only ' + count + ' recipe cards; required five-column recipe index');
  return pageClass(html, 'recipe-index');
}

function getSection(html, term) {
  const at = html.indexOf(term);
  if (at < 0) return null;
  const stack = [], found = [];
  const tags = /<\/?section\b[^>]*>/gi;
  let m;
  while ((m = tags.exec(html))) {
    const closing = /^<\//.test(m[0]);
    if (!closing) {
      stack.push({start:m.index});
    } else {
      const el=stack.pop();
      if (el && el.start <= at && m.index >= at) found.push({start:el.start,end:tags.lastIndex});
    }
  }
  found.sort((a,b)=>(a.end-a.start)-(b.end-b.start));
  return found[0] || null;
}
// Review sidebar is moved after DOM parsing (no brittle source-HTML matching).
function reviews(html, ar) {
 return pageClass(html, 'reviews-index');
}
function about(html) {
  return pageClass(html, 'about-page');
}

export function applyBoudieMinimalLayout({directory,basePath='/'}) {
  const base=basePath.endsWith('/')?basePath:basePath+'/';
  copyFileSync(new URL('./minimal-layout.css',import.meta.url),join(directory,'be-minimal.css'));
  copyFileSync(new URL('./minimal-interactions.js',import.meta.url),join(directory,'be-minimal-interactions.js'));

  let touched=0;
  for (const entry of readdirSync(directory,{recursive:true})) {
    if (!entry.endsWith('.html') || /^google[a-z0-9]+\.html$/i.test(entry)) continue;
    const path=join(directory,entry);
    let html=readFileSync(path,'utf8');
    if (!html.includes('</head>')) continue;
    const ar=entry.startsWith('ar/');
    const route=ar?entry.slice(3):entry;
    if (route==='index.html') html=homepage(html,base,ar);
    if (route==='recipes/index.html') html=recipes(html,ar);
    if (route==='reviews/index.html') html=reviews(html,ar);
    if (route==='about/index.html') html=about(html);
    html=html.replace('</head>','<link rel="stylesheet" href="' + base + 'be-minimal.css">'+
      '<script defer src="' + base + 'be-minimal-interactions.js"></script></head>');
    writeFileSync(path,html);
    touched++;
  }
  console.log('Applied minimal bilingual Boudie Eats presentation to ' + touched + ' pages.');
}

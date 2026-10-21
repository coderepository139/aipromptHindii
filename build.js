// AI Prompt Hindi static site builder — zero dependencies.
// Usage: node build.js   → writes the full site to ./dist
const fs = require("fs");
const path = require("path");
const cfg = require("./site.config.js");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");
const CONTENT = path.join(ROOT, "content");
const STATIC = path.join(ROOT, "static");

// ---------- helpers ----------
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = (p) => cfg.url.replace(/\/$/, "") + p;
const catBySlug = Object.fromEntries(cfg.categories.map((c) => [c.slug, c]));
const today = new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d + "T00:00:00+05:30").toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, "-").replace(/(^-|-$)/g, "");
const write = (rel, data) => {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, data);
};
const words = (a) => JSON.stringify(a).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

fs.rmSync(OUT, { recursive: true, force: true });

// ---------- load content ----------
const posts = fs
  .readdirSync(CONTENT)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const p = JSON.parse(fs.readFileSync(path.join(CONTENT, f), "utf8"));
    if (!p.slug) throw new Error(`${f}: missing slug`);
    if (!catBySlug[p.category]) throw new Error(`${f}: unknown category ${p.category}`);
    if (p.draft) return null;
    if (p.date > today) return null; // scheduled for the future
    p.updated = p.updated || p.date;
    p.url = `/${p.slug}/`;
    p.readMin = Math.max(2, Math.round(words(p.blocks) / 180));
    p.promptCount = p.blocks.filter((b) => b.type === "prompt").length;
    return p;
  })
  .filter(Boolean)
  .sort((a, b) => (b.updated + b.date).localeCompare(a.updated + a.date));

// ---------- CSS (inlined for zero render-blocking requests) ----------
const CSS = fs.readFileSync(path.join(ROOT, "theme.css"), "utf8").replace(/\s*\n\s*/g, "\n");

// ---------- JS (tiny: copy buttons, theme toggle, search) ----------
const JS = `
(function(){
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-copy]');if(!b)return;
    var t=document.getElementById(b.getAttribute('data-copy')).innerText;
    var done=function(){var o=b.innerHTML;b.classList.add('ok');b.innerHTML='✓ कॉपी हो गया';setTimeout(function(){b.classList.remove('ok');b.innerHTML=o},1800)};
    if(navigator.clipboard){navigator.clipboard.writeText(t).then(done,function(){fallback(t);done()})}else{fallback(t);done()}
    try{if(window.gtag)gtag('event','copy_prompt',{prompt_id:b.getAttribute('data-copy')})}catch(_){}
  });
  function fallback(t){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(_){}a.remove()}
  var tg=document.getElementById('theme');if(tg)tg.addEventListener('click',function(){
    var r=document.documentElement,n=r.getAttribute('data-theme')==='dark'?'light':(r.getAttribute('data-theme')==='light'?'dark':(matchMedia('(prefers-color-scheme: dark)').matches?'light':'dark'));
    r.setAttribute('data-theme',n);try{localStorage.setItem('aph-theme',n)}catch(_){}
  });
  var q=document.getElementById('q');if(q){var items=[].slice.call(document.querySelectorAll('[data-search]'));
    q.addEventListener('input',function(){var v=q.value.trim().toLowerCase();items.forEach(function(i){i.style.display=!v||i.getAttribute('data-search').indexOf(v)>-1?'':'none'})})}
})();`.trim();

const themeBoot = `try{var t=localStorage.getItem('aph-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

// ---------- layout ----------
function layout({ title, description, canonical, body, schema = [], ogType = "website", keywords = "", noindex = false, published, modified }) {
  const ga = cfg.ga4
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${cfg.ga4}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${cfg.ga4}');</script>`
    : "";
  const nav = cfg.categories.map((c) => `<a href="/category/${c.slug}/">${c.short}</a>`).join("");
  return `<!doctype html>
<html lang="${cfg.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ""}
<link rel="canonical" href="${abs(canonical)}">
<meta name="robots" content="${noindex ? "noindex,follow" : "index,follow,max-image-preview:large,max-snippet:-1"}">
<link rel="alternate" hreflang="hi-IN" href="${abs(canonical)}">
<link rel="alternate" hreflang="x-default" href="${abs(canonical)}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${cfg.name}">
<meta property="og:locale" content="${cfg.locale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${abs(canonical)}">
<meta property="og:image" content="${abs("/og.png")}">
${published ? `<meta property="article:published_time" content="${published}T08:00:00+05:30"><meta property="article:modified_time" content="${modified}T08:00:00+05:30">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#E8590C">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${cfg.name}" href="${abs("/rss.xml")}">
${cfg.gscVerification ? `<meta name="google-site-verification" content="${cfg.gscVerification}">` : ""}
<script>${themeBoot}</script>
<style>${CSS}</style>
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n")}
${ga}
</head>
<body>
<a class="skip" href="#main">मुख्य सामग्री पर जाएं</a>
<header class="top">
  <div class="wrap top-in">
    <a class="logo" href="/" aria-label="${cfg.name} होम"><span class="mark" aria-hidden="true">AI</span><span>Prompt<b>Hindi</b></span></a>
    <nav class="nav" aria-label="कैटेगरी">${nav}</nav>
    <button id="theme" class="icon-btn" aria-label="डार्क / लाइट मोड"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>
  </div>
</header>
<main id="main">${body}</main>
<footer class="foot">
  <div class="wrap foot-in">
    <div>
      <a class="logo" href="/"><span class="mark" aria-hidden="true">AI</span><span>Prompt<b>Hindi</b></span></a>
      <p>${cfg.tagline}. हर प्रॉम्प्ट कॉपी-पेस्ट के लिए तैयार।</p>
    </div>
    <div class="foot-links">
      <a href="/about/">हमारे बारे में</a><a href="/contact/">संपर्क</a><a href="/privacy-policy/">प्राइवेसी पॉलिसी</a><a href="/disclaimer/">डिस्क्लेमर</a><a href="/sitemap.xml">साइटमैप</a>
    </div>
  </div>
  <div class="wrap small">© ${new Date().getFullYear()} ${cfg.name}. Gemini, ChatGPT और दूसरे नाम उनके मालिकों के ट्रेडमार्क हैं; हम उनसे जुड़े नहीं हैं।</div>
</footer>
<script>${JS}</script>
</body>
</html>`;
}

// ---------- shared schema ----------
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": abs("/#org"),
  name: cfg.name,
  alternateName: cfg.nameHi,
  url: abs("/"),
  logo: abs("/favicon.svg"),
  ...(cfg.email ? { email: cfg.email } : {})
};
const siteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": abs("/#website"),
  name: cfg.name,
  alternateName: cfg.nameHi,
  url: abs("/"),
  inLanguage: cfg.lang,
  publisher: { "@id": abs("/#org") }
};
const crumbs = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(url) }))
});

// ---------- block renderer ----------
function renderBlocks(p) {
  let n = 0;
  const toc = [];
  const html = p.blocks
    .map((b) => {
      switch (b.type) {
        case "p":
          return `<p>${b.html}</p>`;
        case "h2": {
          const id = b.id || slugify(b.text);
          toc.push([id, b.text]);
          return `<h2 id="${id}">${esc(b.text)}</h2>`;
        }
        case "h3":
          return `<h3 id="${b.id || slugify(b.text)}">${esc(b.text)}</h3>`;
        case "ul":
          return `<ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
        case "ol":
          return `<ol>${b.items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
        case "note":
          return `<aside class="note${b.tone ? " " + b.tone : ""}">${b.title ? `<strong>${esc(b.title)}</strong>` : ""}<p>${b.html}</p></aside>`;
        case "table":
          return `<div class="tbl"><table><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${b.rows
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
            .join("")}</tbody></table></div>`;
        case "prompt": {
          n++;
          const id = `p${n}`;
          return `<article class="prompt" id="prompt-${n}">
  <div class="prompt-head"><span class="num">#${n}</span><h3>${esc(b.title)}</h3>${b.for ? `<span class="tag">${esc(b.for)}</span>` : ""}</div>
  <pre id="${id}" class="prompt-text">${esc(b.text)}</pre>
  <div class="prompt-foot">
    <button class="copy" data-copy="${id}" aria-label="${esc(b.title)} प्रॉम्प्ट कॉपी करें"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg> प्रॉम्प्ट कॉपी करें</button>
    ${b.tip ? `<p class="tip"><b>टिप:</b> ${b.tip}</p>` : ""}
  </div>
</article>`;
        }
        default:
          throw new Error(`${p.slug}: unknown block type ${b.type}`);
      }
    })
    .join("\n");
  return { html, toc };
}

function card(p) {
  const c = catBySlug[p.category];
  return `<a class="card" href="${p.url}" data-search="${esc((p.title + " " + (p.keywords || "")).toLowerCase())}">
  <span class="card-cat">${c.short}</span>
  <h3>${esc(p.title)}</h3>
  <p>${esc(p.description)}</p>
  <span class="card-meta">${p.promptCount ? `${p.promptCount} प्रॉम्प्ट्स · ` : ""}${p.readMin} मिनट · ${fmtDate(p.updated)}</span>
</a>`;
}

// ---------- article pages ----------
for (const p of posts) {
  const c = catBySlug[p.category];
  const { html, toc } = renderBlocks(p);
  const related = (p.related || [])
    .map((s) => posts.find((x) => x.slug === s))
    .filter(Boolean)
    .concat(posts.filter((x) => x.category === p.category && x.slug !== p.slug))
    .filter((x, i, a) => x.slug !== p.slug && a.findIndex((y) => y.slug === x.slug) === i)
    .slice(0, 4);

  const faqHtml = p.faq && p.faq.length
    ? `<section class="faq"><h2 id="faq">अक्सर पूछे जाने वाले सवाल (FAQ)</h2>${p.faq
        .map((f) => `<details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`)
        .join("")}</section>`
    : "";
  if (faqHtml) toc.push(["faq", "FAQ"]);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      inLanguage: cfg.lang,
      datePublished: p.date + "T08:00:00+05:30",
      dateModified: p.updated + "T08:00:00+05:30",
      mainEntityOfPage: abs(p.url),
      image: abs("/og.png"),
      author: { "@type": "Organization", name: cfg.author, url: abs("/about/") },
      publisher: { "@id": abs("/#org") },
      keywords: p.keywords || "",
      articleSection: c.name,
      wordCount: words(p.blocks)
    },
    crumbs([["होम", "/"], [c.name, `/category/${c.slug}/`], [p.title, p.url]]),
    orgSchema
  ];
  if (p.faq && p.faq.length)
    schema.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a.replace(/<[^>]+>/g, "") } }))
    });

  const body = `
<div class="wrap article-wrap">
  <nav class="crumbs" aria-label="ब्रेडक्रंब"><a href="/">होम</a> › <a href="/category/${c.slug}/">${c.name}</a></nav>
  <article class="post">
    <header class="post-head">
      <span class="pill">${c.name}</span>
      <h1>${esc(p.title)}</h1>
      <p class="lede">${p.intro || esc(p.description)}</p>
      <div class="byline">${cfg.author} · अपडेट: <time datetime="${p.updated}">${fmtDate(p.updated)}</time> · ${p.readMin} मिनट पढ़ें${p.promptCount ? ` · <b>${p.promptCount} प्रॉम्प्ट्स</b>` : ""}</div>
    </header>
    ${toc.length > 2 ? `<details class="toc" open><summary>इस पेज में</summary><ol>${toc.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join("")}</ol></details>` : ""}
    <div class="prose">${html}</div>
    ${faqHtml}
  </article>
  ${related.length ? `<section class="related"><h2>ये भी पढ़ें</h2><div class="grid">${related.map(card).join("")}</div></section>` : ""}
</div>`;

  write(
    `${p.slug}/index.html`,
    layout({ title: p.seoTitle || p.title, description: p.description, canonical: p.url, body, schema, ogType: "article", keywords: p.keywords, published: p.date, modified: p.updated })
  );
}

// ---------- category pages ----------
for (const c of cfg.categories) {
  const list = posts.filter((p) => p.category === c.slug);
  const body = `
<div class="wrap">
  <nav class="crumbs"><a href="/">होम</a> › ${c.name}</nav>
  <header class="cat-head"><h1>${c.name}</h1><p>${c.desc}</p></header>
  ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<p class="empty">इस कैटेगरी में नए आर्टिकल जल्द आ रहे हैं।</p>`}
</div>`;
  write(
    `category/${c.slug}/index.html`,
    layout({
      title: `${c.name} (हिंदी गाइड) | ${cfg.name}`,
      description: c.desc,
      canonical: `/category/${c.slug}/`,
      body,
      noindex: list.length === 0,
      schema: [crumbs([["होम", "/"], [c.name, `/category/${c.slug}/`]]), { "@context": "https://schema.org", "@type": "CollectionPage", name: c.name, description: c.desc, url: abs(`/category/${c.slug}/`), inLanguage: cfg.lang }]
    })
  );
}

// ---------- home ----------
{
  const featured = posts.filter((p) => p.featured).slice(0, 3);
  const totalPrompts = posts.reduce((s, p) => s + p.promptCount, 0);
  const body = `
<section class="hero">
  <div class="wrap hero-in">
    <p class="eyebrow">रोज़ अपडेट · ${totalPrompts}+ कॉपी-पेस्ट प्रॉम्प्ट्स</p>
    <h1>AI से फोटो, वीडियो और कमाई — <span>सब कुछ हिंदी में</span></h1>
    <p class="hero-sub">Gemini और ChatGPT के लिए कॉपी-पेस्ट प्रॉम्प्ट्स, मोबाइल से AI वीडियो बनाने की आसान गाइड और भरोसेमंद AI टूल्स — बिना किसी झंझट के।</p>
    <label class="search"><span class="sr">आर्टिकल खोजें</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" type="search" placeholder="खोजें: couple prompt, saree, AI video…" autocomplete="off"></label>
    <div class="chips">${cfg.categories.map((c) => `<a class="chip" href="/category/${c.slug}/">${c.name}</a>`).join("")}</div>
  </div>
</section>
${featured.length ? `<section class="wrap block"><div class="sec-head"><h2>अभी ट्रेंड में</h2></div><div class="grid feat">${featured.map(card).join("")}</div></section>` : ""}
<section class="wrap block"><div class="sec-head"><h2>सभी नए आर्टिकल</h2></div><div class="grid">${posts.map(card).join("")}</div></section>
<section class="wrap block trust">
  <div><b>चेहरा वही रहे</b><p>हर फोटो प्रॉम्प्ट में चेहरा न बदलने की लाइन पहले से जुड़ी है।</p></div>
  <div><b>हर हफ्ते नए ट्रेंड</b><p>त्योहार और Instagram ट्रेंड आते ही नए प्रॉम्प्ट्स जोड़े जाते हैं।</p></div>
  <div><b>100% फ्री</b><p>कोई लॉगिन नहीं, कोई ऐप डाउनलोड नहीं — बस कॉपी करें और इस्तेमाल करें।</p></div>
</section>`;
  write(
    "index.html",
    layout({
      title: `${cfg.name} — Gemini AI Photo Prompts, AI Video और AI Tools हिंदी में`,
      description: "Gemini AI photo prompt copy paste, ChatGPT photo editing prompts, AI video kaise banaye और best free AI tools — आसान हिंदी में, रोज़ अपडेट।",
      canonical: "/",
      body,
      schema: [orgSchema, siteSchema]
    })
  );
}

// ---------- static info pages (needed for trust + AdSense approval) ----------
const pages = require("./pages.js")(cfg);
for (const pg of pages) {
  write(
    `${pg.slug}/index.html`,
    layout({ title: `${pg.title} | ${cfg.name}`, description: pg.description, canonical: `/${pg.slug}/`, noindex: !!pg.noindex, body: `<div class="wrap article-wrap"><article class="post"><header class="post-head"><h1>${pg.title}</h1></header><div class="prose">${pg.html}</div></article></div>`, schema: [orgSchema] })
  );
}

// ---------- 404 ----------
write(
  "404.html",
  layout({
    title: `पेज नहीं मिला | ${cfg.name}`,
    description: "यह पेज मौजूद नहीं है।",
    canonical: "/404.html",
    noindex: true,
    body: `<div class="wrap article-wrap center"><h1>पेज नहीं मिला</h1><p>हो सकता है यह पेज हटा दिया गया हो। नीचे से नए प्रॉम्प्ट्स देखें।</p><div class="grid">${posts.slice(0, 4).map(card).join("")}</div></div>`
  })
);

// ---------- sitemap, robots, rss ----------
const urls = [
  ["/", posts[0] ? posts[0].updated : today, "1.0"],
  ...cfg.categories.filter((c) => posts.some((p) => p.category === c.slug)).map((c) => [`/category/${c.slug}/`, posts.find((p) => p.category === c.slug).updated, "0.7"]),
  ...posts.map((p) => [p.url, p.updated, "0.8"]),
  ...pages.filter((pg) => !pg.noindex).map((pg) => [`/${pg.slug}/`, "2026-10-21", "0.3"])
];
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(([u, d, pr]) => `<url><loc>${abs(u)}</loc><lastmod>${d}</lastmod><priority>${pr}</priority></url>`)
    .join("\n")}\n</urlset>\n`
);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${abs("/sitemap.xml")}\n`);
write(
  "rss.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${cfg.name}</title><link>${abs("/")}</link><description>${esc(cfg.tagline)}</description><language>hi-in</language><atom:link href="${abs("/rss.xml")}" rel="self" type="application/rss+xml"/>\n${posts
    .slice(0, 30)
    .map((p) => `<item><title>${esc(p.title)}</title><link>${abs(p.url)}</link><guid>${abs(p.url)}</guid><pubDate>${new Date(p.date + "T08:00:00+05:30").toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`)
    .join("\n")}\n</channel></rss>\n`
);

// ---------- copy static assets ----------
for (const f of fs.readdirSync(STATIC)) fs.copyFileSync(path.join(STATIC, f), path.join(OUT, f));

console.log(`Built ${posts.length} posts, ${cfg.categories.length} categories, ${pages.length} pages → dist/ (${urls.length} URLs in sitemap)`);

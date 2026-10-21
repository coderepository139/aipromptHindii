// Quality gate for AI Prompt Hindi. Runs after `node build.js`.
// Exit code 1 = something is broken → Netlify fails the build and keeps the
// last good version live, so a bad commit can never take the site down.
// Usage: node build.js && node scripts/check.js
const fs = require("fs");
const path = require("path");
const cfg = require("../site.config.js");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const DIST = path.join(ROOT, "dist");
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// ---------- 1. content files ----------
const cats = new Set(cfg.categories.map((c) => c.slug));
const slugs = new Set();
const BLOCKS = new Set(["p", "h2", "h3", "ul", "ol", "note", "table", "prompt"]);
const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".json"));
const posts = [];
for (const f of files) {
  let p;
  try {
    p = JSON.parse(fs.readFileSync(path.join(CONTENT, f), "utf8"));
  } catch (e) {
    err(`${f}: invalid JSON — ${e.message}`);
    continue;
  }
  posts.push(p);
  const where = `content/${f}`;
  for (const k of ["slug", "category", "date", "title", "description", "blocks"]) if (!p[k]) err(`${where}: missing "${k}"`);
  if (p.slug && `${p.slug}.json` !== f) err(`${where}: slug "${p.slug}" must match file name`);
  if (p.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) err(`${where}: slug must be lowercase-with-hyphens`);
  if (slugs.has(p.slug)) err(`${where}: duplicate slug`);
  slugs.add(p.slug);
  if (p.category && !cats.has(p.category)) err(`${where}: unknown category "${p.category}"`);
  if (p.date && !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) err(`${where}: date must be YYYY-MM-DD`);
  if (p.updated && !/^\d{4}-\d{2}-\d{2}$/.test(p.updated)) err(`${where}: updated must be YYYY-MM-DD`);
  const t = p.seoTitle || p.title || "";
  if (t.length > 70) warn(`${where}: SEO title is ${t.length} chars (aim ≤ 65)`);
  if (p.description && (p.description.length < 70 || p.description.length > 170)) warn(`${where}: description is ${p.description.length} chars (aim 120–160)`);
  for (const [i, b] of (p.blocks || []).entries()) {
    if (!BLOCKS.has(b.type)) err(`${where}: block ${i} has unknown type "${b.type}"`);
    if (b.type === "prompt" && (!b.title || !b.text)) err(`${where}: prompt block ${i} needs title and text`);
  }
  for (const [i, q] of (p.faq || []).entries()) if (!q.q || !q.a) err(`${where}: faq ${i} needs q and a`);
  const blob = JSON.stringify(p);
  if (/capcut/i.test(blob)) err(`${where}: mentions CapCut (banned in India — see README)`);
  if (/टेस्टेड|tested prompt/i.test(blob)) warn(`${where}: claims prompts are "tested" — only keep if actually tested`);
}
for (const p of posts) for (const r of p.related || []) if (!slugs.has(r)) err(`content/${p.slug}.json: related slug "${r}" does not exist`);

// ---------- 2. built output ----------
if (!fs.existsSync(DIST)) {
  err("dist/ not found — run `node build.js` first");
} else {
  const html = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".html")) html.push(p);
    }
  };
  walk(DIST);
  const routes = new Set(html.map((p) => "/" + path.relative(DIST, p).replace(/\\/g, "/").replace(/index\.html$/, "")));
  const assets = new Set(fs.readdirSync(DIST).filter((f) => !fs.statSync(path.join(DIST, f)).isDirectory()).map((f) => "/" + f));
  for (const file of html) {
    const rel = path.relative(DIST, file);
    const h = fs.readFileSync(file, "utf8");
    if ((h.match(/<h1[\s>]/g) || []).length !== 1 && !rel.startsWith("404")) err(`dist/${rel}: must have exactly one <h1>`);
    if (!/<title>[^<]+<\/title>/.test(h)) err(`dist/${rel}: missing <title>`);
    if (!/name="description" content="[^"]+"/.test(h)) err(`dist/${rel}: missing meta description`);
    if (!/rel="canonical"/.test(h)) err(`dist/${rel}: missing canonical`);
    for (const s of h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []) {
      try {
        JSON.parse(s.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, ""));
      } catch (e) {
        err(`dist/${rel}: invalid JSON-LD — ${e.message}`);
      }
    }
    for (const [, href] of h.matchAll(/href="(\/[^"#?]*)/g)) {
      if (!routes.has(href) && !assets.has(href)) err(`dist/${rel}: broken internal link ${href}`);
    }
  }
  const sm = fs.existsSync(path.join(DIST, "sitemap.xml")) ? fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8") : "";
  if (!sm) err("dist/sitemap.xml missing");
  const base = cfg.url.replace(/\/$/, "");
  for (const [, loc] of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const r = loc.replace(base, "");
    if (!routes.has(r)) err(`sitemap lists ${r} but no page exists`);
  }
  if (!fs.existsSync(path.join(DIST, "robots.txt"))) err("dist/robots.txt missing");
  console.log(`Checked ${files.length} content files and ${html.length} pages.`);
}

for (const w of warnings) console.warn("⚠ " + w);
if (errors.length) {
  for (const e of errors) console.error("✗ " + e);
  console.error(`\n${errors.length} error(s). Fix them before publishing — the live site was NOT changed.`);
  process.exit(1);
}
console.log(`✓ All checks passed${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);

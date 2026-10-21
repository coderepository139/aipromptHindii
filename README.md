# AI Prompt Hindi (aiprompthindi.netlify.app)

Hindi blog of copy-paste AI photo prompts, AI video guides and AI tools. Static site, zero dependencies, built by `node build.js` into `dist/`. Netlify runs the build on every push to `main` (see `netlify.toml`).

## Add a new article
1. Create `content/<slug>.json` (copy any existing file as a template).
2. Required fields: `slug`, `category` (one of the slugs in `site.config.js`), `date` (YYYY-MM-DD), `title`, `description`, `keywords`, `blocks`.
3. Optional: `seoTitle` (≤ 65 chars, keyword first), `intro`, `featured`, `related` (slugs), `faq` (`[{q, a}]`), `updated`, `draft`.
4. A post with a future `date` stays hidden until that day's build.
5. Run `node build.js` and check the output for errors before committing.

Block types: `p` (`html`), `h2`/`h3` (`text`, optional `id`), `ul`/`ol` (`items`), `note` (`html`, optional `title`, `tone: "warn"`), `table` (`head`, `rows`), `prompt` (`title`, `text`, optional `for`, `tip`).

## Content rules
- Photo prompts are in English and always end with a face-preservation line.
- Use single quotes inside JSON HTML strings (`<a href='/x/'>`).
- Don't claim prompts were tested unless they actually were.
- No CapCut recommendations (banned in India). No deepfakes of real people. No unverified prices.
- Festival dates must be checked against at least two panchang/government sources.

## Settings
`site.config.js`: site URL, GA4 ID (`GA4_ID` env var) and Search Console token (`GSC_TOKEN` env var) — set them as Netlify environment variables.

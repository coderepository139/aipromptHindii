# Publishing workflow: Claude → GitHub → Netlify

```
 ┌──────────────┐  edit content/*.json   ┌──────────────┐  git push main   ┌──────────────┐  webhook   ┌───────────────────────────┐
 │ Claude       │ ─────────────────────▶ │ local check  │ ───────────────▶ │ GitHub repo  │ ─────────▶ │ Netlify build             │
 │ (chat or     │                         │ build.js +   │                  │ coderepo139/ │            │ node build.js             │
 │  scheduled   │                         │ check.js     │                  │ aiprompthindi│            │ && node scripts/check.js  │
 │  task)       │                         └──────┬───────┘                  └──────┬───────┘            └────────────┬──────────────┘
 └──────────────┘                                │ ✗ fails → nothing pushed        │ GitHub Action                  │ ✓ passes → live in ~1 min
                                                 ▼                                 ▼ "Site check" ✓/✗               │ ✗ fails → old version stays live
                                          fix and retry                    visible on every commit/PR               ▼
                                                                                                         aiprompthindi.netlify.app
```

Three gates protect the live site: the local check before pushing, the GitHub Action on every commit, and the same check inside the Netlify build. A failed Netlify build never replaces the live site — the previous good deploy keeps serving.

## Day-to-day: publish a change
1. Edit or add files in `content/` (new post: copy `templates/post.json` to `content/<slug>.json`; the slug must match the file name).
2. Run `scripts/publish.sh "Add: <slug>"`. It builds, runs the check, commits and pushes to `main`. If the check fails, nothing is pushed.
3. Netlify builds automatically. The site updates in about a minute.

## Review before going live (optional)
- `scripts/publish.sh "Draft: <slug>" --branch draft/<slug>` pushes to a branch.
- Open a pull request on GitHub → Netlify posts a **deploy preview** link on the PR.
- Merge the PR → `main` deploys to the live site.

## Scheduled posts
A post with a future `date` is skipped by the build. To make it appear on that day without a new commit, add a Netlify **build hook** (Project configuration → Build & deploy → Build hooks) and call it daily, or just let the next publishing run rebuild the site.

## Rolling back
- Netlify: Deploys → pick an earlier deploy → **Publish deploy** (instant).
- Git: `git revert <commit> && git push` (permanent fix; Netlify redeploys).

## One-time setup (owner)
1. GitHub: repo `coderepository139/aiprompthindi` exists, and the Claude GitHub app has access to it (github.com/settings/installations → Claude → Configure → Repository access).
2. Netlify: app.netlify.com/projects/aiprompthindi → Project configuration → Build & deploy → **Link repository** → GitHub → `aiprompthindi`, branch `main`. Leave build settings empty — `netlify.toml` provides them.
3. Optional: Netlify → Environment variables → `GA4_ID`, `GSC_TOKEN`, and `SITE_URL` once a custom domain is connected.

## Where the source lives
- **GitHub repo** is the source of truth for the site.
- The claude.ai Project ("blog post") keeps a mirror under `site/` as a backup and for scheduled runs; keep it in sync after each publish.

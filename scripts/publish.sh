#!/usr/bin/env bash
# Build, check, commit and push. Netlify picks up the push and deploys.
# Usage: scripts/publish.sh "Add: diwali-wishes-ai-image-prompts"
#        scripts/publish.sh "Draft: new-post" --branch draft/new-post   (preview only)
set -euo pipefail
cd "$(dirname "$0")/.."

MSG="${1:-}"
BRANCH="main"
if [[ "${2:-}" == "--branch" ]]; then BRANCH="${3:?branch name required}"; fi
if [[ -z "$MSG" ]]; then echo "Usage: scripts/publish.sh \"commit message\" [--branch name]"; exit 2; fi

echo "→ Building and checking…"
node build.js
node scripts/check.js   # exits non-zero on any error, so nothing is pushed

if [[ -z "$(git status --porcelain -- . ':!dist')" ]]; then
  echo "Nothing changed — nothing to publish."; exit 0
fi

git fetch origin --quiet || true
if [[ "$BRANCH" == "main" ]]; then
  git checkout --quiet main
  git pull --rebase --quiet origin main 2>/dev/null || true
else
  git checkout --quiet -B "$BRANCH"
fi

git add -A
git commit --quiet -m "$MSG"
git push --quiet origin "HEAD:$BRANCH"

if [[ "$BRANCH" == "main" ]]; then
  echo "✓ Pushed to main — Netlify is deploying to https://aiprompthindi.netlify.app (≈1 min)."
else
  echo "✓ Pushed to $BRANCH — open a pull request on GitHub to get a Netlify deploy preview."
fi

"""Organic reach model for aiprompthindi.netlify.app (start 22 Oct 2026).
Pages: 9 at launch + POSTS_PER_DAY new pages daily.
Each page targets a keyword cluster (head + long tail) with a monthly India search volume.
Visits/day for a page = cluster_volume/30 * seasonal(page, day) * indexed(page_age) * blended_ctr(page_age, site_age).
Blended CTR curve derived from Ubersuggest estimate_serp_clicks: #1 30%, #3 9.7%, #5 4.7%, #8 2.0%, #12 0.16%.
"""
import datetime as dt, json
START = dt.date(2026, 10, 22)
DAYS = 52
POSTS_PER_DAY = 2

# launch pages: (slug, monthly cluster volume, seasonal profile)
LAUNCH = [
    ("gemini-ai-photo-prompt-copy-paste", 40000, None),
    ("diwali-ai-photo-prompts", 6000, ("diwali", dt.date(2026, 11, 8))),
    ("chhath-puja-ai-photo-prompts", 4000, ("chhath", dt.date(2026, 11, 15))),
    ("gemini-ai-photo-prompt-couple", 25000, None),
    ("gemini-ai-photo-prompt-saree", 22000, None),
    ("ai-video-kaise-banaye", 30000, None),
    ("chatgpt-kaise-use-kare", 3000, None),
    ("ai-se-paise-kaise-kamaye", 4000, None),
    ("free-ai-tools-list-hindi", 30000, None),
]
NEW_PAGE_VOLUME = 5000  # median cluster volume of planned long-tail pages (from keyword research)

def seasonal(profile, day):
    if not profile: return 1.0
    _, peak = profile
    d = (peak - day).days
    if d < 0: return 0.08 if d > -5 else 0.03          # collapses after the festival
    if d <= 7: return 6.0                              # final week before festival
    if d <= 18: return 3.0
    return 1.0

SCEN = {
    # indexed-share by page age; blended CTR by effective age (min of page age, site age)
    "Low":      dict(idx=[(3,0),(10,.4),(21,.6),(45,.75),(999,.8)],  ctr=[(7,.0002),(14,.0008),(28,.002),(45,.004),(999,.006)]),
    "Expected": dict(idx=[(2,0),(7,.5),(14,.75),(30,.85),(999,.9)],  ctr=[(7,.0008),(14,.003),(28,.007),(45,.012),(999,.017)]),
    "High":     dict(idx=[(1,0),(5,.7),(10,.85),(20,.95),(999,.95)], ctr=[(7,.002),(14,.007),(28,.016),(45,.026),(999,.035)]),
}
def step(table, x):
    for lim, v in table:
        if x <= lim: return v
    return table[-1][1]

def run(s):
    p = SCEN[s]; pages = [(slug, vol, prof, START) for slug, vol, prof in LAUNCH]
    daily = []
    for i in range(DAYS + 1):
        day = START + dt.timedelta(days=i)
        if i > 0:
            for k in range(POSTS_PER_DAY): pages.append((f"new-{i}-{k}", NEW_PAGE_VOLUME, None, day))
        site_age = i; v = 0.0
        for slug, vol, prof, born in pages:
            age = (day - born).days
            eff = min(age, site_age)
            v += vol / 30 * seasonal(prof, day) * step(p["idx"], age) * step(p["ctr"], eff)
        daily.append((day, len(pages), v))
    return daily

out = {}
for s in SCEN:
    d = run(s); res = {}
    for n in (7, 14, 26, 52):
        day, pages, v = d[n]; cum = sum(x[2] for x in d[1:n+1])
        res[n] = dict(date=str(day), pages=pages, visits_per_day=round(v), cumulative=round(cum))
    out[s] = dict(milestones=res, series=[round(x[2]) for x in d])
json.dump(out, open("/home/claude/promptkosh/analysis/reach_estimate.json", "w"), indent=1)
for s, r in out.items():
    print(s, {k: (v["visits_per_day"], v["cumulative"], v["pages"]) for k, v in r["milestones"].items()})

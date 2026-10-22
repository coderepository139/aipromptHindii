# Reach forecast (made 22 Oct 2026)

`reach_model.py` → `reach_estimate.json`. Three scenarios for organic Google visits, 2 new posts/day.
The weekly report compares actual Search Console clicks against the "Expected" series and says whether the site is ahead or behind.

| Day | Date | Pages | Low visits/day | Expected visits/day | High visits/day | Expected cumulative |
|---|---|---|---|---|---|---|
| 7 | 29 Oct | 23 | 1 | 3 | 13 | 13 |
| 14 | 5 Nov | 37 | 4 | 20 | 60 | 137 |
| 26 | 17 Nov | 61 | 14 | 58 | 152 | 770 |
| 52 | 13 Dec | 113 | 59 | 204 | 466 | 4,207 |

Assumptions: new netlify.app domain with no backlinks; median 5,000 monthly searches per new page's keyword cluster; Ubersuggest CTR curve (#1 30%, #3 9.7%, #8 2%, #12 0.16%); rankings improve with page and site age; Diwali/Chhath pages spike before the festival and collapse after. Social shares, Google Discover or backlinks are not included and can add a lot on top.

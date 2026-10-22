# Email report template (Resend)

- `email-template.html` — the report email: email-safe HTML (table layout, inline styles, Outlook-safe), with Resend `{{{VARIABLE}}}` placeholders. Upload it to Resend as template alias **`seo-report`**.
- `../scripts/render_report.py report.json` — fills the template from a report JSON. It writes `report.html` (a preview, or the body to send as raw HTML) and `report.vars.json` (`subject` + the `variables` object to send with the Resend template).
- `sample-daily.json` — example input showing every field. `sample-daily.html` shows the rendered result.

Variables (33): REPORT_TYPE, REPORT_DATE, HEADLINE, SUMMARY, DEPLOY_STATUS, DEPLOY_COLOR, LIVE_COMMIT, PAGES_LIVE, TRAFFIC_SOURCE, TRAFFIC_PERIOD, CLICKS, CLICKS_CHANGE, IMPRESSIONS, IMPRESSIONS_CHANGE, CTR, AVG_POSITION, INDEX_STATUS, FORECAST_STATUS, FORECAST_EXPECTED, FORECAST_NOTE, FORECAST_COLOR, FORECAST_BG, LH_PERFORMANCE, LH_ACCESSIBILITY, LH_BEST_PRACTICES, LH_SEO, PUBLISHED_ROWS, FIXES_ROWS, APPROVAL_BLOCK, NEXT_OPPORTUNITY, OWNER_ACTION_BLOCK, SITE_URL, DEPLOY_URL.
The *_ROWS and *_BLOCK variables carry ready-made HTML rows, so lists of any length fit one template. render_report.py builds them and escapes all text.
Weekly reports use the same template with report_type "Weekly" and traffic_period "Last 7 days".

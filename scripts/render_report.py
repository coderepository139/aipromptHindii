#!/usr/bin/env python3
"""Fill reports/email-template.html from a report JSON.

Usage:
  python3 scripts/render_report.py report.json            -> writes report.html + report.vars.json
The .vars.json is the exact `variables` object for Resend (template alias "seo-report"),
so the same data can be sent through Resend or previewed locally.

report.json keys (lists may be empty):
  report_type      "Daily" | "Weekly"
  report_date      "22 Oct 2026"
  headline, summary
  deploy_ok        true/false          live_commit "6afd1d3"     pages_live 9
  traffic_source   "Google Search Console" | "Not connected yet"
  traffic_period   "Yesterday" | "Last 7 days"
  clicks, impressions, ctr, avg_position  (strings or numbers; use "—" when unknown)
  clicks_change, impressions_change       e.g. "+12 vs day before"
  index_status     e.g. "0 pages indexed"
  forecast_expected  number           forecast_status "Ahead" | "On track" | "Behind" | "Too early"
  forecast_note
  lighthouse       {"performance":100,"accessibility":100,"best_practices":100,"seo":100}
  published        [{"title": "...", "url": "https://..."}]
  fixes            ["..."]
  awaiting_approval [{"title": "...", "url": "https://deploy-preview..."}]
  next_opportunity  "..."
  owner_action      "..." or ""
"""
import html, json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "reports" / "email-template.html"
FONT = "font-family:Arial,Helvetica,sans-serif;"
e = lambda s: html.escape(str(s), quote=True)

def rows_links(items, empty):
    if not items:
        return f'<tr><td style="{FONT}font-size:14px;line-height:21px;color:#57504A;padding-top:4px;padding-bottom:4px;">{e(empty)}</td></tr>'
    out = []
    for it in items:
        out.append(
            f'<tr><td style="padding-top:8px;padding-bottom:8px;border-bottom:1px solid #F4EDE3;{FONT}">'
            f'<a href="{e(it["url"])}" style="{FONT}font-size:15px;line-height:22px;font-weight:bold;color:#1D1A16;text-decoration:none;">{e(it["title"])}</a>'
            f'<br><span style="{FONT}font-size:12px;line-height:18px;color:#B93D0B;">{e(it["url"])}</span></td></tr>'
        )
    return "".join(out)

def rows_bullets(items, empty):
    if not items:
        return f'<tr><td style="{FONT}font-size:14px;line-height:21px;color:#57504A;">{e(empty)}</td></tr>'
    return "".join(
        f'<tr><td width="18" valign="top" style="{FONT}font-size:15px;line-height:23px;color:#2B8A3E;">✓</td>'
        f'<td style="{FONT}font-size:15px;line-height:23px;color:#1D1A16;padding-bottom:4px;">{e(x)}</td></tr>'
        for x in items
    )

def block(title, color, bg, inner):
    return (
        f'<tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding-top:18px;padding-left:24px;padding-right:24px;">'
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
        f'<td bgcolor="{bg}" style="background-color:{bg};border-left:4px solid {color};border-radius:0 10px 10px 0;padding-top:12px;padding-bottom:12px;padding-left:14px;padding-right:14px;{FONT}">'
        f'<p style="margin:0;{FONT}font-size:13px;line-height:18px;font-weight:bold;color:{color};">{e(title)}</p>{inner}</td></tr></table></td></tr>'
    )

FORECAST = {
    "Ahead": ("#2B8A3E", "#EBF7EE"),
    "On track": ("#2B8A3E", "#EBF7EE"),
    "Behind": ("#B93D0B", "#FFE8D9"),
    "Too early": ("#57504A", "#F4EDE3"),
}

def build_vars(d):
    lh = d.get("lighthouse", {})
    fc, fbg = FORECAST.get(d.get("forecast_status", "Too early"), FORECAST["Too early"])
    approvals = d.get("awaiting_approval") or []
    approval_block = ""
    if approvals:
        links = "".join(
            f'<p style="margin-top:6px;margin-bottom:0;{FONT}font-size:14px;line-height:21px;color:#1D1A16;">{e(a["title"])} — '
            f'<a href="{e(a["url"])}" style="color:#B93D0B;font-weight:bold;">preview</a></p>'
            for a in approvals
        )
        approval_block = block("AWAITING YOUR APPROVAL", "#B93D0B", "#FFE8D9", links)
    owner = (d.get("owner_action") or "").strip()
    owner_block = block("ACTION FOR YOU", "#1D1A16", "#F4EDE3",
                        f'<p style="margin-top:4px;margin-bottom:0;{FONT}font-size:14px;line-height:21px;color:#1D1A16;">{e(owner)}</p>') if owner else ""
    deploy_ok = bool(d.get("deploy_ok"))
    return {
        "REPORT_TYPE": d.get("report_type", "Daily"),
        "REPORT_DATE": d["report_date"],
        "HEADLINE": e(d["headline"]),
        "SUMMARY": e(d.get("summary", "")),
        "DEPLOY_STATUS": "✓ Live" if deploy_ok else "✗ Failed",
        "DEPLOY_COLOR": "#2B8A3E" if deploy_ok else "#C92A2A",
        "LIVE_COMMIT": e(d.get("live_commit", "—")),
        "PAGES_LIVE": str(d.get("pages_live", "—")),
        "TRAFFIC_SOURCE": e(d.get("traffic_source", "Not connected yet")),
        "TRAFFIC_PERIOD": e(d.get("traffic_period", "Yesterday")).upper(),
        "CLICKS": str(d.get("clicks", "—")),
        "CLICKS_CHANGE": e(d.get("clicks_change", "")) or "&nbsp;",
        "IMPRESSIONS": str(d.get("impressions", "—")),
        "IMPRESSIONS_CHANGE": e(d.get("impressions_change", "")) or "&nbsp;",
        "CTR": str(d.get("ctr", "—")),
        "AVG_POSITION": str(d.get("avg_position", "—")),
        "INDEX_STATUS": e(d.get("index_status", "")) or "&nbsp;",
        "FORECAST_STATUS": e(d.get("forecast_status", "Too early")),
        "FORECAST_EXPECTED": str(d.get("forecast_expected", "—")),
        "FORECAST_NOTE": e(d.get("forecast_note", "")),
        "FORECAST_COLOR": fc,
        "FORECAST_BG": fbg,
        "LH_PERFORMANCE": str(lh.get("performance", "—")),
        "LH_ACCESSIBILITY": str(lh.get("accessibility", "—")),
        "LH_BEST_PRACTICES": str(lh.get("best_practices", "—")),
        "LH_SEO": str(lh.get("seo", "—")),
        "PUBLISHED_ROWS": rows_links(d.get("published", []), "Nothing new published."),
        "FIXES_ROWS": rows_bullets(d.get("fixes", []), "No fixes needed."),
        "APPROVAL_BLOCK": approval_block,
        "NEXT_OPPORTUNITY": e(d.get("next_opportunity", "")),
        "OWNER_ACTION_BLOCK": owner_block,
        "SITE_URL": d.get("site_url", "https://aiprompthindi.netlify.app/"),
        "DEPLOY_URL": "https://app.netlify.com/projects/aiprompthindi/deploys",
    }

def subject(d):
    return f'AI Prompt Hindi {d.get("report_type","Daily").lower()} – {d["report_date"]} – {d["headline"]}'

def render(d):
    v = build_vars(d)
    out = TEMPLATE.read_text(encoding="utf-8")
    for k, val in v.items():
        out = out.replace("{{{" + k + "}}}", val)
    left = re.findall(r"\{\{\{(\w+)\}\}\}", out)
    if left:
        raise SystemExit(f"Unfilled template variables: {sorted(set(left))}")
    return out, v

if __name__ == "__main__":
    src = pathlib.Path(sys.argv[1])
    d = json.loads(src.read_text(encoding="utf-8"))
    out, v = render(d)
    src.with_suffix(".html").write_text(out, encoding="utf-8")
    src.with_suffix(".vars.json").write_text(json.dumps({"subject": subject(d), "variables": v}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Wrote {src.with_suffix('.html')} and {src.with_suffix('.vars.json')}  ·  subject: {subject(d)}")

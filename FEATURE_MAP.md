# Feature map

v2 cut: `GEO-CHECKER-V2-CUT-2026-11-10-v1`.

This repository already shipped `GEO-CUT-2026-10-27-v1-popup` (C01–C10, the score, the Markdown report). v2 adds one summary on that same popup. `GEO-EXTENSION-CUT-2026-10-29-v1` (a new `geo-checker-extension` repository, a paywall, a daily limit) is not this cut and is not reopened here.

Honesty line, in the popup header and the Markdown report: Based on public signals. 基于公开信号，非实时索引证明。

## Score (unchanged)

```text
score = round(100 * earnedWeight / maxWeight)
```

`maxWeight` is 8.25. C01–C07 and C09 are weight 1. C08 is 0.25. C10 is 0 and never changes the score. `FAQPage` JSON-LD adds no points. The v2 summary is not an input to this formula.

## Checks

| ID | Check | Weight |
| --- | --- | --- |
| C01 | Raw HTML vs rendered page | 1 |
| C02 | AI crawler allow rules in robots.txt | 1 |
| C03 | `noindex`, `nosnippet`, `max-snippet` | 1 |
| C04 | Title, description, canonical, `lang` | 1 |
| C05 | One H1, heading levels do not skip | 1 |
| C06 | JSON-LD | 1 |
| C07 | Author and dates match the visible page | 1 |
| C08 | Extractable answer hints | 0.25 |
| C09 | Authoritative outbound link | 1 |
| C10 | `llms.txt` presence and basic Markdown | 0 |

## v2 summary

Shown first in the popup and as `## AI search citation signals` in the report. Each row repeats an existing check. No new score.

| Signal | Reuses | Status |
| --- | --- | --- |
| Structured data (JSON-LD / schema) | C06 | Pass or Fail |
| robots.txt for AI crawlers | C02 | C02’s Pass or Fail. GPTBot, ClaudeBot, PerplexityBot, and Google-Extended are listed one by one as Allowed, Disallowed, or Not read, from that same check |
| llms.txt | C10 | Pass or Fail, and Not scored. Present or absent follows C10 |
| Headings and Q&A structure | C05, C08 | Pass only when both pass |
| Basic meta | C04 | Pass or Fail |

## Permissions

`activeTab` and `scripting` only. After the icon click, three cookie-less same-origin GETs: the page URL, `/robots.txt`, and `/llms.txt`.

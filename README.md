# GEO Checker

Can AI crawlers actually read this page? An evidence-based GEO checker. No account, no upsell, nothing leaves your browser.

证据型「AI 爬虫到底能不能读到你这页」——不做「AI 引用分数」吹嘘；llms.txt 只展示不计分；无账号、无推销、数据不出浏览器。

Cut id: `GEO-CUT-2026-10-27-v1-popup`. This repository is the Manifest V3 popup only. It is not a landing page, not a bookmarklet, and not a store listing.

## What it checks

Click the toolbar icon on an `http` or `https` page. The popup shows one score and the same ten checks, each with Pass or Fail, an English explanation, a copyable fix, and sources labeled `official`, `research`, or `heuristic`.

| ID | Check | Weight |
| --- | --- | --- |
| C01 | Raw HTML vs rendered page (client-rendered text) | 1 |
| C02 | AI crawler allow rules in robots.txt, training vs search, Cloudflare managed-block tip | 1 |
| C03 | `noindex`, `nosnippet`, and `max-snippet` in meta robots or `X-Robots-Tag` | 1 |
| C04 | Title, meta description, absolute canonical, and `lang` (empty or missing fails) | 1 |
| C05 | Exactly one H1, and heading levels do not skip | 1 |
| C06 | JSON-LD type profile, parse errors, and mojibake | 1 |
| C07 | Author, `datePublished`, and `dateModified` match the visible page | 1 |
| C08 | Definition sentence, question heading, list or table | 0.25 |
| C09 | At least one authoritative outbound link | 1 |
| C10 | `llms.txt` presence and a basic Markdown format check | 0 |

## Score

```text
score = round(100 * earnedWeight / maxWeight)
```

`maxWeight` is **8.25**. A passed check earns its weight. A failed check earns 0.

- C01–C07 and C09 are weight 1.
- C08 is low weight: **0.25**. Failing it changes a perfect score from 100 to 97. Passing it is a hint, not a citation score.
- C10 is weight **0**. A missing file, a valid file, and a malformed file all leave the score unchanged. The row is labeled **Not scored**.
- `FAQPage` JSON-LD does not add points. C08 only looks at visible text. A FAQ schema block cannot pass C08 and does not increase the score.

Google’s [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) says Google Search does not need `llms.txt` or other special AI files, and that Google Search ignores them. C10 quotes that and does not treat the file as a ranking trick.

The same numbers are in the JSON result (`score`, `earnedWeight`, `maxWeight`, `scoreRule`) from `src/checker.js`.

## Confidence

Each source is one of:

- **official** — the vendor’s own documentation (Google Search Central, OpenAI, Anthropic, Perplexity, Cloudflare, MDN, W3C, Schema.org, RFC 9309).
- **research** — a published study. C10 cites the [Ahrefs llms.txt study](https://ahrefs.com/blog/llmstxt-study/).
- **heuristic** — a rule this checker chose and documented, such as “exactly one H1” (the HTML standard allows more than one) or the v1 authority-host list.

The “Why” text states which part is a documented rule and which part is the checker’s threshold.

## Permissions

`manifest.json` requests only:

- `activeTab` — read the tab you just invoked the extension on
- `scripting` — run the evidence collector in that tab

There is no `host_permissions` entry, no “read all sites” permission, and no background script. Nothing is fetched until you click the icon.

## Data stays in the browser

There is no account, no server, and no analytics call. The extension does not send page content to a third party.

After the click, the collector in `src/collect-page.js` makes three unauthenticated same-origin GETs:

1. The page URL, to compare the original HTML with the rendered DOM and to read `X-Robots-Tag`
2. `/robots.txt`
3. `/llms.txt`

Cookies are omitted so the read is closer to a crawler with no login. If a response redirects off the origin, the body is discarded. The popup then calls `checkPage` in `src/checker.js`. Popup code does not contain a second copy of the rules.

## Load unpacked

1. Clone this repository.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Choose **Load unpacked**.
5. Select this directory (the folder that contains `manifest.json`).
6. Open a normal `http` or `https` page.
7. Click the GEO Checker icon. The popup shows the score and all ten checks.
8. Use **Copy fix** on a row, or **Copy Markdown report** for the full report. The report starts with the positioning sentence and ends with a source summary.

Browser pages (`chrome://` and the Chrome Web Store) cannot be checked.

## Run the fixture tests

```bash
npm install
npm test
```

Node 20 or newer. `npm test` runs `node --test`. It parses each HTML file under `fixtures/` with linkedom, calls the same `checkPage` function the popup uses, and writes:

- `testdata/fixture-output/*.json` — the JSON result for each fixture
- `testdata/sample-report.md` — the Markdown report for the healthy fixture

Popup screenshots (same `popup.html` / `popup.css` / `src/render.js` as the extension):

```bash
npm run screenshots
```

That script needs Chrome. It also imports `src/checker.js` inside Chrome and checks that the pass/fail map matches Node (`testdata/browser-parity.json`).

Live-site notes and screenshots:

```bash
npm run self-test
```

`fixtures/` is a set of HTML pages for these tests. They can be published later from this repository’s own GitHub Pages. They are not a product landing page, and they are not under an `ai-demos` path.

## Layout

- `manifest.json`, `popup.html`, `popup.css`, `popup.js` — extension shell
- `src/checker.js` — `checkPage(document, extras) → JSON`
- `src/checks/c01.js` … `c10.js` — one check each
- `src/collect-page.js` — same-origin evidence collection
- `fixtures/<id>/` — rendered HTML, optional raw HTML, `robots.txt`, `llms.txt`
- `testdata/SELF_TEST.md` — ten-site checklist

## Out of scope for this cut

Not in this repository: a marketing landing page, a bookmarklet, a Chrome or Edge store listing, accounts, payments, a backend, or calls to an AI API.

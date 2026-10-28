# GEO Checker

Can AI crawlers actually read this page? An evidence-based GEO checker. No account, no upsell, nothing leaves your browser.

证据型「AI 爬虫到底能不能读到你这页」——不做「AI 引用分数」吹嘘；llms.txt 只展示不计分；无账号、无推销、数据不出浏览器。

中文：[安装](#zh-install) · [使用](#zh-use)。只看这两节就能从本仓库装上扩展，并用弹出窗口检查页面。英文从 [What it checks](#what-it-checks) 继续。

<a id="zh-install"></a>

## 安装（从源码加载未打包扩展）

按这个顺序把本仓库载入 Chrome。不经过应用商店，不需要账号。

1. 克隆仓库并进入目录：

   ```bash
   git clone https://github.com/2045shane/geo-checker.git
   cd geo-checker
   ```

2. 地址栏打开 `chrome://extensions`。
3. 打开 **开发者模式**。英文界面上这个开关叫 **Developer mode**，在页面右上角。
4. 点 **加载未打包的扩展程序**。英文界面叫 **Load unpacked**。
5. 选中刚才克隆的文件夹，也就是直接放着 `manifest.json` 的那一层。不要选它的上一级，也不要选里面的子目录。
6. 打开一个普通网页，地址以 `http://` 或 `https://` 开头。
7. 点工具栏上的 GEO Checker 图标。弹出窗口会显示分数和全部十项检查。工具栏上看不到图标时，点扩展菜单（拼图图标），再点 GEO Checker。
8. 某一项上点 **Copy fix**，复制这一项的修复文本。点 **Copy Markdown report**，复制整份 Markdown 报告。报告开头是定位句，结尾是来源汇总（Source summary）。

只有 `http` 和 `https` 页面可以检查。`chrome://` 页面和 Chrome 网上应用店不能检查。

`manifest.json` 只申请了两项权限：

- `activeTab`：读取你刚刚点图标的那个标签页
- `scripting`：在那个标签页里收集证据

没有 `host_permissions`，不会请求读取所有网站，也没有后台脚本。点图标之前不会请求任何页面。

数据留在这台浏览器里。没有账号，没有服务器，没有统计请求。扩展不会把页面内容发给第三方。点图标之后，扩展对当前网站发三次不带 Cookie 的同源 GET：

1. 页面地址本身，用来对比原始 HTML 和渲染后的页面，并读取 `X-Robots-Tag`
2. `/robots.txt`
3. `/llms.txt`

某个响应如果跳到了别的源，正文不读取。

<a id="zh-use"></a>

## 使用

弹出窗口里的按钮、标题和说明是英文。下面说明怎么检查当前页、结果每一块是什么、两个复制按钮各自复制什么。

### 怎么检查一页

1. 打开要检查的页面，让它留在当前标签页。地址必须是 `http://` 或 `https://`。
2. 点工具栏上的 GEO Checker 图标。直接用浏览器打开仓库里的 `popup.html` 不会开始检查。
3. 弹出窗口先显示 `Checking this page…`，然后换成结果。

点图标之后才会去读页面。读的是当前标签页，外加上面说的三次同源请求。

这些页面不能检查：

- 地址不是 `http://` 或 `https://` 的页面，包括 `chrome://`。弹出窗口显示：`Open an http or https page, then click the GEO Checker icon. Browser pages cannot be checked.`
- Chrome 网上应用店。它的地址是 https，但扩展读不了那个标签页，会显示：`Could not read this tab. Open an http or https page and try again.`

标签页没有交回 HTML 时，显示 `This tab did not return HTML.` 换一个普通网页，再点一次图标。

### 怎么看结果

弹出窗口从上到下是：

1. **Score**。分数写成 `数字/100`。下一行是计分式 `score = round(100 * earnedWeight / maxWeight)`，以及拿到的权重和满分权重。满分权重是 **8.25**。通过的检查加上它的权重，失败的检查加 0。
2. **Copy Markdown report**。复制整份报告，见下一节。
3. 十条检查，顺序固定为 C01 到 C10。每一条有编号、英文标题、**Pass** 或 **Fail**，下面是说明、**Fix**、来源链接。
4. 底部一句隐私说明，大意是：没有账号；点图标之后只读当前标签页，并只请求本站自己的地址、`/robots.txt` 和 `/llms.txt`；这些响应留在这个浏览器里。

两项特殊标记：

- C08 旁边有 **Low weight**。权重是 **0.25**。其他项都通过、只有 C08 失败时，分数从 100 变成 97。通过只说明页面上有可摘的答案线索。
- C10（`llms.txt`）旁边有 **Not scored**。权重是 **0**。文件不存在、格式正常、格式有问题，分数都不变。不存在时这一行是 Pass；格式检查没过时是 Fail。两种都不计入分数。读到文件时，这一行多一块 **llms.txt preview**。

`FAQPage` 的 JSON-LD 不加分。C08 只看页面上看得见的文字，一段 FAQ 结构化数据不能靠它通过 C08，也不会把分数抬高。

来源链接旁边的标记：

- `official`：厂商自己的文档
- `research`：已发表的研究
- `heuristic`：本检查器自己定下来并写明的规则

弹出窗口用英文标题。对照下表看每一行在查什么：

| 编号 | 弹出窗口里的标题 | 这一行在看什么 | 权重 |
| --- | --- | --- | --- |
| C01 | Raw HTML vs rendered page | 原始 HTML 里有没有渲染出来的正文 | 1 |
| C02 | AI crawler allow rules | robots.txt 里的 AI 爬虫规则，训练用和搜索用分开；robots.txt 像 Cloudflare 托管内容时，提示去 Cloudflare 控制台核对 | 1 |
| C03 | Index and snippet directives | meta robots 或 `X-Robots-Tag` 里的 `noindex`、`nosnippet`、`max-snippet` | 1 |
| C04 | Title, description, canonical, and language | title、meta description、绝对地址的 canonical、`lang`。空的或缺失算失败 | 1 |
| C05 | Single H1 and heading order | 恰好一个 H1，标题层级不跳级 | 1 |
| C06 | JSON-LD structured data | JSON-LD 的类型、解析错误、乱码 | 1 |
| C07 | Author and dates match the page | 作者、`datePublished`、`dateModified` 是否和页面上看得见的内容一致 | 1 |
| C08 | Extractable answer hints | 定义句、问句式标题、列表或表格 | 0.25 |
| C09 | Links to authoritative sources | 至少一个指向权威站点的出站链接 | 1 |
| C10 | llms.txt | 有没有 `/llms.txt`，以及是不是基本的 Markdown。只展示，不计分 | 0 |

说明、修复示例和来源标题都是英文。

### 复制修复和 Markdown 报告

- **Copy fix** 在每一条的 Fix 旁边。点一下，复制这一条的修复文本。
- **Copy Markdown report** 在分数下面。点一下，复制整份报告。

写入剪贴板成功时，按钮变成 `Copied`。浏览器拒绝写入时变成 `Copy failed`。大约 1.6 秒后变回原来的文字。

整份报告是 Markdown，顺序固定：

1. 标题 `# GEO Checker report`。
2. 定位句，和弹出窗口顶部那句英文相同：`Can AI crawlers actually read this page? An evidence-based GEO checker. No account, no upsell, nothing leaves your browser.`
3. 页面 URL、检查时间、分数、拿到的权重 / 满分权重、计分式，以及四条计分说明：C01–C07 和 C09 权重各为 1；C08 权重 0.25；C10 权重 0 且不改变分数；`FAQPage` JSON-LD 不加分。
4. C01 到 C10 各一节：英文标题、Pass 或 Fail、权重、Why、Fix 代码块、Sources（标题、`official` / `research` / `heuristic`、链接）。C10 有预览时，再附一段 llms.txt 预览。
5. 最后一节 `## Source summary`，分别列出 Official、Research、Heuristic 各有几条。

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

The same steps in Chinese are in [安装](#zh-install) and [使用](#zh-use) above.

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

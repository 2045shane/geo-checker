# GEO Checker report

Can AI crawlers actually read this page? An evidence-based GEO checker. No account, no upsell, nothing leaves your browser.

- URL: https://example.com/widget
- Checked at: 2026-10-27T02:00:00.000Z
- Score: 100/100
- Earned weight: 8.25 / 8.25
- Rule: score = round(100 * earnedWeight / maxWeight)
- C01, C02, C03, C04, C05, C06, C07, and C09 each have weight 1.
- C08 has weight 0.25 (low weight).
- C10 has weight 0 and never changes the score.
- FAQPage JSON-LD does not add points.

## C01 Raw HTML vs rendered page — Pass

Weight: 1. Earned: 1.

**Why:** The rendered body text (339 characters) is present in the original HTML body (339 characters), including each H1. Script and style contents were ignored. The one-third length rule and the H1 comparison are this checker’s heuristics on top of Google’s JavaScript SEO guidance.

**Fix:**

```
<article>
  <h1>Page title</h1>
  <p>The main explanation is in the HTML response, not only after JavaScript runs.</p>
</article>
```

**Sources:**
- Google: JavaScript SEO basics (official): https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Google: AI optimization guide (technical structure) (official): https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

## C02 AI crawler allow rules — Pass

Weight: 1. Earned: 1.

**Why:** robots.txt was read from this origin. Training crawlers blocked: none; allowed: GPTBot, Google-Extended, CCBot, ClaudeBot, Amazonbot, Applebot-Extended, Bytespider, meta-externalagent. Search crawlers blocked: none; allowed: OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User. Training opt-out (GPTBot, Google-Extended, CCBot, and the other training tokens) is a different decision from blocking search crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, and the other search tokens). This check fails when any tracked token is disallowed for this path. Perplexity’s documentation says Perplexity-User generally ignores robots.txt because a person requested the fetch; the robots.txt rule is still reported. None of the tracked tokens are disallowed for this path.

**Fix:**

```
# Search crawlers fetch pages for AI answers. Allow them if this page should be readable.
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

# Training crawlers are a separate choice. Allowing them opts this site into
# training crawls. Delete a group to keep that training opt-out.
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: ClaudeBot
Allow: /
```

**Sources:**
- OpenAI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User) (official): https://developers.openai.com/api/docs/bots
- Google crawlers overview (including Google-Extended) (official): https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers
- Common Crawl: CCBot (official): https://commoncrawl.org/ccbot
- Anthropic: ClaudeBot, Claude-User, and Claude-SearchBot (official): https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Perplexity crawlers (official): https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- Cloudflare: managed robots.txt (official): https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
- Google robots.txt specification (official): https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
- RFC 9309: Robots Exclusion Protocol (official): https://www.rfc-editor.org/rfc/rfc9309

## C03 Index and snippet directives — Pass

Weight: 1. Earned: 1.

**Why:** No noindex, none, nosnippet, or max-snippet:0 directive was found in meta robots, googlebot, http-equiv X-Robots-Tag, or the page’s X-Robots-Tag header. No max-snippet directive was found.

**Fix:**

```
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">

# If the HTTP response sets a blocking header, remove it:
# X-Robots-Tag: noindex, nosnippet, max-snippet:0
```

**Sources:**
- Google: robots meta tag and X-Robots-Tag (official): https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag

## C04 Title, description, canonical, and language — Pass

Weight: 1. Earned: 1.

**Why:** The page has a non-empty title, a non-empty meta description, an absolute http(s) canonical URL, and a basic BCP 47 lang value on the html element.

**Fix:**

```
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Specific page title</title>
  <meta name="description" content="One or two sentences that describe this page.">
  <link rel="canonical" href="https://example.com/this-page">
</head>
```

**Sources:**
- Google: snippets and meta description (official): https://developers.google.com/search/docs/appearance/snippet
- Google: canonical URLs (official): https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- MDN: lang attribute (official): https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang

## C05 Single H1 and heading order — Pass

Weight: 1. Earned: 1.

**Why:** There is exactly one H1, and no heading is more than one level deeper than the heading before it. Exactly one H1 is this checker’s rule, not an HTML requirement (the HTML standard allows more than one). Skipped levels fail because W3C WAI heading guidance says not to skip, for example H2 then H4.

**Fix:**

```
<h1>Only one top-level heading</h1>
<h2>Section</h2>
<h3>Subsection</h3>
<!-- Do not jump from h2 to h4. -->
```

**Sources:**
- W3C WAI: headings (official): https://www.w3.org/WAI/tutorials/page-structure/headings/
- v1 rule: exactly one H1 (the HTML standard allows more than one) (heuristic): https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements

## C06 JSON-LD structured data — Pass

Weight: 1. Earned: 1.

**Why:** JSON-LD parsed, and Article matched the v1 field profile. Google’s Article documentation says there are no required Article properties. This checker’s Article profile still requires headline, datePublished, and author so the block identifies the piece. image is recommended, and a missing image does not fail the check.

**Fix:**

```
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your headline",
  "image": "https://example.com/cover.jpg",
  "datePublished": "2026-10-27",
  "dateModified": "2026-10-27",
  "author": { "@type": "Person", "name": "Author Name" }
}
</script>
```

**Sources:**
- Google: Article structured data (official): https://developers.google.com/search/docs/appearance/structured-data/article
- Schema.org: Article (official): https://schema.org/Article
- Google: intro to structured data (official): https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- MDN: JSON.parse (official): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse

## C07 Author and dates match the page — Pass

Weight: 1. Earned: 1.

**Why:** Visible author “José García” matches JSON-LD. datePublished 2026-01-15 and dateModified 2026-02-02 match the schema calendar days.

**Fix:**

```
<p>By <span itemprop="author">Ada Lovelace</span></p>
<p>Published <time itemprop="datePublished" datetime="2026-10-27">October 27, 2026</time></p>
<p>Updated <time itemprop="dateModified" datetime="2026-10-27">October 27, 2026</time></p>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your headline",
  "datePublished": "2026-10-27",
  "dateModified": "2026-10-27",
  "author": { "@type": "Person", "name": "Ada Lovelace" }
}
</script>
```

**Sources:**
- Google: Article structured data (official): https://developers.google.com/search/docs/appearance/structured-data/article
- Schema.org: Article (official): https://schema.org/Article

## C08 Extractable answer hints — Pass

Weight: 0.25. Earned: 0.25.

**Why:** Found 3 of 3 extractable-answer signals: a definition-style opening paragraph, a question heading (What is a widget?), a list or table. This check has a low weight (0.25 of 8.25). FAQPage JSON-LD does not add points. No FAQPage block was used. Google’s AI optimization guide says you do not need special markup, and you do not need to rewrite a page just for generative AI. These signals are hints for text extractors, not a citation score.

**Fix:**

```
<p>A widget is a reusable page element that ships its text in the HTML.</p>
<h2>What is a widget?</h2>
<ul>
  <li>One fact per item</li>
  <li>Another fact</li>
</ul>
```

**Sources:**
- Google: AI optimization guide (official): https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Schema.org: FAQPage (official): https://schema.org/FAQPage
- Google: helpful, reliable, people-first content (official): https://developers.google.com/search/docs/fundamentals/creating-helpful-content

## C09 Links to authoritative sources — Pass

Weight: 1. Earned: 1.

**Why:** Found 1 authoritative outbound link, including https://developer.mozilla.org/en-US/docs/Web/HTML. A link counts when it is http(s), its registrable site differs from this page, and its host is on the v1 authority list (for example wikipedia.org, developer.mozilla.org, developers.google.com, schema.org, w3.org) or ends in a government or education suffix such as .gov, .edu, .gov.uk, or .ac.uk. Same-site links do not count. nofollow links still count because the URL is in the HTML.

**Fix:**

```
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML">HTML on MDN</a>
```

**Sources:**
- Google: helpful, reliable, people-first content (official): https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- v1 authority host list and one-link threshold (heuristic): https://developers.google.com/search/docs/fundamentals/creating-helpful-content

## C10 llms.txt — Pass

Not scored (weight 0).

**Why:** llms.txt is present and starts with a Markdown H1. It is shown here and it is not scored. Google’s AI optimization guide says you do not need an llms.txt file (or other special AI markup) for Google Search, including its generative AI features, and that Google Search ignores it. Keeping a file for some other consumer neither helps nor hurts Google Search. This check never changes the score.

**Fix:**

```
# Site name

> One-sentence summary of the site.

## Docs

- [Guide](https://example.com/guide): What this page covers
```

**Sources:**
- Google: AI optimization guide (official): https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Ahrefs: llms.txt study (research): https://ahrefs.com/blog/llmstxt-study/
- llms.txt proposal (heuristic): https://llmstxt.org/

**llms.txt preview:**

```
# Example docs

> Widget handbook for the GEO checker fixture.

## Pages

- [Widget handbook](https://example.com/widget): What a widget is
```

## Source summary

- Official: 26
- Research: 1
- Heuristic: 3

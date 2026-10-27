import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const fixtures = path.join(root, "fixtures");

const article = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Widget handbook",
  image: "https://example.com/widget.jpg",
  datePublished: "2026-01-15",
  dateModified: "2026-02-02",
  author: { "@type": "Person", name: "José García" },
};

const validUnicodeArticle = {
  ...article,
  headline: "José 的文章：生成式优化",
};

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a widget?",
      acceptedAnswer: { "@type": "Answer", text: "A reusable page element." },
    },
  ],
};

const robotsAllow = `User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
`;

const robotsCloudflare = `# As a condition of accessing this website, you agree to abide by the
# following content signals:

# BEGIN Cloudflare Managed content

User-Agent: *
Content-signal: search=yes, ai-train=no
Allow: /

User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: meta-externalagent
Disallow: /

# END Cloudflare Managed Content
`;

const llmsOk = `# Example docs

> Widget handbook for the GEO checker fixture.

## Pages

- [Widget handbook](https://example.com/widget): What a widget is
`;

const llmsHtml = `<!DOCTYPE html>
<html><title>Not llms.txt</title><body>This is HTML.</body></html>
`;

const healthyBody = `<article>
    <h1>Widget handbook</h1>
    <p>A widget is a reusable page element whose text is present in the HTML response, not only after JavaScript runs.</p>
    <p>By <span itemprop="author">José García</span></p>
    <p>Published <time itemprop="datePublished" datetime="2026-01-15">January 15, 2026</time></p>
    <p>Updated <time itemprop="dateModified" datetime="2026-02-02">February 2, 2026</time></p>
    <h2>What is a widget?</h2>
    <ul>
      <li>The main text is in the first HTML response.</li>
      <li>Headings do not skip levels.</li>
    </ul>
    <h3>Why this matters</h3>
    <p>See the <a href="https://developer.mozilla.org/en-US/docs/Web/HTML">HTML documentation on MDN</a>.</p>
  </article>`;

function htmlPage({
  lang = "en",
  title = "Widget handbook",
  description = "A widget is a reusable page element shipped as HTML.",
  canonical = "https://example.com/widget",
  author = "José García",
  jsonLd = [article],
  extraHead = "",
  body = healthyBody,
  includeDescription = true,
  includeCanonical = true,
  includeTitle = true,
} = {}) {
  const langAttr = lang == null ? "" : ` lang="${lang}"`;
  const titleTag = includeTitle ? `<title>${title}</title>` : "";
  const descriptionTag = includeDescription
    ? `<meta name="description" content="${description}">`
    : "";
  const canonicalTag = includeCanonical ? `<link rel="canonical" href="${canonical}">` : "";
  const authorTag = author == null ? "" : `<meta name="author" content="${author}">`;
  const scripts = jsonLd
    .map(
      (block) =>
        `<script type="application/ld+json">\n${typeof block === "string" ? block : JSON.stringify(block, null, 2)}\n</script>`,
    )
    .join("\n");
  return `<!DOCTYPE html>
<html${langAttr}>
<head>
  <meta charset="utf-8">
  ${titleTag}
  ${descriptionTag}
  ${canonicalTag}
  ${authorTag}
  ${scripts}
  ${extraHead}
</head>
<body>
  ${body}
</body>
</html>
`;
}

const shell = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Widget handbook</title>
  <meta name="description" content="A widget is a reusable page element shipped as HTML.">
  <link rel="canonical" href="https://example.com/widget">
  <meta name="author" content="José García">
</head>
<body>
  <div id="app"></div>
  <script>
    document.getElementById("app").innerHTML = "<h1>Widget handbook</h1><p>This product copy is injected by JavaScript only.</p>";
  </script>
</body>
</html>
`;

const skipBody = `<article>
    <h1>Widget handbook</h1>
    <p>A widget is a reusable page element whose text is present in the HTML response, not only after JavaScript runs.</p>
    <p>By <span itemprop="author">José García</span></p>
    <p>Published <time itemprop="datePublished" datetime="2026-01-15">January 15, 2026</time></p>
    <p>Updated <time itemprop="dateModified" datetime="2026-02-02">February 2, 2026</time></p>
    <h2>Maintenance notes</h2>
    <h4>Skipped level</h4>
    <ul>
      <li>The main text is in the first HTML response.</li>
      <li>Headings do not skip levels.</li>
    </ul>
    <p>See the <a href="https://developer.mozilla.org/en-US/docs/Web/HTML">HTML documentation on MDN</a>.</p>
  </article>`;

const c08Body = `<article>
    <h1>Widget handbook</h1>
    <p>This handbook records maintenance notes for editors who ship the words in HTML.</p>
    <p>By <span itemprop="author">José García</span></p>
    <p>Published <time itemprop="datePublished" datetime="2026-01-15">January 15, 2026</time></p>
    <p>Updated <time itemprop="dateModified" datetime="2026-02-02">February 2, 2026</time></p>
    <h2>Maintenance notes</h2>
    <h3>Schedule</h3>
    <p>See the <a href="https://developer.mozilla.org/en-US/docs/Web/HTML">HTML documentation on MDN</a>.</p>
  </article>`;

const mismatchBody = `<article>
    <h1>Widget handbook</h1>
    <p>A widget is a reusable page element whose text is present in the HTML response, not only after JavaScript runs.</p>
    <p>By <span itemprop="author">John Smith</span></p>
    <p>Published <time itemprop="datePublished" datetime="2024-05-05">May 5, 2024</time></p>
    <p>Updated <time itemprop="dateModified" datetime="2024-06-06">June 6, 2024</time></p>
    <h2>What is a widget?</h2>
    <ul>
      <li>The main text is in the first HTML response.</li>
      <li>Headings do not skip levels.</li>
    </ul>
    <h3>Why this matters</h3>
    <p>See the <a href="https://developer.mozilla.org/en-US/docs/Web/HTML">HTML documentation on MDN</a>.</p>
  </article>`;

const noAuthorityBody = healthyBody.replace(
  "https://developer.mozilla.org/en-US/docs/Web/HTML",
  "https://shop.example.org/widgets",
).replace("HTML documentation on MDN", "a shop page");

const mojibakeArticle = {
  ...article,
  headline: "JosÃ© GarcÃ­a handbook",
  author: { "@type": "Person", name: "JosÃ© GarcÃ­a" },
};

const cases = [
  {
    id: "healthy",
    rendered: htmlPage(),
    robots: robotsAllow,
    llms: llmsOk,
    expect: all("pass"),
  },
  {
    id: "c01-js-only",
    rendered: htmlPage(),
    raw: shell,
    robots: robotsAllow,
    llms: llmsOk,
    expect: all("pass", { C01: "fail" }),
    whyIncludes: { C01: ["JavaScript", "original HTML"] },
  },
  {
    id: "c02-gptbot-cloudflare",
    rendered: htmlPage(),
    robots: robotsCloudflare,
    llms: llmsOk,
    expect: all("pass", { C02: "fail" }),
    whyIncludes: { C02: ["GPTBot", "Cloudflare", "OAI-SearchBot", "Training crawlers", "Search crawlers"] },
  },
  {
    id: "c03-robots-directives",
    rendered: htmlPage({
      extraHead: '<meta name="robots" content="noindex, nosnippet, max-snippet:0">',
    }),
    robots: robotsAllow,
    llms: llmsOk,
    xRobotsTag: "googlebot: noindex, nosnippet, max-snippet:0",
    expect: all("pass", { C03: "fail" }),
    whyIncludes: { C03: ["noindex", "nosnippet", "max-snippet:0"] },
  },
  {
    id: "c04-missing-metadata",
    rendered: htmlPage({
      lang: null,
      includeTitle: true,
      title: "   ",
      includeDescription: false,
      includeCanonical: false,
    }),
    robots: robotsAllow,
    llms: llmsOk,
    expect: all("pass", { C04: "fail" }),
    whyIncludes: { C04: ["title", "meta description", "canonical", "lang"] },
  },
  {
    id: "c05-skipped-heading",
    rendered: htmlPage({ body: skipBody }),
    robots: robotsAllow,
    llms: llmsOk,
    expect: all("pass", { C05: "fail" }),
    whyIncludes: { C05: ["h2 → h4", "Exactly one H1"] },
  },
  {
    id: "c06-invalid-and-article",
    rendered: htmlPage({
      jsonLd: [
        '{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  headline: "broken quotes"\n}',
        validUnicodeArticle,
      ],
    }),
    robots: robotsAllow,
    llms: llmsOk,
    expect: all("pass", { C06: "fail" }),
    whyIncludes: { C06: ["parse error", "José 的文章：生成式优化", "no required Article properties"] },
  },
  {
    id: "c06-mojibake",
    rendered: htmlPage({
      author: "JosÃ© GarcÃ­a",
      body: healthyBody.replaceAll("José García", "JosÃ© GarcÃ­a"),
      jsonLd: [mojibakeArticle],
    }),
    robots: robotsAllow,
    llms: llmsOk,
    expect: all("pass", { C06: "fail" }),
    whyIncludes: { C06: ["mojibake", "UTF-8"] },
  },
  {
    id: "c07-author-date-mismatch",
    rendered: htmlPage({ author: "John Smith", body: mismatchBody }),
    robots: robotsAllow,
    llms: llmsOk,
    expect: all("pass", { C07: "fail" }),
    whyIncludes: { C07: ["José García", "John Smith", "2026-01-15", "2024-05-05"] },
  },
  {
    id: "c08-faq-schema-ignored",
    rendered: htmlPage({ body: c08Body, jsonLd: [article, faq] }),
    robots: robotsAllow,
    llms: llmsOk,
    expect: all("pass", { C08: "fail" }),
    whyIncludes: {
      C08: ["low weight (0.25 of 8.25)", "FAQPage JSON-LD does not add points", "ignored"],
    },
  },
  {
    id: "c09-no-authority-link",
    rendered: htmlPage({ body: noAuthorityBody }),
    robots: robotsAllow,
    llms: llmsOk,
    expect: all("pass", { C09: "fail" }),
    whyIncludes: { C09: ["authoritative", "wikipedia.org"] },
  },
  {
    id: "c10-absent",
    rendered: htmlPage(),
    robots: robotsAllow,
    expect: all("pass"),
    whyIncludes: { C10: ["do not need an llms.txt", "never changes the score"] },
  },
  {
    id: "c10-invalid",
    rendered: htmlPage(),
    robots: robotsAllow,
    llms: llmsHtml,
    expect: all("pass", { C10: "fail" }),
    whyIncludes: { C10: ["never changes the score", "Markdown H1"] },
  },
];

function all(status, overrides = {}) {
  const ids = ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09", "C10"];
  return Object.fromEntries(ids.map((id) => [id, overrides[id] || status]));
}

for (const item of cases) {
  const dir = path.join(fixtures, item.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "rendered.html"), item.rendered);
  if (item.raw) writeFileSync(path.join(dir, "raw.html"), item.raw);
  if (item.robots) writeFileSync(path.join(dir, "robots.txt"), item.robots);
  if (item.llms) writeFileSync(path.join(dir, "llms.txt"), item.llms);
  writeFileSync(
    path.join(dir, "case.json"),
    `${JSON.stringify(
      {
        id: item.id,
        pageUrl: "https://example.com/widget",
        xRobotsTag: item.xRobotsTag ?? null,
        expect: item.expect,
        whyIncludes: item.whyIncludes ?? {},
        comment: "GEO checker fixture page. Not a product landing page.",
      },
      null,
      2,
    )}\n`,
  );
}

console.log(`Wrote ${cases.length} fixtures`);

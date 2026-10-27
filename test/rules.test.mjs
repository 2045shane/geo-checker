import assert from "node:assert/strict";
import test from "node:test";
import { parseHTML } from "linkedom";
import { checkPage } from "../src/checker.js";
import { looksMojibake } from "../src/jsonld.js";
import { detectCloudflare, isAllowed, parseRobots } from "../src/robots.js";
import { maxWeight } from "../src/score.js";

const allowAll = "User-agent: *\nAllow: /\n";

test("robots.txt prefers the specific agent and lets Allow win equal-length ties", () => {
  const groups = parseRobots(`User-agent: *\nDisallow: /\n\nUser-agent: GPTBot\nAllow: /\nDisallow: /\n`);
  assert.equal(isAllowed(groups, "GPTBot", "/widget"), true);
  assert.equal(isAllowed(groups, "OAI-SearchBot", "/widget"), false);

  const longest = parseRobots(`User-agent: GPTBot\nDisallow: /\nAllow: /widget\n`);
  assert.equal(isAllowed(longest, "GPTBot", "/widget"), true);
  assert.equal(isAllowed(longest, "GPTBot", "/other"), false);
});

test("Cloudflare managed sample is detected and blocks GPTBot only in the training group", () => {
  const text = `User-agent: *\nAllow: /\nUser-agent: GPTBot\nDisallow: /\n# BEGIN Cloudflare Managed content\nContent-signal: ai-train=no\n# END Cloudflare Managed Content\n`;
  const found = detectCloudflare(text);
  assert.equal(found.detected, true);
  assert.equal(isAllowed(parseRobots(text), "GPTBot", "/"), false);
  assert.equal(isAllowed(parseRobots(text), "OAI-SearchBot", "/"), true);
});

test("mojibake detector leaves real Unicode alone", () => {
  assert.equal(looksMojibake("José García"), false);
  assert.equal(looksMojibake("生成式引擎优化"), false);
  assert.equal(looksMojibake("JosÃ©"), true);
  assert.equal(looksMojibake("ä¸­文"), true);
});

test("max-snippet:-1 passes and a positive cap is reported without failing", () => {
  const unlimited = check(page(""), { xRobotsTag: "max-snippet:-1" });
  assert.equal(status(unlimited, "C03"), "pass");
  const capped = check(page('<meta name="robots" content="max-snippet:40">'));
  assert.equal(status(capped, "C03"), "pass");
  assert.equal(capped.checks.find((check) => check.id === "C03").details.maxSnippet, 40);
  const blocked = check(page(""), { xRobotsTag: "noindex" });
  assert.equal(status(blocked, "C03"), "fail");
});

test("two H1 elements fail even when levels do not skip", () => {
  const html = page("").replace("<h1>Widget handbook</h1>", "<h1>Widget handbook</h1><h1>Second</h1>");
  assert.equal(status(check(html), "C05"), "fail");
});

test("a relative canonical fails basic validity", () => {
  const html = page("").replace('href="https://example.com/widget"', 'href="/widget"');
  assert.equal(status(check(html), "C04"), "fail");
});

test("weights sum to 8.25 and C10 cannot move the score", () => {
  assert.equal(maxWeight(), 8.25);
  const base = check(page(""));
  const malformed = check(page(""), { llmsTxt: "<html></html>", llmsStatus: 200 });
  assert.equal(malformed.score, base.score);
  assert.equal(malformed.checks.find((check) => check.id === "C10").weight, 0);
});

test("missing raw HTML fails C01 instead of pretending the DOM is the response", () => {
  const result = check(page(""), { rawDocument: null, rawError: "blocked" });
  assert.equal(status(result, "C01"), "fail");
  assert.match(result.checks.find((check) => check.id === "C01").why, /blocked/);
});

function page(extraHead) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Widget handbook</title>
    <meta name="description" content="A widget is a reusable page element shipped as HTML.">
    <link rel="canonical" href="https://example.com/widget"><meta name="author" content="José García">${extraHead}
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Widget handbook",
      datePublished: "2026-01-15",
      dateModified: "2026-02-02",
      author: { "@type": "Person", name: "José García" },
    })}</script></head><body>
    <h1>Widget handbook</h1>
    <p>A widget is a reusable page element whose text is present in the HTML response, not only after JavaScript runs.</p>
    <p>By <span itemprop="author">José García</span></p>
    <p>Published <time itemprop="datePublished" datetime="2026-01-15">January 15, 2026</time></p>
    <p>Updated <time itemprop="dateModified" datetime="2026-02-02">February 2, 2026</time></p>
    <h2>What is a widget?</h2>
    <ul><li>One</li><li>Two</li></ul>
    <p><a href="https://developer.mozilla.org/en-US/docs/Web/HTML">MDN</a></p>
    </body></html>`;
}

function check(html, extras = {}) {
  const { document } = parseHTML(html);
  return checkPage(document, {
    rawDocument: extras.rawDocument === null ? null : document,
    pageUrl: "https://example.com/widget",
    robotsTxt: allowAll,
    robotsStatus: 200,
    llmsTxt: "# Docs\n\n> Hello\n",
    llmsStatus: 200,
    now: "2026-10-27T02:00:00.000Z",
    rawError: extras.rawError ?? null,
    xRobotsTag: extras.xRobotsTag ?? null,
    ...extras,
    rawDocument: extras.rawDocument === null ? null : extras.rawDocument ?? document,
  });
}

function status(result, id) {
  return result.checks.find((check) => check.id === id).status;
}

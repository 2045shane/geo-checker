import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { parseHTML } from "linkedom";
import { checkPage } from "../src/checker.js";
import { buildMarkdown } from "../src/report.js";
import { fixtureIds, root, runFixture } from "../scripts/load-fixture.mjs";

const outputDir = path.join(root, "testdata", "fixture-output");

test("every fixture matches its expected pass/fail map", () => {
  mkdirSync(outputDir, { recursive: true });
  const summary = [];
  for (const id of fixtureIds()) {
    const { meta, result } = runFixture(id);
    const actual = Object.fromEntries(result.checks.map((check) => [check.id, check.status]));
    assert.deepEqual(actual, meta.expect, id);
    for (const [checkId, needles] of Object.entries(meta.whyIncludes || {})) {
      const why = result.checks.find((check) => check.id === checkId).why;
      for (const needle of needles) {
        assert.ok(why.includes(needle), `${id} ${checkId} why missing “${needle}”\n${why}`);
      }
    }
    for (const check of result.checks) {
      assert.ok(check.why.length > 20, `${id} ${check.id} why`);
      assert.ok(check.fix.includes("\n") || check.fix.length > 10, `${id} ${check.id} fix`);
      assert.ok(check.sources.length > 0, `${id} ${check.id} sources`);
    }
    writeFileSync(path.join(outputDir, `${id}.json`), `${JSON.stringify(result, null, 2)}\n`);
    summary.push({
      id,
      score: result.score,
      earnedWeight: result.earnedWeight,
      maxWeight: result.maxWeight,
      status: actual,
    });
  }
  writeFileSync(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  const healthy = summary.find((item) => item.id === "healthy");
  const low = summary.find((item) => item.id === "c08-faq-schema-ignored");
  const absent = summary.find((item) => item.id === "c10-absent");
  const invalidLlms = summary.find((item) => item.id === "c10-invalid");
  assert.equal(healthy.score, 100);
  assert.equal(healthy.earnedWeight, 8.25);
  assert.equal(low.score, 97);
  assert.equal(low.earnedWeight, 8);
  assert.equal(absent.score, 100);
  assert.equal(invalidLlms.score, 100);
  assert.equal(invalidLlms.earnedWeight, 8.25);
});

test("FAQPage JSON-LD does not change C08 or the score", () => {
  const withFaq = runFixture("c08-faq-schema-ignored");
  const c08 = withFaq.result.checks.find((check) => check.id === "C08");
  assert.equal(c08.details.faqSchemaPresent, true);
  assert.equal(c08.details.faqSchemaAddsPoints, false);
  assert.equal(c08.weight, 0.25);
  assert.equal(c08.earned, 0);

  const { document } = parseHTML(withFaq.renderedHtml);
  for (const script of [...document.querySelectorAll("script")]) {
    if ((script.textContent || "").includes("FAQPage")) script.remove();
  }
  const without = checkPage(document, {
    rawDocument: parseHTML(withFaq.rawHtml).document,
    pageUrl: "https://example.com/widget",
    robotsTxt: readFileSync(path.join(root, "fixtures/c08-faq-schema-ignored/robots.txt"), "utf8"),
    robotsStatus: 200,
    llmsTxt: readFileSync(path.join(root, "fixtures/c08-faq-schema-ignored/llms.txt"), "utf8"),
    llmsStatus: 200,
    now: "2026-10-27T02:00:00.000Z",
  });
  assert.equal(without.checks.find((check) => check.id === "C08").status, "fail");
  assert.equal(without.checks.find((check) => check.id === "C08").details.faqSchemaPresent, false);
  assert.equal(without.score, withFaq.result.score);
});

test("C06 keeps CJK and diacritics from the valid Article block", () => {
  const { result } = runFixture("c06-invalid-and-article");
  const c06 = result.checks.find((check) => check.id === "C06");
  const headlines = c06.details.nodes.map((node) => node.headline);
  assert.ok(headlines.includes("José 的文章：生成式优化"));
  assert.deepEqual(c06.details.mojibake, []);
});

test("C10 absence and a malformed file leave the score unchanged", () => {
  const healthy = runFixture("healthy").result;
  const absent = runFixture("c10-absent").result;
  const invalid = runFixture("c10-invalid").result;
  assert.equal(absent.checks.find((check) => check.id === "C10").details.present, false);
  assert.equal(absent.checks.find((check) => check.id === "C10").scored, false);
  assert.equal(healthy.checks.find((check) => check.id === "C10").details.present, true);
  assert.equal(healthy.checks.find((check) => check.id === "C10").scored, false);
  assert.equal(invalid.checks.find((check) => check.id === "C10").status, "fail");
  assert.equal(invalid.score, healthy.score);
  assert.equal(absent.score, healthy.score);
});

test("markdown report includes positioning, every check, and a source summary", () => {
  const { result } = runFixture("healthy");
  const markdown = buildMarkdown(result);
  assert.match(markdown, /Can AI crawlers actually read this page\?/);
  for (const check of result.checks) assert.match(markdown, new RegExp(`## ${check.id} `));
  assert.match(markdown, /## Source summary/);
  assert.match(markdown, /Not scored \(weight 0\)/);
  writeFileSync(path.join(root, "testdata", "sample-report.md"), markdown);
});

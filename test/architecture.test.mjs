import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { collectPageEvidence } from "../src/collect-page.js";
import { POSITIONING } from "../src/positioning.js";

const root = path.resolve(import.meta.dirname, "..");

test("manifest is MV3 with only activeTab and scripting", () => {
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ["activeTab", "scripting"]);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.optional_host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
  assert.equal(manifest.background, undefined);
  assert.equal(manifest.description, POSITIONING);
});

test("popup calls the shared checker and does not embed a second ruleset", () => {
  const popup = readFileSync(path.join(root, "popup.js"), "utf8");
  const render = readFileSync(path.join(root, "src/render.js"), "utf8");
  const report = readFileSync(path.join(root, "src/report.js"), "utf8");
  assert.match(popup, /from "\.\/src\/checker\.js"/);
  for (const source of [popup, render, report]) {
    assert.equal(source.includes("GPTBot"), false, source.slice(0, 40));
    assert.equal(source.includes("max-snippet"), false);
    assert.equal(source.includes("FAQPage"), false);
    assert.equal(source.includes("datePublished"), false);
  }
});

test("product copy has no account or pricing pitch", () => {
  const files = ["popup.html", "popup.js", "popup.css", "src/render.js", "src/collect-page.js"];
  const banned = [/sign in/i, /log in/i, /create an account/i, /\bupgrade\b/i, /\bpricing\b/i, /\bsubscribe\b/i, /go pro/i];
  const analytics = ["google-analytics", "googletagmanager", "doubleclick", "mixpanel", "sentry.io", "posthog", "segment.io"];
  for (const file of files) {
    const text = readFileSync(path.join(root, file), "utf8");
    for (const pattern of banned) assert.equal(pattern.test(text), false, `${file} ${pattern}`);
    for (const host of analytics) assert.equal(text.includes(host), false, `${file} ${host}`);
  }
  const html = readFileSync(path.join(root, "popup.html"), "utf8");
  assert.ok(html.includes(POSITIONING));
  const readme = readFileSync(path.join(root, "README.md"), "utf8");
  assert.ok(readme.includes(POSITIONING));
});

test("the injected collector is self-contained", () => {
  const source = collectPageEvidence.toString();
  assert.match(source, /async function readSameOrigin/);
  assert.equal(source.includes("https://"), false);
});

test("runtime files do not fetch third-party hosts", () => {
  const files = ["popup.js", "src/collect-page.js", "src/render.js", "src/checker.js"];
  for (const file of files) {
    const text = readFileSync(path.join(root, file), "utf8");
    assert.equal(/https?:\/\//.test(text), false, file);
  }
});

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { parseHTML } from "linkedom";
import { checkPage } from "../src/checker.js";

export const root = path.resolve(import.meta.dirname, "..");
export const fixturesDir = path.join(root, "fixtures");

export function fixtureIds() {
  return readdirSync(fixturesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function runFixture(id) {
  const dir = path.join(fixturesDir, id);
  const meta = JSON.parse(readFileSync(path.join(dir, "case.json"), "utf8"));
  const renderedHtml = readFileSync(path.join(dir, "rendered.html"), "utf8");
  const rawPath = path.join(dir, "raw.html");
  const robotsPath = path.join(dir, "robots.txt");
  const llmsPath = path.join(dir, "llms.txt");
  const rawHtml = existsSync(rawPath) ? readFileSync(rawPath, "utf8") : renderedHtml;
  const robotsTxt = existsSync(robotsPath) ? readFileSync(robotsPath, "utf8") : null;
  const llmsTxt = existsSync(llmsPath) ? readFileSync(llmsPath, "utf8") : null;
  const { document } = parseHTML(renderedHtml);
  const raw = parseHTML(rawHtml);
  const result = checkPage(document, {
    rawDocument: meta.rawDocument === null ? null : raw.document,
    pageUrl: meta.pageUrl,
    xRobotsTag: meta.xRobotsTag,
    robotsTxt,
    robotsStatus: robotsTxt == null ? 404 : 200,
    llmsTxt,
    llmsStatus: llmsTxt == null ? 404 : 200,
    now: "2026-10-27T02:00:00.000Z",
  });
  return { meta, result, renderedHtml, rawHtml };
}

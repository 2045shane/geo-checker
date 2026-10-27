import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { root, runFixture } from "./load-fixture.mjs";
import { screenshotReport, startPreviewServer } from "./preview.mjs";

const shots = [
  ["healthy", "ux-healthy.png"],
  ["c01-js-only", "c01-fail.png"],
  ["c02-gptbot-cloudflare", "c02-cloudflare.png"],
  ["c03-robots-directives", "c03-fail.png"],
  ["c04-missing-metadata", "c04-fail.png"],
  ["c05-skipped-heading", "c05-fail.png"],
  ["c06-invalid-and-article", "c06-fail.png"],
  ["c07-author-date-mismatch", "c07-fail.png"],
  ["c08-faq-schema-ignored", "c08-low-weight.png"],
  ["c09-no-authority-link", "c09-fail.png"],
  ["c10-absent", "c10-absent.png"],
  ["c10-invalid", "c10-invalid-unscored.png"],
];

const outDir = path.join(root, "testdata", "screenshots");
mkdirSync(outDir, { recursive: true });
const chrome = process.env.CHROME_PATH || "/usr/local/bin/google-chrome";

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const { server, origin } = await startPreviewServer(root);

try {
  await assertBrowserParity(browser, origin);
  for (const [id, name] of shots) {
    const { result } = runFixture(id);
    await screenshotReport(browser, origin, result, path.join(outDir, name));
    console.log(name);
  }
  await tryUnpackedLoad(chrome);
} finally {
  await browser.close();
  server.close();
}

async function assertBrowserParity(browser, origin) {
  const healthy = runFixture("healthy");
  const robotsTxt = readFileSync(path.join(root, "fixtures/healthy/robots.txt"), "utf8");
  const llmsTxt = readFileSync(path.join(root, "fixtures/healthy/llms.txt"), "utf8");
  const page = await browser.newPage();
  await page.goto(`${origin}/popup.html`, { waitUntil: "domcontentloaded" });
  const browserResult = await page.evaluate(
    async ({ renderedHtml, rawHtml, robots, llms }) => {
      const { checkPage } = await import("/src/checker.js");
      const rendered = new DOMParser().parseFromString(renderedHtml, "text/html");
      const raw = new DOMParser().parseFromString(rawHtml, "text/html");
      const result = checkPage(rendered, {
        rawDocument: raw,
        pageUrl: "https://example.com/widget",
        robotsTxt: robots,
        robotsStatus: 200,
        llmsTxt: llms,
        llmsStatus: 200,
        now: "2026-10-27T02:00:00.000Z",
      });
      return {
        score: result.score,
        status: Object.fromEntries(result.checks.map((check) => [check.id, check.status])),
      };
    },
    {
      renderedHtml: healthy.renderedHtml,
      rawHtml: healthy.rawHtml,
      robots: robotsTxt,
      llms: llmsTxt,
    },
  );
  await page.close();
  const nodeStatus = Object.fromEntries(healthy.result.checks.map((check) => [check.id, check.status]));
  if (browserResult.score !== healthy.result.score || JSON.stringify(browserResult.status) !== JSON.stringify(nodeStatus)) {
    throw new Error(`Browser checker diverged from Node: ${JSON.stringify({ browserResult, nodeStatus })}`);
  }
  writeFileSync(
    path.join(root, "testdata", "browser-parity.json"),
    `${JSON.stringify({ matchesNode: true, score: browserResult.score, status: browserResult.status }, null, 2)}\n`,
  );
}

async function tryUnpackedLoad(chromePath) {
  const notePath = path.join(root, "testdata", "extension-load.json");
  let extensionBrowser;
  try {
    extensionBrowser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        `--disable-extensions-except=${root}`,
        `--load-extension=${root}`,
      ],
    });
    const page = await extensionBrowser.newPage();
    await page.goto("chrome://extensions", { waitUntil: "domcontentloaded", timeout: 15000 });
    const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
    writeFileSync(notePath, `${JSON.stringify({ loaded: true, extensionsPageSnippet: text }, null, 2)}\n`);
  } catch (error) {
    writeFileSync(
      notePath,
      `${JSON.stringify({ loaded: false, error: error instanceof Error ? error.message : String(error) }, null, 2)}\n`,
    );
  } finally {
    await extensionBrowser?.close();
  }
}

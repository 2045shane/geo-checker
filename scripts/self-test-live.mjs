import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseHTML } from "linkedom";
import puppeteer from "puppeteer-core";
import { collectPageEvidence } from "../src/collect-page.js";
import { checkPage } from "../src/checker.js";
import { root } from "./load-fixture.mjs";
import { screenshotReport, startPreviewServer } from "./preview.mjs";

const slots = [
  {
    category: "GitHub Pages",
    candidates: ["https://2045shane.github.io/", "https://2045shane.github.io/ai-demos/", "https://pages.github.com/"],
  },
  {
    category: "Big site",
    candidates: ["https://developer.mozilla.org/en-US/docs/Web/HTML", "https://www.wikipedia.org/"],
  },
  {
    category: "Big site",
    candidates: ["https://en.wikipedia.org/wiki/Robots.txt", "https://www.wikipedia.org/"],
  },
  {
    category: "Big site",
    candidates: ["https://www.nasa.gov/", "https://www.bbc.com/news"],
  },
  {
    category: "Small blog",
    candidates: ["https://jvns.ca/", "https://rachelbythebay.com/"],
  },
  {
    category: "Small blog",
    candidates: ["https://overreacted.io/", "https://jakearchibald.com/"],
  },
  {
    category: "Small blog",
    candidates: ["https://danluu.com/", "https://lea.verou.me/"],
  },
  {
    category: "Competitor",
    candidates: ["https://geochecker.app/", "https://www.geochecker.app/"],
  },
  {
    category: "Competitor",
    candidates: ["https://geochecker.net/", "https://www.geochecker.net/"],
  },
  {
    category: "Competitor",
    candidates: ["https://otterly.ai/", "https://www.tryprofound.com/", "https://llmstxthub.com/"],
  },
];

const shotDir = path.join(root, "testdata", "screenshots", "self-test");
const dataDir = path.join(root, "testdata", "self-test");
mkdirSync(shotDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

const checkedAt = new Date();
const shanghaiDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(checkedAt);
const shanghaiStamp = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
}).format(checkedAt);

const chrome = process.env.CHROME_PATH || "/usr/local/bin/google-chrome";
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
});
const { server, origin } = await startPreviewServer(root);
const rows = [];

try {
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const row = await captureSlot(browser, origin, slot, index + 1);
    rows.push(row);
    const detail = row.outcome === "captured" ? row.score : `${row.outcome} ${row.error || ""}`;
    console.log(`${index + 1} ${row.category} ${row.url || "not captured"} ${detail}`);
  }
} finally {
  await browser.close();
  server.close();
}

writeFileSync(path.join(root, "testdata", "SELF_TEST.md"), renderChecklist(rows));

async function captureSlot(browser, previewOrigin, slot, index) {
  const attempts = [];
  for (const url of slot.candidates) {
    const attempt = await captureUrl(browser, previewOrigin, url, index);
    attempts.push({ url, outcome: attempt.outcome, error: attempt.error || null });
    if (attempt.outcome === "captured") {
      return { ...attempt, category: slot.category, index, attempts, date: shanghaiDate };
    }
  }
  return {
    category: slot.category,
    index,
    outcome: "not-captured",
    url: null,
    score: null,
    fails: null,
    screenshot: null,
    attempts,
    date: shanghaiDate,
    error: "Every candidate failed or returned an interstitial. No score was invented.",
  };
}

async function captureUrl(browser, previewOrigin, url, index) {
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  );
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 8000 }).catch(() => {});
    const status = response?.status() ?? null;
    const probe = await page.evaluate(() => ({
      title: document.title,
      text: (document.body?.innerText || "").slice(0, 400),
    }));
    if (status != null && status >= 400) {
      return { outcome: "http-error", error: `HTTP ${status}`, url };
    }
    if (isInterstitial(probe.title, probe.text)) {
      return { outcome: "interstitial", error: `Interstitial or challenge: ${probe.title || probe.text.slice(0, 80)}`, url };
    }
    const evidence = await page.evaluate(collectPageEvidence);
    if (!evidence?.renderedHtml) return { outcome: "empty", error: "No rendered HTML", url };
    const rendered = parseHTML(evidence.renderedHtml).document;
    const raw = evidence.rawHtml ? parseHTML(evidence.rawHtml).document : null;
    const result = checkPage(rendered, {
      ...evidence,
      rawDocument: raw,
      now: checkedAt.toISOString(),
    });
    const slug = `${String(index).padStart(2, "0")}-${new URL(url).hostname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`;
    const screenshot = `testdata/screenshots/self-test/${slug}.png`;
    const jsonPath = path.join(dataDir, `${slug}.json`);
    const fails = result.checks.filter((check) => check.status === "fail").map((check) => check.id);
    const saved = {
      url,
      date: shanghaiDate,
      checkedAt: shanghaiStamp,
      timezone: "Asia/Shanghai",
      score: result.score,
      earnedWeight: result.earnedWeight,
      maxWeight: result.maxWeight,
      fails,
      checks: result.checks.map((check) => ({
        id: check.id,
        status: check.status,
        weight: check.weight,
        earned: check.earned,
        scored: check.scored,
        why: check.why,
      })),
    };
    writeFileSync(jsonPath, `${JSON.stringify(saved, null, 2)}\n`);
    await screenshotReport(browser, previewOrigin, result, path.join(root, screenshot));
    return {
      outcome: "captured",
      url,
      score: result.score,
      fails,
      screenshot,
      json: `testdata/self-test/${slug}.json`,
      title: probe.title,
    };
  } catch (error) {
    return { outcome: "error", error: error instanceof Error ? error.message : String(error), url };
  } finally {
    await page.close().catch(() => {});
  }
}

function isInterstitial(title, text) {
  const blob = `${title}\n${text}`.toLowerCase();
  return /just a moment|attention required|cf-browser-verification|verify you are human|enable javascript and cookies|captcha|access denied|are you a robot/.test(blob);
}

function renderChecklist(rows) {
  const lines = [
    "# GEO Checker self-test",
    "",
    `Date (Asia/Shanghai): ${shanghaiDate}`,
    `Recorded at: ${shanghaiStamp} (Asia/Shanghai)`,
    "",
    "Method: Chrome on this machine opened each URL, ran `collectPageEvidence` in the page (same-origin refetch, `/robots.txt`, `/llms.txt`), then ran `checkPage` from `src/checker.js`. The popup screenshot is `popup.html` rendered with that JSON result. Scores below were produced by that run. Rows marked not captured have no score.",
    "",
    "This is not a substitute for clicking the toolbar icon on your own machine. Load unpacked steps are in the README. If a live site blocked the cloud VM, the attempt log says so and the score cell is empty.",
    "",
    "| # | Category | URL | Date | Score | Fails | Screenshot |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const row of rows) {
    if (row.outcome === "captured") {
      lines.push(
        `| ${row.index} | ${row.category} | ${row.url} | ${row.date} | ${row.score}/100 | ${row.fails.length ? row.fails.join(", ") : "none"} | ${row.screenshot} |`,
      );
    } else {
      lines.push(`| ${row.index} | ${row.category} | not captured | ${row.date} |  |  |  |`);
    }
  }
  lines.push("", "## Attempt log", "");
  for (const row of rows) {
    lines.push(`### ${row.index}. ${row.category}`);
    lines.push("");
    if (row.outcome === "captured") {
      lines.push(`- Captured: ${row.url}`);
      lines.push(`- Title: ${row.title || ""}`);
      lines.push(`- Score: ${row.score}/100`);
      lines.push(`- Fails: ${row.fails.length ? row.fails.join(", ") : "none"}`);
      lines.push(`- JSON: ${row.json}`);
      lines.push(`- Screenshot: ${row.screenshot}`);
    } else {
      lines.push(`- Not captured. ${row.error}`);
    }
    for (const attempt of row.attempts) {
      lines.push(`- Attempt ${attempt.url}: ${attempt.outcome}${attempt.error ? ` — ${attempt.error}` : ""}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

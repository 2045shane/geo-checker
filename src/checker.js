import { run as c01 } from "./checks/c01.js";
import { run as c02 } from "./checks/c02.js";
import { run as c03 } from "./checks/c03.js";
import { run as c04 } from "./checks/c04.js";
import { run as c05 } from "./checks/c05.js";
import { run as c06 } from "./checks/c06.js";
import { run as c07 } from "./checks/c07.js";
import { run as c08 } from "./checks/c08.js";
import { run as c09 } from "./checks/c09.js";
import { run as c10 } from "./checks/c10.js";
import { POSITIONING } from "./positioning.js";
import { CHECKS, WEIGHTS, scoreFromChecks } from "./score.js";

const RUNNERS = [c01, c02, c03, c04, c05, c06, c07, c08, c09, c10];
const CONFIDENCE = new Set(["official", "research", "heuristic"]);

/**
 * Run the locked v1 checks.
 * @param {Document} document Rendered DOM.
 * @param {object} extras Same-origin evidence collected after the user click.
 * @param {Document|null} [extras.rawDocument] Parsed original HTML response.
 * @param {string|null} [extras.robotsTxt]
 * @param {string|null} [extras.llmsTxt]
 * @returns {object} JSON-serializable result. Dates and node lists are plain data.
 */
export function checkPage(document, extras = {}) {
  if (!document || typeof document.querySelectorAll !== "function") {
    throw new TypeError("checkPage expects a Document");
  }

  const ctx = {
    document,
    rawDocument: extras.rawDocument ?? null,
    pageUrl: extras.pageUrl ?? "",
    xRobotsTag: extras.xRobotsTag ?? null,
    robotsTxt: extras.robotsTxt ?? null,
    robotsStatus: extras.robotsStatus ?? null,
    robotsError: extras.robotsError ?? null,
    llmsTxt: extras.llmsTxt ?? null,
    llmsStatus: extras.llmsStatus ?? null,
    llmsError: extras.llmsError ?? null,
    rawError: extras.rawError ?? null,
    rawStatus: extras.rawStatus ?? null,
    now: extras.now ?? new Date().toISOString(),
  };

  const checks = RUNNERS.map((run) => finalize(run(ctx)));
  const ids = checks.map((check) => check.id);
  if (ids.join(",") !== CHECKS.map((check) => check.id).join(",")) {
    throw new Error(`Checker returned unexpected ids: ${ids.join(",")}`);
  }

  return {
    version: 1,
    positioning: POSITIONING,
    pageUrl: ctx.pageUrl || null,
    checkedAt: ctx.now,
    ...scoreFromChecks(checks),
    checks,
  };
}

function finalize(check) {
  if (!WEIGHTS[check.id] && WEIGHTS[check.id] !== 0) {
    throw new Error(`Unknown check id ${check.id}`);
  }
  if (check.status !== "pass" && check.status !== "fail") {
    throw new Error(`${check.id} status must be pass or fail`);
  }
  if (!check.why || !check.fix) throw new Error(`${check.id} needs why and fix`);
  if (!Array.isArray(check.sources) || check.sources.length === 0) {
    throw new Error(`${check.id} needs sources`);
  }
  for (const source of check.sources) {
    if (!CONFIDENCE.has(source.confidence)) {
      throw new Error(`${check.id} has invalid confidence ${source.confidence}`);
    }
    if (!/^https:\/\//.test(source.url)) throw new Error(`${check.id} source URL must be https`);
  }
  const weight = WEIGHTS[check.id];
  return {
    id: check.id,
    title: check.title,
    status: check.status,
    weight,
    earned: check.status === "pass" ? weight : 0,
    scored: weight > 0,
    why: check.why,
    fix: `${check.fix.trim()}\n`,
    sources: check.sources.map((source) => ({
      title: source.title,
      url: source.url,
      confidence: source.confidence,
    })),
    details: toPlain(check.details ?? {}),
  };
}

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

export { CHECKS, POSITIONING, WEIGHTS };

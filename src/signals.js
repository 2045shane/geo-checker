import { CITATION_DISCLAIMER } from "./positioning.js";

/** Tokens the v2 summary lists one by one. Allow/disallow comes from C02. */
export const CITATION_BOTS = Object.freeze([
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
]);

export const SIGNAL_IDS = Object.freeze([
  "structured-data",
  "robots-ai",
  "llms-txt",
  "headings-qa",
  "basic-meta",
]);

/**
 * Roll existing checks into the five citation-signal rows.
 * This does not score anything. C10 stays unscored.
 * @param {object[]} checks Finalized C01–C10 results.
 */
export function buildCitationSignals(checks) {
  const c02 = need(checks, "C02");
  const c04 = need(checks, "C04");
  const c05 = need(checks, "C05");
  const c06 = need(checks, "C06");
  const c08 = need(checks, "C08");
  const c10 = need(checks, "C10");
  const present = c10.details?.present === true;

  return {
    title: "AI search citation signals",
    disclaimer: CITATION_DISCLAIMER,
    note: "Reuses the checks below. Not a second score.",
    items: [
      {
        id: "structured-data",
        label: "Structured data (JSON-LD / schema)",
        status: c06.status,
        sources: ["C06"],
        detail: `Same result as C06 (${c06.status}).`,
      },
      {
        id: "robots-ai",
        label: "robots.txt for AI crawlers",
        status: c02.status,
        sources: ["C02"],
        detail:
          "Same result as C02 for every tracked token. The four lines are that check’s allow or disallow for these tokens.",
        bots: citationBots(c02),
      },
      {
        id: "llms-txt",
        label: "llms.txt",
        status: "unscored",
        checkStatus: c10.status,
        present,
        sources: ["C10"],
        detail: llmsDetail(c10, present),
      },
      {
        id: "headings-qa",
        label: "Headings and Q&A structure",
        status: c05.status === "pass" && c08.status === "pass" ? "pass" : "fail",
        sources: ["C05", "C08"],
        detail: "Same results as C05 (headings) and C08 (Q&A hints). The row fails if either check fails. This summary adds no score.",
        parts: [
          { id: "C05", label: "Headings", status: c05.status },
          { id: "C08", label: "Q&A hints", status: c08.status },
        ],
      },
      {
        id: "basic-meta",
        label: "Basic meta",
        status: c04.status,
        sources: ["C04"],
        detail: `Same result as C04 (${c04.status}): title, description, canonical, and lang.`,
      },
    ],
  };
}

function citationBots(check) {
  const training = Array.isArray(check.details?.training) ? check.details.training : [];
  const search = Array.isArray(check.details?.search) ? check.details.search : [];
  const rows = [...training, ...search];
  return CITATION_BOTS.map((token) => {
    const row = rows.find((bot) => bot.token === token);
    return { token, allowed: row ? row.allowed : null };
  });
}

function llmsDetail(check, present) {
  const where = present ? "/llms.txt is present" : "/llms.txt is absent";
  const format = present && check.status === "fail" ? " The format check failed." : "";
  return `C10 ${check.status}. ${where}.${format} Not scored.`;
}

function need(checks, id) {
  const check = checks.find((item) => item.id === id);
  if (!check) throw new Error(`citation signals missing ${id}`);
  return check;
}

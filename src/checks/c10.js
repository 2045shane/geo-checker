import { SRC } from "../sources.js";
import { TITLES } from "../score.js";

const FIX = `# Site name

> One-sentence summary of the site.

## Docs

- [Guide](https://example.com/guide): What this page covers`;

const GOOGLE_NOTE =
  "Google’s AI optimization guide says you do not need an llms.txt file (or other special AI markup) for Google Search, including its generative AI features, and that Google Search ignores it. Keeping a file for some other consumer neither helps nor hurts Google Search. This check never changes the score.";

export function run(ctx) {
  const status = ctx.llmsStatus ?? null;
  const error = ctx.llmsError ?? null;
  const text = typeof ctx.llmsTxt === "string" ? ctx.llmsTxt : null;
  const present = status === 200 && text != null && text.trim().length > 0;
  const format = present ? formatCheck(text) : { ok: true, problems: [] };
  const preview = present ? text.trim().slice(0, 500) : null;

  if (!present) {
    return {
      id: "C10",
      title: TITLES.C10,
      status: "pass",
      why: `No llms.txt content was found at /llms.txt${status != null ? ` (HTTP ${status})` : ""}${error ? `. Fetch detail: ${error}` : ""}. That is fine. ${GOOGLE_NOTE}`,
      fix: FIX,
      sources: [SRC.aiGuide, SRC.ahrefsLlms, SRC.llmstxt],
      details: { present: false, scored: false, formatOk: null, llmsStatus: status, preview: null },
    };
  }

  if (!format.ok) {
    return {
      id: "C10",
      title: TITLES.C10,
      status: "fail",
      why: `llms.txt is present but the v1 format check failed: ${format.problems.join("; ")}. The proposal uses a Markdown H1. HTML pages are not the llms.txt format. ${GOOGLE_NOTE}`,
      fix: FIX,
      sources: [SRC.aiGuide, SRC.ahrefsLlms, SRC.llmstxt],
      details: { present: true, scored: false, formatOk: false, problems: format.problems, llmsStatus: status, preview },
    };
  }

  return {
    id: "C10",
    title: TITLES.C10,
    status: "pass",
    why: `llms.txt is present and starts with a Markdown H1. It is shown here and it is not scored. ${GOOGLE_NOTE}`,
    fix: FIX,
    sources: [SRC.aiGuide, SRC.ahrefsLlms, SRC.llmstxt],
    details: { present: true, scored: false, formatOk: true, llmsStatus: status, preview },
  };
}

function formatCheck(text) {
  const problems = [];
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (/^<!doctype html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
    problems.push("the body looks like HTML, not Markdown");
  }
  const first = trimmed.split(/\r?\n/).find((line) => line.trim());
  if (!first || !/^#\s+\S/.test(first.trim())) {
    problems.push("the first non-empty line is not a Markdown H1 (`# Title`)");
  }
  return { ok: problems.length === 0, problems };
}

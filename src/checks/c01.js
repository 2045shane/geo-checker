import { SRC } from "../sources.js";
import { TITLES } from "../score.js";
import { bodyText } from "../text.js";

const FIX = `<article>
  <h1>Page title</h1>
  <p>The main explanation is in the HTML response, not only after JavaScript runs.</p>
</article>`;

export function run(ctx) {
  const rendered = bodyText(ctx.document);
  const h1s = headingTexts(ctx.document, "h1").filter((text) => text.length >= 3);

  if (!ctx.rawDocument) {
    return fail(
      "The original HTML response could not be read from this page’s own URL, so the live DOM cannot be compared with what a non-JavaScript crawler fetches. " +
        (ctx.rawError ? `Refetch detail: ${ctx.rawError}` : "The same-origin refetch returned no document."),
      {
        rawStatus: ctx.rawStatus ?? null,
        rawError: ctx.rawError ?? null,
        renderedLength: rendered.length,
      },
    );
  }

  const raw = bodyText(ctx.rawDocument);
  const rawNorm = raw.toLowerCase();
  const missingH1 = h1s.filter((text) => !rawNorm.includes(text.toLowerCase()));
  const thinRaw = rendered.length >= 80 && raw.length * 3 < rendered.length;

  if (missingH1.length || thinRaw) {
    const reasons = [];
    if (missingH1.length) {
      reasons.push(
        `Rendered H1 text is not in the original HTML body: ${missingH1.map((text) => `“${text}”`).join(", ")}.`,
      );
    }
    if (thinRaw) {
      reasons.push(
        `The rendered body has ${rendered.length} characters and the original HTML body has ${raw.length}. The original is under one third of the rendered text, which is the v1 signal for content injected by JavaScript.`,
      );
    }
    return fail(
      `${reasons.join(" ")} Script and style contents are ignored, so text that exists only inside a JavaScript string does not count as readable HTML. Many AI crawlers fetch the response and do not reliably build the page. Googlebot can render JavaScript later; that is a second wave, not a substitute for text in the first response.`,
      { renderedLength: rendered.length, rawLength: raw.length, missingH1 },
    );
  }

  return {
    id: "C01",
    title: TITLES.C01,
    status: "pass",
    why: `The rendered body text (${rendered.length} characters) is present in the original HTML body (${raw.length} characters), including each H1. Script and style contents were ignored. The one-third length rule and the H1 comparison are this checker’s heuristics on top of Google’s JavaScript SEO guidance.`,
    fix: FIX,
    sources: sources(),
    details: { renderedLength: rendered.length, rawLength: raw.length, missingH1: [] },
  };
}

function fail(why, details) {
  return {
    id: "C01",
    title: TITLES.C01,
    status: "fail",
    why,
    fix: FIX,
    sources: sources(),
    details,
  };
}

function sources() {
  return [SRC.jsSeo, { ...SRC.aiGuide, title: "Google: AI optimization guide (technical structure)" }];
}

function headingTexts(doc, tag) {
  if (!doc.body) return [];
  return [...doc.body.querySelectorAll(tag)].map((node) =>
    node.textContent.replace(/\s+/g, " ").trim(),
  );
}

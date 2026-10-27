import { SRC } from "../sources.js";
import { TITLES } from "../score.js";

const FIX = `<h1>Only one top-level heading</h1>
<h2>Section</h2>
<h3>Subsection</h3>
<!-- Do not jump from h2 to h4. -->`;

export function run(ctx) {
  const headings = ctx.document.body
    ? [...ctx.document.body.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((node) => ({
        level: Number(node.tagName.slice(1)),
        text: node.textContent.replace(/\s+/g, " ").trim(),
      }))
    : [];
  const h1Count = headings.filter((heading) => heading.level === 1).length;
  const skips = [];
  for (let i = 1; i < headings.length; i += 1) {
    const prev = headings[i - 1];
    const current = headings[i];
    if (current.level > prev.level + 1) {
      skips.push({
        from: `h${prev.level}`,
        to: `h${current.level}`,
        text: current.text,
      });
    }
  }

  const problems = [];
  if (h1Count !== 1) problems.push(`found ${h1Count} H1 elements; this check requires exactly one`);
  if (skips.length) {
    problems.push(
      `heading levels skip: ${skips
        .map((skip) => `${skip.from} → ${skip.to}${skip.text ? ` (“${skip.text}”)` : ""}`)
        .join(", ")}`,
    );
  }

  const whyBase =
    "Exactly one H1 is this checker’s rule, not an HTML requirement (the HTML standard allows more than one). Skipped levels fail because W3C WAI heading guidance says not to skip, for example H2 then H4.";

  if (problems.length) {
    return {
      id: "C05",
      title: TITLES.C05,
      status: "fail",
      why: `${problems.join("; ")}. ${whyBase}`,
      fix: FIX,
      sources: sources(),
      details: { h1Count, skips, headings },
    };
  }

  return {
    id: "C05",
    title: TITLES.C05,
    status: "pass",
    why: `There is exactly one H1, and no heading is more than one level deeper than the heading before it. ${whyBase}`,
    fix: FIX,
    sources: sources(),
    details: { h1Count, skips, headings },
  };
}

function sources() {
  return [
    SRC.headingsWai,
    {
      title: "v1 rule: exactly one H1 (the HTML standard allows more than one)",
      url: SRC.htmlHeadings.url,
      confidence: "heuristic",
    },
  ];
}

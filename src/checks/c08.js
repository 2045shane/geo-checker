import { SRC } from "../sources.js";
import { TITLES } from "../score.js";
import { allNodes, typesOf } from "../jsonld.js";

const FAQ_NOTE = "FAQPage JSON-LD does not add points.";

const FIX = `<p>A widget is a reusable page element that ships its text in the HTML.</p>
<h2>What is a widget?</h2>
<ul>
  <li>One fact per item</li>
  <li>Another fact</li>
</ul>`;

export function run(ctx) {
  const definition = hasDefinition(ctx.document);
  const questions = questionHeadings(ctx.document);
  const listOrTable = hasListOrTable(ctx.document);
  const signals = [definition, questions.length > 0, listOrTable].filter(Boolean).length;
  const faqSchema = allNodes(ctx.document).some((node) => typesOf(node).includes("FAQPage"));
  const passed = signals >= 2;
  const found = [
    definition ? "a definition-style opening paragraph" : null,
    questions.length ? `a question heading (${questions.join("; ")})` : null,
    listOrTable ? "a list or table" : null,
  ].filter(Boolean);

  const why = [
    passed
      ? `Found ${signals} of 3 extractable-answer signals: ${found.join(", ")}.`
      : `Found ${signals} of 3 extractable-answer signals${found.length ? ` (${found.join(", ")})` : ""}. This check passes only when at least two are present: a definition-style first paragraph (“X is …”), a heading that ends with a question mark, and a list of at least two items or a table of at least two rows.`,
    "This check has a low weight (0.25 of 8.25).",
    FAQ_NOTE,
    faqSchema ? "A FAQPage block is present and was ignored for this check." : "No FAQPage block was used.",
    "Google’s AI optimization guide says you do not need special markup, and you do not need to rewrite a page just for generative AI. These signals are hints for text extractors, not a citation score.",
  ].join(" ");

  return {
    id: "C08",
    title: TITLES.C08,
    status: passed ? "pass" : "fail",
    why,
    fix: FIX,
    sources: [SRC.aiGuide, SRC.schemaFaq, SRC.helpfulContent],
    details: {
      signals,
      definition,
      questionHeadings: questions,
      listOrTable,
      faqSchemaPresent: faqSchema,
      faqSchemaAddsPoints: false,
      weight: 0.25,
    },
  };
}

function hasDefinition(doc) {
  const paragraphs = [...doc.querySelectorAll("p")]
    .map((node) => node.textContent.replace(/\s+/g, " ").trim())
    .filter((text) => text.length >= 40 && text.length <= 500);
  const first = paragraphs[0] || "";
  return /^.{0,120}?\b(is|are|means|refers to)\b/i.test(first);
}

function questionHeadings(doc) {
  return [...doc.querySelectorAll("h2, h3, h4")]
    .map((node) => node.textContent.replace(/\s+/g, " ").trim())
    .filter((text) => text.endsWith("?"));
}

function hasListOrTable(doc) {
  for (const list of doc.querySelectorAll("ul, ol")) {
    const items = [...list.children].filter(
      (node) => node.tagName === "LI" && node.textContent.trim().length > 0,
    );
    if (items.length >= 2) return true;
  }
  for (const table of doc.querySelectorAll("table")) {
    if (table.querySelectorAll("tr").length >= 2) return true;
  }
  return false;
}

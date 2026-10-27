import { SRC } from "../sources.js";
import { TITLES } from "../score.js";
import {
  PROFILES,
  hasImage,
  jsonLdBlocks,
  looksMojibake,
  nodesFromJsonLd,
  profileIssues,
  typesOf,
} from "../jsonld.js";

const FIX = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your headline",
  "image": "https://example.com/cover.jpg",
  "datePublished": "2026-10-27",
  "dateModified": "2026-10-27",
  "author": { "@type": "Person", "name": "Author Name" }
}
</script>`;

export function run(ctx) {
  const blocks = jsonLdBlocks(ctx.document);
  const parsedNodes = [];
  const parseErrors = [];
  const mojibake = [];

  blocks.forEach((block, index) => {
    if (looksMojibake(block.raw)) mojibake.push(index);
    if (!block.ok) {
      parseErrors.push({ index, error: block.error });
      return;
    }
    for (const node of nodesFromJsonLd(block.data)) {
      const profile = profileIssues(node);
      parsedNodes.push({
        types: typesOf(node),
        recognized: profile.recognized,
        issues: profile.issues,
        headline: typeof node.headline === "string" ? node.headline : null,
        hasImage: hasImage(node.image),
      });
      if (looksMojibake(JSON.stringify(node))) mojibake.push(index);
    }
  });

  const recognized = parsedNodes.filter((node) => node.recognized);
  const unrecognized = parsedNodes.filter((node) => node.types.length && !node.recognized);
  const fieldIssues = parsedNodes.flatMap((node) => node.issues);
  const problems = [];

  if (!blocks.length) problems.push("no JSON-LD script was found");
  if (parseErrors.length) {
    problems.push(
      `JSON-LD parse error: ${parseErrors.map((item) => `block ${item.index + 1} (${item.error})`).join("; ")}`,
    );
  }
  if (mojibake.length) {
    problems.push(
      "a JSON-LD block looks like mojibake (UTF-8 read as Latin-1 or Windows-1252). CJK characters and diacritics must be real Unicode in a UTF-8 page",
    );
  }
  if (blocks.length && !parseErrors.length && !recognized.length) {
    const found = unrecognized.map((node) => node.types.join("/")).join(", ") || "no @type";
    problems.push(`no recognized type with a v1 field profile (found ${found})`);
  }
  if (fieldIssues.length) problems.push(`missing or invalid profile fields: ${fieldIssues.join(", ")}`);

  const profileNote =
    "Google’s Article documentation says there are no required Article properties. This checker’s Article profile still requires headline, datePublished, and author so the block identifies the piece. image is recommended, and a missing image does not fail the check.";

  const unicodeNote = sampleUnicode(parsedNodes);

  if (problems.length) {
    return {
      id: "C06",
      title: TITLES.C06,
      status: "fail",
      why: `${problems.join(". ")}. ${unicodeNote}${profileNote} Save the HTML as UTF-8 and keep the script body as strict JSON (no comments, no trailing commas, no smart quotes).`,
      fix: FIX,
      sources: [SRC.articleSchema, SRC.schemaArticle, SRC.structuredIntro, SRC.jsonParse],
      details: { parseErrors, mojibake, nodes: parsedNodes, fieldIssues, profiles: PROFILES },
    };
  }

  const types = [...new Set(recognized.flatMap((node) => node.types.filter((type) => PROFILES[type])))];
  return {
    id: "C06",
    title: TITLES.C06,
    status: "pass",
    why: `JSON-LD parsed, and ${types.join(", ")} matched the v1 field profile. ${unicodeNote}${profileNote}`,
    fix: FIX,
    sources: [SRC.articleSchema, SRC.schemaArticle, SRC.structuredIntro, SRC.jsonParse],
    details: { parseErrors: [], mojibake: [], nodes: parsedNodes, fieldIssues: [], profiles: PROFILES },
  };
}

function sampleUnicode(nodes) {
  const headlines = nodes.map((node) => node.headline).filter(Boolean);
  const interesting = headlines.filter((text) => /[^\u0000-\u007F]/.test(text));
  if (!interesting.length) return "";
  return `Unicode in parsed headlines stayed intact: ${interesting.map((text) => `“${text}”`).join(", ")}. `;
}

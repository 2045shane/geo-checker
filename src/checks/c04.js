import { SRC } from "../sources.js";
import { TITLES } from "../score.js";
import { absoluteHttpUrl, canonicalHref, headTitle, metaByName, validLang } from "../text.js";

const FIX = `<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Specific page title</title>
  <meta name="description" content="One or two sentences that describe this page.">
  <link rel="canonical" href="https://example.com/this-page">
</head>`;

export function run(ctx) {
  const title = headTitle(ctx.document);
  const description = metaByName(ctx.document, "description");
  const canonical = canonicalHref(ctx.document);
  const lang = ctx.document.documentElement?.getAttribute("lang") ?? "";
  const problems = [];

  if (!title) problems.push("the title element is missing or empty");
  if (description == null || description.trim() === "") {
    problems.push("meta description is missing or empty");
  }
  if (canonical == null || canonical.trim() === "") {
    problems.push("the canonical link is missing or empty");
  } else if (!absoluteHttpUrl(canonical.trim())) {
    problems.push("the canonical link is not an absolute http(s) URL");
  }
  if (!String(lang).trim()) problems.push("the html lang attribute is missing or empty");
  else if (!validLang(lang)) problems.push(`the html lang value “${String(lang).trim()}” is not a basic BCP 47 tag`);

  const details = {
    title,
    description: description == null ? null : description.trim(),
    canonical,
    lang: String(lang).trim(),
    problems,
  };

  if (problems.length) {
    return {
      id: "C04",
      title: TITLES.C04,
      status: "fail",
      why: `Fail because ${problems.join("; ")}. Empty or missing title, meta description, canonical, or lang fails this check. Length alone does not.`,
      fix: FIX,
      sources: [SRC.snippets, SRC.canonical, SRC.lang],
      details,
    };
  }

  return {
    id: "C04",
    title: TITLES.C04,
    status: "pass",
    why: "The page has a non-empty title, a non-empty meta description, an absolute http(s) canonical URL, and a basic BCP 47 lang value on the html element.",
    fix: FIX,
    sources: [SRC.snippets, SRC.canonical, SRC.lang],
    details,
  };
}

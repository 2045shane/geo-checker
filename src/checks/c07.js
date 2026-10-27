import { SRC } from "../sources.js";
import { TITLES } from "../score.js";
import { allNodes, authorNames, typesOf } from "../jsonld.js";
import { calendarDay, collapseSpace, metaByName, metaByProperty, sameName } from "../text.js";

const FIX = `<p>By <span itemprop="author">Ada Lovelace</span></p>
<p>Published <time itemprop="datePublished" datetime="2026-10-27">October 27, 2026</time></p>
<p>Updated <time itemprop="dateModified" datetime="2026-10-27">October 27, 2026</time></p>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your headline",
  "datePublished": "2026-10-27",
  "dateModified": "2026-10-27",
  "author": { "@type": "Person", "name": "Ada Lovelace" }
}
</script>`;

const PREFERRED = ["Article", "NewsArticle", "BlogPosting", "Report", "WebPage", "Blog"];

export function run(ctx) {
  const schema = schemaFacts(ctx.document);
  const visible = visibleFacts(ctx.document);
  const problems = [];

  if (!schema.authors.length) problems.push("JSON-LD has no author name");
  if (!schema.datePublished) problems.push("JSON-LD has no datePublished that resolves to a calendar day");
  if (!schema.dateModified) problems.push("JSON-LD has no dateModified that resolves to a calendar day");
  if (!visible.authors.length) problems.push("the visible page has no author (meta author, rel=author, or itemprop=author)");
  if (!visible.datePublished) {
    problems.push("the visible page has no datePublished (itemprop=datePublished or article:published_time)");
  }
  if (!visible.dateModified) {
    problems.push("the visible page has no dateModified (itemprop=dateModified or article:modified_time)");
  }

  const missingAuthors = schema.authors.filter(
    (name) => !visible.authors.some((visibleName) => sameName(name, visibleName)),
  );
  if (schema.authors.length && visible.authors.length && missingAuthors.length) {
    problems.push(
      `schema author ${missingAuthors.map((name) => `“${name}”`).join(", ")} is not the visible author (${visible.authors.map((name) => `“${name}”`).join(", ")})`,
    );
  }
  if (schema.datePublished && visible.datePublished && schema.datePublished !== visible.datePublished) {
    problems.push(
      `datePublished is ${schema.datePublished} in JSON-LD and ${visible.datePublished} on the page`,
    );
  }
  if (schema.dateModified && visible.dateModified && schema.dateModified !== visible.dateModified) {
    problems.push(
      `dateModified is ${schema.dateModified} in JSON-LD and ${visible.dateModified} on the page`,
    );
  }

  const details = { schema, visible, missingAuthors };
  if (problems.length) {
    return {
      id: "C07",
      title: TITLES.C07,
      status: "fail",
      why: `${problems.join("; ")}. Author, datePublished, and dateModified must each appear in JSON-LD and in visible markup, and the calendar days and author names must match. Visible dates are read from itemprop or article:published_time / article:modified_time, not from an unmarked time element.`,
      fix: FIX,
      sources: [SRC.articleSchema, SRC.schemaArticle],
      details,
    };
  }

  return {
    id: "C07",
    title: TITLES.C07,
    status: "pass",
    why: `Visible author ${visible.authors.map((name) => `“${name}”`).join(", ")} matches JSON-LD. datePublished ${visible.datePublished} and dateModified ${visible.dateModified} match the schema calendar days.`,
    fix: FIX,
    sources: [SRC.articleSchema, SRC.schemaArticle],
    details,
  };
}

function schemaFacts(doc) {
  const nodes = allNodes(doc);
  const ranked = [...nodes].sort((a, b) => rank(a) - rank(b));
  const authors = [];
  let datePublished = null;
  let dateModified = null;
  for (const node of ranked) {
    authorNames(node.author, authors);
    if (!datePublished) datePublished = calendarDay(node.datePublished);
    if (!dateModified) dateModified = calendarDay(node.dateModified);
  }
  return {
    authors: unique(authors),
    datePublished,
    dateModified,
  };
}

function rank(node) {
  const types = typesOf(node);
  const index = PREFERRED.findIndex((type) => types.includes(type));
  return index === -1 ? PREFERRED.length : index;
}

function visibleFacts(doc) {
  const authors = [];
  const metaAuthor = metaByName(doc, "author");
  if (metaAuthor && collapseSpace(metaAuthor)) authors.push(collapseSpace(metaAuthor));
  for (const node of doc.querySelectorAll("[rel='author'], [itemprop='author']")) {
    const nested = [...node.querySelectorAll("[itemprop='name']")].map((item) =>
      collapseSpace(item.textContent),
    );
    if (nested.length) authors.push(...nested.filter(Boolean));
    else if (collapseSpace(node.textContent)) authors.push(collapseSpace(node.textContent));
  }
  return {
    authors: unique(authors),
    datePublished: visibleDate(doc, "datePublished", "article:published_time"),
    dateModified: visibleDate(doc, "dateModified", "article:modified_time"),
  };
}

function visibleDate(doc, itemprop, property) {
  for (const node of doc.querySelectorAll(`[itemprop='${itemprop}']`)) {
    const day = calendarDay(node.getAttribute("datetime") || node.getAttribute("content") || node.textContent);
    if (day) return day;
  }
  return calendarDay(metaByProperty(doc, property));
}

function unique(values) {
  const out = [];
  for (const value of values) {
    if (!out.some((item) => sameName(item, value))) out.push(value);
  }
  return out;
}

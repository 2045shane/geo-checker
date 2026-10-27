import { calendarDay, collapseSpace } from "./text.js";

/** UTF-8 bytes misread as Latin-1/Windows-1252, plus the replacement character. */
export function looksMojibake(text) {
  const value = String(text ?? "");
  if (!value) return false;
  if (value.includes("\uFFFD")) return true;
  if (/\u00C3[\u0080-\u00BF]/.test(value)) return true;
  return /ä¸­|æ–‡|å¼€|Ã©|Ã¨|Ã¼|Ã±/.test(value);
}

export function jsonLdBlocks(doc) {
  const blocks = [];
  for (const script of doc.querySelectorAll("script")) {
    const type = (script.getAttribute("type") || "").split(";")[0].trim().toLowerCase();
    if (type !== "application/ld+json") continue;
    const raw = script.textContent ?? "";
    try {
      blocks.push({ ok: true, data: JSON.parse(raw), raw });
    } catch (error) {
      blocks.push({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        raw,
      });
    }
  }
  return blocks;
}

export function nodesFromJsonLd(data, out = []) {
  if (Array.isArray(data)) {
    for (const item of data) nodesFromJsonLd(item, out);
    return out;
  }
  if (!data || typeof data !== "object") return out;
  if (data["@graph"]) nodesFromJsonLd(data["@graph"], out);
  out.push(data);
  return out;
}

export function typesOf(node) {
  const value = node?.["@type"];
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map((item) => String(item));
}

export function authorNames(value, out = []) {
  if (value == null) return out;
  if (typeof value === "string") {
    const name = collapseSpace(value);
    if (name) out.push(name);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) authorNames(item, out);
    return out;
  }
  if (typeof value === "object") {
    if (typeof value.name === "string") {
      const name = collapseSpace(value.name);
      if (name) out.push(name);
    } else if (value.name) {
      authorNames(value.name, out);
    }
  }
  return out;
}

export function hasImage(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((item) => hasImage(item));
  if (value && typeof value === "object") {
    return hasImage(value.url || value.contentUrl || "");
  }
  return false;
}

export function hasIsoDate(value) {
  return calendarDay(typeof value === "string" ? value : "") != null;
}

/**
 * v1 field profile.
 * Google’s Article docs say there are no required properties. This checker
 * still requires headline, datePublished, and author so the block identifies
 * the piece. image is recommended and does not fail the check.
 */
export const PROFILES = Object.freeze({
  Article: ["headline", "datePublished", "author"],
  NewsArticle: ["headline", "datePublished", "author"],
  BlogPosting: ["headline", "datePublished", "author"],
  FAQPage: ["mainEntity"],
  HowTo: ["name", "step"],
  Organization: ["name"],
  Corporation: ["name"],
  LocalBusiness: ["name"],
  Person: ["name"],
  Product: ["name"],
  WebSite: ["name", "url"],
  WebPage: ["name"],
  AboutPage: ["name"],
  ContactPage: ["name"],
  ProfilePage: ["name"],
  BreadcrumbList: ["itemListElement"],
});

export function profileIssues(node) {
  const types = typesOf(node).filter((type) => PROFILES[type]);
  const issues = [];
  for (const type of types) {
    for (const field of PROFILES[type]) {
      if (!fieldOk(node, field)) issues.push(`${type}.${field}`);
    }
  }
  return { types, recognized: types.length > 0, issues };
}

function fieldOk(node, field) {
  const value = node[field];
  if (field === "author") return authorNames(value).length > 0;
  if (field === "headline" || field === "name") {
    return typeof value === "string" && collapseSpace(value).length > 0;
  }
  if (field === "datePublished" || field === "dateModified") return hasIsoDate(value);
  if (field === "image") return hasImage(value);
  if (field === "url") return typeof value === "string" && /^https?:\/\//i.test(value.trim());
  if (field === "mainEntity") return faqMainEntityOk(value);
  if (field === "step") {
    const steps = Array.isArray(value) ? value : value ? [value] : [];
    return steps.length > 0;
  }
  if (field === "itemListElement") {
    return Array.isArray(value) && value.length > 0;
  }
  return value != null && value !== "";
}

function faqMainEntityOk(value) {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  if (!items.length) return false;
  return items.every((item) => {
    if (!item || typeof item !== "object") return false;
    const name = typeof item.name === "string" && item.name.trim();
    const answer = item.acceptedAnswer;
    if (!name || !answer || typeof answer !== "object") return false;
    const text = answer.text ?? answer.name;
    return typeof text === "string" && text.trim().length > 0;
  });
}

export function allNodes(doc) {
  const nodes = [];
  for (const block of jsonLdBlocks(doc)) {
    if (!block.ok) continue;
    nodesFromJsonLd(block.data, nodes);
  }
  return nodes;
}

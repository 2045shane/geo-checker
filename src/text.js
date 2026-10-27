const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEMPLATE"]);

export function collapseSpace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function bodyText(doc) {
  if (!doc?.body) return "";
  return collapseSpace(textFrom(doc.body));
}

function textFrom(node) {
  if (!node) return "";
  if (node.nodeType === 3) return node.nodeValue || "";
  if (node.nodeType !== 1) return "";
  if (SKIP_TAGS.has(node.tagName)) return "";
  let out = "";
  for (const child of node.childNodes) out += `${textFrom(child)} `;
  return out;
}

export function calendarDay(value) {
  if (value == null) return null;
  const text = collapseSpace(value);
  if (!text) return null;
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

export function sameName(a, b) {
  return collapseSpace(a).toLowerCase() === collapseSpace(b).toLowerCase();
}

export function metaByName(doc, name) {
  const target = name.toLowerCase();
  for (const meta of doc.querySelectorAll("meta")) {
    const metaName = (meta.getAttribute("name") || "").toLowerCase();
    if (metaName === target) return meta.getAttribute("content") ?? "";
  }
  return null;
}

export function metaByProperty(doc, property) {
  const target = property.toLowerCase();
  for (const meta of doc.querySelectorAll("meta")) {
    const value = (meta.getAttribute("property") || "").toLowerCase();
    if (value === target) return meta.getAttribute("content") ?? "";
  }
  return null;
}

export function headTitle(doc) {
  const head = doc.querySelector("head");
  if (!head) return collapseSpace(doc.title || "");
  for (const title of head.children) {
    if (title.tagName === "TITLE") return collapseSpace(title.textContent);
  }
  return collapseSpace(doc.title || "");
}

export function canonicalHref(doc) {
  for (const link of doc.querySelectorAll("link")) {
    const rel = (link.getAttribute("rel") || "").toLowerCase().split(/\s+/);
    if (rel.includes("canonical")) return link.getAttribute("href") ?? "";
  }
  return null;
}

export function absoluteHttpUrl(href) {
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export function validLang(value) {
  return /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(collapseSpace(value));
}

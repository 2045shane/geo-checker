import { SRC } from "../sources.js";
import { TITLES } from "../score.js";

const FIX = `<a href="https://developer.mozilla.org/en-US/docs/Web/HTML">HTML on MDN</a>`;

/** Hosts and suffixes treated as authoritative outbound targets in v1. */
export const AUTHORITY_HOSTS = Object.freeze([
  "wikipedia.org",
  "schema.org",
  "w3.org",
  "ietf.org",
  "rfc-editor.org",
  "developer.mozilla.org",
  "developers.google.com",
  "web.dev",
  "who.int",
  "nih.gov",
  "ncbi.nlm.nih.gov",
  "cdc.gov",
  "nature.com",
  "science.org",
  "ieee.org",
  "iso.org",
  "un.org",
  "europa.eu",
  "data.gov",
  "nasa.gov",
]);

const AUTHORITY_SUFFIXES = Object.freeze([
  ".gov",
  ".mil",
  ".edu",
  ".gov.uk",
  ".gov.au",
  ".gc.ca",
  ".ac.uk",
  ".edu.au",
]);

const MULTI_PART_SUFFIXES = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "com.au",
  "net.au",
  "org.au",
  "edu.au",
  "gov.au",
  "co.jp",
  "com.cn",
  "com.br",
  "co.nz",
  "com.sg",
]);

export function run(ctx) {
  const pageUrl = ctx.pageUrl || "";
  let pageHost = "";
  try {
    pageHost = new URL(pageUrl).hostname;
  } catch {
    pageHost = "";
  }
  const pageSite = siteKey(pageHost);
  const matches = [];

  for (const anchor of ctx.document.querySelectorAll("a[href]")) {
    let url;
    try {
      url = new URL(anchor.getAttribute("href"), pageUrl || undefined);
    } catch {
      continue;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") continue;
    if (!pageSite || siteKey(url.hostname) === pageSite) continue;
    if (!isAuthority(url.hostname)) continue;
    matches.push(url.href);
  }

  const unique = [...new Set(matches)];
  const rule =
    "A link counts when it is http(s), its registrable site differs from this page, and its host is on the v1 authority list (for example wikipedia.org, developer.mozilla.org, developers.google.com, schema.org, w3.org) or ends in a government or education suffix such as .gov, .edu, .gov.uk, or .ac.uk. Same-site links do not count. nofollow links still count because the URL is in the HTML.";

  if (!unique.length) {
    return {
      id: "C09",
      title: TITLES.C09,
      status: "fail",
      why: `No authoritative outbound link was found. ${rule}`,
      fix: FIX,
      sources: sources(),
      details: { matches: [], hosts: AUTHORITY_HOSTS, suffixes: AUTHORITY_SUFFIXES },
    };
  }

  return {
    id: "C09",
    title: TITLES.C09,
    status: "pass",
    why: `Found ${unique.length} authoritative outbound link${unique.length === 1 ? "" : "s"}, including ${unique[0]}. ${rule}`,
    fix: FIX,
      sources: sources(),
      details: { matches: unique, hosts: AUTHORITY_HOSTS, suffixes: AUTHORITY_SUFFIXES },
  };
}

function sources() {
  return [
    SRC.helpfulContent,
    {
      title: "v1 authority host list and one-link threshold",
      url: SRC.helpfulContent.url,
      confidence: "heuristic",
    },
  ];
}

function isAuthority(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (AUTHORITY_HOSTS.some((item) => host === item || host.endsWith(`.${item}`))) return true;
  return AUTHORITY_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

function siteKey(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo) && parts.length >= 3) return parts.slice(-3).join(".");
  return lastTwo;
}

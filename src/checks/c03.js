import { SRC } from "../sources.js";
import { TITLES } from "../score.js";

const VALUED = new Set(["max-snippet", "max-image-preview", "max-video-preview", "unavailable_after"]);

const FIX = `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">

# If the HTTP response sets a blocking header, remove it:
# X-Robots-Tag: noindex, nosnippet, max-snippet:0`;

export function run(ctx) {
  const found = { noindex: false, nosnippet: false, none: false, maxSnippet: null, sources: [] };
  absorbDocument(ctx.document, found);
  if (ctx.xRobotsTag) absorb(found, ctx.xRobotsTag, "X-Robots-Tag");

  const blocks = [];
  if (found.noindex) blocks.push("noindex");
  if (found.none) blocks.push("none");
  if (found.nosnippet) blocks.push("nosnippet");
  if (found.maxSnippet === 0) blocks.push("max-snippet:0");

  const capNote =
    found.maxSnippet == null
      ? ""
      : found.maxSnippet < 0
        ? " max-snippet:-1 means no snippet cap, so it does not fail this check."
        : found.maxSnippet === 0
          ? " max-snippet:0 blocks snippets."
          : ` max-snippet:${found.maxSnippet} caps snippet length and is reported, but it still allows a snippet, so it does not by itself fail this check.`;

  if (blocks.length) {
    return {
      id: "C03",
      title: TITLES.C03,
      status: "fail",
      why: `Found ${blocks.join(", ")} in meta robots and/or X-Robots-Tag (${found.sources.join("; ") || "the page"}). noindex and none keep the page out of an index. nosnippet and max-snippet:0 block excerpts. A positive max-snippet is only a cap.${capNote}`,
      fix: FIX,
      sources: [SRC.robotsMeta],
      details: found,
    };
  }

  return {
    id: "C03",
    title: TITLES.C03,
    status: "pass",
    why: `No noindex, none, nosnippet, or max-snippet:0 directive was found in meta robots, googlebot, http-equiv X-Robots-Tag, or the page’s X-Robots-Tag header.${capNote || " No max-snippet directive was found."}`,
    fix: FIX,
    sources: [SRC.robotsMeta],
    details: found,
  };
}

function absorbDocument(doc, found) {
  for (const meta of doc.querySelectorAll("meta")) {
    const name = (meta.getAttribute("name") || "").toLowerCase();
    const httpEquiv = (meta.getAttribute("http-equiv") || "").toLowerCase();
    if (name === "robots" || name === "googlebot" || httpEquiv === "x-robots-tag") {
      const label = httpEquiv === "x-robots-tag" ? "http-equiv X-Robots-Tag" : `meta ${name}`;
      absorb(found, meta.getAttribute("content") || "", label);
    }
  }
}

function absorb(found, content, label) {
  if (!found.sources.includes(label)) found.sources.push(label);
  for (const part of String(content).split(",")) absorbToken(found, part);
}

function absorbToken(found, token) {
  const piece = token.trim().toLowerCase();
  if (!piece) return;
  const colon = piece.indexOf(":");
  if (colon === -1) {
    if (piece === "noindex") found.noindex = true;
    else if (piece === "nosnippet") found.nosnippet = true;
    else if (piece === "none") {
      found.none = true;
      found.noindex = true;
    }
    return;
  }
  const left = piece.slice(0, colon).trim();
  const right = piece.slice(colon + 1).trim();
  if (left === "max-snippet" && right !== "" && Number.isFinite(Number(right))) {
    const number = Number(right);
    found.maxSnippet = found.maxSnippet == null ? number : Math.min(found.maxSnippet, number);
    return;
  }
  if (VALUED.has(left)) return;
  absorbToken(found, right);
}

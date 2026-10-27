import { SRC } from "../sources.js";
import { TITLES } from "../score.js";
import {
  CLOUDFLARE_TIP,
  SEARCH_BOTS,
  TRAINING_BOTS,
  detectCloudflare,
  isAllowed,
  parseRobots,
  urlPath,
} from "../robots.js";

const FIX = `# Search crawlers fetch pages for AI answers. Allow them if this page should be readable.
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

# Training crawlers are a separate choice. Allowing them opts this site into
# training crawls. Delete a group to keep that training opt-out.
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: ClaudeBot
Allow: /`;

export function run(ctx) {
  const path = urlPath(ctx.pageUrl || "https://example.invalid/");
  const status = ctx.robotsStatus ?? null;
  const error = ctx.robotsError ?? null;
  const text = ctx.robotsTxt;

  if (text == null && status !== 404 && status !== 410) {
    return base("fail", {
      why:
        "robots.txt could not be read from this site, so this check cannot show whether AI crawlers are allowed. " +
        (error ? `Fetch detail: ${error}. ` : status != null ? `HTTP status: ${status}. ` : "") +
        "A missing file (HTTP 404 or 410) would mean crawlers are allowed by default. Any other failure stays a fail.",
      details: { robotsStatus: status, robotsError: error, path },
    });
  }

  const groups = text ? parseRobots(text) : [];
  const training = classify(groups, TRAINING_BOTS, path);
  const search = classify(groups, SEARCH_BOTS, path);
  const cloudflare = text ? detectCloudflare(text) : { detected: false, signals: [], clusterBlocked: [] };
  const blocked = [...training, ...search].filter((bot) => !bot.allowed);
  const passed = blocked.length === 0;
  const fileNote =
    status === 404 || status === 410
      ? `No robots.txt was found (HTTP ${status}). Crawlers are allowed by default.`
      : "robots.txt was read from this origin.";

  const why = [
    fileNote,
    `Training crawlers ${phrase(training)}.`,
    `Search crawlers ${phrase(search)}.`,
    "Training opt-out (GPTBot, Google-Extended, CCBot, and the other training tokens) is a different decision from blocking search crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, and the other search tokens). This check fails when any tracked token is disallowed for this path. Perplexity’s documentation says Perplexity-User generally ignores robots.txt because a person requested the fetch; the robots.txt rule is still reported.",
    cloudflare.detected ? CLOUDFLARE_TIP : "",
    passed
      ? "None of the tracked tokens are disallowed for this path."
      : `Disallowed for ${path}: ${blocked.map((bot) => bot.token).join(", ")}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return base(passed ? "pass" : "fail", {
    why,
    details: {
      path,
      robotsStatus: status,
      training,
      search,
      cloudflare,
    },
  });
}

function classify(groups, bots, path) {
  return bots.map((bot) => ({
    token: bot.token,
    vendor: bot.vendor,
    role: bot.role,
    allowed: isAllowed(groups, bot.token, path),
  }));
}

function phrase(bots) {
  const blocked = bots.filter((bot) => !bot.allowed).map((bot) => bot.token);
  const allowed = bots.filter((bot) => bot.allowed).map((bot) => bot.token);
  const parts = [];
  parts.push(blocked.length ? `blocked: ${blocked.join(", ")}` : "blocked: none");
  parts.push(allowed.length ? `allowed: ${allowed.join(", ")}` : "allowed: none");
  return parts.join("; ");
}

function base(status, { why, details }) {
  return {
    id: "C02",
    title: TITLES.C02,
    status,
    why,
    fix: FIX,
    sources: [
      SRC.openaiBots,
      SRC.googleCrawlers,
      SRC.ccbot,
      SRC.anthropicBots,
      SRC.perplexityBots,
      SRC.cloudflareRobots,
      SRC.robotsSpec,
      SRC.rfc9309,
    ],
    details,
  };
}

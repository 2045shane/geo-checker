/**
 * Training crawlers collect pages for model training.
 * Search crawlers fetch pages for AI answers or an AI search index.
 * Tokens are matched to robots.txt User-agent groups, case-insensitively.
 */
export const TRAINING_BOTS = Object.freeze([
  { token: "GPTBot", vendor: "OpenAI", role: "training" },
  { token: "Google-Extended", vendor: "Google", role: "training" },
  { token: "CCBot", vendor: "Common Crawl", role: "training" },
  { token: "ClaudeBot", vendor: "Anthropic", role: "training" },
  { token: "Amazonbot", vendor: "Amazon", role: "training" },
  { token: "Applebot-Extended", vendor: "Apple", role: "training" },
  { token: "Bytespider", vendor: "ByteDance", role: "training" },
  { token: "meta-externalagent", vendor: "Meta", role: "training" },
]);

export const SEARCH_BOTS = Object.freeze([
  { token: "OAI-SearchBot", vendor: "OpenAI", role: "search" },
  { token: "ChatGPT-User", vendor: "OpenAI", role: "search" },
  { token: "PerplexityBot", vendor: "Perplexity", role: "search" },
  { token: "Perplexity-User", vendor: "Perplexity", role: "search" },
  { token: "Claude-SearchBot", vendor: "Anthropic", role: "search" },
  { token: "Claude-User", vendor: "Anthropic", role: "search" },
]);

export const TRACKED_BOTS = Object.freeze([...TRAINING_BOTS, ...SEARCH_BOTS]);

const CLOUDFLARE_CLUSTER = [
  "Amazonbot",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "ClaudeBot",
  "Google-Extended",
  "GPTBot",
  "meta-externalagent",
];

export function parseRobots(text) {
  const groups = [];
  let current = null;
  let seenRule = false;

  for (const rawLine of String(text ?? "").split(/\r?\n/)) {
    const line = stripComment(rawLine);
    if (!line) continue;
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim().toLowerCase();
    const value = line.slice(sep + 1).trim();

    if (key === "user-agent") {
      if (!current || seenRule) {
        current = { agents: [], rules: [] };
        groups.push(current);
        seenRule = false;
      }
      if (value) current.agents.push(value.toLowerCase());
      continue;
    }

    if ((key === "allow" || key === "disallow") && current) {
      seenRule = true;
      if (!value) continue;
      current.rules.push({ type: key, path: value });
    }
  }

  return groups;
}

export function isAllowed(groups, token, urlPath) {
  const rules = rulesFor(groups, token);
  return pathAllowed(rules, urlPath || "/");
}

export function rulesFor(groups, token) {
  const needle = token.toLowerCase();
  const specific = groups.filter((group) => group.agents.includes(needle));
  if (specific.length) return specific.flatMap((group) => group.rules);
  return groups
    .filter((group) => group.agents.includes("*"))
    .flatMap((group) => group.rules);
}

export function pathAllowed(rules, urlPath) {
  const path = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  let matched = false;
  let bestLen = -1;
  let bestType = "allow";

  for (const rule of rules) {
    if (!rule.path.startsWith("/") && !rule.path.startsWith("*")) continue;
    if (!pathMatches(rule.path, path)) continue;
    const len = rule.path.length;
    if (!matched || len > bestLen) {
      matched = true;
      bestLen = len;
      bestType = rule.type;
    } else if (len === bestLen && rule.type === "allow") {
      bestType = "allow";
    }
  }

  return !matched || bestType === "allow";
}

export function pathMatches(pattern, path) {
  let source = "^";
  let end = false;
  let body = pattern;
  if (body.endsWith("$")) {
    end = true;
    body = body.slice(0, -1);
  }
  for (const char of body) {
    source += char === "*" ? ".*" : escapeRegex(char);
  }
  if (end) source += "$";
  return new RegExp(source).test(path);
}

export function urlPath(pageUrl) {
  try {
    const url = new URL(pageUrl);
    return url.pathname || "/";
  } catch {
    return "/";
  }
}

export function detectCloudflare(text) {
  const raw = String(text ?? "");
  const signals = [];
  if (/BEGIN Cloudflare Managed content/i.test(raw)) signals.push("begin-marker");
  if (/END Cloudflare Managed Content/i.test(raw)) signals.push("end-marker");
  if (/content-signal\s*:/i.test(raw)) signals.push("content-signal");
  if (/following content signals/i.test(raw)) signals.push("content-signals-policy");

  const groups = parseRobots(raw);
  const clusterBlocked = CLOUDFLARE_CLUSTER.filter(
    (token) => !isAllowed(groups, token, "/"),
  );
  if (clusterBlocked.length >= 6) signals.push("managed-bot-cluster");

  const detected =
    signals.includes("begin-marker") ||
    (signals.includes("content-signal") && signals.includes("managed-bot-cluster")) ||
    (/cloudflare/i.test(raw) && signals.includes("managed-bot-cluster"));

  return { detected, signals, clusterBlocked };
}

export const CLOUDFLARE_TIP =
  "This file matches Cloudflare’s managed robots.txt fingerprint (a “BEGIN Cloudflare Managed content” block and/or a Content-Signal line plus the usual training-bot Disallow list). Cloudflare can prepend that block from managed robots.txt or Bot Preference Sync, so an edit on the origin may not be what crawlers fetch. Check the Cloudflare dashboard for this domain, then reload /robots.txt.";

function stripComment(line) {
  const hash = line.indexOf("#");
  return (hash === -1 ? line : line.slice(0, hash)).trim();
}

function escapeRegex(char) {
  return char.replace(/[\\^$+?.()|[\]{}]/g, "\\$&");
}

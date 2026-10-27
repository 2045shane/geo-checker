import { buildMarkdown } from "./report.js";

export function renderReport(root, result) {
  root.replaceChildren();

  const score = document.createElement("section");
  score.className = "score";
  score.append(
    el("p", "score-kicker", "Score"),
    scoreNumber(result.score),
    el(
      "p",
      "score-rule",
      `${result.scoreRule.formula}. Earned ${formatWeight(result.earnedWeight)} of ${formatWeight(result.maxWeight)}. C08 is low-weight. llms.txt (C10) is shown and never scored.`,
    ),
  );
  const copyReport = button("Copy Markdown report", () => buildMarkdown(result));
  copyReport.classList.add("primary");
  score.append(copyReport);
  root.append(score);

  const list = document.createElement("ol");
  list.className = "checks";
  for (const check of result.checks) list.append(renderCheck(check));
  root.append(list);

  const privacy = el(
    "p",
    "privacy",
    "No account. After you click the icon, this extension reads the open tab and requests only this site’s own URL, /robots.txt, and /llms.txt. Those responses stay in this browser.",
  );
  root.append(privacy);
}

function renderCheck(check) {
  const item = document.createElement("li");
  item.className = `check check-${check.status}`;
  item.id = `check-${check.id}`;
  item.dataset.status = check.status;

  const header = document.createElement("div");
  header.className = "check-head";
  header.append(
    el("span", "check-id", check.id),
    el("h2", "check-title", check.title),
    badge(check.status === "pass" ? "Pass" : "Fail", check.status),
  );
  if (!check.scored) header.append(badge("Not scored", "unscored"));
  else if (check.weight < 1) header.append(badge("Low weight", "low"));
  item.append(header);

  item.append(el("p", "why", check.why));

  if (typeof check.details?.preview === "string" && check.details.preview) {
    const preview = el("pre", "preview", check.details.preview);
    const label = el("p", "preview-label", "llms.txt preview");
    item.append(label, preview);
  }

  const fixWrap = document.createElement("div");
  fixWrap.className = "fix";
  const bar = document.createElement("div");
  bar.className = "fix-bar";
  bar.append(el("span", "fix-label", "Fix"), button("Copy fix", () => check.fix));
  const pre = el("pre", "fix-code", check.fix.trimEnd());
  fixWrap.append(bar, pre);
  item.append(fixWrap);

  const sources = document.createElement("ul");
  sources.className = "sources";
  for (const source of check.sources) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = source.title;
    li.append(link, badge(source.confidence, "confidence"));
    sources.append(li);
  }
  item.append(sources);
  return item;
}

function scoreNumber(score) {
  const node = document.createElement("p");
  node.className = "score-num";
  node.append(document.createTextNode(String(score)));
  const denom = document.createElement("span");
  denom.textContent = "/100";
  node.append(denom);
  return node;
}

function badge(text, kind) {
  return el("span", `badge badge-${kind}`, text);
}

function button(label, getText) {
  const node = document.createElement("button");
  node.type = "button";
  node.textContent = label;
  node.addEventListener("click", async () => {
    const text = getText();
    try {
      await navigator.clipboard.writeText(text);
      node.textContent = "Copied";
    } catch {
      node.textContent = "Copy failed";
    }
    setTimeout(() => {
      node.textContent = label;
    }, 1600);
  });
  return node;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function formatWeight(value) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
}

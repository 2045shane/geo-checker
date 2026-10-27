export function buildMarkdown(result) {
  const counts = { official: 0, research: 0, heuristic: 0 };
  const lines = [
    "# GEO Checker report",
    "",
    result.positioning,
    "",
    `- URL: ${result.pageUrl || "unknown"}`,
    `- Checked at: ${result.checkedAt}`,
    `- Score: ${result.score}/100`,
    `- Earned weight: ${result.earnedWeight} / ${result.maxWeight}`,
    `- Rule: ${result.scoreRule.formula}`,
    ...result.scoreRule.notes.map((note) => `- ${note}`),
    "",
  ];

  for (const check of result.checks) {
    lines.push(`## ${check.id} ${check.title} — ${check.status === "pass" ? "Pass" : "Fail"}`);
    lines.push("");
    lines.push(
      check.scored
        ? `Weight: ${check.weight}. Earned: ${check.earned}.`
        : `Not scored (weight ${check.weight}).`,
    );
    lines.push("");
    lines.push(`**Why:** ${check.why}`);
    lines.push("");
    lines.push("**Fix:**");
    lines.push("");
    lines.push("```");
    lines.push(check.fix.trimEnd());
    lines.push("```");
    lines.push("");
    lines.push("**Sources:**");
    for (const source of check.sources) {
      counts[source.confidence] += 1;
      lines.push(`- ${source.title} (${source.confidence}): ${source.url}`);
    }
    if (check.details?.preview) {
      lines.push("");
      lines.push("**llms.txt preview:**");
      lines.push("");
      lines.push("```");
      lines.push(String(check.details.preview).trimEnd());
      lines.push("```");
    }
    lines.push("");
  }

  lines.push("## Source summary");
  lines.push("");
  lines.push(`- Official: ${counts.official}`);
  lines.push(`- Research: ${counts.research}`);
  lines.push(`- Heuristic: ${counts.heuristic}`);
  lines.push("");
  return lines.join("\n");
}

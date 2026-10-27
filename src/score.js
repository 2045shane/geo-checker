/** Transparent v1 weights. C08 is low. C10 never changes the score. */
export const CHECKS = Object.freeze([
  { id: "C01", title: "Raw HTML vs rendered page", weight: 1 },
  { id: "C02", title: "AI crawler allow rules", weight: 1 },
  { id: "C03", title: "Index and snippet directives", weight: 1 },
  { id: "C04", title: "Title, description, canonical, and language", weight: 1 },
  { id: "C05", title: "Single H1 and heading order", weight: 1 },
  { id: "C06", title: "JSON-LD structured data", weight: 1 },
  { id: "C07", title: "Author and dates match the page", weight: 1 },
  { id: "C08", title: "Extractable answer hints", weight: 0.25 },
  { id: "C09", title: "Links to authoritative sources", weight: 1 },
  { id: "C10", title: "llms.txt", weight: 0 },
]);

export const WEIGHTS = Object.freeze(
  Object.fromEntries(CHECKS.map((check) => [check.id, check.weight])),
);

export const TITLES = Object.freeze(
  Object.fromEntries(CHECKS.map((check) => [check.id, check.title])),
);

export const SCORE_NOTES = Object.freeze([
  "C01, C02, C03, C04, C05, C06, C07, and C09 each have weight 1.",
  "C08 has weight 0.25 (low weight).",
  "C10 has weight 0 and never changes the score.",
  "FAQPage JSON-LD does not add points.",
]);

export const SCORE_FORMULA = "score = round(100 * earnedWeight / maxWeight)";

export function maxWeight() {
  return CHECKS.reduce((sum, check) => sum + check.weight, 0);
}

export function scoreFromChecks(checks) {
  const max = maxWeight();
  const earned = checks.reduce((sum, check) => {
    return sum + (check.status === "pass" ? check.weight : 0);
  }, 0);
  const score = max === 0 ? 0 : Math.round((earned / max) * 100);
  return {
    score,
    earnedWeight: earned,
    maxWeight: max,
    scoreRule: {
      formula: SCORE_FORMULA,
      maxWeight: max,
      weights: { ...WEIGHTS },
      notes: [...SCORE_NOTES],
    },
  };
}

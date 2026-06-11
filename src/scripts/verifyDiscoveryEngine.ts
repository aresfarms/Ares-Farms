/**
 * verify:discovery-engine — proves the Possibility Discovery Engine stays on
 * doctrine across a BATTERY of intake combinations:
 *
 *   1. ANONYMOUS by construction — the routing layer + the wizard send NOTHING
 *      to a server (no fetch / POST / network); the engine imports no server or
 *      PII store. The map is computed in the browser from in-session answers.
 *   2. EDUCATION, NEVER DETERMINATION — every rendered "claim" string clears the
 *      content-claims policy (0 BLOCK) and carries no affirmative eligibility/
 *      approval language ("you qualify / are eligible / are approved / pre-
 *      approved / guaranteed"). Honest disclaimers (which negate those words)
 *      are exempt from the word grep, exactly like verify:place-fact-claims.
 *   3. HUMAN REVIEW ALWAYS PRESENT — output #10 is recommended and routes to
 *      licensed humans for EVERY combination (the safety valve).
 *   4. VERIFIED-ONLY property facts — property counts equal the verified feed;
 *      "No" to property yields no property counts; nothing says "may fit".
 *   5. EVERY possibility routes to a human — each program/financing/revenue/
 *      environmental item names who confirms it (confirmWith).
 *   6. BROWSE PRESERVED — the secondary browse route still exists + is linked.
 *
 * Master Volume traceability: Vol I CONST-DATA-001, Vol II (eligibility is a
 * licensed act), Vol III replay determinism, Vol V "ask, never assume".
 */

import * as fs from "node:fs";

import { evaluateContentClaims } from "@/lib/governance/contentClaimsPolicy";
import {
  generatePossibilityMap,
  type DiscoveryAnswers, type GoalId, type PersonaId, type PropertyInterest,
  type ConstraintId, type ResourceId, type ValueId, type PossibilityMap, type PossibilityItem,
} from "@/lib/discovery/possibilityEngine";
import type { GuidedIntakeFeed } from "@/lib/property/guidedIntakeFeed";
import { BROWSE_HREF, discoveryPrimary } from "@/lib/discovery/discoveryConfig";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// Synthetic verified feed (isolated + deterministic — no server calls).
const FEED: GuidedIntakeFeed = {
  asOf: "2026-06-11",
  states: [
    { abbr: "WV", byCategory: { land: 12, homes: 3, "farms-ranches": 5 }, total: 20, ozDesignated: 4, hubzoneDesignated: 2 },
    { abbr: "CO", byCategory: { land: 7, commercial: 2 }, total: 9, ozDesignated: 1, hubzoneDesignated: 0 },
    { abbr: "NY", byCategory: { homes: 6 }, total: 6, ozDesignated: 3, hubzoneDesignated: 1 },
  ],
};

// ── 1. Structural anonymity — no network, no server/PII imports ──────────────
const engineSrc = fs.readFileSync("src/lib/discovery/possibilityEngine.ts", "utf8");
const wizardSrc = fs.readFileSync("src/components/discovery/DiscoveryEngine.tsx", "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
for (const [name, src] of [["possibilityEngine", engineSrc], ["DiscoveryEngine", wizardSrc]] as const) {
  const body = strip(src);
  ok(!/\bfetch\s*\(|axios|XMLHttpRequest|navigator\.sendBeacon|\.post\s*\(/.test(body),
    `${name} must send NOTHING to a server (anonymous — answers stay in the browser)`);
  ok(!/email|phone|ssn|firstName|lastName|fullName/i.test(body),
    `${name} must collect/handle NO PII fields`);
}
ok(/runs in the browser|nothing is sent|in-session/i.test(engineSrc), "engine must document the anonymity guarantee");

// ── battery of intake combinations ───────────────────────────────────────────
const PERSONAS: PersonaId[] = ["farmer", "investor", "retiree", "veteran", "nonprofit", "individual", "developer"];
const GOAL_SETS: GoalId[][] = [
  ["buy-land", "build-wealth"],
  ["start-expand-farm", "generate-income"],
  ["preserve-family-land", "retire"],
  ["buy-sell-business"],
  ["improve-environment"],
  ["create-housing", "develop"],
  ["reduce-debt", "improve-cash-flow"],
  ["not-sure"],
  [],
  ["passive-income", "evaluate-opportunities", "access-programs", "access-financing"],
];
const INTERESTS: PropertyInterest[] = ["yes", "no", "maybe"];
const CONSTRAINTS: ConstraintId[][] = [[], ["limited-capital", "credit"], ["experience", "unsure-where-to-start"], ["regulatory", "environmental", "market-uncertainty"]];
const RESOURCES: ResourceId[][] = [["land", "farm"], ["savings", "credit-access"], ["none"], ["retirement-assets"]];
const VALUES: ValueId[][] = [["income"], ["family-legacy", "environmental-stewardship"], ["risk-reduction", "retirement-security"], []];

// Affirmative determination patterns — these must NEVER appear in claim copy.
const BANNED = [
  /\byou\s+qualify\b/i,
  /\byou(?:'re| are)\s+(?:approved|eligible|pre-?approved|qualified)\b/i,
  /\byou\s+will\s+(?:receive|get|be\s+approved)\b/i,
  /\bguaranteed\b/i,
  /\bpre-?approved\b/i,
];

// Fields that are HONEST DISCLAIMERS (they negate the banned words) — exempt
// from the word grep but STILL run through the claims policy.
function disclaimerStrings(map: PossibilityMap): string[] {
  return [map.summary, map.humanReview.message, map.property.note];
}
function claimStrings(map: PossibilityMap): string[] {
  const items = (xs: PossibilityItem[]) => xs.flatMap((i) => [i.label, i.description, `Confirm with ${i.confirmWith}.`]);
  return [
    map.headline, ...map.themes,
    ...map.pathways.flatMap((p) => [p.title, p.whyItFits, ...p.exploreSteps]),
    ...map.risks.flatMap((r) => [r.note, r.mitigationToExplore]),
    ...items(map.programs), ...items(map.financing), ...items(map.revenue), ...items(map.environmental),
    ...map.nextActions,
    ...map.humanReview.routeTo,
    ...(map.property.verified ? map.property.verified.states.map((s) => `${s.abbr}: ${s.total}`) : []),
  ];
}

let combos = 0;
for (const persona of PERSONAS)
for (const goals of GOAL_SETS)
for (const propertyInterest of INTERESTS) {
  // vary the secondary axes deterministically by combo index (keeps it bounded)
  const constraints = CONSTRAINTS[combos % CONSTRAINTS.length];
  const resources = RESOURCES[combos % RESOURCES.length];
  const values = VALUES[combos % VALUES.length];
  combos++;

  const answers: DiscoveryAnswers = {
    persona, goals, timeHorizon: "near", resources, constraints, values, propertyInterest,
    property: propertyInterest !== "no" ? { states: ["WV"], categories: ["land"], financingRequired: true } : undefined,
  };
  const map = generatePossibilityMap(answers, FEED);

  // 2. claims policy on ALL strings (claims + disclaimers)
  for (const text of [...claimStrings(map), ...disclaimerStrings(map)]) {
    if (evaluateContentClaims(text).blockCount > 0)
      fail.push(`CLAIMS BLOCK [${persona}/${goals.join("+") || "none"}/${propertyInterest}]: "${text.slice(0, 60)}…"`);
  }
  // 2b. banned affirmative words on EVERY rendered string — claims AND
  // disclaimers. (The disclaimers no longer negate-by-quoting the banned
  // phrases, so even an eyes-on DOM scan of the whole page finds zero hits.)
  for (const text of [...claimStrings(map), ...disclaimerStrings(map)]) {
    for (const re of BANNED) if (re.test(text))
      fail.push(`BANNED DETERMINATION [${persona}/${propertyInterest}]: ${re} in "${text.slice(0, 60)}…"`);
  }

  // 3. human review always present + routes to humans
  ok(map.humanReview.recommended === true && map.humanReview.routeTo.length >= 2,
    `human-review must be present + route to humans [${persona}/${propertyInterest}]`);

  // 4. verified-only property facts
  if (propertyInterest === "no") {
    ok(map.property.relevant === false && !map.property.verified, "property:'no' yields no property counts");
  } else {
    ok(map.property.relevant === true, `property:'${propertyInterest}' must be relevant`);
    // counts must equal the verified feed (WV selected → WV total 20)
    const wv = map.property.verified?.states.find((s) => s.abbr === "WV");
    ok(wv?.total === 20 && wv.oz === 4 && wv.hubzone === 2, "property counts must equal the verified feed (no fabrication)");
  }
  ok(!/may fit|may qualify/i.test(map.property.note), "property note must never say 'may fit/may qualify'");

  // 5. every possibility item routes to a human
  for (const it of [...map.programs, ...map.financing, ...map.revenue, ...map.environmental])
    ok(it.confirmWith.trim().length > 0, "every possibility item must name who confirms it");

  // pathways always non-empty (orientation fallback)
  ok(map.pathways.length >= 1, `at least one pathway for every combo [${persona}/${goals.join("+") || "none"}]`);
}

// ── 6. browse preserved + discovery primary default ──────────────────────────
ok(BROWSE_HREF.includes("/explore"), "secondary browse route must be preserved");
ok(/discovery-browse-link|\/explore/.test(wizardSrc), "wizard must link to browse (browse stays usable)");
ok(discoveryPrimary() === true, "discovery is primary by default (browse one click away)");

// ── report ────────────────────────────────────────────────────────────────────
console.log(`verify:discovery-engine — checked ${combos} intake combinations.`);
if (fail.length) {
  console.error(`\n✗  verify:discovery-engine FAIL — ${fail.length} issue(s):`);
  for (const f of fail.slice(0, 40)) console.error(`    ✗ ${f}`);
  process.exit(1);
}
console.log(
  `\n✓  verify:discovery-engine PASS — across ${combos} combinations: anonymous by construction (nothing sent, no PII); ` +
    "every output clears the claims policy with no affirmative eligibility/approval language; Human Review always present; " +
    "property facts are verified-only (counts = feed, never 'may fit'); every possibility routes to a licensed human; browse preserved.",
);
process.exit(0);

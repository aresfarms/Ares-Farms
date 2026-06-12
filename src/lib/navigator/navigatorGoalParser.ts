/**
 * navigatorGoalParser — UNIVERSAL goal parser (BUILD FIX 2026-06-12).
 *
 * "Navigator should not need a new hand-written route every time a test phrase
 * is invented. If the user gives a clear goal, parse the goal, classify the
 * asset, reality-check it, and ask the next relevant question. Goal first.
 * Story later."
 *
 * This runs in the goal tier (after safety/refusals, before generic intake).
 * It owns the asset classes the hand-written routes don't, and the iconic
 * taxonomy refinement:
 *   ICONIC_PRIVATE_ASSET     — privately ownable but extraordinary (Empire State)
 *   PUBLIC_DISPOSITION_ONLY  — only via surplus/auction/redevelopment (lighthouses, closed prisons)
 *   NOT_PRIVATELY_OWNABLE    — no ordinary private path (White House, Brooklyn Bridge, Capitol)
 *   IMPOSSIBLE_SCALE_ASSET   — city/region/state-scale (Manhattan, California, Mississippi River)
 *   FANTASY                  — Mars/Moon/Hogwarts (handled by impossible-place)
 */

import type { TurnIntent } from "./turnIntent";

export type GoalAction = "buy" | "own" | "live" | "build" | "acquire" | "convert" | "find" | "analyze";
export type AssetReality = "ORDINARY" | "UNUSUAL_BUT_REAL" | "REGULATED" | "ICONIC_PRIVATE_ASSET" | "PUBLIC_DISPOSITION_ONLY" | "NOT_PRIVATELY_OWNABLE" | "IMPOSSIBLE_SCALE_ASSET" | "FANTASY";

export interface ParsedGoal {
  goalAction: GoalAction | null;
  targetAsset: string | null;
  location: string | null;
  hasGoal: boolean;
}

const ACTION_PATTERNS: [RegExp, GoalAction][] = [
  [/\bi\s+want\s+to\s+buy\b|\bcan\s+i\s+buy\b|\bi'?d\s+like\s+to\s+buy\b|\blooking\s+to\s+buy\b/i, "buy"],
  [/\bi\s+want\s+to\s+own\b|\bi\s+want\b.{0,12}\bown\b/i, "own"],
  [/\bi\s+want\s+to\s+live\s+(?:in|on|aboard)\b/i, "live"],
  [/\bi\s+want\s+to\s+build\b|\bcan\s+i\s+build\b|\bi\s+want\s+land\s+for\b/i, "build"],
  [/\bi\s+want\s+to\s+acquire\b/i, "acquire"],
  [/\bconvert\b/i, "convert"],
  [/\bhelp\s+me\s+find\b|\bi\s+want\s+to\s+find\b/i, "find"],
  [/\bi\s+want\s+(?:a|an|the)\b|\bi\s+need\s+(?:a|an)\b/i, "own"],
];

const LOCATION_RE = /\bin\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?(?:,?\s+[A-Z]{2})?)\b|\b(?:off|near)\s+(?:the\s+)?([A-Z][a-zA-Z]+)/;

export function parseGoal(message: string): ParsedGoal {
  let goalAction: GoalAction | null = null;
  for (const [re, a] of ACTION_PATTERNS) if (re.test(message)) { goalAction = a; break; }
  const loc = message.match(LOCATION_RE);
  const location = loc ? (loc[1] ?? loc[2] ?? null) : null;
  // target_asset = the salient noun after the action verb (best-effort).
  const after = message.replace(/^.*?\b(?:buy|own|live\s+(?:in|on|aboard)|build|acquire|convert|find|want|need|a|an|the)\b/i, "").trim();
  const targetAsset = after ? after.replace(/\s+in\s+[A-Z].*$/, "").trim() || null : null;
  return { goalAction, targetAsset, location, hasGoal: goalAction !== null };
}

export interface GoalAssetDecision {
  turnIntent: TurnIntent;
  reality: AssetReality;
  text: string;
  echoConcept: string | null;
  slot: string;
}

// ── NOT_PRIVATELY_OWNABLE — no ordinary private ownership path ────────────────
const NOT_OWNABLE_RE: [RegExp, string][] = [
  [/\bwhite\s+house\b/i, "The White House"],
  [/\b(?:us\s+)?capitol(?:\s+building)?\b/i, "The U.S. Capitol"],
  [/\bsupreme\s+court(?:\s+building)?\b/i, "The Supreme Court building"],
  [/\bpentagon\b/i, "The Pentagon"],
  [/\bbrooklyn\s+bridge\b|\bgolden\s+gate\s+bridge\b/i, "That bridge"],
  [/\bstatue\s+of\s+liberty\b/i, "The Statue of Liberty"],
  [/\b(?:lincoln|jefferson|washington)\s+(?:memorial|monument)\b|\bmount\s+rushmore\b/i, "That national monument"],
  [/\bkennedy\s+space\s+center\b|\bcape\s+canaveral\b/i, "Kennedy Space Center"],
  [/\bhoover\s+dam\b/i, "Hoover Dam"],
];

// ── IMPOSSIBLE_SCALE — city/region/state/river-scale acquisition ──────────────
const IMPOSSIBLE_SCALE_RE: [RegExp, string][] = [
  [/\b(?:buy|own|acquire)\b.{0,20}\bmanhattan\b/i, "Manhattan"],
  [/\b(?:buy|own|acquire)\b.{0,20}\b(?:california|texas|florida|alaska|a\s+(?:state|whole\s+state))\b/i, "an entire state"],
  [/\b(?:buy|own|acquire)\b.{0,20}\b(?:a\s+(?:whole\s+)?city|a\s+county|a\s+town|a\s+region|a\s+country|a\s+continent)\b/i, "a whole city or region"],
  [/\b(?:buy|own|acquire)\b.{0,20}\b(?:the\s+)?(?:mississippi|colorado|hudson)\s+river\b|\bthe\s+ocean\b|\ba\s+(?:whole\s+)?(?:lake|mountain\s+range)\b/i, "that geographic feature"],
];

// ── REGULATED airport / airstrip acquisition (NOT a hard shutdown) ────────────
const AIRPORT_RE = /\b(?:small\s+)?airport\b|\bairstrip\b|\bairfield\b|\bprivate\s+(?:airstrip|runway)\b/i;

// ── AGRICULTURAL acquisition (ordinary, regulated ag) ─────────────────────────
const AG_RE = /\b(pig|hog|cattle|dairy|poultry|chicken|sheep|goat|horse|alpaca|bee|hemp|cannabis|crop|grain|produce|vegetable|fruit|berry|blueberry|christmas\s+tree)\s+(?:farm|ranch|operation|orchard|grove)\b|\b(?:pig|hog|cattle|dairy|poultry|sheep|goat)\s+farm\b/i;

// ── MARINE vessel / waterfront ────────────────────────────────────────────────
const MARINE_VESSEL_RE = /\b(?:a\s+)?(?:boat|vessel|yacht|sailboat)\b.{0,30}\b(?:off|near|in|on)\b.{0,20}\b(?:the\s+)?(?:coast|carolinas|atlantic|pacific|gulf|bay|sound|lake|ocean|water)\b|\bboat\s+off\s+the\b/i;

export function classifyGoalAsset(message: string): GoalAssetDecision | null {
  // Most-severe honesty first.
  for (const [re, label] of NOT_OWNABLE_RE) if (re.test(message)) {
    return {
      turnIntent: "REALITY_CHECK_NOT_PRIVATELY_OWNABLE", reality: "NOT_PRIVATELY_OWNABLE",
      echoConcept: label, slot: "reality-check:not-privately-ownable",
      text: `${label} is not a privately ownable asset, so Furlong can’t treat it as a real acquisition pathway. ` +
        "If your goal is a historic civic-style property, a landmark residence, a government-surplus redevelopment " +
        "opportunity, or an institutional building with similar character, I can help map realistic alternatives.",
    };
  }
  for (const [re, label] of IMPOSSIBLE_SCALE_RE) if (re.test(message)) {
    return {
      turnIntent: "REALITY_CHECK_IMPOSSIBLE_SCALE_ASSET", reality: "IMPOSSIBLE_SCALE_ASSET",
      echoConcept: label, slot: "reality-check:impossible-scale",
      text: `Buying ${label} is not a realistic ordinary acquisition path. But if your real goal is commercial real ` +
        "estate, a mixed-use building, a redevelopment site, an apartment building, a hotel, or a landmark-style " +
        "asset in that area, I can help map realistic alternatives. Which is closest?",
    };
  }
  if (AIRPORT_RE.test(message)) {
    return {
      turnIntent: "ROUTE_REGULATED_AIRPORT_ASSET", reality: "REGULATED",
      echoConcept: "airport", slot: "route:regulated-airport",
      text: "A small airport can be a real but regulated acquisition path. Furlong would need to distinguish a " +
        "private airstrip, a public-use airport, a closed airport, an aviation business, or land near an airport. " +
        "We’d check FAA/state aviation rules, zoning, runway/easement constraints, environmental issues, insurance, " +
        "access, and whether the property is publicly listed or privately marketed. Which of those fits your goal?",
    };
  }
  const ag = message.match(AG_RE);
  if (ag) {
    const label = ag[0].toLowerCase();
    return {
      turnIntent: "ROUTE_AGRICULTURAL_ACQUISITION", reality: "ORDINARY",
      echoConcept: label, slot: "route:agricultural-acquisition",
      text: `A ${label} is a real agricultural acquisition path. We’d need to look at zoning, animal limits, ` +
        "manure/nutrient management, water, setbacks, biosecurity, environmental rules, financing, and whether you " +
        "want an operating farm, land to build one, or a smaller livestock setup. Which of those are you after?",
    };
  }
  if (MARINE_VESSEL_RE.test(message)) {
    return {
      turnIntent: "ROUTE_MARINE_VESSEL_OR_LIVEABOARD", reality: "UNUSUAL_BUT_REAL",
      echoConcept: "boat", slot: "route:marine-vessel",
      text: "That could mean buying a vessel, living aboard, marina/slip access, charter use, fishing/commercial " +
        "use, or waterfront property. Each has different Coast Guard, marina, insurance, state, and local rules. " +
        "Are you looking to live on it, operate it, rent it, or compare it to waterfront land?",
    };
  }
  return null;
}

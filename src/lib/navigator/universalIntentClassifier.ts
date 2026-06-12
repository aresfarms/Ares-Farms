/**
 * universalIntentClassifier (BUILD FIX 2026-06-12) — the Universal Intent
 * Classification Layer that runs BEFORE goal route selection. Instead of a
 * cascade of one-off keyword handlers, a single data-driven taxonomy produces
 * the structured classification, and route selection happens ONLY after stages
 * 1–4 complete:
 *
 *   Stage 1  intent_class       — what the user is trying to DO
 *   Stage 2  asset_class        — what OBJECT they reference
 *   Stage 3  reality_class      — how realistic / constrained the goal is
 *   Stage 4  review_categories  — required regulatory review areas
 *   Stage 5  route selection    — performed by the router from the above
 *
 * HARD RULE: the Navigator must never ask "Tell me about yourself / your story /
 * what brought you here" until `intentClass` AND `assetClass` exist, OR the
 * classifier has determined neither can be identified (`identified === false`).
 *
 * This is the SINGLE place new assets are registered (one ASSET_TAXONOMY row),
 * not a new route. The router maps `recommendedTurnIntent` to the existing
 * reply builders.
 */

import type { TurnIntent } from "./turnIntent";

export type IntentClass =
  | "acquire" | "build" | "sell" | "lease" | "finance" | "operate" | "redevelop"
  | "preserve" | "live_in" | "invest_in" | "research" | "verify" | "test_system" | "unknown";

export type AssetClass =
  | "agricultural" | "residential" | "commercial" | "institutional" | "government"
  | "infrastructure" | "specialty" | "iconic" | "unknown";

export type RealityClass =
  | "ordinary" | "unusual_but_realistic" | "highly_constrained" | "regulated"
  | "iconic" | "impossible_scale" | "not_privately_ownable" | "sensitive_facility" | "unknown";

export interface UniversalClassification {
  intentClass: IntentClass;
  assetClass: AssetClass;
  assetLabel: string | null;
  realityClass: RealityClass;
  reviewCategories: string[];
  recommendedTurnIntent: TurnIntent | null;
  /** True when BOTH an intent and an asset were identified. */
  identified: boolean;
}

// ── Stage 1: intent verbs ────────────────────────────────────────────────────
const INTENT_VERBS: [RegExp, IntentClass][] = [
  [/\b(?:buy|purchase|own|acquire|get)\b/i, "acquire"],
  [/\bbuild\b|\bland\s+for\b|\bconstruct\b/i, "build"],
  [/\bsell\b|\blist\b/i, "sell"],
  [/\blease\b|\brent\s+out\b/i, "lease"],
  [/\bfinance\b|\bloan\b|\bmortgage\b/i, "finance"],
  [/\boperate\b|\brun\b/i, "operate"],
  [/\bredevelop\b|\bconvert\b|\bre(?:use|purpose)\b/i, "redevelop"],
  [/\bpreserve\b|\bconserv|\bprotect\b/i, "preserve"],
  [/\blive\s+(?:in|on|aboard)\b/i, "live_in"],
  [/\binvest\b/i, "invest_in"],
  [/\bresearch\b|\blook\s+(?:into|up)\b/i, "research"],
  [/\bverify\b|\bconfirm\b/i, "verify"],
  [/\btest(?:ing)?\s+(?:the\s+)?(?:navigator|system|bot|you)\b/i, "test_system"],
  [/\bi\s+want\b|\bi\s+need\b|\blooking\s+for\b|\bi'?d\s+like\b|\bhelp\s+me\s+find\b/i, "acquire"],
];

// ── Stage 2–4: asset taxonomy (the SINGLE registry — add a row, not a route) ──
interface AssetRow {
  re: RegExp;
  label: string;
  assetClass: AssetClass;
  realityClass: RealityClass;
  reviewCategories: string[];
  turnIntent: TurnIntent;
}

const ASSET_TAXONOMY: AssetRow[] = [
  // Government / not privately ownable (most-severe honesty first)
  { re: /\bwhite\s+house\b|\b(?:us\s+)?capitol\b|\bsupreme\s+court\b|\bpentagon\b|\bbrooklyn\s+bridge\b|\bstatue\s+of\s+liberty\b|\bmount\s+rushmore\b|\bkennedy\s+space\s+center\b/i, label: "government landmark", assetClass: "government", realityClass: "not_privately_ownable", reviewCategories: ["federal", "not-for-sale"], turnIntent: "REALITY_CHECK_NOT_PRIVATELY_OWNABLE" },
  // Impossible scale
  { re: /\b(?:buy|own|acquire)\b.{0,20}\b(?:manhattan|california|texas|a\s+(?:whole\s+)?(?:city|state|county|country)|the\s+\w+\s+river|the\s+ocean)\b/i, label: "city/region-scale", assetClass: "government", realityClass: "impossible_scale", reviewCategories: ["scale-infeasible"], turnIntent: "REALITY_CHECK_IMPOSSIBLE_SCALE_ASSET" },
  // Iconic private
  { re: /\bempire\s+state\s+building\b|\bchrysler\s+building\b|\bdisney\s*(?:world|land)\b|\beiffel\s+tower\b|\bfamous\s+(?:skyscraper|landmark|stadium)\b/i, label: "iconic asset", assetClass: "iconic", realityClass: "iconic", reviewCategories: ["extraordinary-capital", "private-market"], turnIntent: "REALITY_CHECK_ICONIC_ASSET" },
  // Sensitive infrastructure (classifier flags; the infra layer hard-shuts down)
  { re: /\bnuclear\s+(?:plant|facility|reactor)|substation|power\s+plant|pipeline|water\s+treatment|coal\s+(?:plant|mine)|chemical\s+plant|military\s+base|prison\b/i, label: "sensitive facility", assetClass: "infrastructure", realityClass: "sensitive_facility", reviewCategories: ["verified-public-disposition", "environmental", "federal"], turnIntent: "HARD_SHUTDOWN_SENSITIVE_FACILITY" },
  // Regulated infrastructure (acquisition allowed)
  { re: /\b(?:small\s+)?airport\b|\bairstrip\b|\bairfield\b/i, label: "airport", assetClass: "infrastructure", realityClass: "regulated", reviewCategories: ["FAA", "state", "zoning", "environmental"], turnIntent: "ROUTE_REGULATED_AIRPORT_ASSET" },
  // Institutional
  { re: /\bhospital\b|\bmedical\s+center\b|\bclinic\b|\bnursing\s+home\b/i, label: "healthcare facility", assetClass: "institutional", realityClass: "regulated", reviewCategories: ["healthcare", "state", "zoning", "environmental"], turnIntent: "ROUTE_HEALTHCARE_REAL_ESTATE" },
  // Specialty / adaptive reuse
  { re: /\blighthouse\b/i, label: "lighthouse", assetClass: "specialty", realityClass: "unusual_but_realistic", reviewCategories: ["historic", "environmental", "GSA-surplus"], turnIntent: "ROUTE_SPECIALTY_ASSET_ACQUISITION" },
  { re: /\b(?:missile|nuclear)\s+silo\b/i, label: "missile silo", assetClass: "specialty", realityClass: "unusual_but_realistic", reviewCategories: ["environmental", "zoning", "structural"], turnIntent: "ROUTE_SPECIALTY_ASSET_ACQUISITION" },
  { re: /\bgrain\s+elevator\b|\bwater\s+tower\b|\bbunker\b/i, label: "specialty structure", assetClass: "specialty", realityClass: "unusual_but_realistic", reviewCategories: ["structural", "zoning", "code"], turnIntent: "ROUTE_SPECIALTY_ASSET_ACQUISITION" },
  { re: /\bshipping\s+container\s+(?:home|house)\b|\bcontainer\s+home\b/i, label: "shipping-container home", assetClass: "specialty", realityClass: "unusual_but_realistic", reviewCategories: ["code", "zoning", "engineering"], turnIntent: "ROUTE_SPECIALTY_ASSET_ACQUISITION" },
  // Vehicle-inspired (residential)
  { re: /\bairplane\s+(?:house|home|hangar\s+home)\b|\baircraft\s+(?:house|home)\b|\btrain\s+car\s+(?:house|home)\b|\bcaboose\s+(?:house|home)\b|\bspaceship\s+house\b/i, label: "vehicle-inspired home", assetClass: "residential", realityClass: "unusual_but_realistic", reviewCategories: ["zoning", "code", "utility", "safety"], turnIntent: "ROUTE_VEHICLE_INSPIRED_ARCHITECTURE" },
  // Marine / nontraditional dwellings
  { re: /\blive\s+(?:on|aboard)\b.{0,20}\b(?:sailboat|houseboat|boat|yacht)\b/i, label: "liveaboard vessel", assetClass: "residential", realityClass: "unusual_but_realistic", reviewCategories: ["marina", "coast-guard", "registration", "insurance"], turnIntent: "ROUTE_MARINE_LIVEABOARD" },
  { re: /\bearth[- ]sheltered\b|\blive\s+underground\b|\bunderground\s+(?:home|house)\b/i, label: "earth-sheltered home", assetClass: "residential", realityClass: "unusual_but_realistic", reviewCategories: ["geotech", "code", "zoning", "permitting"], turnIntent: "ROUTE_EARTH_SHELTERED_HOUSING" },
  // Agricultural
  { re: /\b(?:pig|hog|cattle|dairy|poultry|chicken|sheep|goat)\s+farm\b|\bfarm\b|\branch\b|\borchard\b|\bvineyard\b/i, label: "agricultural property", assetClass: "agricultural", realityClass: "ordinary", reviewCategories: ["zoning", "USDA", "environmental", "water"], turnIntent: "ROUTE_AGRICULTURAL_ACQUISITION" },
  // Commercial
  { re: /\bhotel\b|\bmotel\b|\bresort\b|\boffice\s+building\b|\bwarehouse\b|\bapartment\s+(?:complex|building)\b|\bmobile\s+home\s+park\b|\bshopping\s+center\b/i, label: "commercial property", assetClass: "commercial", realityClass: "regulated", reviewCategories: ["zoning", "hospitality", "building-code", "financing"], turnIntent: "ROUTE_COMMERCIAL_ACQUISITION" },
  { re: /\blaundromat\b|\bgas\s+station\b|\bcar\s+wash\b|\bself[- ]storage\b/i, label: "regulated business", assetClass: "commercial", realityClass: "regulated", reviewCategories: ["zoning", "licensing", "environmental"], turnIntent: "ROUTE_REGULATED_BUSINESS_ACQUISITION" },
];

export function classifyIntentClass(message: string): IntentClass {
  for (const [re, c] of INTENT_VERBS) if (re.test(message)) return c;
  return "unknown";
}

export function classifyAsset(message: string): AssetRow | null {
  for (const row of ASSET_TAXONOMY) if (row.re.test(message)) return row;
  return null;
}

/** The full Universal Intent Classification (stages 1–4). */
export function classifyIntent(message: string): UniversalClassification {
  const intentClass = classifyIntentClass(message);
  const asset = classifyAsset(message);
  return {
    intentClass,
    assetClass: asset?.assetClass ?? "unknown",
    assetLabel: asset?.label ?? null,
    realityClass: asset?.realityClass ?? "unknown",
    reviewCategories: asset?.reviewCategories ?? [],
    recommendedTurnIntent: asset?.turnIntent ?? null,
    identified: intentClass !== "unknown" && asset !== null,
  };
}

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

// Relationship / availability / sensitivity / encumbrance context (2026-06-12).
export type RelationshipClass =
  | "self_owned_or_controlled" | "public_listing" | "third_party_private_property"
  | "neighbor_or_adjacent_property" | "public_asset" | "government_asset"
  | "facility_asset" | "unknown";

export type AvailabilityClass =
  | "verified_available" | "claimed_available_unverified" | "not_publicly_available"
  | "public_disposition_required" | "not_privately_ownable" | "unknown";

export type SensitivityClass =
  | "ordinary" | "private_residence" | "celebrity_or_public_figure_risk"
  | "government_or_civic" | "critical_infrastructure" | "regulated_facility"
  | "protected_facility" | "unknown";

export type ConstraintClass =
  | "none_detected" | "utility_easement" | "pipeline_easement" | "transmission_easement"
  | "drainage_easement" | "access_easement" | "conservation_easement" | "mineral_rights"
  | "water_rights" | "railroad_easement" | "unknown";

export interface UniversalClassification {
  intentClass: IntentClass;
  assetClass: AssetClass;
  assetLabel: string | null;
  realityClass: RealityClass;
  reviewCategories: string[];
  relationshipClass: RelationshipClass;
  availabilityClass: AvailabilityClass;
  sensitivityClass: SensitivityClass;
  constraintClass: ConstraintClass;
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

// ── Relationship / availability / sensitivity / constraint scans ─────────────
const NEIGHBOR_RE = /\b(?:my\s+)?neighbor'?s?\s+(?:house|home|property|farm|land|place)\b|\bhouse\s+next\s+door\b|\bnext[- ]door\s+(?:house|property)\b/i;
const THIRD_PARTY_PERSON_RE = /\b(?:that|this)\s+person'?s\s+(?:house|home|property)\b|\bthe\s+owner'?s\s+(?:house|home|residence)\b|\bget\s+(?:them|him|her|the\s+owner)\s+to\s+sell\b/i;
const CELEBRITY_RE = /\b(?:celebrity|celeb|famous\s+person|movie\s+star|athlete|senator|congress(?:man|woman|person)|governor|mayor|president|public\s+official)\b.{0,20}\b(?:house|home|residence|property|mansion|estate)\b/i;
const LISTING_URL_RE = /https?:\/\/|\b(?:zillow|redfin|loopnet|crexi|realtor|landwatch)\b/i;
const OFFICIAL_DISPO_RE = /\b(?:public\s+auction|auction\s+(?:listing|notice)|surplus\s+(?:listing|disposition|notice)|GSA\s+surplus|redevelopment\s+(?:rfp|rfq|listing|notice)|(?:listed|listing)\s+for\s+redevelopment|disposition\s+record|\brfp\b|\brfq\b|official\s+\w+\s+listing)\b/i;
const WEAK_CLAIM_RE = /\b(?:for\s+sale|on\s+the\s+market|listed|available)\b/i;
const SELF_OWNED_RE = /\b(?:my\s+(?:farm|land|property|lot|parcel|house|home)|i\s+own|i'?m\s+buying|i\s+am\s+buying|on\s+my\s+\w+)\b/i;
const STREET_ADDRESS_RE = /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|way|ct|court|pl|place|hwy|highway|cir|circle|terrace|ter|trail|trl|pkwy|parkway)\b/i;
const FSBO_RE = /\bfsbo\b|\bfor\s+sale\s+by\s+owner\b|\bis\s+for\s+sale\b|\bon\s+the\s+market\b/i;
/** A bare private/residential address acquisition with no asset-class match. */
function isPrivateAddressTarget(message: string, asset: AssetRow | null): boolean {
  return asset === null && STREET_ADDRESS_RE.test(message) &&
    !SELF_OWNED_RE.test(message) && (/\b(?:buy|purchase|acquire|own)\b/i.test(message) || FSBO_RE.test(message));
}
const CRITICAL_INFRA_RE = /\bnuclear\s+(?:plant|facility|reactor)|substation|power\s+plant|pipeline|water\s+treatment|coal\s+(?:plant|mine)|chemical\s+plant|military\s+base|\bprison\b|refinery|fuel\s+terminal/i;
const REGULATED_FACILITY_RE = /\b(?:small\s+)?airport\b|\bairstrip\b|\bhospital\b|\bmedical\s+center\b/i;
const GOV_LANDMARK_RE = /\bwhite\s+house\b|\bcapitol\b|\bsupreme\s+court\b|\bpentagon\b|\bbrooklyn\s+bridge\b|\bstatue\s+of\s+liberty\b|\bmount\s+rushmore\b|\bkennedy\s+space\s+center\b/i;
const GOV_BUILDING_RE = /\b(?:state|federal|government|county|municipal)\s+building\b|\bcity\s+hall\b|\bcourthouse\b/i;

const CONSTRAINT_PATTERNS: [RegExp, ConstraintClass][] = [
  [/\b(?:gas\s+(?:line|pipeline)|pipeline)\s+easement\b|\bpipeline\s+right[- ]of[- ]way\b/i, "pipeline_easement"],
  [/\btransmission\s+(?:line\s+)?easement\b|\bpower\s+line\s+easement\b/i, "transmission_easement"],
  [/\bdrainage\s+easement\b/i, "drainage_easement"],
  [/\baccess\s+easement\b/i, "access_easement"],
  [/\bconservation\s+easement\b/i, "conservation_easement"],
  [/\brailroad\s+easement\b|\brail\s+easement\b/i, "railroad_easement"],
  [/\bmineral\s+rights\b/i, "mineral_rights"],
  [/\bwater\s+rights\b/i, "water_rights"],
  [/\butility\s+easement\b|\beasement\b|\bright[- ]of[- ]way\b/i, "utility_easement"],
];

function classifyConstraint(message: string): ConstraintClass {
  for (const [re, c] of CONSTRAINT_PATTERNS) if (re.test(message)) return c;
  return "none_detected";
}

function classifyRelationship(message: string, asset: AssetRow | null, encumbered: boolean): RelationshipClass {
  if (NEIGHBOR_RE.test(message)) return "neighbor_or_adjacent_property";
  if (THIRD_PARTY_PERSON_RE.test(message) || CELEBRITY_RE.test(message) || isPrivateAddressTarget(message, asset)) return "third_party_private_property";
  if (asset?.realityClass === "not_privately_ownable" || GOV_LANDMARK_RE.test(message)) return "government_asset";
  // An easement/encumbrance means the infra term is an ENCUMBRANCE on the
  // user's parcel — not the facility being acquired.
  if (!encumbered && (asset?.assetClass === "infrastructure" || CRITICAL_INFRA_RE.test(message) || REGULATED_FACILITY_RE.test(message))) return "facility_asset";
  if (LISTING_URL_RE.test(message) || OFFICIAL_DISPO_RE.test(message)) return "public_listing";
  if (SELF_OWNED_RE.test(message)) return "self_owned_or_controlled";
  return "unknown";
}

function classifyAvailability(message: string, asset: AssetRow | null, encumbered: boolean): AvailabilityClass {
  if (asset?.realityClass === "not_privately_ownable" || asset?.realityClass === "impossible_scale") return "not_privately_ownable";
  if (LISTING_URL_RE.test(message) || OFFICIAL_DISPO_RE.test(message)) return "verified_available";
  const sensitive = !encumbered && (CRITICAL_INFRA_RE.test(message) || GOV_BUILDING_RE.test(message) || asset?.realityClass === "sensitive_facility");
  if (sensitive) return "public_disposition_required";
  if (WEAK_CLAIM_RE.test(message) || (isPrivateAddressTarget(message, asset) && FSBO_RE.test(message))) return "claimed_available_unverified";
  if (NEIGHBOR_RE.test(message) || THIRD_PARTY_PERSON_RE.test(message) || CELEBRITY_RE.test(message) || isPrivateAddressTarget(message, asset)) return "not_publicly_available";
  return "unknown";
}

function classifySensitivity(message: string, asset: AssetRow | null, encumbered: boolean): SensitivityClass {
  if (!encumbered && (CRITICAL_INFRA_RE.test(message) || asset?.realityClass === "sensitive_facility")) return "critical_infrastructure";
  if (GOV_LANDMARK_RE.test(message) || GOV_BUILDING_RE.test(message) || asset?.assetClass === "government") return "government_or_civic";
  if (CELEBRITY_RE.test(message)) return "celebrity_or_public_figure_risk";
  if (!encumbered && (REGULATED_FACILITY_RE.test(message) || asset?.realityClass === "regulated")) return "regulated_facility";
  if (NEIGHBOR_RE.test(message) || THIRD_PARTY_PERSON_RE.test(message) || isPrivateAddressTarget(message, asset)) return "private_residence";
  if (encumbered || asset) return "ordinary";
  return "unknown";
}

/** The full Universal Intent Classification (stages 1–4 + context). */
export function classifyIntent(message: string): UniversalClassification {
  const intentClass = classifyIntentClass(message);
  const asset = classifyAsset(message);
  const constraintClass = classifyConstraint(message);
  // An easement/encumbrance means an infra term is a CONSTRAINT on the user's
  // parcel, not the facility itself — don't classify it as sensitive/facility.
  const encumbered = constraintClass !== "none_detected" && constraintClass !== "unknown";
  return {
    intentClass,
    assetClass: asset?.assetClass ?? "unknown",
    assetLabel: asset?.label ?? null,
    realityClass: asset?.realityClass ?? "unknown",
    reviewCategories: asset?.reviewCategories ?? [],
    relationshipClass: classifyRelationship(message, asset, encumbered),
    availabilityClass: classifyAvailability(message, asset, encumbered),
    sensitivityClass: classifySensitivity(message, asset, encumbered),
    constraintClass,
    recommendedTurnIntent: asset?.turnIntent ?? null,
    identified: intentClass !== "unknown" && asset !== null,
  };
}

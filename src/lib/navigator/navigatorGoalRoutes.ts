/**
 * Goal-first routing layer (BUILD FIX 2026-06-12) — detectors + locked replies
 * for the high-priority categories that must respond to a CLEAR GOAL before any
 * questionnaire intake ("Reality before intake. Understanding before
 * questions."). Consumed by navigatorTurnRouter.routeTurn in priority order.
 *
 * Covers:
 *  - ESCALATE_TARGETED_HARASSMENT (stalking / doxxing / locating a person)
 *  - HARD_SHUTDOWN_SENSITIVE_FACILITY + infrastructure security-probe escalation
 *  - asset-class acquisition (commercial / healthcare / regulated business)
 *  - vehicle/vessel-inspired architecture
 *  - marine liveaboard / nontraditional dwelling
 *  - specialty / surplus / adaptive-reuse assets
 */

import type { ThreatPhraseCategory } from "@/security/realityPlatform/threatEscalationLedger";

// ── ESCALATE_TARGETED_HARASSMENT (stalking / doxxing / locating a person) ────
const HARASSMENT_RE: [RegExp, ThreatPhraseCategory][] = [
  [/\b(?:stalk|stalking)\b/i, "stalking"],
  [/\bdox+(?:x|ing)?\b/i, "doxxing"],
  [/\b(?:track|tracking|trace|locate|find\s+(?:out\s+)?where|monitor|surveil|surveill|follow|spy\s+on|keep\s+tabs\s+on)\b.{0,40}\b(?:my\s+)?(?:neighbor|neighbour|person|people|owner|resident|tenant|employee|official|household|ex|him|her|them|someone|guy|woman|man|family)\b/i, "harassment"],
  [/\b(?:where\s+(?:does|do)|find\s+out\s+where|find\s+where)\b.{0,30}\b(?:this\s+person|he|she|they|the\s+owner|my\s+\w+|someone)\b.{0,15}\blives?\b/i, "stalking"],
  // Verb-led "who lives" is targeting; a bare "who lives at X" stays an
  // ordinary owner/resident lookup (handled by the privacy doctrine).
  [/\b(?:track|find|monitor|stalk|locate|surveil|surveill|follow|figure\s+out|see|learn)\b.{0,20}\bwho\s+lives\b/i, "harassment"],
];

export const HARASSMENT_REPLY =
  "I can’t help stalk, track, harass, dox, or target another person. If your concern is about a property, " +
  "boundary, nuisance, safety, code, or neighbor dispute, I can help think through lawful next steps like " +
  "documentation, municipal contacts, mediation, or legal/professional help.";

export function detectTargetedHarassment(message: string): ThreatPhraseCategory | null {
  for (const [re, cat] of HARASSMENT_RE) if (re.test(message)) return cat;
  return null;
}

// ── Critical / sensitive infrastructure ──────────────────────────────────────
// SENSITIVE = hard shutdown unless a VERIFIED public disposition source exists.
// The critical-infrastructure patch is AUTHORITATIVE over specialty/adaptive-
// reuse routing for these overlap categories (military base, coal plant/mine,
// prison, substation, power plant, etc.) — they never route as ordinary
// specialty assets without verified public sale/auction/surplus/redevelopment.
const CRITICAL_FACILITY_RE =
  /\b(?:nuclear\s+(?:plant|facility|reactor|station)|electrical?\s+substation|substation|power\s+plant|power\s+station|water\s+treatment|sewage\s+treatment|\bdam\b|data\s+center|datacenter|telecom\s+(?:hub|facility)|pipeline|fuel\s+(?:terminal|depot)|oil\s+(?:refinery|terminal)|refinery|air\s+traffic|control\s+tower|rail\s*yard|railyard|\bprison\b|penitentiary|correctional\s+facility|military\s+(?:base|site|installation)|army\s+base|naval\s+base|air\s+force\s+base|active\s+mine|coal\s+(?:mine|plant)|chemical\s+plant|grid\s+(?:station|facility)|(?<!empire\s)(?:state|federal|government|county|municipal)\s+building|city\s+hall|courthouse|post\s+office)\b/i;
// REGULATED PASSTHROUGH = lawful acquisition concepts; a probe/status question
// still escalates/refuses, but plain acquisition is handled by goal routing
// (airport → ROUTE_REGULATED_AIRPORT_ASSET; hospital → healthcare goal).
const REGULATED_PASSTHROUGH_RE = /\b(?:small\s+)?airport\b|\bairstrip\b|\bairfield\b|\bhospital\b/i;

// Probing a facility's access / weak points / security / operations → escalate.
const INFRA_PROBE_RE =
  /\b(?:weak\s*(?:point|spot)s?|vulnerab|get\s+(?:in|inside|past)|break\s+in|access\s+(?:point|control)s?|security\s+(?:gap|hole|weakness|schedule)|guard\s+(?:schedule|rotation|shift)|bypass|disable|operational\s+layout|control\s+room|utility\s+connections?|hazardous\s+materials?|surveil|case\s+the)\b/i;

// Active-status probes — must never be answered.
const INFRA_STATUS_RE = /\b(?:is|are)\b.{0,30}\b(?:active|inactive|operational|abandoned|decommissioned|unused|still\s+(?:running|operating)|guarded|manned|staffed)\b|\bactive\??\s*$/i;

// VERIFIED public disposition — an OFFICIAL mechanism, not a bare "for sale"
// claim. User assertion alone is NOT verification (restricted-property refine
// 2026-06-12): only an official surplus/auction/RFP/disposition reference (or
// verified Furlong inventory) unlocks high-level reuse. Everything weaker is a
// verification-required shutdown.
const OFFICIAL_DISPOSITION_RE =
  /\b(?:public\s+auction|auction\s+(?:listing|notice)|surplus\s+(?:listing|disposition|notice|record)|GSA\s+surplus|redevelopment\s+(?:rfp|rfq|listing|notice|plan|opportunity)|(?:listed|listing)\s+for\s+redevelopment|disposition\s+(?:record|notice)|decommissioning\s+(?:notice|listing)|\brfp\b|\brfq\b|official\s+\w+\s+listing)\b/i;
const WEAK_CLAIM_RE = /\b(?:for\s+sale|on\s+the\s+market|listed|available|surplus\s+(?:base|property|building|facility))\b/i;

export const SENSITIVE_FACILITY_SHUTDOWN_REPLY =
  "Furlong can’t analyze that facility here. Sensitive infrastructure and regulated facilities are not treated " +
  "as ordinary property discovery, and we won’t provide ownership, operational, access, active-status, or " +
  "vulnerability details. If you have a public for-sale, auction, surplus, or redevelopment listing, paste that " +
  "listing and we can review only the lawful, high-level reuse questions.";

export const SENSITIVE_FACILITY_STATUS_REPLY =
  "Status cannot be assessed here. Furlong won’t infer whether a sensitive or regulated facility is active, " +
  "inactive, guarded, or decommissioned. If you have a public for-sale, auction, surplus, or official " +
  "decommissioning/redevelopment source, paste it and we can review only the lawful, high-level reuse questions.";

export const SENSITIVE_FACILITY_REUSE_REPLY =
  "Working only from a genuine public auction, surplus, or redevelopment listing — and strictly high-level — " +
  "Furlong can speak to lawful reuse categories: environmental diligence, zoning/land-use review, brownfield " +
  "remediation, general utility/easement limitations, professional engineering review, regulatory approvals, " +
  "financing/insurance feasibility, public redevelopment constraints, and the requirement for licensed-professional " +
  "review. No ownership, operational, access, or active-status detail, and no pro forma here. What lawful reuse are " +
  "you weighing?";

export const SENSITIVE_FACILITY_VERIFY_REPLY =
  "A claim that it’s for sale isn’t verification on its own — for a sensitive or restricted facility Furlong needs " +
  "an official public-disposition source: a government surplus listing, a public auction notice, a redevelopment " +
  "RFP/RFQ, an authorized public-disposition record, or a verified Furlong inventory record. Share that official " +
  "source and we can review only high-level, lawful reuse questions — never ownership, operator, active-status, " +
  "access, or operational detail.";

export type InfraDecision =
  | { kind: "escalate"; category: ThreatPhraseCategory }
  | { kind: "shutdown" }
  | { kind: "status" }
  | { kind: "verify" }
  | { kind: "reuse" }
  | null;

export function assessCriticalInfrastructure(message: string): InfraDecision {
  const sensitive = CRITICAL_FACILITY_RE.test(message);
  const passthrough = REGULATED_PASSTHROUGH_RE.test(message);
  if (!sensitive && !passthrough) return null;
  // Probes and active-status questions escalate/refuse for BOTH classes.
  if (INFRA_PROBE_RE.test(message)) return { kind: "escalate", category: "infrastructure-probe" };
  if (INFRA_STATUS_RE.test(message)) return { kind: "status" };
  // Regulated-passthrough (airport/hospital) acquisition → goal routing owns it.
  if (passthrough && !sensitive) return null;
  // Sensitive facility: official disposition → high-level reuse; weak claim →
  // verification required; nothing → hard shutdown.
  if (OFFICIAL_DISPOSITION_RE.test(message)) return { kind: "reuse" };
  if (WEAK_CLAIM_RE.test(message)) return { kind: "verify" };
  return { kind: "shutdown" };
}

// ── Asset-class acquisition / development goals (respond to the goal first) ───
export interface AssetGoal { intent: AssetGoalIntent; label: string; reply: string }
type AssetGoalIntent = "ROUTE_HEALTHCARE_REAL_ESTATE" | "ROUTE_REGULATED_BUSINESS_ACQUISITION" | "ROUTE_COMMERCIAL_ACQUISITION" | "ROUTE_AGRICULTURAL_ACQUISITION";

const ACQUIRE_VERB = "\\b(?:buy|purchase|acquire|own|invest\\s+in|develop|build|open|start)\\b";

const HEALTHCARE_RE = /\b(?:hospital|medical\s+(?:center|building|office)|clinic|nursing\s+home|assisted\s+living|surgery\s+center|dialysis\s+center|healthcare\s+facility|urgent\s+care)\b/i;
const REGULATED_BIZ_RE = /\b(?:laundromat|gas\s+station|car\s+wash|liquor\s+store|dispensary|funeral\s+home|daycare|child\s+care|self[- ]storage|storage\s+facility|processing\s+(?:facility|plant)|distillery|brewery|winery|cannabis\s+(?:grow|cultivation)|slaughterhouse|recycling\s+(?:center|facility)|cat\s+cafe|pet\s+(?:cafe|daycare|hotel|resort)|cafe|coffee\s+shop)\b/i;
const COMMERCIAL_RE = /\b(?:hotel|motel|resort|apartment\s+(?:complex|building)|mobile\s+home\s+park|trailer\s+park|rv\s+park|shopping\s+(?:center|mall)|strip\s+mall|office\s+(?:building|park)|warehouse|industrial\s+(?:building|park)|retail\s+(?:center|space)|restaurant|bar\s+business|farmland|ranch\s+land|vineyard|orchard|timberland|commercial\s+(?:building|property|real\s+estate))\b/i;

const BARE_AG_RE = /\b(?:farm|ranch|orchard|vineyard|homestead|cropland|pasture\s+land|acreage)\b/i;
// "the farm is at…" / "my farm" describe an OWNED property — not an acquisition.
const OWN_FARM_RE = /\b(?:the|my|our|this)\s+(?:farm|ranch|orchard|vineyard|land)\b/i;

export function detectAssetGoal(message: string): AssetGoal | null {
  const acquiring = new RegExp(ACQUIRE_VERB, "i").test(message);
  if (!acquiring) return null;
  // Bare farm/ranch/orchard acquisition (D11) → agricultural; never when the
  // user is describing land they already own ("the farm is at…").
  if (BARE_AG_RE.test(message) && !OWN_FARM_RE.test(message)) {
    const m = message.match(BARE_AG_RE)![0].toLowerCase();
    return {
      intent: "ROUTE_AGRICULTURAL_ACQUISITION",
      label: m,
      reply: `A ${m} is a real agricultural acquisition. We’d look at zoning, soil/water, USDA programs, animal limits ` +
        "if any, setbacks, environmental rules, financing, and whether you want an operating farm, land to build one, " +
        "or a smaller setup. Which region, and roughly what scale?",
    };
  }
  if (HEALTHCARE_RE.test(message)) {
    const m = message.match(HEALTHCARE_RE)![0].toLowerCase();
    return {
      intent: "ROUTE_HEALTHCARE_REAL_ESTATE",
      label: m,
      reply: `Buying ${/^[aeiou]/.test(m) ? "an" : "a"} ${m} is a real but highly regulated path. Furlong would need to look at asset type, ` +
        "operating license, healthcare regulatory approvals, zoning, certificates of need if applicable, financing " +
        "capacity, operator experience, payer/revenue risk, and environmental/building condition — and whether you " +
        `mean an operating ${m} business, a vacant medical facility, a clinic, or healthcare real estate. Are you trying ` +
        "to buy an operating business, a medical building, or land for a healthcare facility?",
    };
  }
  if (REGULATED_BIZ_RE.test(message)) {
    const m = message.match(REGULATED_BIZ_RE)![0].toLowerCase();
    return {
      intent: "ROUTE_REGULATED_BUSINESS_ACQUISITION",
      label: m,
      reply: `${cap(m)} is a real, regulated acquisition. Furlong would look at whether you mean the operating business, ` +
        "the real estate, or land to build; plus licensing, zoning/permitted use, environmental and building " +
        "condition, utilities, financing, and operator experience. Are you after the operating business, the " +
        "property itself, or land to build one?",
    };
  }
  if (COMMERCIAL_RE.test(message)) {
    const m = message.match(COMMERCIAL_RE)![0].toLowerCase();
    return {
      intent: "ROUTE_COMMERCIAL_ACQUISITION",
      label: m,
      reply: `${cap(m)} is a clear commercial real-estate goal. Furlong would look at asset type and class, location and ` +
        "market, zoning/permitted use, condition, income/operating profile, financing capacity, and whether you mean " +
        "an operating business, the real estate, or land to develop. Are you buying an operating business, the " +
        "property, or land to build — and which market?",
    };
  }
  return null;
}

// ── Vehicle / vessel-inspired architecture ───────────────────────────────────
const VEHICLE_INSPIRED_RE: [RegExp, string][] = [
  [/\bairplane\s+(?:house|home|hangar\s+home)\b|\baircraft\s+(?:house|home|conversion)\b|\bhangar\s+home\b/i, "airplane house"],
  [/\btrain\s+car\s+(?:house|home)\b|\bcaboose\s+(?:house|home)\b|\brailcar\s+home\b/i, "train-car house"],
  [/\b(?:boat|ship)\s+house\b|\bship[- ]inspired\s+(?:house|home)\b/i, "boat-inspired house"],
  [/\bbus\s+(?:house|home|conversion|conversion\s+home)\b|\bskoolie\b/i, "bus conversion"],
  [/\b(?:rv|tiny[- ]home)\s+conversion\b/i, "RV/tiny-home conversion"],
];

export function detectVehicleInspired(message: string): string | null {
  for (const [re, label] of VEHICLE_INSPIRED_RE) if (re.test(message)) return label;
  return null;
}

export function vehicleInspiredReply(concept: string): string {
  return `${cap(concept)} could mean a few real things: a home shaped like the vehicle, a converted aircraft/vessel/` +
    "car, a hangar- or slip-adjacent home, a themed rental, or land near an airstrip or water. Each has different " +
    "zoning, building-code, utility, safety, and permitting issues. Are you trying to build one, buy one, convert a " +
    "real vehicle, or find land where a concept like that could legally work?";
}

// ── Marine liveaboard / nontraditional dwelling ──────────────────────────────
const MARINE_RE = /\blive\s+(?:on|aboard)\b.{0,20}\b(?:a\s+)?(sailboat|houseboat|boat|yacht|barge|floating\s+home|vessel)\b|\b(?:buy|own)\s+a\s+(floating\s+home|houseboat|liveaboard)\b/i;
const NONTRAD_DWELLING_RE = /\blive\s+(?:in|on)\b.{0,25}\b(?:an?\s+)?(rv|van|tiny\s+home|tiny\s+house|tiny[- ]home\s+village|yurt|camper|motorhome|school\s+bus|earthship|dome\s+home)\b|\bvan\s*life\b|\bfull[- ]time\s+rv\b/i;

export function detectMarineDwelling(message: string): { concept: string; kind: "marine" | "nontraditional" } | null {
  const m = message.match(MARINE_RE);
  if (m) return { concept: (m[1] ?? m[2] ?? "vessel").toLowerCase(), kind: "marine" };
  const n = message.match(NONTRAD_DWELLING_RE);
  if (n) return { concept: (n[1] ?? "dwelling").toLowerCase(), kind: "nontraditional" };
  return null;
}

export function marineReply(concept: string): string {
  return `Living on a ${concept} is a real but regulated liveaboard path. Furlong would need to check marina ` +
    "liveaboard rules, slip availability, harbor-authority rules, vessel registration, insurance, sanitation/" +
    "pump-out requirements, coastal regulations, and financing — and whether you mean full-time residence, seasonal " +
    "use, or a floating rental/hospitality concept. Are you trying to live aboard full-time, buy a vessel, find a " +
    "marina/slip, or compare this to land-based alternatives?";
}

export function nontraditionalReply(concept: string): string {
  return `Living in ${/^[aeiou]/.test(concept) ? "an" : "a"} ${concept} full-time is a real but regulated path. Furlong would check local zoning and ` +
    "occupancy rules, whether full-time dwelling is allowed on the land in question, utilities/septic/water, parking " +
    "or siting limits, HOA restrictions, and any tiny-home or RV ordinances. Are you placing it on land you own, " +
    "looking for land that allows it, or comparing options? And which area?";
}

// ── Specialty / surplus / adaptive-reuse assets ──────────────────────────────
const SPECIALTY_RE: [RegExp, string][] = [
  [/\b(?:missile\s+silo|nuclear\s+silo|icbm\s+silo|launch\s+silo)\b/i, "retired missile silo"],
  [/\b(?:old|former|decommissioned|surplus)\s+military\s+(?:base|site)\b|\bmilitary\s+surplus\s+property\b/i, "former military property"],
  [/\blighthouse\b/i, "lighthouse"],
  [/\bshipping\s+container\s+(?:home|house)\b|\bcontainer\s+home\b/i, "shipping-container home"],
  [/\b(?:old|former|decommissioned|abandoned)\s+(?:school|church|fire\s+station|firehouse|jail|hospital|factory|mill|warehouse|industrial\s+site)\b/i, "adaptive-reuse property"],
  [/\bgrain\s+elevator\b|\bwater\s+tower\b|\bbunker\b|\bsilo\s+(?:conversion|home)\b/i, "specialty structure"],
  [/\b(?:barn|church|school|warehouse|firehouse|mill)\s+conversion\b/i, "conversion property"],
];

export function detectSpecialtyAsset(message: string): string | null {
  for (const [re, label] of SPECIALTY_RE) if (re.test(message)) {
    const m = message.match(re)!;
    return label === "adaptive-reuse property" || label === "conversion property" ? m[0].toLowerCase() : label;
  }
  return null;
}

export function specialtyAssetReply(asset: string): string {
  return `A ${asset} is unusual, but not automatically impossible. Some former military, industrial, transportation, ` +
    "lighthouse, rail, school, church, and specialty properties may exist through specialty brokers, auctions, " +
    "government surplus, or private sales — availability must be verified. Furlong would need to check title and " +
    "survey diligence, environmental conditions, access, utilities, zoning, building code, safety, permitting, " +
    "financing, and insurance, and whether the reuse is residential, commercial, storage, tourism, or another " +
    `lawful use. Are you trying to buy an existing ${asset}, convert one into housing, use it for storage/business, ` +
    "or compare similar adaptive-reuse properties?";
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── GENERIC ANIMAL GOAL classifier (defect fix 2026-06-12) ───────────────────
// "I want ostriches in ME" / "I want a camel in Texas" must NOT fall through to
// ASK_STORY. Any animal-goal is classified generically (no per-animal route).
export type AnimalCategory = "livestock" | "exotic_livestock" | "companion_animal" | "wildlife_or_conservation" | "aquaculture" | "apiculture";

const ANIMAL_LEXICON: [RegExp, AnimalCategory][] = [
  [/\b(?:ostrich|emu|rhea|camel|yak|water\s+buffalo|llama|alpaca|reindeer|bison|buffalo|elk|musk\s+ox(?:en)?|peacock|peafowl|guinea\s+fowl|antelope|zebra|kangaroo|wallaby)(?:e?s)?\b/i, "exotic_livestock"],
  [/\b(?:cattle|cow|steer|bull|calf|pig|hog|swine|sheep|lamb|goat|chicken|hen|rooster|poultry|horse|pony|ponies|donkey|mule|turkey|duck|goose|geese|rabbit|quail)(?:e?s)?\b/i, "livestock"],
  [/\b(?:trout|catfish|tilapia|salmon|shrimp|prawn|oyster|clam|mussel|crawfish|aquaculture|fish\s+farm)\b/i, "aquaculture"],
  [/\b(?:bee|bees|apiary|apiaries|honeybee|beekeep(?:ing|er)?|hive)s?\b/i, "apiculture"],
  [/\b(?:deer|bison\s+herd|elk\s+herd|game\s+animal|wildlife|pheasant)\b/i, "wildlife_or_conservation"],
  [/\b(?:dog|cat|puppy|kitten)\b/i, "companion_animal"],
];

const ANIMAL_GOAL_VERB_RE = /\b(?:want|wants|need|needs|raise|raising|breed|breeding|buy|keep|keeping|start|get|own|have|farm|farming)\b/i;

function singularizeAnimal(w: string): string {
  const s = w.toLowerCase();
  if (/(?:ches|shes|sses|xes)$/.test(s)) return s.slice(0, -2); // ostriches→ostrich
  if (/[^s]s$/.test(s)) return s.slice(0, -1);                  // emus→emu, camels→camel
  return s;                                                     // reindeer, sheep, musk ox
}

export function detectAnimalCategory(message: string): { animal: string; category: AnimalCategory } | null {
  for (const [re, category] of ANIMAL_LEXICON) {
    const m = message.match(re);
    if (m) return { animal: singularizeAnimal(m[0]), category };
  }
  return null;
}

/** A generic animal GOAL: an animal entity + a goal verb (or location phrasing). */
export function detectAnimalGoal(message: string): { animal: string; category: AnimalCategory } | null {
  const found = detectAnimalCategory(message);
  if (!found) return null;
  const hasGoal = ANIMAL_GOAL_VERB_RE.test(message) || /\b(?:in|on|near)\s+[A-Z]/.test(message);
  return hasGoal ? found : null;
}

export function animalGoalReply(animal: string, category: AnimalCategory): string {
  if (category === "exotic_livestock") {
    return `Raising ${animal} is a real but specialized agricultural path. We’d look at ag zoning, exotic/livestock ` +
      "permits and animal limits, fencing/shelter, veterinary and feed sourcing, setbacks, and whether you want an " +
      "operating operation, land to start one, or a smaller setup. Which region, and roughly what scale?";
  }
  if (category === "aquaculture") {
    return `${cap(animal)} is an aquaculture/specialized-ag goal. We’d look at water rights and quality, state ` +
      "aquaculture permits, zoning, environmental rules, and whether you have land/water or are looking. " +
      "Which region, and operating business, land to build, or smaller setup?";
  }
  if (category === "apiculture") {
    return "Bees are a real apiculture path — from a single backyard hive to a honey or pollination business. We’d " +
      "look at local bee rules and setbacks, state apiary registration, lot/HOA limits, water source, and scale. " +
      "Are you thinking one or two hives at home, a small apiary, or an income operation — and do you have a " +
      "property already, or are you looking for one that allows bees?";
  }
  if (category === "wildlife_or_conservation") {
    return `A ${animal} goal usually means a wildlife, game, or conservation land use. We’d look at acreage, state ` +
      "wildlife/game rules, conservation easements or programs, zoning, and whether this is private land, a preserve, " +
      "or a managed operation. Which region?";
  }
  if (category === "companion_animal") {
    return `Happy to help with the ${animal} as a property goal — are you after land or a property where ${animal}s ` +
      "are allowed, a boarding/kennel/breeding use, or a pet-related business? Rules are local — which area?";
  }
  return `A ${animal} operation is a real agricultural goal. We’d look at ag zoning, animal limits, setbacks, ` +
    "manure/nutrient management, water, fencing/shelter, and whether you want an operating farm, land to start one, " +
    "or a smaller setup. Which region, and roughly what scale?";
}

// ── APICULTURE SCALE / BEE-BOX clarification (patch 2026-06-12) ──────────────
// "one bee box" after "I want bees" is a SCALE clarification inside the
// apiculture domain — never a generic constraints answer or open discovery.
const APIARY_SCALE_RE =
  /\b(?:one|a|an|1|two|2|a\s+few|couple\s+of?)\s+(?:bee\s*box(?:es)?|hives?|colon(?:y|ies))\b|\bbackyard\s+bees\b|\bsmall\s+apiary\b|\bhobby\s+beekeep|\bhoney\s*bees?\s+for\s+my\s+(?:yard|garden)\b|\bpollination\s+(?:for\s+my\s+(?:garden|yard|crops?)|income|services?)\b|\bkeep\s+bees\b/i;

export const APIARY_SCALE_REPLY =
  "Got it — one hive / one bee box is a small-scale apiary path. That can be realistic, but it depends on local " +
  "rules, lot size, setbacks, nuisance rules, water source, nearby neighbors, HOA/private restrictions, state " +
  "apiary registration, wintering, equipment, and whether this is hobby use or honey/pollination income. Do you " +
  "already have a property where the hive would go, or are you looking for a property that allows bees?";

export function detectApiaryScale(message: string): boolean {
  return APIARY_SCALE_RE.test(message);
}

// ── SHORT NOUN PHRASE resolver (patch 2026-06-12) ────────────────────────────
// "Cat box" is not nothing. A short noun phrase with no goal verb — especially
// [animal/object] + box/tank/pond/cage/etc. — clarifies before intake. Phrases
// the specific routes already own (chicken coop, horse barn) never reach this.
const GOAL_VERB_PRESENT_RE = /\b(?:want|need|buy|build|live|own|acquire|find|looking|raise|keep|start|sell|lease|convert|help|analyz)/i;
const SHORT_NP_RE =
  /^\s*(?:a|an|one|the|my)?\s*([a-z]+(?:\s+[a-z]+)?)\s+(box|tank|pond|cage|crate|room|shelter|hutch|coop|pen|barn|house|kennel|habitat|run)\s*(?:please)?\s*[.!?]*\s*$/i;
const STANDALONE_NP_RE = /^\s*(?:a|an|one|the)?\s*(animal\s+shelter|kennel|pet\s+room|aviary|apiary)\s*(?:please)?\s*[.!?]*\s*$/i;

export function detectShortNounPhrase(message: string): string | null {
  if (GOAL_VERB_PRESENT_RE.test(message)) return null;
  if (message.trim().split(/\s+/).length > 5) return null;
  const m = message.match(SHORT_NP_RE);
  if (m) return `${m[1]} ${m[2]}`.toLowerCase();
  const s = message.match(STANDALONE_NP_RE);
  return s ? s[1].toLowerCase() : null;
}

export function shortNounPhraseReply(phrase: string): string {
  if (/^cat\s+box$/.test(phrase)) {
    return "When you say “cat box,” do you mean a litter-box product, a shelter/boarding setup for cats, a cat café " +
      "or pet business, a small structure for an animal rescue, or are you testing the Navigator? Furlong can help " +
      "with lawful property, business, animal-care, or facility questions once I know which meaning you intend.";
  }
  return `When you say “${phrase},” do you mean a product, a structure for animals, a shelter/boarding or rescue ` +
    "setup, a pet or animal business, or are you testing the Navigator? Furlong can help with lawful property, " +
    "business, animal-care, or facility questions once I know which meaning you intend.";
}

// ── PARCEL ENCUMBRANCE / EASEMENT (not infrastructure analysis) ──────────────
// A pipeline easement ON a farm is a PROPERTY CONSTRAINT — not a request to
// analyze the pipeline. Detected before the infra hard-shutdown. NEVER yields
// operational infrastructure detail (owner/operator, route, pressure, status,
// access, vulnerabilities).
const EASEMENT_RE = /\beasement\b|\bright[- ]of[- ]way\b|\b(?:utility|gas|pipeline|transmission|power\s+line|drainage|access|conservation)\s+(?:easement|right[- ]of[- ]way|corridor)\b/i;

export const EASEMENT_CONSTRAINT_REPLY =
  "That is a property-constraint question, not a request to analyze the pipeline or facility itself. Furlong can " +
  "help at a high level with how an easement may affect buildable area, setbacks, access, farming use, financing, " +
  "insurance, and due diligence. We won’t provide operational pipeline/utility details. You’d need the recorded " +
  "easement, survey, title commitment, local zoning, and utility/operator review before relying on it — and " +
  "without the easement document the exact limits can’t be determined.";

export function detectEasementConstraint(message: string): boolean {
  return EASEMENT_RE.test(message);
}

// ── NEIGHBOR / THIRD-PARTY HOUSE ACQUISITION boundary ────────────────────────
// Property-focused acquisition is allowed; people-targeting is not. Distinguish
// a lawful "is it for sale / here's the listing" path from pressure, owner
// lookup, or celebrity/official targeting.
const THIRD_PARTY_RE = /\b(?:my\s+)?neighbor'?s?\s+(?:house|home|property|farm|land|place)\b|\bhouse\s+next\s+door\b|\b(?:that|this)\s+person'?s\s+(?:house|home|property)\b|\bnext[- ]door\s+(?:house|property)\b/i;
const PRESSURE_RE = /\b(?:how\s+do\s+i\s+get|how\s+to\s+get|make|convince|pressure|force|persuade|push)\b.{0,30}\b(?:them|him|her|my\s+neighbor|the\s+owner|the\s+homeowner)\b.{0,15}\b(?:to\s+)?sell\b|\bget\s+(?:them|him|her|the\s+owner)\s+to\s+sell\b|\bcontact\s+the\s+(?:owner|homeowner|resident)\b/i;
const CELEBRITY_RE = /\b(?:celebrity|celeb|famous\s+person|movie\s+star|pop\s+star|athlete|senator|congress(?:man|woman|person)|governor|mayor|president|public\s+official|the\s+ceo\s+of)\b.{0,20}\b(?:house|home|residence|property|mansion|estate)\b|\b(?:house|home|residence|mansion)\b.{0,20}\bof\s+(?:a\s+)?(?:celebrity|famous|senator|governor|the\s+president)\b/i;

export const THIRD_PARTY_CLARIFY_REPLY =
  "That can be a legitimate property goal, but Furlong has to keep this property-focused, not person-focused. I can " +
  "help analyze a property that is publicly listed, openly marketed, or that you provide as an address for lawful " +
  "property-use review — but I can’t identify, target, pressure, or profile the owner or resident. Is the property " +
  "publicly for sale, or are you asking how to evaluate it if it becomes available?";

export const THIRD_PARTY_PRESSURE_REPLY =
  "I can’t help pressure, target, or profile a homeowner. A lawful path would be to work through a licensed real " +
  "estate professional, a public listing, or a neutral market channel.";

export const THIRD_PARTY_CELEBRITY_REPLY =
  "Furlong can’t help target a person’s residence. If there is a public listing or official sale source, paste that " +
  "link and we can analyze only the property, not the person.";

// ── Private-address acquisition: limited public overview vs hard shutdown ─────
// A bare private/residential address + purchase intent is NOT a hard shutdown.
// Without verified availability it gets a LIMITED generic overview (categories
// only), never owner/resident data, pro forma, or targeting. If the same
// address was tied to stalking/harassment earlier in the session, even the
// limited overview is withheld.
const STREET_ADDRESS_RE = /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|way|ct|court|pl|place|hwy|highway|cir|circle|terrace|ter|trail|trl|pkwy|parkway)\b/i;
const ACQUIRE_ADDR_RE = /\b(?:buy|purchase|acquire|own)\b/i;
// A claimed (unverified) availability signal also warrants the limited overview.
const FSBO_CLAIM_RE = /\bfsbo\b|\bfor\s+sale\s+by\s+owner\b|\bis\s+for\s+sale\b|\bon\s+the\s+market\b/i;
const SELF_PROPERTY_RE = /\b(?:my|our)\s+(?:farm|land|property|lot|parcel|house|home|place)\b/i;
const SELLER_OFFERED_RE = /\b(?:offered|wants|agreed|willing)\s+to\s+sell\s+(?:me|us)\b|\bseller\s+(?:offered|invited)\b/i;

export function detectStreetAddress(message: string): string | null {
  const m = message.match(STREET_ADDRESS_RE);
  return m ? m[0].toLowerCase().replace(/\s+/g, " ").trim() : null;
}

export const PRIVATE_ADDRESS_OVERVIEW_REPLY =
  "I can help at a general property level, but I can’t treat a private residence as a full acquisition target unless " +
  "there is public sale, FSBO, auction, broker, or other lawful availability evidence. Without that, I can only give " +
  "a limited overview: what categories we would check — zoning, permitted uses, constraints, condition, financing " +
  "fit, and due diligence — and I can’t identify, profile, contact, or pressure the owner or residents. If you have " +
  "a listing, FSBO page, auction notice, or written invitation to evaluate the property, paste or provide that and I " +
  "can analyze the property itself.";

export const PRIVATE_ADDRESS_STALKING_REFUSAL =
  "Because this session included targeting or stalking language tied to that address, I can’t continue analyzing it " +
  "here. If there is a public listing or lawful sale process, start a new property-focused session and provide that " +
  "listing source.";

export type PrivateAddressKind = "overview" | "seller-offered" | null;

/** Detect a private-address (or seller-offered) acquisition lacking verified availability. */
export function detectPrivateAddressAcquisition(message: string): { kind: PrivateAddressKind; address: string | null } {
  // A real listing URL means an ordinary property path — handled elsewhere.
  if (/https?:\/\//i.test(message)) return { kind: null, address: null };
  if (SELLER_OFFERED_RE.test(message)) return { kind: "seller-offered", address: detectStreetAddress(message) };
  const address = detectStreetAddress(message);
  if (address && (ACQUIRE_ADDR_RE.test(message) || FSBO_CLAIM_RE.test(message)) && !SELF_PROPERTY_RE.test(message)) {
    return { kind: "overview", address };
  }
  return { kind: null, address: null };
}

export type ThirdPartyKind = "pressure" | "celebrity" | "clarify";

export function detectThirdPartyAcquisition(message: string): ThirdPartyKind | null {
  // A real listing URL means an ordinary property path — let listing intake run.
  if (/https?:\/\//i.test(message)) return null;
  if (PRESSURE_RE.test(message)) return "pressure";
  if (CELEBRITY_RE.test(message)) return "celebrity";
  if (THIRD_PARTY_RE.test(message)) return "clarify";
  return null;
}

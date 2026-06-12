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
type AssetGoalIntent = "ROUTE_HEALTHCARE_REAL_ESTATE" | "ROUTE_REGULATED_BUSINESS_ACQUISITION" | "ROUTE_COMMERCIAL_ACQUISITION";

const ACQUIRE_VERB = "\\b(?:buy|purchase|acquire|own|invest\\s+in|develop|build|open|start)\\b";

const HEALTHCARE_RE = /\b(?:hospital|medical\s+(?:center|building|office)|clinic|nursing\s+home|assisted\s+living|surgery\s+center|dialysis\s+center|healthcare\s+facility|urgent\s+care)\b/i;
const REGULATED_BIZ_RE = /\b(?:laundromat|gas\s+station|car\s+wash|liquor\s+store|dispensary|funeral\s+home|daycare|child\s+care|self[- ]storage|storage\s+facility|processing\s+(?:facility|plant)|distillery|brewery|winery|cannabis\s+(?:grow|cultivation)|slaughterhouse|recycling\s+(?:center|facility))\b/i;
const COMMERCIAL_RE = /\b(?:hotel|motel|resort|apartment\s+(?:complex|building)|mobile\s+home\s+park|trailer\s+park|rv\s+park|shopping\s+(?:center|mall)|strip\s+mall|office\s+(?:building|park)|warehouse|industrial\s+(?:building|park)|retail\s+(?:center|space)|restaurant|bar\s+business|farmland|ranch\s+land|vineyard|orchard|timberland|commercial\s+(?:building|property|real\s+estate))\b/i;

export function detectAssetGoal(message: string): AssetGoal | null {
  const acquiring = new RegExp(ACQUIRE_VERB, "i").test(message);
  if (!acquiring) return null;
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

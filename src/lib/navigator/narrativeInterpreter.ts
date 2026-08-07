/**
 * Narrative interpreter — the DETERMINISTIC floor that reads the visitor's own
 * words and walks the spine (spec §1):
 *
 *   Person → Story → Assets → Constraints → Pathways → Evidence → Programs →
 *   Tradeoffs → Decision → Journey
 *
 * There is NO chip grid and NO persona enum: the visitor types; this extracts
 * what it can (property kind, assets, constraints, an address or pasted listing
 * link) and decides the next conversational move. The AI guide (Tier-1, same
 * driver seam as aiInterview) can replace the WORDING and enrich extraction;
 * the arc, the refusal gates, and the pathway engine stay deterministic.
 *
 * ISOMORPHIC + pure. Anonymous: free text is interpreted in-flight and only the
 * extracted PROPERTY facts persist (journey memory holds no identity).
 */

import { resolveListingInput, type PropertyReference } from "./listingIntake";
import { EMPTY_CONTEXT, type PropertyContext } from "./possibilityCheck";
import type { NoveltyGate } from "./noveltyBuildDoctrine";

export type ArcNode =
  | "person" | "story" | "assets" | "constraints"
  | "pathways" | "evidence" | "programs" | "tradeoffs" | "decision" | "journey";

export const ARC_ORDER: ArcNode[] = [
  "person", "story", "assets", "constraints", "pathways",
  "evidence", "programs", "tradeoffs", "decision", "journey",
];

/**
 * Property-intent states (fix 2026-06-11): "I don't have a property / help me
 * find one" must route to GUIDED PROPERTY DISCOVERY, never loop back to the
 * "what do you have to work with?" asset prompt. Discovery never requires an
 * address or listing before it can begin.
 */
export type PropertyIntent =
  | "HAS_PROPERTY"
  | "HAS_LISTING_LINK"
  | "NO_PROPERTY_YET"
  | "WANTS_PROPERTY_DISCOVERY"
  | "UNKNOWN_OPEN_DISCOVERY"
  | "PROTECTED_STEERING_REFUSED"
  | null;

export type DealType =
  | "hospitality-acquisition"
  | "working-farm"
  | "rural-business"
  | "redevelopment"
  | "residential-income"
  | "general";

export interface JourneyState {
  /** Server-authenticated integrity tag; clients may carry but never mint it. */
  integrity?: string;
  node: ArcNode;
  /** Free-text fragments the visitor offered, in their words (no identity). */
  story: string[];
  context: PropertyContext;
  property: PropertyReference | null;
  /** Mode 1 = open discovery ("guide me"); mode 2 = brought their own asset. */
  entryMode: "open-discovery" | "own-asset" | null;
  /** The latest classified property intent. */
  intent: PropertyIntent;
  /** Guided Property Discovery engaged — assets node is satisfied WITHOUT an address. */
  guidedDiscovery: boolean;
  /** The best current reading of the deal rhythm for this property/opportunity. */
  dealType: DealType;
  exploredPathways: string[];
  /** Guide prompts already sent (anti-repeat: a prompt may not repeat more than once). */
  askedPrompts: string[];
  /** Anonymous abuse counters (REALITY-SEC-001 input guard) — never an identity. */
  guardCounters: { refusals: number; rejections: number };
  /** Machine-readable intent of the PREVIOUS guide turn (intent loop guard). */
  lastTurnIntent: string | null;
  /** Last THREE guide intents (semantic loop guard, routing fix 2026-06-12). */
  recentTurnIntents: string[];
  /** Novelty/fantasy build code-compliance gate — null = no novelty concept. */
  noveltyGate: NoveltyGate | null;
  /** ESCALATE_VIOLENT_THREAT fired — discovery stays held until human review. */
  threatHold: boolean;
  /** Addresses tied to stalking/harassment THIS session — no overview for them. */
  flaggedAddresses: string[];
  /**
   * PROPOSED-SOLUTION-AS-HYPOTHESIS-001: a stated expansion/portfolio path has
   * already been met with the objective-discovery question this session, so the
   * hypothesis layer does NOT re-ask — the user's next turn (an objective or a
   * confirmation) proceeds to the existing asset routing.
   */
  proposedSolutionAsked: boolean;
  /**
   * OBJECTIVE-DISCOVERY-001: the hypothesis layer just asked "what are you
   * trying to accomplish", so the NEXT user message is interpreted as an
   * OBJECTIVE answer (wealth, passive income, job replacement, …) — never as a
   * generic constraints/questionnaire prompt. Cleared once the objective is
   * captured or the user confirms the original path.
   */
  objectiveDiscoveryPending: boolean;
  /** The proposed asset label ("pet stores") to reference in objective discovery. */
  proposedAssetLabel: string | null;
}

export const FRESH_JOURNEY: JourneyState = {
  node: "person", story: [], context: EMPTY_CONTEXT, property: null, entryMode: null,
  intent: null, guidedDiscovery: false, dealType: "general", exploredPathways: [], askedPrompts: [],
  guardCounters: { refusals: 0, rejections: 0 },
  lastTurnIntent: null, recentTurnIntents: [], noveltyGate: null, threatHold: false, flaggedAddresses: [],
  proposedSolutionAsked: false, objectiveDiscoveryPending: false, proposedAssetLabel: null,
};

// ── Guided Property Discovery copy (spec fix 2026-06-11) ─────────────────────
export const GUIDED_DISCOVERY_OPENER =
  "Absolutely. We can start without a property. Tell me what kind of journey you're looking for — income, " +
  "farming, rural business, storage, housing, hospitality, conservation, or just something interesting — and " +
  "I'll help narrow possible property types and pathways without using demographics or neighborhood profiling.";

export const GUIDED_DISCOVERY_FOLLOWUP =
  "What would make a property interesting to you — income, lifestyle, business use, land, location type, " +
  "budget range, or something else?";

// ── property-intent detection (paraphrase-robust, deterministic) ─────────────
const NO_PROPERTY_RE: RegExp[] = [
  /\b(?:don'?t|do\s+not)\s+(?:have|own)\b/i,
  /\bno\s+(?:specific\s+)?property\b/i,
  /\bnothing\s+(?:yet|specific|in\s+mind)\b/i,
  /\bdon'?t\s+own\s+anything\b/i,
  /\bno\s+idea\b/i,
  /\bhaven'?t\s+(?:found|bought|got)\b/i,
];
const WANTS_DISCOVERY_RE: RegExp[] = [
  /\bhelp\s+(?:me\s+)?find\b/i,
  /\bfind\s+me\s+(?:a|an|some|something)\b/i,
  /\bshow\s+me\s+what\s+might\s+fit\b/i,
  /\blooking\s+(?:for|to\s+(?:buy|find))\b.{0,30}\b(?:property|land|place|something)\b/i,
  /\bwant\s+(?:a|an)\s+property\b/i,
  /\bwhat\s+(?:property|kind\s+of\s+property)\s+(?:should|could|can)\s+I\b/i,
];

/** Classify the property intent of a message (independent of refusal gates). */
export function detectPropertyIntent(message: string, ref: PropertyReference | null): PropertyIntent {
  if (ref && ref.source !== "plain-address" && (ref.addressText || true)) return "HAS_LISTING_LINK";
  if (ref) return "HAS_PROPERTY";
  if (WANTS_DISCOVERY_RE.some((re) => re.test(message))) return "WANTS_PROPERTY_DISCOVERY";
  if (NO_PROPERTY_RE.some((re) => re.test(message))) return "NO_PROPERTY_YET";
  if (/\b(?:don'?t know|not sure|guide me|what'?s possible|help me figure)\b/i.test(message)) return "UNKNOWN_OPEN_DISCOVERY";
  return null;
}

/** Map a guided-discovery interest answer to a property kind where sensible. */
const INTEREST_KINDS: [RegExp, PropertyContext["propertyKind"]][] = [
  [/\bfarm|agricultur|crop|ranch|grow\b/i, "farm"],
  [/\bhous|home|residen|live\s+in\b/i, "residential"],
  [/\bbusiness|hospitality|retail|commercial|shop\b/i, "commercial"],
];

// ── extraction (deterministic; the AI may enrich, never replace, this floor) ──
const KIND_HINTS: [RegExp, PropertyContext["propertyKind"]][] = [
  [/\b(?:farm|farmer|ranch|cropland|acreage|cattle|livestock|fields?|grain|pasture)\b/i, "farm"],
  [/\b(?:house|home|residential|backyard|condo|townhouse|duplex|my\s+place)\b/i, "residential"],
  [/\b(?:commercial|retail|warehouse|office|storefront)\b/i, "commercial"],
];

function inferDealType(s: JourneyState): DealType {
  const corpus = [
    ...s.story,
    s.property?.addressText ?? "",
    s.context.propertyKind,
  ].join(" ").toLowerCase();

  if (/(inn|hotel|motel|lodging|retreat|guesthouse|short[-\s]?term|vacation|wedding|event venue|hospitality|bnb)/.test(corpus)) {
    return "hospitality-acquisition";
  }
  if (/(farm|ranch|orchard|pasture|acreage|crop|livestock|greenhouse|agri|homestead)/.test(corpus) || s.context.propertyKind === "farm") {
    return "working-farm";
  }
  if (/(redevelop|adaptive reuse|conversion|rehab|renovat|vacant|historic|main street|warehouse|mixed[-\s]?use|brownfield|opportunity zone)/.test(corpus)) {
    return "redevelopment";
  }
  if (/(commercial|retail|office|industrial|flex|service business|shop|warehouse|light industrial)/.test(corpus) || s.context.propertyKind === "commercial") {
    return "rural-business";
  }
  if (/(rental|duplex|triplex|multifamily|house[-\s]?hack|owner[-\s]?occupied|single[-\s]?family|residential)/.test(corpus) || s.context.propertyKind === "residential") {
    return "residential-income";
  }
  return "general";
}

export function describeDealType(dealType: DealType): string {
  switch (dealType) {
    case "hospitality-acquisition":
      return "hospitality acquisition";
    case "working-farm":
      return "working farm";
    case "rural-business":
      return "rural business";
    case "redevelopment":
      return "redevelopment opportunity";
    case "residential-income":
      return "residential income opportunity";
    default:
      return "property opportunity";
  }
}

export function shouldAutoPresentPathways(s: JourneyState): boolean {
  return (
    !s.guidedDiscovery &&
    (
      (s.entryMode === "own-asset" && (s.property !== null || s.context.propertyKind !== "unknown")) ||
      (s.context.propertyKind !== "unknown" && s.story.length >= 1)
    )
  );
}

export function interpretMessage(prev: JourneyState, message: string): JourneyState {
  const s: JourneyState = {
    ...prev,
    story: [...prev.story, message].slice(-12),
    context: { ...prev.context },
  };

  // Pasted listing/address → the Assets node becomes the entry point (mode 2).
  const ref = resolveListingInput(message);
  if (ref && (ref.addressText || ref.source !== "plain-address")) {
    s.property = ref;
    s.context.addressText = ref.addressText || s.context.addressText;
    s.context.state = ref.state ?? s.context.state;
    s.entryMode = s.entryMode ?? "own-asset";
  }

  for (const [re, kind] of KIND_HINTS) {
    if (re.test(message) && s.context.propertyKind === "unknown") s.context.propertyKind = kind;
  }
  const acres = message.match(/(\d+(?:\.\d+)?)\s*acres?/i);
  if (acres) s.context.acreage = Number(acres[1]);
  if (/\bpool\b/i.test(message)) s.context.hasPool = !/\bno\s+pool\b/i.test(message);
  if (/\bgarage\b/i.test(message)) s.context.hasGarage = !/\bno\s+garage\b/i.test(message);
  if (/\bHOA\b/i.test(message)) s.context.inHoa = !/\b(?:no|not\s+in)\s+(?:an?\s+)?HOA\b/i.test(message);
  if (/\bcc&?rs?\b/i.test(message)) s.context.ccrsSupplied = /\b(?:attach|supply|have|here)\b/i.test(message);

  // Property intent: "no property / help me find one" ENGAGES guided discovery
  // — it never bounces back to the asset prompt (loop fix 2026-06-11).
  const intent = detectPropertyIntent(message, s.property === prev.property ? null : s.property);
  if (intent) s.intent = intent;
  if (intent === "NO_PROPERTY_YET" || intent === "WANTS_PROPERTY_DISCOVERY") {
    s.guidedDiscovery = true;
    s.entryMode = s.entryMode ?? "open-discovery";
  }
  if (intent === "UNKNOWN_OPEN_DISCOVERY") {
    s.entryMode = s.entryMode ?? "open-discovery";
    // "no idea" while already past the story node = they have nothing to bring
    // — engage guided discovery rather than re-asking for an asset.
    if (s.node === "assets" || s.node === "constraints") s.guidedDiscovery = true;
  }
  // In guided discovery, the interest answer can narrow the property kind.
  if (s.guidedDiscovery && s.context.propertyKind === "unknown") {
    for (const [re, kind] of INTEREST_KINDS) {
      if (re.test(message)) { s.context.propertyKind = kind; break; }
    }
  }

  s.dealType = inferDealType(s);

  // Advance the arc: we move forward when the current node has what it needs.
  s.node = nextNode(s);
  return s;
}

function nextNode(s: JourneyState): ArcNode {
  // The arc never moves backwards; it advances as substance accumulates.
  const at = ARC_ORDER.indexOf(s.node);
  const hasPerson = s.story.length >= 1;
  const hasStory = s.story.length >= 2 || s.entryMode !== null;
  // Guided discovery SATISFIES the assets node — no address/listing required.
  const hasAssets = s.property !== null || s.context.propertyKind !== "unknown" || s.guidedDiscovery;
  // Constraints are optional substance — one more exchange after assets.
  const enough = [hasPerson, hasStory, hasAssets];
  let target: ArcNode = "person";
  if (hasPerson) target = "story";
  if (hasStory) target = "assets";
  if (hasAssets) target = "constraints";
  if (shouldAutoPresentPathways(s)) target = "pathways";
  if (enough.every(Boolean) && s.story.length >= 3) target = "pathways";
  return ARC_ORDER[Math.max(at, ARC_ORDER.indexOf(target))];
}

/** The ONE next open question for the node (warm wording; AI may rephrase). */
export function questionForNode(s: JourneyState): string {
  const hasPropertyContext =
    s.property !== null ||
    s.context.propertyKind !== "unknown" ||
    s.entryMode === "own-asset";
  switch (s.node) {
    case "person":
      switch (s.dealType) {
        case "hospitality-acquisition":
          return "Before we get too far, tell me your role in this hospitality deal. Are you the buyer, operator, advisor, or still testing whether this could become a destination asset?";
        case "working-farm":
          return "Before we get too far, tell me your role here. Are you the farmer, landowner, operator, advisor, or still exploring whether this could support a real operation?";
        case "rural-business":
          return "Before we get too far, tell me your role in this business deal. Are you the buyer, operator, advisor, or still testing whether this site could support the business?";
        case "redevelopment":
          return "Before we get too far, tell me your role in this redevelopment. Are you the buyer, developer, operator, advisor, or still pressure-testing the concept?";
        case "residential-income":
          return "Before we get too far, tell me your role here. Are you the buyer, owner-occupant, investor, advisor, or still exploring the income possibilities?";
        default:
          return hasPropertyContext
            ? "Before we get too far, tell me about your role in this deal. Are you the buyer, operator, advisor, or still just exploring it?"
            : "Before we go further, tell me what role you're playing here. Are you the buyer, operator, advisor, or still just exploring?";
      }
    case "story":
      switch (s.dealType) {
        case "hospitality-acquisition":
          return "What is the actual guest and revenue thesis here? Tell me what makes you think this property could become a stay, retreat, event, or destination asset if the numbers work.";
        case "working-farm":
          return "What is the actual operating thesis here? Tell me what you think this land could produce, support, or lease into if the numbers and constraints work.";
        case "rural-business":
          return "What is the actual business thesis here? Tell me what operation belongs on this site and why this property is supposed to support it.";
        case "redevelopment":
          return "What is the actual reuse thesis here? Tell me what this property is now, what you think it could become, and why that transformation feels credible.";
        case "residential-income":
          return "What is the actual income thesis here? Tell me whether you see this as owner-occupied income, rental, storage, events, or a different residential play.";
        default:
          return s.entryMode === "own-asset"
            ? "What is the actual thesis here? Tell me what drew you to this property and what you believe it could become if the numbers and constraints work."
            : hasPropertyContext
              ? "What is the actual thesis here? Tell me what attracted you to this property and what you want it to become."
              : "What is the real opportunity you are trying to create or evaluate?";
      }
    case "assets":
      switch (s.dealType) {
        case "hospitality-acquisition":
          return "What do you actually have to work with so far: listing details, room count, event potential, budget, renovation scope, operator background, or draft numbers?";
        case "working-farm":
          return "What do you actually have to work with so far: acreage, water, soils, outbuildings, operator experience, equipment, budget, or a draft operating plan?";
        case "rural-business":
          return "What do you actually have to work with so far: listing details, zoning clues, utility capacity, business model, operator background, budget, or draft financials?";
        case "redevelopment":
          return "What do you actually have to work with so far: listing details, current condition, historic status, renovation scope, utility facts, budget, or a reuse concept?";
        case "residential-income":
          return "What do you actually have to work with so far: the listing, lot details, enclosed space, HOA status, budget, occupancy plan, or any draft numbers?";
        default:
          return hasPropertyContext
            ? "What do you actually have to work with so far: a listing, rough budget, operating plan, renovation scope, or documents already in hand?"
            : "What do you actually have to work with so far: a property, listing, rough budget, operator, or supporting documents?";
      }
    case "constraints":
      switch (s.dealType) {
        case "hospitality-acquisition":
          return "What could break this hospitality deal first: occupancy reality, renovation cost, licensing, staffing depth, access, or capital structure?";
        case "working-farm":
          return "What could break this farm deal first: water, soils, infrastructure, labor, commodity risk, timing, or capital depth?";
        case "rural-business":
          return "What could break this business deal first: zoning, utilities, traffic/access, build-out cost, operator depth, or capital limits?";
        case "redevelopment":
          return "What could break this redevelopment first: code issues, contamination, historic restrictions, utility upgrades, construction cost, or financing?";
        case "residential-income":
          return "What could break this income play first: HOA rules, local ordinances, lot size, parking, condition, or the numbers themselves?";
        default:
          return hasPropertyContext
            ? "What could break this deal first: capital limits, timing, zoning, condition, operator depth, or something else you already suspect?"
            : "What are the real constraints here: capital, timing, rules, site issues, or operator limitations?";
      }
    default:
      return "If you want to keep pressure-testing this, bring the next fact, document, or property and we will keep tightening the picture.";
  }
}

/** Proactive widening (spec §3) — the guide opens doors they didn't ask about. */
export function wideningLine(explored: string[], allIds: string[]): string | null {
  const unexplored = allIds.filter((id) => !explored.includes(id));
  if (unexplored.length === 0) return null;
  return "Have you looked at other possibilities? A few of the pathways below might interest you even though you didn't ask about them — that's the point of the journey.";
}

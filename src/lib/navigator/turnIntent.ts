/**
 * Machine-readable turn intents (loop-guard enforcement, Caitlin 2026-06-11,
 * expanded per the Routing Authority build fix 2026-06-12).
 *
 * EVERY Navigator response carries a turn_intent. The semantic loop guard
 * compares INTENTS, not just text:
 *  - HARD INVARIANT: no two consecutive bot turns may share the same
 *    turn_intent (unless the user explicitly asks to repeat/restart);
 *  - the last THREE bot intents are tracked — if the next selected intent
 *    appears in the recent three without new information, the guard branches
 *    to a different allowed action.
 * Alternates for REFUSE_* intents still refuse in substance — the guard may
 * never weaken a safety or legality boundary, only vary the wording/route.
 *
 * The rendered component exposes the intent in test mode as a
 * data-turn-intent attribute on each guide message, so the test harness can
 * assert the loop guard against the real UI.
 */

import {
  GUIDED_DISCOVERY_OPENER, GUIDED_DISCOVERY_FOLLOWUP, type ArcNode, type JourneyState,
} from "./narrativeInterpreter";

export type TurnIntent =
  // questionnaire arc (LAST-RESORT only — the router authorizes these)
  | "ASK_PERSON" | "ASK_STORY" | "ASK_ASSETS" | "ASK_GOAL" | "ASK_REGION"
  | "ASK_BUDGET" | "ASK_CONSTRAINTS"
  // clarification
  | "CLARIFY_HUMAN_CONTEXT" | "CLARIFY_METAPHOR_OR_JOKE" | "CLARIFY_METAPHOR"
  | "CLARIFY_UNUSUAL_BUILD" | "CLARIFY_OUT_OF_SCOPE" | "CLARIFY_NOVELTY_BUILD_CONCEPT"
  | "CLARIFY_SPECIFIC_CONCEPT_USE" | "CLARIFY_ANIMAL_HOUSING"
  | "ROUTE_PET_STRUCTURE" | "ROUTE_LIVESTOCK_OR_AG_STRUCTURE"
  // refusals (always refuse in substance; alternates only vary wording)
  | "REFUSE_UNLAWFUL_EVASION" | "REFUSE_FAIR_HOUSING_STEERING"
  | "REFUSE_OWNER_LOOKUP" | "REFUSE_ADULT_SEXUAL_STRUCTURE" | "REFUSE_AND_REDIRECT"
  // routing
  | "ROUTE_OPEN_DISCOVERY" | "ROUTE_MAP" | "ROUTE_MAP_EXPLORATION"
  | "OFFER_SEARCH_AND_BRING_BACK" | "ROUTE_PROPERTY_ANALYSIS"
  | "ROUTE_ALTERNATIVE_HOUSING" | "ROUTE_EARTH_SHELTERED_HOUSING"
  | "ROUTE_WEIRD_BUT_LAWFUL_ARCHITECTURE" | "ROUTE_CODE_CHECKABLE_TRANSLATION"
  | "OUT_OF_SCOPE_WITH_REAL_WORLD_ADJACENT"
  // reality + safety escalation
  | "REALITY_CHECK_ICONIC_ASSET" | "ESCALATE_VIOLENT_THREAT"
  | "ESCALATE_TARGETED_HARASSMENT" | "HARD_SHUTDOWN_SENSITIVE_FACILITY"
  // goal-first asset-class / dwelling / specialty routes
  | "ROUTE_COMMERCIAL_ACQUISITION" | "ROUTE_HEALTHCARE_REAL_ESTATE"
  | "ROUTE_REGULATED_BUSINESS_ACQUISITION" | "ROUTE_VEHICLE_INSPIRED_ARCHITECTURE"
  | "ROUTE_MARINE_LIVEABOARD" | "ROUTE_NONTRADITIONAL_DWELLING"
  | "ROUTE_SPECIALTY_ASSET_ACQUISITION" | "ROUTE_SURPLUS_GOVERNMENT_PROPERTY"
  | "ROUTE_ADAPTIVE_REUSE_PROPERTY"
  // lawful regulated property operations (threat-classifier precision)
  | "ROUTE_LAWFUL_LAND_MANAGEMENT" | "ROUTE_DEMOLITION_PERMITTING"
  | "ROUTE_REGULATED_BLASTING_REVIEW" | "ROUTE_PROPERTY_OPERATION_PERMITTING"
  | "CLARIFY_LAWFUL_PROPERTY_OPERATION"
  // universal goal parser asset classes + iconic taxonomy
  | "ROUTE_AGRICULTURAL_ACQUISITION" | "ROUTE_REGULATED_AIRPORT_ASSET"
  | "ROUTE_MARINE_VESSEL_OR_LIVEABOARD" | "REALITY_CHECK_IMPOSSIBLE_SCALE_ASSET"
  | "REALITY_CHECK_NOT_PRIVATELY_OWNABLE"
  // semantic ambiguity resolution
  | "CLARIFY_AMBIGUOUS_TERM" | "REFUSE_ADULT_SERVICE_SEEKING"
  | "ROUTE_ANIMAL_RESCUE_OR_BOARDING" | "ROUTE_CONSERVATION_OR_HABITAT"
  | "CLARIFY_AMBIGUOUS_OR_MYTHIC_GOAL" | "CLARIFY_CONTEXTUAL_ANSWER"
  | "ROUTE_HOBBY_OR_SMALL_SCALE_APIARY" | "CLARIFY_SHORT_NOUN_PHRASE"
  | "PRESENT_PATHS_AND_OPTIONS" | "EXPLORE_PROPOSED_SOLUTION" | "CLARIFY_OBJECTIVE"
  // parcel encumbrance + third-party acquisition boundary
  | "ROUTE_EASEMENT_CONSTRAINT_REVIEW" | "CLARIFY_THIRD_PARTY_ACQUISITION"
  | "LIMITED_PRIVATE_ADDRESS_OVERVIEW"
  // flow
  | "WAIT_FOR_MORE_INFO" | "PRESENT_PATHWAYS";

/** The deterministic intent for the node-driven open question. */
export function intentForNode(node: ArcNode): TurnIntent {
  switch (node) {
    case "person": return "ASK_PERSON";
    case "story": return "ASK_GOAL";
    case "assets": return "ASK_ASSETS";
    case "constraints": return "ASK_BUDGET";
    default: return "ROUTE_OPEN_DISCOVERY";
  }
}

/** Did the user explicitly ask to repeat or restart? (lifts the invariant) */
export function userAskedToRepeat(message: string): boolean {
  return /\b(?:say that again|repeat that|start over|restart|ask me again|one more time)\b/i.test(message);
}

const DISCOVERY_TEXT = `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`;
const SEARCH_BRING_BACK_TEXT =
  "Here's another way in: search Zillow, Crexi, LoopNet, or LandWatch with whatever criteria feel right, and paste any listing link or address back here — I'll tell you honestly what it could become.";
const MAP_TEXT =
  "Or browse the map of America's possibilities on our home page and come back with any place that catches your eye — we can start from there.";

/**
 * Alternate ladder — when an intent would repeat, the guard switches to a
 * DIFFERENT allowed action with its own wording. Intents not listed fall back
 * to open discovery (which genuinely engages it). PRESENT_PATHWAYS is exempt
 * (each pathways turn carries new assessments, never a re-ask). Concept-aware
 * intents (CLARIFY_NOVELTY_BUILD_CONCEPT, OUT_OF_SCOPE_WITH_REAL_WORLD_ADJACENT,
 * ROUTE_WEIRD_BUT_LAWFUL_ARCHITECTURE, …) are loop-managed inside the ROUTER so
 * their alternates can still echo the user's named concept.
 */
const ALTERNATES: Partial<Record<TurnIntent, { intent: TurnIntent; text: string }>> = {
  ASK_PERSON: { intent: "ASK_GOAL", text: "Let's come at it from the goal instead — what would a win look like for you a year from now?" },
  ASK_STORY: { intent: "ASK_GOAL", text: "Let's come at it from the goal instead — what would a win look like for you a year from now?" },
  ASK_GOAL: { intent: "ASK_REGION", text: "Another angle: is there a part of the country — or a kind of place, rural or in-town — that's pulling at you?" },
  ASK_ASSETS: { intent: "ROUTE_OPEN_DISCOVERY", text: DISCOVERY_TEXT },
  ASK_REGION: { intent: "ASK_BUDGET", text: "Let's try the practical side — is there a budget range you're working inside, even a rough one?" },
  ASK_BUDGET: { intent: "ROUTE_OPEN_DISCOVERY", text: DISCOVERY_TEXT },
  ASK_CONSTRAINTS: { intent: "ROUTE_OPEN_DISCOVERY", text: DISCOVERY_TEXT },
  CLARIFY_OUT_OF_SCOPE: { intent: "ROUTE_OPEN_DISCOVERY", text: DISCOVERY_TEXT },
  CLARIFY_METAPHOR: { intent: "ROUTE_OPEN_DISCOVERY", text: DISCOVERY_TEXT },
  CLARIFY_METAPHOR_OR_JOKE: { intent: "ROUTE_OPEN_DISCOVERY", text: DISCOVERY_TEXT },
  REALITY_CHECK_ICONIC_ASSET: {
    intent: "OFFER_SEARCH_AND_BRING_BACK",
    text: SEARCH_BRING_BACK_TEXT,
  },
  // Harassment alternate STILL REFUSES and HOLDS — wording/intent only changes.
  ESCALATE_TARGETED_HARASSMENT: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "I still can’t help locate, track, or target a person. If there’s a lawful property, boundary, nuisance, safety, or code concern, tell me that and I can help think through documentation, municipal contacts, mediation, or professional help.",
  },
  HARD_SHUTDOWN_SENSITIVE_FACILITY: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "Still not something Furlong can analyze here. If you have a public for-sale, auction, surplus, or redevelopment listing, paste it and we can review only the lawful, high-level reuse questions.",
  },
  ROUTE_COMMERCIAL_ACQUISITION: { intent: "ASK_REGION", text: "Which market or region are you focused on, and is there a rough budget or financing picture? Both shape what's realistic." },
  ROUTE_HEALTHCARE_REAL_ESTATE: { intent: "ASK_REGION", text: "Which state or market, and roughly what scale? Healthcare real estate rules are very state-specific." },
  ROUTE_REGULATED_BUSINESS_ACQUISITION: { intent: "ASK_REGION", text: "Which state or town, and any budget range? Licensing and zoning for regulated businesses are local." },
  ROUTE_VEHICLE_INSPIRED_ARCHITECTURE: { intent: "ASK_REGION", text: "Which region are you thinking, and a rough budget? Both shape where a concept like that could legally work." },
  ROUTE_MARINE_LIVEABOARD: { intent: "ASK_REGION", text: "Which coast or waterway, and full-time or seasonal? Marina and harbor rules vary a lot by location." },
  ROUTE_NONTRADITIONAL_DWELLING: { intent: "ASK_REGION", text: "Which area, and is this full-time living or part-time? Local rules decide what's allowed." },
  ROUTE_SPECIALTY_ASSET_ACQUISITION: { intent: "ASK_REGION", text: "Which region, and what use — residential, storage, business, or tourism? That shapes the diligence." },
  ROUTE_SURPLUS_GOVERNMENT_PROPERTY: { intent: "ASK_REGION", text: "Which area, and intended reuse? Surplus channels and conditions vary by agency and location." },
  ROUTE_ADAPTIVE_REUSE_PROPERTY: { intent: "ASK_REGION", text: "Which region, and what reuse do you have in mind? Code and zoning drive what's feasible." },
  ROUTE_LAWFUL_LAND_MANAGEMENT: { intent: "ASK_REGION", text: "Which state and county? Burn rules and fire-authority approvals are local." },
  ROUTE_DEMOLITION_PERMITTING: { intent: "ASK_REGION", text: "Which municipality? Demolition permits and disposal rules are set locally." },
  ROUTE_REGULATED_BLASTING_REVIEW: { intent: "ASK_REGION", text: "Which state and site? Blasting rules and licensing are local, state, and federal." },
  ROUTE_PROPERTY_OPERATION_PERMITTING: { intent: "ASK_REGION", text: "Which parcel and jurisdiction? Land-disturbance permits are local." },
  CLARIFY_LAWFUL_PROPERTY_OPERATION: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "Whenever you can confirm it's a lawful, permitted operation on your own property — prescribed burn, demolition, clearing, or regulated blasting — I can help map the permitting path.",
  },
  ROUTE_AGRICULTURAL_ACQUISITION: { intent: "ASK_REGION", text: "Which region or state, and roughly what scale? Ag zoning and animal rules are local." },
  ROUTE_REGULATED_AIRPORT_ASSET: { intent: "ASK_REGION", text: "Which state, and is this a private airstrip, a public-use field, or land near one? That shapes the rules." },
  ROUTE_MARINE_VESSEL_OR_LIVEABOARD: { intent: "ASK_REGION", text: "Which coast or waterway, and live-aboard, operate, rent, or waterfront land?" },
  REALITY_CHECK_IMPOSSIBLE_SCALE_ASSET: { intent: "OFFER_SEARCH_AND_BRING_BACK", text: SEARCH_BRING_BACK_TEXT },
  REALITY_CHECK_NOT_PRIVATELY_OWNABLE: { intent: "OFFER_SEARCH_AND_BRING_BACK", text: SEARCH_BRING_BACK_TEXT },
  CLARIFY_AMBIGUOUS_TERM: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "Whenever you can tell me the real-world property, land, or business goal in plain terms, I’ll help with zoning, licensing, constraints, and alternatives.",
  },
  // The adult-service alternate STILL REFUSES — wording/intent only changes.
  REFUSE_ADULT_SERVICE_SEEKING: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "Furlong still isn’t a dating, hookup, escort, or adult-services platform. If there’s a lawful property or business goal, describe that and I can help with zoning, licensing, and alternatives.",
  },
  ROUTE_ANIMAL_RESCUE_OR_BOARDING: { intent: "ASK_REGION", text: "Which area, and is this nonprofit rescue, boarding, or breeding? Animal-use rules are local." },
  ROUTE_CONSERVATION_OR_HABITAT: { intent: "ASK_REGION", text: "Which region, and conservation, habitat, or private land? That shapes the rules and any programs." },
  CLARIFY_AMBIGUOUS_OR_MYTHIC_GOAL: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "Whenever you can tell me the real-world version — a rare property, land, business, or conservation goal — I’ll help reality-check what’s realistic.",
  },
  CLARIFY_CONTEXTUAL_ANSWER: {
    intent: "ASK_GOAL",
    text: "Just so I answer the right thing — what would a win look like for you? A property, land, business, or income goal in your own words.",
  },
  ROUTE_HOBBY_OR_SMALL_SCALE_APIARY: {
    intent: "ASK_REGION",
    text: "Which town or area would the hive go in? Bee rules — setbacks, registration, HOA limits — are local.",
  },
  CLARIFY_SHORT_NOUN_PHRASE: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "Whenever you can say a bit more about the real-world property, animal-care, business, or facility goal, I’ll point this the right way.",
  },
  PRESENT_PATHS_AND_OPTIONS: {
    intent: "ASK_REGION",
    text: "Which property or option do you want me to lay the paths and tradeoffs out for? I’ll show the map; the decision stays yours.",
  },
  ROUTE_EASEMENT_CONSTRAINT_REVIEW: { intent: "ASK_REGION", text: "Which parcel and jurisdiction? Buildable-area and use limits from an easement turn on the recorded document and local zoning." },
  CLARIFY_THIRD_PARTY_ACQUISITION: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "Whenever there’s a public listing, auction, or other lawful sale source — or you just want to define the kind of property you’re after — I can help with the property itself, never the person.",
  },
  LIMITED_PRIVATE_ADDRESS_OVERVIEW: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "Whenever you have a public listing, FSBO page, auction notice, broker listing, or a written invitation to evaluate the property, paste or provide that and I can analyze the property itself — never the owner or residents.",
  },
  // The threat alternate STILL REFUSES and STILL holds — different intent and
  // wording only; the boundary never weakens and discovery never resumes.
  ESCALATE_VIOLENT_THREAT: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "I can’t continue with that. If this is an emergency or someone may be in danger, contact emergency services now. This conversation can’t go further until that’s resolved.",
  },
  CLARIFY_ANIMAL_HOUSING: {
    intent: "ASK_REGION",
    text: "Whichever it is — which part of the country (or town) are we talking about? Climate, zoning, and animal rules all hang on the place.",
  },
  ROUTE_PET_STRUCTURE: {
    intent: "ASK_REGION",
    text: "Which town or area is this for? Kennel and animal rules are local — the place decides what's allowed.",
  },
  ROUTE_LIVESTOCK_OR_AG_STRUCTURE: {
    intent: "ASK_REGION",
    text: "Which region is the land in (or where are you looking)? Ag zoning and animal limits are set locally.",
  },
  CLARIFY_SPECIFIC_CONCEPT_USE: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "Whenever you can tell me the real-world use — home, business, habitat, education, or just testing — we can check what zoning and building codes would allow.",
  },
  CLARIFY_HUMAN_CONTEXT: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "No rush — whenever you want to tell me about a real property goal, land, business, or place, I'm here for that.",
  },
  ROUTE_OPEN_DISCOVERY: { intent: "OFFER_SEARCH_AND_BRING_BACK", text: SEARCH_BRING_BACK_TEXT },
  OFFER_SEARCH_AND_BRING_BACK: { intent: "ROUTE_MAP_EXPLORATION", text: MAP_TEXT },
  ROUTE_MAP: { intent: "ASK_GOAL", text: "Wherever you wander, the journey starts the same way — what would a win look like for you?" },
  ROUTE_MAP_EXPLORATION: { intent: "ASK_GOAL", text: "Wherever you wander, the journey starts the same way — what would a win look like for you?" },
  // Refusal alternates STILL REFUSE — different intent + wording, same boundary.
  REFUSE_UNLAWFUL_EVASION: {
    intent: "WAIT_FOR_MORE_INFO",
    text: "I still can't help with that. When you're ready, I can help with lawful information — understanding immigration processes, finding legal assistance or community resources, or exploring real property and opportunity pathways.",
  },
  REFUSE_AND_REDIRECT: { intent: "ROUTE_OPEN_DISCOVERY", text: DISCOVERY_TEXT },
  REFUSE_FAIR_HOUSING_STEERING: { intent: "ROUTE_OPEN_DISCOVERY", text: DISCOVERY_TEXT },
  REFUSE_OWNER_LOOKUP: { intent: "ROUTE_OPEN_DISCOVERY", text: DISCOVERY_TEXT },
  REFUSE_ADULT_SEXUAL_STRUCTURE: {
    intent: "ROUTE_WEIRD_BUT_LAWFUL_ARCHITECTURE",
    text: "That boundary stays — but unusual, lawful, non-sexual architecture is absolutely on the table: themed cabins, earth-sheltered homes, observatories, art-driven venues. Are you hoping to build one, buy one, or find land where one could legally be built?",
  },
  WAIT_FOR_MORE_INFO: { intent: "ROUTE_OPEN_DISCOVERY", text: DISCOVERY_TEXT },
};

export function recentIntents(j: JourneyState): string[] {
  return Array.isArray(j.recentTurnIntents) ? j.recentTurnIntents : [];
}

function pushIntent(j: JourneyState, intent: TurnIntent): JourneyState {
  const recent = [...recentIntents(j), intent].slice(-3);
  return { ...j, lastTurnIntent: intent, recentTurnIntents: recent };
}

/**
 * The semantic loop guard. Blocks (a) a consecutive intent repeat and (b) an
 * intent already present in the recent three when the message brought no new
 * information — and chooses a different allowed action. Returns the (possibly
 * swapped) intent + text and the journey with intent history updated.
 */
export function guardTurnIntent(
  journey: JourneyState,
  intent: TurnIntent,
  text: string,
  opts?: { userMessage?: string; newInformation?: boolean },
): { intent: TurnIntent; text: string; journey: JourneyState } {
  let outIntent = intent;
  let outText = text;
  const recent = recentIntents(journey);
  const consecutiveRepeat = journey.lastTurnIntent === intent;
  const staleInRecentThree = recent.includes(intent) && opts?.newInformation === false;
  const userWantsRepeat = opts?.userMessage ? userAskedToRepeat(opts.userMessage) : false;
  if (intent !== "PRESENT_PATHWAYS" && !userWantsRepeat && (consecutiveRepeat || staleInRecentThree)) {
    const alt = ALTERNATES[intent] ?? { intent: "ROUTE_OPEN_DISCOVERY" as TurnIntent, text: DISCOVERY_TEXT };
    outIntent = alt.intent;
    outText = alt.text;
    // If the alternate ALSO repeats consecutively, step once more down the ladder.
    if (journey.lastTurnIntent === outIntent) {
      const alt2 = ALTERNATES[outIntent] ?? { intent: "OFFER_SEARCH_AND_BRING_BACK" as TurnIntent, text: SEARCH_BRING_BACK_TEXT };
      outIntent = alt2.intent;
      outText = alt2.text;
    }
    // Routing to open discovery genuinely engages it — no asset prompt follows.
    if (outIntent === "ROUTE_OPEN_DISCOVERY") {
      journey = { ...journey, guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" };
    }
  }
  return { intent: outIntent, text: outText, journey: pushIntent(journey, outIntent) };
}

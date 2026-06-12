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

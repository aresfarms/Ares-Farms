/**
 * Machine-readable turn intents (loop-guard enforcement, Caitlin 2026-06-11).
 *
 * EVERY Navigator response carries a turn_intent. The loop guard compares
 * INTENTS, not just text: if next_turn_intent === previous_turn_intent the
 * repeat is BLOCKED and a different allowed action is chosen from the
 * alternate ladder below. (The verbatim-text anti-repeat in the route remains
 * as a second, independent layer.)
 *
 * The rendered component exposes the intent in test mode as a
 * data-turn-intent attribute on each guide message, so the test harness can
 * assert "no consecutive repeated turn_intent" against the real UI.
 */

import {
  GUIDED_DISCOVERY_OPENER, GUIDED_DISCOVERY_FOLLOWUP, type ArcNode, type JourneyState,
} from "./narrativeInterpreter";

export type TurnIntent =
  | "ASK_PERSON"
  | "ASK_ASSETS"
  | "ASK_GOAL"
  | "ASK_REGION"
  | "ASK_BUDGET"
  | "CLARIFY_OUT_OF_SCOPE"
  | "CLARIFY_METAPHOR"
  | "ROUTE_OPEN_DISCOVERY"
  | "ROUTE_MAP"
  | "OFFER_SEARCH_AND_BRING_BACK"
  | "REFUSE_AND_REDIRECT"
  | "PRESENT_PATHWAYS";

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

/**
 * Alternate ladder — when an intent would repeat consecutively, the guard
 * switches to a DIFFERENT allowed action with its own wording. PRESENT_PATHWAYS
 * is exempt (each pathways turn carries new assessments, never a re-ask).
 */
const ALTERNATES: Record<Exclude<TurnIntent, "PRESENT_PATHWAYS">, { intent: TurnIntent; text: string }> = {
  ASK_PERSON: {
    intent: "ASK_GOAL",
    text: "Let's come at it from the goal instead — what would a win look like for you a year from now?",
  },
  ASK_GOAL: {
    intent: "ASK_REGION",
    text: "Another angle: is there a part of the country — or a kind of place, rural or in-town — that's pulling at you?",
  },
  ASK_ASSETS: {
    intent: "ROUTE_OPEN_DISCOVERY",
    text: `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`,
  },
  ASK_REGION: {
    intent: "ASK_BUDGET",
    text: "Let's try the practical side — is there a budget range you're working inside, even a rough one?",
  },
  ASK_BUDGET: {
    intent: "ROUTE_OPEN_DISCOVERY",
    text: `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`,
  },
  CLARIFY_OUT_OF_SCOPE: {
    intent: "ROUTE_OPEN_DISCOVERY",
    text: `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`,
  },
  CLARIFY_METAPHOR: {
    intent: "ROUTE_OPEN_DISCOVERY",
    text: `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`,
  },
  ROUTE_OPEN_DISCOVERY: {
    intent: "OFFER_SEARCH_AND_BRING_BACK",
    text: "Here's another way in: search Zillow, Crexi, LoopNet, or LandWatch with whatever criteria feel right, and paste any listing link or address back here — I'll tell you honestly what it could become.",
  },
  OFFER_SEARCH_AND_BRING_BACK: {
    intent: "ROUTE_MAP",
    text: "Or browse the map of America's possibilities on our home page and come back with any place that catches your eye — we can start from there.",
  },
  ROUTE_MAP: {
    intent: "ASK_GOAL",
    text: "Wherever you wander, the journey starts the same way — what would a win look like for you?",
  },
  REFUSE_AND_REDIRECT: {
    intent: "ROUTE_OPEN_DISCOVERY",
    text: `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`,
  },
};

/**
 * The loop guard: block a consecutive intent repeat and choose a different
 * allowed action. Returns the (possibly swapped) intent + text and the journey
 * with lastTurnIntent updated.
 */
export function guardTurnIntent(
  journey: JourneyState,
  intent: TurnIntent,
  text: string,
): { intent: TurnIntent; text: string; journey: JourneyState } {
  let outIntent = intent;
  let outText = text;
  if (intent !== "PRESENT_PATHWAYS" && journey.lastTurnIntent === intent) {
    const alt = ALTERNATES[intent as Exclude<TurnIntent, "PRESENT_PATHWAYS">];
    outIntent = alt.intent;
    outText = alt.text;
    // Routing to open discovery genuinely engages it — no asset prompt follows.
    if (outIntent === "ROUTE_OPEN_DISCOVERY") {
      journey = { ...journey, guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" };
    }
  }
  return { intent: outIntent, text: outText, journey: { ...journey, lastTurnIntent: outIntent } };
}

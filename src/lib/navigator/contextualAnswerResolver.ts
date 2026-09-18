/**
 * contextualAnswerResolver (BUILD FIX 2026-06-12) — "Navigator must remember
 * what it just asked." Short answers (all of the above / none / yes / no / not
 * sure / both / the first one …) are NOT new goals — they resolve against the
 * IMMEDIATELY PREVIOUS bot question. Only when no prior question exists is a
 * short answer treated as needing clarification.
 *
 * Runs before routeTurn / open discovery so "all of the above" after a
 * constraints prompt is never misread as a discovery goal.
 */

import type { JourneyState } from "./narrativeInterpreter";
import type { TurnIntent } from "./turnIntent";

const SHORT_ANSWER_RE =
  /^\s*(?:all\s+of\s+the\s+above|none\s+of\s+the\s+above|all\s+of\s+them|none|yes|yep|yeah|no|nope|not\s+sure|maybe|both|either|neither|the\s+first(?:\s+one)?|the\s+second(?:\s+one)?|first\s+one|second\s+one|that\s+one)\s*[.!]?\s*$/i;

const AFFIRM_ALL_RE = /\ball\s+of\s+(?:the\s+above|them)\b/i;

export interface ContextualResolution {
  turnIntent: TurnIntent;
  text: string;
  slot: string;
}

export function isShortAnswer(message: string): boolean {
  return SHORT_ANSWER_RE.test(message);
}

/**
 * Resolve a short answer against the previous bot question. Returns null when
 * the message is not a short answer (let normal routing handle it).
 */
export function resolveContextualAnswer(message: string, journey: JourneyState): ContextualResolution | null {
  if (!isShortAnswer(message)) return null;
  const last = journey.lastTurnIntent;
  const hadPriorQuestion = !!last && journey.story.length > 0;

  // No prior question to attach to → clarify what they're answering.
  if (!hadPriorQuestion) {
    return {
      turnIntent: "CLARIFY_CONTEXTUAL_ANSWER", slot: "contextual:no-prior-question",
      text: "I want to make sure I’m answering the right thing — what are you responding to? Tell me your property, land, " +
        "business, or income goal in your own words and we’ll go from there.",
    };
  }

  // Previous question was about constraints (ASK_BUDGET / ASK_CONSTRAINTS).
  if (last === "ASK_BUDGET" || last === "ASK_CONSTRAINTS") {
    const text = AFFIRM_ALL_RE.test(message)
      ? "Got it — budget, timing, private restrictions, and permitting all matter. Is there a property already in " +
        "mind (or a public listing/address you can share), or a part of the country you want to point this at?"
      : "Understood — noted on the constraints. Is there a property already in mind, or a region you want to focus on?";
    return { turnIntent: "ASK_REGION", text, slot: "contextual:constraints-answer" };
  }

  // Other prior questions: let normal flow interpret (return null) — but never
  // let a short answer become an open-discovery goal here.
  return null;
}

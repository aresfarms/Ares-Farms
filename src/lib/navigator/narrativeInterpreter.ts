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

export type ArcNode =
  | "person" | "story" | "assets" | "constraints"
  | "pathways" | "evidence" | "programs" | "tradeoffs" | "decision" | "journey";

export const ARC_ORDER: ArcNode[] = [
  "person", "story", "assets", "constraints", "pathways",
  "evidence", "programs", "tradeoffs", "decision", "journey",
];

export interface JourneyState {
  node: ArcNode;
  /** Free-text fragments the visitor offered, in their words (no identity). */
  story: string[];
  context: PropertyContext;
  property: PropertyReference | null;
  /** Mode 1 = open discovery ("guide me"); mode 2 = brought their own asset. */
  entryMode: "open-discovery" | "own-asset" | null;
  exploredPathways: string[];
}

export const FRESH_JOURNEY: JourneyState = {
  node: "person", story: [], context: EMPTY_CONTEXT, property: null, entryMode: null, exploredPathways: [],
};

// ── extraction (deterministic; the AI may enrich, never replace, this floor) ──
const KIND_HINTS: [RegExp, PropertyContext["propertyKind"]][] = [
  [/\b(?:farm|farmer|ranch|cropland|acreage|cattle|livestock|fields?|grain|pasture)\b/i, "farm"],
  [/\b(?:house|home|residential|backyard|condo|townhouse|duplex|my\s+place)\b/i, "residential"],
  [/\b(?:commercial|retail|warehouse|office|storefront)\b/i, "commercial"],
];

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

  if (/\b(?:don'?t know|not sure|no idea|guide me|what'?s possible|help me figure)\b/i.test(message)) {
    s.entryMode = s.entryMode ?? "open-discovery";
  }

  // Advance the arc: we move forward when the current node has what it needs.
  s.node = nextNode(s);
  return s;
}

function nextNode(s: JourneyState): ArcNode {
  // The arc never moves backwards; it advances as substance accumulates.
  const at = ARC_ORDER.indexOf(s.node);
  const hasPerson = s.story.length >= 1;
  const hasStory = s.story.length >= 2 || s.entryMode !== null;
  const hasAssets = s.property !== null || s.context.propertyKind !== "unknown";
  // Constraints are optional substance — one more exchange after assets.
  const enough = [hasPerson, hasStory, hasAssets];
  let target: ArcNode = "person";
  if (hasPerson) target = "story";
  if (hasStory) target = "assets";
  if (hasAssets) target = "constraints";
  if (enough.every(Boolean) && s.story.length >= 3) target = "pathways";
  return ARC_ORDER[Math.max(at, ARC_ORDER.indexOf(target))];
}

/** The ONE next open question for the node (warm wording; AI may rephrase). */
export function questionForNode(s: JourneyState): string {
  switch (s.node) {
    case "person":
      return "Who are you? Tell me a little about yourself — in your own words, however you'd say it.";
    case "story":
      return s.entryMode === "own-asset"
        ? "Got it — tell me the story. What drew you to this property, and what are you hoping it could become?"
        : "Tell me a bit more of the story — what's going on in your world that brought you here today?";
    case "assets":
      return "What do you have to work with? A property or land you own, a place you're looking at — you can paste any listing link (Crexi, Zillow, Redfin, LoopNet) or just type an address.";
    case "constraints":
      return "Anything that boxes you in? Money, time, an HOA, rules you already know about — knowing the walls helps us find the doors.";
    default:
      return "Want to keep exploring? Tell me what caught your eye, or bring another property — the journey keeps going.";
  }
}

/** Proactive widening (spec §3) — the guide opens doors they didn't ask about. */
export function wideningLine(explored: string[], allIds: string[]): string | null {
  const unexplored = allIds.filter((id) => !explored.includes(id));
  if (unexplored.length === 0) return null;
  return "Have you looked at other possibilities? A few of the pathways below might interest you even though you didn't ask about them — that's the point of the journey.";
}

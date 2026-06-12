/**
 * semanticAmbiguityResolver (BUILD FIX 2026-06-12) — "Understanding before
 * output." When a message contains a double-meaning/slang term, the Navigator
 * must CLARIFY meaning before routing — never assume, and never fall back to
 * "Tell me your story." Runs before ASK_PERSON/STORY/ASSETS, open discovery,
 * property analysis, and pathway cards.
 *
 * The word itself is NOT automatically disallowed. Clarify first UNLESS the
 * full message clearly requests adult services (then refuse) or clearly carries
 * animal/property context (then route to the lawful animal/ag/conservation
 * path).
 */

import type { TurnIntent } from "./turnIntent";

export interface AmbiguityDecision {
  turnIntent: TurnIntent;
  text: string;
  echoConcept: string | null;
  slot: string;
  refusal: boolean;
}

// Terms with materially different meanings (slang vs animal vs object).
const AMBIGUOUS_TERMS = /\b(pussy|cougar|beaver|fox|chick|stud|bitch|cock|hoe|john|trick|kitty)\b/i;

// Clear adult-service / dating / hookup intent → refuse (no clarification).
const ADULT_SERVICE_CLEAR =
  /\b(escort|escorts|hookup|hook\s+up|hooking\s+up|one[- ]night\s+stand|dating|date\s+night|prostitut|sex\s+work|sexual\s+services?|adult\s+services?|call\s+girl|sugar\s+(?:baby|daddy|momma)|get\s+laid|booty\s+call|swinger)\b/i;

// Clear animal / property / conservation context → route, don't clarify.
const HABITAT_CTX = /\b(habitat|conservation|wildlife|sanctuary|pond|wetland|preserve|refuge)\b/i;
const RESCUE_CTX = /\b(rescue|shelter|boarding|adoption|nonprofit)\b/i;
const LIVESTOCK_CTX = /\b(barn|farm|ranch|stable|pasture|livestock|breeding|stud\s+farm|coop|stall)\b/i;
const KENNEL_CTX = /\b(kennel)\b/i;
const PET_PROPERTY_CTX = /\b(cat\s+(?:cafe|shelter|rescue)|pet\s+(?:store|shop|resort|hotel)|animal\s+(?:shelter|hospital))\b/i;

export const ADULT_SERVICE_REPLY =
  "Furlong isn’t a dating, hookup, escort, or adult-services platform. If your goal is a lawful property or " +
  "business use, describe that real-world property goal and I can help with zoning, licensing, constraints, and " +
  "alternatives.";

function ambiguousClarifyReply(term: string): string {
  // The observed fixture ("pussy") gets the cat/pet-framed line; others get the
  // general pet/animal vs property/business clarification.
  if (/pussy|kitty/i.test(term)) {
    return "That phrase could mean different things. Are you looking for a cat or pet-related property/resource, a " +
      "lawful business/property use, or something else? Furlong isn’t a dating, hookup, escort, or adult-services platform.";
  }
  return `“${term}” could mean a few different things. Do you mean a pet/animal, a property or business use, or ` +
    "something else? Furlong can help with lawful property, land, business, and opportunity pathways, but not adult " +
    "services, harassment, or illegal activity.";
}

export function resolveAmbiguity(message: string): AmbiguityDecision | null {
  if (ADULT_SERVICE_CLEAR.test(message)) {
    return { turnIntent: "REFUSE_ADULT_SERVICE_SEEKING", text: ADULT_SERVICE_REPLY, echoConcept: null, slot: "refuse:adult-service", refusal: true };
  }
  const m = message.match(AMBIGUOUS_TERMS);
  if (!m) return null;
  const term = m[1].toLowerCase();
  // Clear animal/property context → route to the lawful path, no clarification.
  if (PET_PROPERTY_CTX.test(message) || KENNEL_CTX.test(message)) {
    return { turnIntent: "ROUTE_PET_STRUCTURE", text: petResourceReply(term), echoConcept: term, slot: "route:pet-resource", refusal: false };
  }
  if (RESCUE_CTX.test(message)) {
    return { turnIntent: "ROUTE_ANIMAL_RESCUE_OR_BOARDING", text: rescueReply(term), echoConcept: term, slot: "route:animal-rescue", refusal: false };
  }
  if (HABITAT_CTX.test(message)) {
    return { turnIntent: "ROUTE_CONSERVATION_OR_HABITAT", text: habitatReply(term), echoConcept: term, slot: "route:conservation-habitat", refusal: false };
  }
  if (LIVESTOCK_CTX.test(message)) {
    return { turnIntent: "ROUTE_LIVESTOCK_OR_AG_STRUCTURE", text: livestockReply(term), echoConcept: term, slot: "route:livestock-ag", refusal: false };
  }
  // Ambiguous, no disambiguating context → CLARIFY before routing.
  return { turnIntent: "CLARIFY_AMBIGUOUS_TERM", text: ambiguousClarifyReply(term), echoConcept: term, slot: "clarify:ambiguous-term", refusal: false };
}

function habitatReply(term: string): string {
  return `Got it — a ${term} habitat/conservation goal is a real land use. We’d look at acreage, wetland/wildlife ` +
    "rules, conservation easements or programs, zoning, water, and whether this is private land, a preserve, or a " +
    "nonprofit. Which region, and is it private conservation or a formal habitat project?";
}
function rescueReply(term: string): string {
  return `A ${term} rescue/shelter is a real animal-use property goal. We’d check zoning, animal limits, noise/odor ` +
    "rules, kennel/shelter licensing, setbacks, and nonprofit vs business structure. Which area, and roughly what scale?";
}
function livestockReply(term: string): string {
  return `A ${term} barn/farm is real agricultural infrastructure. We’d look at ag zoning, animal limits, setbacks, ` +
    "manure/nutrient management, water, and whether it’s for animals on land you have, land you’re seeking, or a " +
    "business. Which region?";
}
function petResourceReply(term: string): string {
  return `Happy to help with the ${term} as a pet/animal property goal. Are you after a kennel/boarding structure, a ` +
    "pet-related business (cafe, shop, daycare), or a property where animals are allowed? Rules are local — which area?";
}

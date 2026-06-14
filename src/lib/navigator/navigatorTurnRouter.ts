/**
 * navigatorTurnRouter — the AUTHORITATIVE pre-response router (BUILD FIX
 * "Navigator Routing Authority Must Override Questionnaire State Machine",
 * spec 2026-06-11/12, Caitlin). CRITICAL.
 *
 * Every user message passes through this router BEFORE any questionnaire
 * prompt is selected. The classifier is not advisory — no questionnaire node
 * may render unless the router authorizes it (returns null = arc allowed).
 *
 * Pipeline: classify safety/legality → scope → human context → intent →
 * select turn intent → semantic loop guard → render. Routing priority order:
 *   1. Safety / illegality (unlawful evasion)
 *   2. Fair Housing / ownership / privacy        (handled by route.ts G-1/G-2
 *      block which runs BEFORE this router and assigns REFUSE_OWNER_LOOKUP /
 *      REFUSE_FAIR_HOUSING_STEERING — priority preserved because the evasion
 *      check is exported separately and runs first)
 *   3. Adult or sexual structure boundary
 *   4. Non-human / fantasy / metaphor clarification
 *   5. Out-of-scope or impossible request (real-world-adjacent options)
 *   6. SPECIFIC novelty/fantasy/build concept (piñata rule: if the user names
 *      a specific unusual concept, the next response MUST reference it — never
 *      generic discovery copy)
 *   7. Known goal-specific routing (earth-sheltered / weird-but-lawful)
 *   8. Open discovery
 *   9. Bring-your-own-property / generic arc prompt — LAST RESORT ONLY.
 *
 * HARD RULES (spec §6): refusal alternates still refuse; concept echoes are
 * mandatory; ASK_ASSETS is skippable and may never follow a high-priority
 * safety/scope/intent input. "Understanding before output. Reality before
 * commitment."
 */

import type { JourneyState } from "./narrativeInterpreter";
import { detectPropertyIntent } from "./narrativeInterpreter";
import {
  classifyNoveltyConcept, gateForCategory, isDisallowedOutright,
  detectRegulatedUse, CODE_EVASION_REPLY,
} from "./noveltyBuildDoctrine";
import { recentIntents, type TurnIntent } from "./turnIntent";
import {
  detectTargetedHarassment, HARASSMENT_REPLY,
  assessCriticalInfrastructure, SENSITIVE_FACILITY_SHUTDOWN_REPLY,
  SENSITIVE_FACILITY_STATUS_REPLY, SENSITIVE_FACILITY_REUSE_REPLY, SENSITIVE_FACILITY_VERIFY_REPLY,
  detectAssetGoal, detectVehicleInspired, vehicleInspiredReply,
  detectMarineDwelling, marineReply, nontraditionalReply,
  detectSpecialtyAsset, specialtyAssetReply,
  detectEasementConstraint, EASEMENT_CONSTRAINT_REPLY,
  detectThirdPartyAcquisition, THIRD_PARTY_CLARIFY_REPLY, THIRD_PARTY_PRESSURE_REPLY, THIRD_PARTY_CELEBRITY_REPLY,
  detectStreetAddress, detectPrivateAddressAcquisition,
  PRIVATE_ADDRESS_OVERVIEW_REPLY, PRIVATE_ADDRESS_STALKING_REFUSAL,
  detectAnimalGoal, animalGoalReply,
  detectDecisionRequest, decisionRequestReply,
  detectApiaryScale, APIARY_SCALE_REPLY,
  detectShortNounPhrase, shortNounPhraseReply,
} from "./navigatorGoalRoutes";

export { detectTargetedHarassment, assessCriticalInfrastructure } from "./navigatorGoalRoutes";
import { classifyGoalAsset } from "./navigatorGoalParser";
import { detectProposedSolution, isProposedSolutionConfirmation, proposedSolutionReply, confirmedAssetProbe, detectObjectivePending, objectiveDiscoveryReply } from "./proposedSolutionHypothesis";
import { resolveAmbiguity } from "./semanticAmbiguityResolver";

export interface RouteDecision {
  turnIntent: TurnIntent;
  text: string;
  /** Replay/ledger slot suffix. */
  slot: string;
  /** The named concept the response must echo (piñata rule), if any. */
  echoConcept: string | null;
  /** True when this decision is a refusal (kind: "refusal" in the API). */
  refusal: boolean;
  /** Journey mutations the decision requires (gate, discovery engagement). */
  patch: Partial<JourneyState>;
}

// ── 0. THREAT / VIOLENCE ESCALATION (CRITICAL, 2026-06-12) ───────────────────
// Violent-threat intent overrides EVERY Navigator pathway — checked before all
// questionnaire prompts and all other routes. No property, location,
// materials, planning, evasion, or tactical help. Ever.
import type { ThreatPhraseCategory } from "@/security/realityPlatform/threatEscalationLedger";

// THREAT CLASSIFIER PRECISION (CRITICAL, 2026-06-12): Furlong's domain overlaps
// threat vocabulary (controlled burn, demolish a barn, foundation blasting,
// clear land). threatHold is STICKY, so a false positive locks the session —
// safety must be strict but not stupid. Threat escalation requires MALICIOUS or
// harm-oriented context, NOT the mere presence of burn/blast/demolish/destroy/
// tear down/clear/fire/explosives.

// Unconditionally violent — no lawful land-management reading.
const THREAT_HARD: [RegExp, ThreatPhraseCategory][] = [
  [/\b(?:bomb|blow\s+up|detonate|explosives?|pipe\s+bomb|car\s+bomb|ied)\b/i, "bombing"],
  [/\bshoot\s+up\b|\bopen\s+fire\b|\bmass\s+shooting\b/i, "shooting"],
  [/\bterroris[mt]\b|\bterror\s+attack\b/i, "terrorism"],
];
// Sabotage is malicious by definition in this domain.
const SABOTAGE_RE = /\bsabotage\b/i;
// Harm to PEOPLE.
const HARM_PEOPLE_RE = /\b(?:kill|murder|hurt|harm|injure|shoot|stab|poison|assault)\b.{0,30}\b(?:people|person|him|her|them|someone|somebody|a\s+\w+|my\s+\w+|the\s+\w+|everyone|anybody)\b/i;
// "attack <target>" is violent.
const ATTACK_RE = /\battack\b.{0,30}\b(?:building|house|home|school|hospital|courthouse|church|mosque|synagogue|person|people|someone|neighbor|business|office|store|facility|station|the\s+\w+)\b/i;
// burn / destroy / wreck / vandalize directed at SOMEONE ELSE'S property or with
// covert/insurance-fraud intent → malicious. Own derelict barn ≠ threat.
const MALICIOUS_TARGET_RE = /\b(?:neighbor'?s?|neighbour'?s?|someone(?:'s| else'?s)?|somebody'?s?|their|his|her|else'?s|the\s+\w+'s|public|school|hospital|courthouse|church|government|the\s+city|a\s+rival|competitor'?s?)\b/i;
const MALICIOUS_INTENT_RE = /\b(?:for\s+(?:the\s+)?insurance|insurance\s+money|to\s+collect\s+insurance|get\s+revenge|for\s+revenge|so\s+no\s+one|to\s+get\s+back\s+at|covertly|in\s+secret|without\s+(?:them|anyone)\s+knowing)\b/i;
const DESTRUCTIVE_VERB_RE = /\b(?:burn\s+(?:down|up)?|set\s+fire\s+to|torch|arson|destroy|wreck|vandaliz|raze\s+(?:someone|their))\b/i;

export const VIOLENT_THREAT_REPLY =
  "I can’t help with threats, violence, bombing, sabotage, or harming people or property. If this is an emergency " +
  "or someone may be in danger, contact emergency services now.";

export function detectViolentThreat(message: string): ThreatPhraseCategory | null {
  for (const [re, cat] of THREAT_HARD) if (re.test(message)) return cat;
  if (SABOTAGE_RE.test(message)) return "sabotage";
  if (HARM_PEOPLE_RE.test(message)) return "assault";
  if (ATTACK_RE.test(message)) return "assault";
  // Destructive verb ONLY escalates with a malicious target or covert intent.
  if (DESTRUCTIVE_VERB_RE.test(message) && (MALICIOUS_TARGET_RE.test(message) || MALICIOUS_INTENT_RE.test(message))) {
    return "arson";
  }
  return null;
}

// ── LAWFUL REGULATED PROPERTY OPERATIONS (burn/demolish/blast/clear) ──────────
// Distinguished from threats: these route to permitting / professional review.
// NEVER provide tactical/operational detail (formulas, placement, ignition,
// bypassing permits) — stay at permitting/compliance level.
export type PropertyOperation =
  | { intent: "ROUTE_LAWFUL_LAND_MANAGEMENT"; reply: string }
  | { intent: "ROUTE_DEMOLITION_PERMITTING"; reply: string }
  | { intent: "ROUTE_REGULATED_BLASTING_REVIEW"; reply: string }
  | { intent: "ROUTE_PROPERTY_OPERATION_PERMITTING"; reply: string }
  | { intent: "CLARIFY_LAWFUL_PROPERTY_OPERATION"; reply: string };

const LAND_MGMT_RE = /\b(?:prescribed|controlled)\s+burn\b|\bburn\s+(?:crop\s+residue|the\s+field|a\s+field|my\s+field|pasture|brush|stubble)\b|\bfirebreak\b|\bcrop\s+residue\s+burn|\bhabitat\s+restoration\s+burn/i;
const DEMOLITION_RE = /\b(?:demolish|demolition|tear\s+down|knock\s+down|raze)\b.{0,30}\b(?:barn|shed|structure|building|house|garage|silo|outbuilding|derelict\s+\w+|old\s+\w+)\b/i;
const BLASTING_RE = /\b(?:rock\s+blasting|controlled\s+blasting|foundation\s+blasting|blast(?:ing)?)\b.{0,30}\b(?:quarry|foundation|excavation|rock|site)\b|\bblast(?:ing)?\b.{0,40}\bprofessionals?\b/i;
const CLEAR_LAND_RE = /\b(?:clear(?:ing)?\s+(?:land|the\s+lot|brush|trees|the\s+land)|land\s+clearing|remove\s+(?:an?\s+)?(?:old\s+)?(?:shed|structure|outbuilding))\b/i;
// Ambiguous: a bare destructive verb on a generic structure with NO malicious
// marker and NO clear lawful framing → clarify before any sticky hold.
const AMBIGUOUS_OP_RE = /\b(?:burn|blast|destroy|demolish|tear\s+down|raze)\b.{0,20}\b(?:this|the|that|an?\s+old)\b.{0,20}\b(?:barn|building|shed|structure|property|house|lot)\b/i;

const LAND_MGMT_REPLY =
  "A prescribed or controlled burn can be a lawful land-management practice, but it usually requires local fire " +
  "authority approval, weather/smoke checks, burn permits, safety planning, and sometimes state environmental " +
  "review. Are you asking about crop residue, pasture management, firebreak creation, or habitat restoration?";
const DEMOLITION_REPLY =
  "Demolishing a derelict barn or structure can be lawful, but it may require demolition permits, utility " +
  "disconnects, asbestos/lead checks, waste-disposal rules, and local inspection. Are you removing it for safety, " +
  "redevelopment, or land reuse?";
const BLASTING_REPLY =
  "Blasting for quarry, excavation, or foundation work is highly regulated and must be handled by licensed " +
  "professionals under local, state, and federal rules. I can help outline lawful permitting and " +
  "professional-review categories — not operational blasting instructions. Is this for site prep, a quarry, or " +
  "foundation work, and do you have a licensed contractor engaged?";
const CLEAR_REPLY =
  "Clearing land or removing a structure is usually lawful but permit-dependent — grading/land-disturbance " +
  "permits, erosion control, tree or wetland rules, utility disconnects, and waste disposal can all apply. What's " +
  "the parcel and the end use you have in mind?";
const CLARIFY_OP_REPLY =
  "I can help with lawful land management, demolition, permitting, or regulated site work, but I can’t help harm " +
  "people or property. Are you asking about a permitted property operation such as prescribed burning, demolition, " +
  "clearing, or regulated blasting?";

export function detectPropertyOperation(message: string): PropertyOperation | null {
  // Malicious context is handled by detectViolentThreat first; this is the
  // lawful/ambiguous remainder.
  if (LAND_MGMT_RE.test(message)) return { intent: "ROUTE_LAWFUL_LAND_MANAGEMENT", reply: LAND_MGMT_REPLY };
  if (BLASTING_RE.test(message)) return { intent: "ROUTE_REGULATED_BLASTING_REVIEW", reply: BLASTING_REPLY };
  if (DEMOLITION_RE.test(message)) return { intent: "ROUTE_DEMOLITION_PERMITTING", reply: DEMOLITION_REPLY };
  if (CLEAR_LAND_RE.test(message)) return { intent: "ROUTE_PROPERTY_OPERATION_PERMITTING", reply: CLEAR_REPLY };
  if (AMBIGUOUS_OP_RE.test(message)) return { intent: "CLARIFY_LAWFUL_PROPERTY_OPERATION", reply: CLARIFY_OP_REPLY };
  return null;
}

// ── ICONIC / LIKELY-UNAVAILABLE ASSET reality check (2026-06-12) ─────────────
// A famous landmark, public/institutional asset, or major infrastructure is
// NOT an ordinary property goal: reality-check availability FIRST — name the
// asset, say it's almost certainly not a realistic ordinary path, offer
// realistic adjacent alternatives, never invent availability or imply it's
// for sale.
// ICONIC_PRIVATE_ASSET ONLY — theoretically privately ownable but extraordinary
// capital. Not-privately-ownable assets (White House, bridges, Capitol, KSC,
// monuments) are handled by navigatorGoalParser.classifyGoalAsset BEFORE this.
const ICONIC_ASSETS_RE: [RegExp, string][] = [
  [/\bempire\s+state\s+building\b/i, "the Empire State Building"],
  [/\bchrysler\s+building\b/i, "the Chrysler Building"],
  [/\bdisney\s*(?:world|land)\b/i, "Disney World"],
  [/\beiffel\s+tower\b/i, "the Eiffel Tower"],
  [/\b(?:a\s+)?famous\s+(?:skyscraper|landmark|building|tower|stadium)\b/i, "a famous landmark of that kind"],
];

export function detectIconicAsset(message: string): string | null {
  if (!/\b(?:own|buy|purchase|acquire|get|want)\b/i.test(message)) return null;
  for (const [re, label] of ICONIC_ASSETS_RE) {
    const m = message.match(re);
    if (m) return label.startsWith("the ") || label.startsWith("that") || label.startsWith("a ") || label.startsWith("an ") ? label : m[0];
  }
  return null;
}

export function iconicAssetReply(asset: string): string {
  return `Owning ${asset} itself is almost certainly not a realistic ordinary property path — iconic assets like ` +
    "that are rarely available and would involve extraordinary capital, institutional ownership, legal diligence, " +
    "and private-market negotiation. But if your real goal is landmark-style ownership, trophy commercial real " +
    "estate, an Art Deco building, a mixed-use tower, or a hospitality/office property with similar character, I " +
    "can help map what would be realistic. Are you looking for that kind of asset, or are you testing the Navigator?";
}

// ── 1. Safety / illegality — unlawful evasion of law enforcement ─────────────
const EVASION_RE: RegExp[] = [
  /\b(?:hide|hiding|evade|evading|escape|run|running|avoid\s+detection|stay\s+hidden|conceal)\b.{0,40}\b(?:ice|immigration|cbp|border\s+patrol|police|cops|law\s+enforcement|the\s+feds|fbi|dea|marshals|deportation|authorities)\b/i,
  /\b(?:ice|immigration|police|law\s+enforcement)\b.{0,30}\b(?:can'?t|won'?t|never)\s+find\s+me\b/i,
  /\bsafe\s+house\b.{0,30}\b(?:from|against)\b.{0,30}\b(?:ice|police|immigration|raids?)\b/i,
  /\b(?:dodge|obstruct|outrun)\b.{0,30}\b(?:a\s+)?(?:raid|warrant|deportation|arrest)\b/i,
];

export const UNLAWFUL_EVASION_REPLY =
  "I can’t help someone evade law enforcement or immigration authorities. If you need help understanding " +
  "immigration processes, legal rights, legal assistance, or community resources, I can help with that kind of information.";

export function isUnlawfulEvasionAsk(message: string): boolean {
  return EVASION_RE.some((re) => re.test(message));
}

// ── 4. Non-human / animal / fantasy / object identity ────────────────────────
const NONHUMAN_IDENTITY_RE =
  /\bI(?:'m| am)\s+(?:a|an|the)\s+(frog|pig|cow|chicken|goat|sheep|horse|cat|dog|fox|bear|wolf|fish|bird|dragon|unicorn|mermaid|elf|goblin|fairy|wizard|vampire|werewolf|zombie|ghost|alien|robot|bot|cyborg|toaster|rock|tree|house|car|spaceship)\b/i;

export function detectNonHumanIdentity(message: string): string | null {
  const m = message.match(NONHUMAN_IDENTITY_RE);
  return m ? m[1].toLowerCase() : null;
}

export function humanContextReply(entity: string): string {
  return `Just to make sure I’m understanding correctly — when you say you’re a ${entity}, are you speaking ` +
    "metaphorically, joking, or testing the Navigator? Furlong is built to help people explore real property, " +
    "land, business, and opportunity pathways.";
}

// ── 5. Impossible destination / out-of-scope (real-world-adjacent options) ───
const IMPOSSIBLE_PLACE_RE: [RegExp, string][] = [
  [/\bouter\s+space\b|\bin\s+space\b|\bzero[- ]g(?:ravity)?\b|\bin\s+orbit\b|\borbital\b/i, "outer space"],
  [/\bon\s+the\s+moon\b|\bmoon\s+base\b/i, "the Moon"],
  [/\bon\s+mars\b|\bmars\s+colony\b/i, "Mars"],
  [/\b(?:a|my)\s+spaceship\b(?!\s*[- ]?(?:house|home|inspired))/i, "a spaceship"],
  [/\bunderwater\s+(?:city|castle|mansion)\b|\bbottom\s+of\s+the\s+ocean\b/i, "an underwater city"],
  [/\b(?:floating|flying)\s+(?:castle|city|island|fortress)\b/i, "a floating fortress"],
  [/\b(?:hogwarts|death\s+star|cloud\s+(?:city|palace)|narnia|middle[- ]earth)\b/i, "a fictional place"],
];

export function detectImpossiblePlace(message: string): string | null {
  for (const [re, label] of IMPOSSIBLE_PLACE_RE) if (re.test(message)) return label;
  return null;
}

export function outOfScopeAdjacentReply(concept: string): string {
  return `${concept[0].toUpperCase()}${concept.slice(1)} is outside what Furlong can directly map — we work with ` +
    "real-world land, property, business, and opportunity pathways here on Earth. But if what you want is " +
    "wide-open space, dark skies, isolation, aerospace-adjacent land, an observatory, or a spaceship-inspired " +
    "home, we can explore that. Which of those is closer to what you mean?";
}

// ── 6/7. Specific concepts: weird-but-lawful architecture vs novelty objects ─
// Earth-sheltered / underground (a REAL, code-checkable building type).
const EARTH_SHELTERED_RE: [RegExp, string][] = [
  [/\blive\s+underground\b|\bunderground\s+(?:home|house|dwelling|living)\b/i, "underground home"],
  [/\bearth[- ]sheltered\b/i, "earth-sheltered home"],
];
// Other unusual-but-lawful architecture concepts.
const WEIRD_LAWFUL_RE: [RegExp, string][] = [
  [/\bhobbit\s+(?:house|home|hole)\b/i, "hobbit house"],
  [/\bspaceship[- ](?:house|home|inspired)\b/i, "spaceship house"],
  [/\bcastle\s+(?:house|home)\b|\blive\s+in\s+a\s+castle\b/i, "castle house"],
  [/\btree\s?house\s+(?:hotel|lodging|rental|home)?\b/i, "treehouse"],
  [/\bsilo\s+(?:home|house)\b|\bgrain\s+silo\b.{0,20}\b(?:home|live)\b/i, "silo home"],
  [/\bdome\s+(?:home|house)\b|\bearthship\b|\byurt\b/i, "alternative dwelling"],
];
// SPECIFIC lawful/ambiguous concepts whose real-world USE must be clarified
// BEFORE any generic budget/constraints prompt (fix 2026-06-12): the reply
// must echo the user's concept phrase and ask a USE-SPECIFIC follow-up.
const SPECIFIC_CONCEPTS: [RegExp, string, string[]][] = [
  [/\bfrog\s+house\b/i, "frog house",
    ["a frog-themed house", "a real amphibian habitat", "a wetland education structure", "a tiny home with frog character"]],
  [/\b(chinese\s+)?apothecary\s+(?:house|home|shop|store|building)\b/i, "apothecary house",
    ["a residence with apothecary character", "an herbal or apothecary retail shop", "a cultural design concept", "a hospitality concept", "a museum or education space"]],
  [/\bpig\s?pen\b/i, "pig pen",
    ["real livestock infrastructure", "a farm property", "a simple rural-home metaphor"]],
  [/\b(?:bird|owl|bat|butterfly)\s+house\b.{0,30}\b(?:live|home|build|big|giant|human)\b/i, "animal-house concept",
    ["a themed structure", "a real wildlife habitat", "an education feature"]],
  [/\b(?:fairy|gnome|mushroom|witch)\s+(?:house|cottage|home)\b/i, "storybook structure",
    ["a themed cabin or cottage", "a garden feature", "a hospitality concept"]],
];

export function detectSpecificConcept(message: string): { phrase: string; options: string[] } | null {
  for (const [re, label, options] of SPECIFIC_CONCEPTS) {
    const m = message.match(re);
    if (m) return { phrase: m[1] ? m[0].trim() : label, options };
  }
  return null;
}

export function specificConceptReply(phrase: string, options: string[]): string {
  return `A ${phrase} could mean a few different real things — ${options.join(", ")} — or are you just testing the ` +
    "Navigator? Which is closest? Once I know the real-world use, we can check what zoning and building codes would allow.";
}

// ── Animal / pet / livestock housing (fix 2026-06-12) ────────────────────────
// "My dog needs a house" is NOT open discovery — it's animal housing. If the
// user names an animal plus house/shelter/pen/kennel/barn/coop/stable, the
// next response must reference the animal and classify the use: pet structure,
// livestock/ag infrastructure, boarding/kennel business, property for a person
// with animals, or joke/test — BEFORE any generic route.
const PET_ANIMALS = "dog|coonhound|hound|puppy|cat|kitten|rabbit|bunny";
const LIVESTOCK_ANIMALS = "pig|hog|horse|pony|donkey|mule|goat|sheep|lamb|cow|cattle|bull|chicken|hen|rooster|duck|goose|turkey|llama|alpaca|bee";
const ANIMAL_STRUCTURES = "house|home|shelter|pen|kennel|barn|coop|stable|run|hutch|paddock|enclosure";
const ANIMAL_HOUSING_RE = new RegExp(
  `\\b(${PET_ANIMALS}|${LIVESTOCK_ANIMALS})s?\\b.{0,40}\\b(?:${ANIMAL_STRUCTURES})s?\\b|\\b(?:${ANIMAL_STRUCTURES})s?\\b.{0,30}\\bfor\\b.{0,20}\\b(${PET_ANIMALS}|${LIVESTOCK_ANIMALS})s?\\b`, "i");
const KENNEL_BUSINESS_RE = /\b(?:land|property|lot|acreage|business)\b.{0,40}\b(?:kennel|boarding|breeding)\b|\b(?:kennel|boarding|breeding)\b.{0,30}\b(?:business|operation|facility)\b/i;

export interface AnimalHousing { animal: string; kind: "pet" | "livestock" | "kennel-business" }

export function detectAnimalHousing(message: string): AnimalHousing | null {
  const kennel = KENNEL_BUSINESS_RE.test(message);
  const m = message.match(ANIMAL_HOUSING_RE);
  const animal = (m?.[1] ?? m?.[2])?.toLowerCase() ?? null;
  if (kennel) return { animal: animal ?? "dog", kind: "kennel-business" };
  if (!animal) return null;
  return { animal, kind: new RegExp(`^(?:${LIVESTOCK_ANIMALS})$`, "i").test(animal) ? "livestock" : "pet" };
}

export function animalHousingReply(a: AnimalHousing): string {
  if (a.kind === "kennel-business") {
    return `A ${a.animal} kennel can be a backyard structure (personal use) or a boarding/breeding business — they're ` +
      "treated very differently. Kennel businesses usually need specific zoning, animal-limit and noise rules, " +
      "setbacks, and licensing. Which is it — and do you have land already, or are you looking for some?";
  }
  if (a.kind === "livestock") {
    return `A ${a.animal} needs real agricultural infrastructure — barns, pens, and coops are usually allowed on ` +
      "ag-zoned land, with setbacks and sometimes animal limits. Is this for animals on land you already have, " +
      "land you're looking for, or a livestock business? Depending on the place, we'd check zoning, animal limits, " +
      "setbacks, and personal-use vs business rules.";
  }
  return `Happy to help with the ${a.animal} — to point this right: are you looking for a ${a.animal === "dog" ? "doghouse" : `${a.animal} house`} or kennel ` +
    `structure for the ${a.animal}, a property where ${a.animal}s are allowed, land for a kennel/breeding/boarding ` +
    "business, livestock-style infrastructure, or are you just testing? Depending on the place, we'd check climate, " +
    "zoning, animal limits, kennel rules, setbacks, and whether it's personal use or a business.";
}

// Specific novelty objects / animal structures someone wants to live in or
// build — the piñata rule: the reply MUST name the concept.
const NOVELTY_CONCEPT_RE: [RegExp, string][] = [
  [/\bpi[ñn]ata\b/i, "piñata"],
  [/\bchicken\s+coop\b/i, "chicken coop"],
  [/\bdog\s?house\b.{0,20}\b(?:live|home)\b/i, "dog house"],
  [/\blive\s+in\s+a\s+(?:giant\s+)?(shoe|boot|teapot|pumpkin|barrel|bottle|sandcastle|igloo)\b/i, "$1"],
  [/\b(?:building|house|home|hotel|tower|structure)\b.{0,40}\bshaped\s+like\s+(?:a\s+|an\s+)?(\w+(?:\s\w+)?)/i, "$1-shaped building"],
  [/\bgiant\s+(donut|doughnut|pickle|banana|guitar)\b/i, "giant $1"],
];

export function detectEarthSheltered(message: string): string | null {
  for (const [re, label] of EARTH_SHELTERED_RE) if (re.test(message)) return label;
  return null;
}
export function detectWeirdLawful(message: string): string | null {
  for (const [re, label] of WEIRD_LAWFUL_RE) if (re.test(message)) return label;
  return null;
}
export function detectNoveltyConceptPhrase(message: string): string | null {
  for (const [re, label] of NOVELTY_CONCEPT_RE) {
    const m = message.match(re);
    if (m) return label.includes("$1") ? label.replace("$1", (m[1] ?? "").toLowerCase()) : label;
  }
  return null;
}

export function noveltyConceptReply(concept: string): string {
  return `A ${concept} as a literal home probably is not a code-ready building concept, but a ${concept}-inspired ` +
    "structure, themed cabin, art installation, event space, or hospitality concept might be something we can " +
    "reality-check. Furlong can only explore lawful, safe, non-sexual, code-checkable builds. Are you imagining " +
    "a home, business, event attraction, or just testing the Navigator?";
}

export function codeCheckableTranslationReply(concept: string): string {
  return `Furlong doesn’t build anything itself, and a literal ${concept} isn’t a code-checkable dwelling — but ` +
    `describe the real-world version of the ${concept} idea (a themed cabin, venue, art structure, or hospitality ` +
    "concept) and I’ll help test what zoning, building codes, and permitting would realistically allow.";
}

export function weirdLawfulReply(concept: string): string {
  return `A ${concept} is real, lawful architecture — people do build them, and codes usually decide where. ` +
    "Are you hoping to build one, buy one, or find land where one could legally be built?";
}

export function earthShelteredReply(concept: string): string {
  return `An ${concept} is a real, code-checkable building type — earth-sheltered ` +
    "construction is permitted in many jurisdictions with the right engineering. Are you hoping to build one, buy " +
    "one, or find land where one could legally be built? And is there a region or rough budget range in mind?";
}

// ── The router ────────────────────────────────────────────────────────────────
/**
 * Authoritative route decision for a user message. Returns null ONLY when no
 * higher-priority route applies — only then may the questionnaire arc render.
 * (G-1/G-2 refusals and the input security guard run in route.ts BEFORE this
 * is consulted; unlawful-evasion runs FIRST via isUnlawfulEvasionAsk.)
 */
export function routeTurn(message: string, journey: JourneyState): RouteDecision | null {
  const recent = recentIntents(journey);
  const repeatOf = (intent: TurnIntent) => journey.lastTurnIntent === intent || recent.includes(intent);

  // 0 — VIOLENT THREAT: overrides everything. The hold persists (threatHold)
  // until human review clears the escalation; the alternate still refuses.
  const threat = detectViolentThreat(message);
  if (threat || journey.threatHold) {
    // Alternate ONLY on the immediately-previous turn so a persistent hold
    // cycles two refusing wordings (never resumes discovery, never weakens).
    const repeated = journey.lastTurnIntent === "ESCALATE_VIOLENT_THREAT";
    return {
      turnIntent: repeated ? "WAIT_FOR_MORE_INFO" : "ESCALATE_VIOLENT_THREAT",
      text: repeated
        ? "I can’t continue with that. If this is an emergency or someone may be in danger, contact emergency services now. This conversation can’t go further until that’s resolved."
        : VIOLENT_THREAT_REPLY,
      slot: `escalate:violent-threat:${threat ?? "hold"}`, echoConcept: null, refusal: true,
      patch: { threatHold: true },
    };
  }

  // 0.4 — INFRASTRUCTURE SECURITY PROBE (weak points / access / guard schedule
  // on a named sensitive facility) → security escalation, same as a threat.
  const infra = assessCriticalInfrastructure(message);
  if (infra?.kind === "escalate") {
    const repeated = journey.lastTurnIntent === "ESCALATE_VIOLENT_THREAT";
    return {
      turnIntent: repeated ? "WAIT_FOR_MORE_INFO" : "ESCALATE_VIOLENT_THREAT",
      text: repeated
        ? "I can’t continue with that. This conversation can’t go further until that’s resolved."
        : VIOLENT_THREAT_REPLY,
      slot: "escalate:infrastructure-probe", echoConcept: null, refusal: true, patch: { threatHold: true },
    };
  }

  // 0.5 — TARGETED HARASSMENT / STALKING / DOXXING: outranks owner lookup,
  // property analysis, open discovery, and all intake. Refuse + lawful
  // dispute/safety/code alternatives only; no hold (a restated lawful concern
  // may proceed).
  const harassment = detectTargetedHarassment(message);
  if (harassment) {
    const repeated = repeatOf("ESCALATE_TARGETED_HARASSMENT");
    // Flag any address tied to the harassment — no overview for it later.
    const flagged = detectStreetAddress(message);
    const patch = flagged
      ? { flaggedAddresses: [...new Set([...(journey.flaggedAddresses ?? []), flagged])] }
      : {};
    return {
      turnIntent: repeated ? "WAIT_FOR_MORE_INFO" : "ESCALATE_TARGETED_HARASSMENT",
      text: repeated
        ? "I still can’t help locate, track, or target a person. If there’s a lawful property, boundary, nuisance, safety, or code concern, tell me that and I can help think through documentation, municipal contacts, mediation, or professional help."
        : HARASSMENT_REPLY,
      slot: `escalate:targeted-harassment:${harassment}`, echoConcept: null, refusal: true, patch,
    };
  }

  // 0.55 — PARCEL EASEMENT / ENCUMBRANCE: a pipeline/utility easement ON a
  // parcel is a property CONSTRAINT, not infrastructure analysis — runs BEFORE
  // the infra hard-shutdown. (An infra security-probe still escalates above.)
  if (detectEasementConstraint(message)) {
    const repeated = repeatOf("ROUTE_EASEMENT_CONSTRAINT_REVIEW");
    return {
      turnIntent: repeated ? "ASK_REGION" : "ROUTE_EASEMENT_CONSTRAINT_REVIEW",
      text: repeated ? "Which parcel and jurisdiction? The recorded easement and local zoning decide the buildable limits." : EASEMENT_CONSTRAINT_REPLY,
      slot: "route:easement-constraint", echoConcept: null, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 0.56 — NEIGHBOR / THIRD-PARTY HOUSE ACQUISITION: property-focused only,
  // never people-targeting. Pressure → refuse; celebrity/official → hard stop;
  // otherwise clarify whether it's publicly for sale before populating data.
  const thirdParty = detectThirdPartyAcquisition(message);
  if (thirdParty) {
    const intent: TurnIntent = thirdParty === "clarify" ? "CLARIFY_THIRD_PARTY_ACQUISITION"
      : thirdParty === "pressure" ? "REFUSE_AND_REDIRECT" : "CLARIFY_THIRD_PARTY_ACQUISITION";
    const text = thirdParty === "pressure" ? THIRD_PARTY_PRESSURE_REPLY
      : thirdParty === "celebrity" ? THIRD_PARTY_CELEBRITY_REPLY
      : THIRD_PARTY_CLARIFY_REPLY;
    const repeated = repeatOf(intent);
    return {
      turnIntent: repeated && thirdParty === "clarify" ? "WAIT_FOR_MORE_INFO" : intent,
      text, slot: `third-party:${thirdParty}`, echoConcept: null,
      refusal: thirdParty !== "clarify", patch: {},
    };
  }

  // 0.57 — SELLER-OFFERED third-party property ("my neighbor offered to sell
  // me their farm"): limited overview + ask for listing/written invitation,
  // BEFORE the asset routes claim the "farm"/"house" word. No owner identity.
  const sellerOffered = detectPrivateAddressAcquisition(message);
  if (sellerOffered.kind === "seller-offered") {
    return {
      turnIntent: "LIMITED_PRIVATE_ADDRESS_OVERVIEW", text: PRIVATE_ADDRESS_OVERVIEW_REPLY,
      slot: "limited-overview:seller-offered", echoConcept: null, refusal: false, patch: {},
    };
  }

  // 0.6 — CRITICAL / SENSITIVE INFRASTRUCTURE hard shutdown: not ordinary
  // property discovery. No public for-sale/redevelopment evidence = no
  // analysis. Active-status probes are never answered.
  if (infra) {
    // Verified-disposition reuse is an ALLOWED (non-refusal) high-level path —
    // distinct intent so the loop guard never collapses it into the shutdown.
    if (infra.kind === "reuse") {
      return {
        turnIntent: "ROUTE_ADAPTIVE_REUSE_PROPERTY", text: SENSITIVE_FACILITY_REUSE_REPLY,
        slot: "reuse:sensitive-facility:verified", echoConcept: null, refusal: false, patch: {},
      };
    }
    const text = infra.kind === "status" ? SENSITIVE_FACILITY_STATUS_REPLY
      : infra.kind === "verify" ? SENSITIVE_FACILITY_VERIFY_REPLY
      : SENSITIVE_FACILITY_SHUTDOWN_REPLY;
    return {
      turnIntent: "HARD_SHUTDOWN_SENSITIVE_FACILITY", text,
      slot: `shutdown:sensitive-facility:${infra.kind}`, echoConcept: null, refusal: true, patch: {},
    };
  }

  // 0.7 — LAWFUL REGULATED PROPERTY OPERATIONS (burn/demolish/blast/clear) —
  // distinguished from threats (which are handled above only on malicious
  // context). These route to permitting/professional review; ambiguous cases
  // clarify WITHOUT a sticky threatHold.
  const op = detectPropertyOperation(message);
  if (op) {
    const repeated = repeatOf(op.intent);
    return {
      turnIntent: repeated ? "ASK_REGION" : op.intent,
      text: repeated ? "Which jurisdiction is this in? The permitting authority is local." : op.reply,
      slot: `route:property-operation:${op.intent}`, echoConcept: null,
      refusal: false, patch: op.intent === "CLARIFY_LAWFUL_PROPERTY_OPERATION" ? {} : { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 0.8 — SEMANTIC AMBIGUITY: a double-meaning/slang term must be clarified
  // (or routed if animal/property context is clear, or refused if the message
  // clearly seeks adult services) BEFORE any intake or routing.
  const ambiguity = resolveAmbiguity(message);
  if (ambiguity) {
    const repeated = repeatOf(ambiguity.turnIntent);
    return {
      turnIntent: repeated && !ambiguity.refusal ? "ASK_REGION" : ambiguity.turnIntent,
      text: ambiguity.text, slot: ambiguity.slot, echoConcept: ambiguity.echoConcept,
      refusal: ambiguity.refusal,
      patch: ambiguity.refusal || ambiguity.turnIntent === "CLARIFY_AMBIGUOUS_TERM" ? {} : { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 1 — safety/illegality.
  if (isUnlawfulEvasionAsk(message)) {
    const repeated = repeatOf("REFUSE_UNLAWFUL_EVASION");
    return {
      turnIntent: repeated ? "WAIT_FOR_MORE_INFO" : "REFUSE_UNLAWFUL_EVASION",
      text: repeated
        ? "I still can’t help with that. When you’re ready, I can help with lawful information — understanding immigration processes, finding legal assistance or community resources, or exploring real property and opportunity pathways."
        : UNLAWFUL_EVASION_REPLY,
      slot: "refusal:unlawful-evasion", echoConcept: null, refusal: true, patch: {},
    };
  }

  // 2.5 — LAWFUL-BUT-REGULATED business use → ordinary zoning question, NEVER
  // a refusal (over-refusal fix 2026-06-12). Adult subject matter alone is not
  // a refusal trigger; explicit content/shape generation is (checked inside
  // detectRegulatedUse + classifyNoveltyConcept below). Neutral, evidence-
  // based three-answer framing: without verified local ordinance data the
  // honest answer is can't-determine — confirm with the municipality.
  const regulatedUse = detectRegulatedUse(message);
  if (regulatedUse) {
    const repeated = repeatOf("ROUTE_PROPERTY_ANALYSIS");
    return {
      turnIntent: repeated ? "ASK_REGION" : "ROUTE_PROPERTY_ANALYSIS",
      text: repeated
        ? `Still on the ${regulatedUse} — which municipality or address is this for? The local ordinance is what decides it.`
        : `${/^[aeiou]/i.test(regulatedUse) ? "An" : "A"} ${regulatedUse} is a lawful, regulated use. In many places it's permitted only in specific zones, often ` +
          "with buffer or distance requirements (for adult uses, typically from schools, places of worship, and " +
          "residential areas) plus licensing. We don't have the local ordinance verified for an address yet, so the " +
          "honest answer is can't-determine until it's checked — the municipality's zoning office can confirm. Share " +
          "the address or town and I'll map exactly what to verify: zoning district, any special-use or overlay " +
          "requirements, buffer distances, and license steps.",
      slot: "route:regulated-use", echoConcept: regulatedUse, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 3 — adult/sexual structure (explicit content/shape) + other disallowed
  // novelty. CODE_EVASION refuses the EVASION but offers the lawful path.
  const noveltyCat = classifyNoveltyConcept(message);
  if (noveltyCat && isDisallowedOutright(noveltyCat)) {
    if (noveltyCat === "CODE_EVASION") {
      const repeated = repeatOf("REFUSE_AND_REDIRECT");
      return {
        turnIntent: repeated ? "WAIT_FOR_MORE_INFO" : "REFUSE_AND_REDIRECT",
        text: repeated
          ? "Still can’t help hide anything from the county — the lawful permitting path is the only one I can map. Describe the project whenever you’re ready."
          : CODE_EVASION_REPLY,
        slot: "refusal:novelty:CODE_EVASION", echoConcept: null, refusal: true,
        patch: { noveltyGate: gateForCategory(noveltyCat) },
      };
    }
    const intent: TurnIntent = noveltyCat === "SEXUAL_EXPLICIT" ? "REFUSE_ADULT_SEXUAL_STRUCTURE" : "REFUSE_AND_REDIRECT";
    const repeated = repeatOf(intent);
    return {
      turnIntent: repeated ? "ROUTE_WEIRD_BUT_LAWFUL_ARCHITECTURE" : intent,
      text: repeated
        ? "That boundary stays — but unusual, lawful architecture is absolutely on the table: themed cabins, earth-sheltered homes, observatories, art-driven venues. Are you hoping to build one, buy one, or find land where one could legally be built?"
        : "That isn’t something Furlong can help design — explicit content and explicit building shapes are out of scope. Lawful projects, including unusual architecture and regulated business uses, are fair game: describe that version and we can test what zoning, building codes, and permitting would realistically allow.",
      slot: `refusal:novelty:${noveltyCat}`, echoConcept: null, refusal: true,
      patch: { noveltyGate: gateForCategory(noveltyCat) },
    };
  }

  // 4 — non-human / fantasy identity → clarify human context (echo the entity).
  const entity = detectNonHumanIdentity(message);
  if (entity) {
    const repeated = repeatOf("CLARIFY_HUMAN_CONTEXT");
    return {
      turnIntent: repeated ? "WAIT_FOR_MORE_INFO" : "CLARIFY_HUMAN_CONTEXT",
      text: repeated
        ? "No rush — whenever you want to tell me about a real property goal, land, business, or place, I'm here for that."
        : humanContextReply(entity),
      slot: "clarify:human-context", echoConcept: entity, refusal: false, patch: {},
    };
  }

  // 4.35 — PATH-AND-OPTIONS (constitutional): a request to DECIDE ("should I
  // buy this RV park?", "tell me what to do", "is this the best?", "rent or
  // buy?", "100% financing?") gets paths/tradeoffs/alternatives — never a
  // buy/sell directive. Runs BEFORE asset routing so "should I buy X" isn't
  // treated as a plain acquisition goal.
  const decision = detectDecisionRequest(message);
  if (decision) {
    const repeated = repeatOf("PRESENT_PATHS_AND_OPTIONS");
    return {
      turnIntent: repeated ? "ASK_REGION" : "PRESENT_PATHS_AND_OPTIONS",
      text: decisionRequestReply(decision),
      slot: `paths-and-options:${decision}`, echoConcept: null, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 4.38 — PROPOSED-SOLUTION-AS-HYPOTHESIS (PROPOSED-SOLUTION-AS-HYPOTHESIS-001):
  // a stated SCALE / PORTFOLIO / EXPANSION plan ("buy 10 more laundromats",
  // "five more farms", "a $10M property") is a strategy hypothesis, not a plain
  // acquisition. Acknowledge it, ask the destination, offer to compare routes —
  // the stated path stays open. Runs BEFORE the asset routes so the first reply
  // is human, not a regulated-acquisition label. Does NOT fire when the user is
  // confirming ("I just want ten more laundromats") or has already been asked
  // this session — those proceed to the existing asset routing below.
  {
    const proposed = detectProposedSolution(message);
    const confirming = isProposedSolutionConfirmation(message);

    // 4.38a — OBJECTIVE-DISCOVERY-001: we just asked the destination, so this
    // answer ("I just want to be rich", "passive income", "quit my job") is an
    // OBJECTIVE — continue objective discovery, never a constraints prompt.
    // Runs FIRST so an objective answer is never re-read as an asset/confirm.
    if (journey.objectiveDiscoveryPending) {
      const objective = detectObjectivePending(message);
      if (objective) {
        return {
          turnIntent: "CLARIFY_OBJECTIVE",
          text: objectiveDiscoveryReply(objective, journey.proposedAssetLabel),
          slot: `objective-discovery:${objective}`, echoConcept: journey.proposedAssetLabel, refusal: false,
          patch: { objectiveDiscoveryPending: false },
        };
      }
    }

    // 4.38b — first encounter with the expansion plan: ask the destination.
    if (proposed && !confirming && !journey.proposedSolutionAsked) {
      return {
        turnIntent: "EXPLORE_PROPOSED_SOLUTION",
        text: proposedSolutionReply(proposed.asset),
        slot: "explore:proposed-solution", echoConcept: proposed.asset, refusal: false,
        patch: {
          proposedSolutionAsked: true, objectiveDiscoveryPending: true, proposedAssetLabel: proposed.asset,
          guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery",
        },
      };
    }

    // 4.38c — §8 confirmation, or a follow-up naming the asset after we asked:
    // the stated path proceeds to its EXISTING asset workup (regulated/
    // commercial/ag preserved via a singularized probe). Clears objective
    // discovery — the user chose the path.
    if (proposed && (confirming || journey.proposedSolutionAsked)) {
      const confirmed = detectAssetGoal(confirmedAssetProbe(proposed.asset));
      if (confirmed) {
        const repeated = repeatOf(confirmed.intent);
        return {
          turnIntent: repeated ? "ASK_REGION" : confirmed.intent,
          text: repeated ? `Still on the ${confirmed.label} — which market or region, and any budget or financing picture?` : confirmed.reply,
          slot: `route:confirmed-asset:${confirmed.intent}`, echoConcept: confirmed.label, refusal: false,
          patch: { objectiveDiscoveryPending: false, guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
        };
      }
    }
  }

  // 4.4 — UNIVERSAL GOAL PARSER classes: not-privately-ownable, impossible
  // scale, regulated airport, agriculture, marine vessel. Reality-check the
  // asset and respond to the goal — never fall through to ASK_PERSON/STORY.
  const goalAsset = classifyGoalAsset(message);
  if (goalAsset) {
    const repeated = repeatOf(goalAsset.turnIntent);
    return {
      turnIntent: repeated ? "ASK_REGION" : goalAsset.turnIntent,
      text: repeated ? `Still on that — which market or region, and what use? That shapes what's realistic.` : goalAsset.text,
      slot: goalAsset.slot, echoConcept: goalAsset.echoConcept, refusal: false,
      patch: goalAsset.reality === "NOT_PRIVATELY_OWNABLE" || goalAsset.reality === "IMPOSSIBLE_SCALE_ASSET"
        ? {} : { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 4.5 — ICONIC PRIVATE ASSET: extraordinary-capital reality check.
  const iconic = detectIconicAsset(message);
  if (iconic) {
    const repeated = repeatOf("REALITY_CHECK_ICONIC_ASSET");
    return {
      turnIntent: repeated ? "OFFER_SEARCH_AND_BRING_BACK" : "REALITY_CHECK_ICONIC_ASSET",
      text: repeated
        ? "Same honest answer on the iconic asset — but the realistic adjacents are searchable: look for trophy commercial, Art Deco, or landmark-character properties on Crexi or LoopNet and paste a listing back here. I'll tell you honestly what it could become."
        : iconicAssetReply(iconic),
      slot: "reality-check:iconic-asset", echoConcept: iconic, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 5 — impossible destination → out-of-scope WITH real-world-adjacent options.
  const impossible = detectImpossiblePlace(message);
  if (impossible) {
    const repeated = repeatOf("OUT_OF_SCOPE_WITH_REAL_WORLD_ADJACENT");
    return {
      turnIntent: repeated ? "OFFER_SEARCH_AND_BRING_BACK" : "OUT_OF_SCOPE_WITH_REAL_WORLD_ADJACENT",
      text: repeated
        ? `Still with you — ${impossible} stays outside the map, but the real-world versions don't: search Zillow, Crexi, LoopNet, or LandWatch for remote land, dark-sky areas, or unusual builds, and paste any listing link back here. I'll tell you honestly what it could become.`
        : outOfScopeAdjacentReply(impossible),
      slot: "out-of-scope:impossible-place", echoConcept: impossible, refusal: false,
      patch: { noveltyGate: gateForCategory("FANTASY_OUT_OF_SCOPE") },
    };
  }

  // 5.5 — SPECIFIC lawful/ambiguous concept → clarify the real-world USE
  // before ANY generic constraints/budget prompt; the reply echoes the phrase.
  const specific = detectSpecificConcept(message);
  if (specific) {
    const repeated = repeatOf("CLARIFY_SPECIFIC_CONCEPT_USE");
    return {
      turnIntent: repeated ? "ROUTE_CODE_CHECKABLE_TRANSLATION" : "CLARIFY_SPECIFIC_CONCEPT_USE",
      text: repeated ? codeCheckableTranslationReply(specific.phrase) : specificConceptReply(specific.phrase, specific.options),
      slot: "clarify:specific-concept-use", echoConcept: specific.phrase, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 5.55 — APICULTURE SCALE: "one bee box / a hive / backyard bees / keep bees /
  // pollination income" is a small-scale apiary clarification — inside the
  // apiculture domain, never a generic constraints answer or open discovery.
  if (detectApiaryScale(message)) {
    const repeated = repeatOf("ROUTE_HOBBY_OR_SMALL_SCALE_APIARY");
    return {
      turnIntent: repeated ? "ASK_REGION" : "ROUTE_HOBBY_OR_SMALL_SCALE_APIARY",
      text: repeated ? "Which town or area would the hive go in? Bee rules — setbacks, registration, HOA limits — are local." : APIARY_SCALE_REPLY,
      slot: "route:apiary-small-scale", echoConcept: "bee box / hive", refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 5.6 — ANIMAL / PET / LIVESTOCK housing: classify the use BEFORE any
  // generic route; the reply must reference the animal.
  const animal = detectAnimalHousing(message);
  if (animal) {
    const baseIntent: TurnIntent =
      animal.kind === "kennel-business" ? "ROUTE_PET_STRUCTURE"
      : animal.kind === "livestock" ? "ROUTE_LIVESTOCK_OR_AG_STRUCTURE"
      : "CLARIFY_ANIMAL_HOUSING";
    const repeated = repeatOf(baseIntent);
    return {
      turnIntent: repeated ? "ASK_REGION" : baseIntent,
      text: repeated
        ? `Staying with the ${animal.animal} — which town or region is this for? Climate, zoning, and animal rules all hang on the place.`
        : animalHousingReply(animal),
      slot: `route:animal-housing:${animal.kind}`, echoConcept: animal.animal, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 6 — SPECIFIC novelty concept (piñata rule — the reply must name it).
  const noveltyConcept = detectNoveltyConceptPhrase(message);
  if (noveltyConcept) {
    const repeated = repeatOf("CLARIFY_NOVELTY_BUILD_CONCEPT");
    return {
      turnIntent: repeated ? "ROUTE_CODE_CHECKABLE_TRANSLATION" : "CLARIFY_NOVELTY_BUILD_CONCEPT",
      text: repeated ? codeCheckableTranslationReply(noveltyConcept) : noveltyConceptReply(noveltyConcept),
      slot: "clarify:novelty-concept", echoConcept: noveltyConcept, refusal: false,
      patch: { noveltyGate: gateForCategory("NOVELTY_UNTRANSLATED") },
    };
  }

  // 7 — goal-specific routes: earth-sheltered, then other lawful unusual builds.
  const earth = detectEarthSheltered(message);
  if (earth) {
    const repeated = repeatOf("ROUTE_EARTH_SHELTERED_HOUSING");
    return {
      turnIntent: repeated ? "ASK_REGION" : "ROUTE_EARTH_SHELTERED_HOUSING",
      text: repeated
        ? "Staying underground, then — is there a part of the country you're drawn to, and a rough budget range? Both shape which earth-sheltered paths are realistic."
        : earthShelteredReply(earth),
      slot: "route:earth-sheltered", echoConcept: earth, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }
  const weird = detectWeirdLawful(message);
  if (weird) {
    const repeated = repeatOf("ROUTE_WEIRD_BUT_LAWFUL_ARCHITECTURE");
    return {
      turnIntent: repeated ? "ASK_REGION" : "ROUTE_WEIRD_BUT_LAWFUL_ARCHITECTURE",
      text: repeated
        ? `Sticking with the ${weird} — is there a region you're drawn to, and a rough budget range? Both shape where one could legally happen.`
        : weirdLawfulReply(weird),
      slot: "route:weird-but-lawful", echoConcept: weird, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 7.3 — VEHICLE / VESSEL-INSPIRED architecture → clarify use, echo concept.
  const vehicle = detectVehicleInspired(message);
  if (vehicle) {
    const repeated = repeatOf("ROUTE_VEHICLE_INSPIRED_ARCHITECTURE");
    return {
      turnIntent: repeated ? "ASK_REGION" : "ROUTE_VEHICLE_INSPIRED_ARCHITECTURE",
      text: repeated ? `Sticking with the ${vehicle} — which region, and a rough budget? Both shape where it could legally work.` : vehicleInspiredReply(vehicle),
      slot: "route:vehicle-inspired", echoConcept: vehicle, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 7.4 — MARINE LIVEABOARD / NONTRADITIONAL DWELLING → goal-first dwelling.
  const dwelling = detectMarineDwelling(message);
  if (dwelling) {
    const base: TurnIntent = dwelling.kind === "marine" ? "ROUTE_MARINE_LIVEABOARD" : "ROUTE_NONTRADITIONAL_DWELLING";
    const repeated = repeatOf(base);
    return {
      turnIntent: repeated ? "ASK_REGION" : base,
      text: repeated ? `Staying with the ${dwelling.concept} — which area, and full-time or seasonal?` : dwelling.kind === "marine" ? marineReply(dwelling.concept) : nontraditionalReply(dwelling.concept),
      slot: `route:dwelling:${dwelling.kind}`, echoConcept: dwelling.concept, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 7.5 — SPECIALTY / SURPLUS / ADAPTIVE-REUSE asset → unusual but not
  // impossible; never imply availability.
  const specialty = detectSpecialtyAsset(message);
  if (specialty) {
    const repeated = repeatOf("ROUTE_SPECIALTY_ASSET_ACQUISITION");
    return {
      turnIntent: repeated ? "ASK_REGION" : "ROUTE_SPECIALTY_ASSET_ACQUISITION",
      text: repeated ? `Staying with the ${specialty} — which region, and what use (residential, storage, business, tourism)?` : specialtyAssetReply(specialty),
      slot: "route:specialty-asset", echoConcept: specialty, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 7.6 — ASSET-CLASS ACQUISITION (commercial / healthcare / regulated) →
  // respond to the clear goal, never fall through to ASK_PERSON/ASK_STORY.
  const assetGoal = detectAssetGoal(message);
  if (assetGoal) {
    const repeated = repeatOf(assetGoal.intent);
    return {
      turnIntent: repeated ? "ASK_REGION" : assetGoal.intent,
      text: repeated ? `Still on the ${assetGoal.label} — which market or region, and any budget or financing picture?` : assetGoal.reply,
      slot: `route:asset-goal:${assetGoal.intent}`, echoConcept: assetGoal.label, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 7.7 — GENERIC ANIMAL GOAL: any animal entity + goal verb (ostriches, camel,
  // yak, …) classifies to an agricultural/animal pathway — never ASK_STORY.
  const animalGoal = detectAnimalGoal(message);
  if (animalGoal) {
    const base: TurnIntent = animalGoal.category === "wildlife_or_conservation" ? "ROUTE_CONSERVATION_OR_HABITAT" : "ROUTE_LIVESTOCK_OR_AG_STRUCTURE";
    const repeated = repeatOf(base);
    return {
      turnIntent: repeated ? "ASK_REGION" : base,
      text: repeated ? `Staying with the ${animalGoal.animal} — which region, and roughly what scale?` : animalGoalReply(animalGoal.animal, animalGoal.category),
      slot: `route:animal-goal:${animalGoal.category}`, echoConcept: animalGoal.animal, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 7.75 — SHORT NOUN PHRASE: "cat box" / "fish tank" with no goal verb is not
  // nothing — clarify product vs structure vs business vs test before intake.
  const shortNoun = detectShortNounPhrase(message);
  if (shortNoun) {
    const repeated = repeatOf("CLARIFY_SHORT_NOUN_PHRASE");
    return {
      turnIntent: repeated ? "WAIT_FOR_MORE_INFO" : "CLARIFY_SHORT_NOUN_PHRASE",
      text: repeated
        ? "Whenever you can say a bit more about the real-world property, animal-care, business, or facility goal, I’ll point this the right way."
        : shortNounPhraseReply(shortNoun),
      slot: "clarify:short-noun-phrase", echoConcept: shortNoun, refusal: false, patch: {},
    };
  }

  // 7.8 — PRIVATE-ADDRESS ACQUISITION: a bare private/residential address with
  // purchase intent (no verified listing) is NOT a hard shutdown — it gets a
  // LIMITED generic overview (categories only, no owner/resident/pro forma).
  // If the address was tied to stalking/harassment earlier this session, even
  // the limited overview is withheld. (Runs after all asset routes, so a
  // commercial/ag/specialty goal at an address is handled by those first.)
  const priv = detectPrivateAddressAcquisition(message);
  if (priv.kind) {
    const flaggedHit = priv.address && (journey.flaggedAddresses ?? []).includes(priv.address);
    if (flaggedHit) {
      return {
        turnIntent: "REFUSE_OWNER_LOOKUP", text: PRIVATE_ADDRESS_STALKING_REFUSAL,
        slot: "refuse:stalking-tied-address", echoConcept: null, refusal: true, patch: {},
      };
    }
    const repeated = repeatOf("LIMITED_PRIVATE_ADDRESS_OVERVIEW");
    return {
      turnIntent: repeated ? "WAIT_FOR_MORE_INFO" : "LIMITED_PRIVATE_ADDRESS_OVERVIEW",
      text: PRIVATE_ADDRESS_OVERVIEW_REPLY,
      slot: `limited-overview:${priv.kind}`, echoConcept: null, refusal: false, patch: {},
    };
  }

  // 8 — open discovery (no property / help me find one / no idea).
  const intent = detectPropertyIntent(message, null);
  if ((intent === "NO_PROPERTY_YET" || intent === "WANTS_PROPERTY_DISCOVERY" || intent === "UNKNOWN_OPEN_DISCOVERY") && !journey.guidedDiscovery) {
    return {
      turnIntent: "ROUTE_OPEN_DISCOVERY",
      text: "", // route.ts supplies the locked guided-discovery copy
      slot: "route:open-discovery", echoConcept: null, refusal: false,
      patch: { guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" },
    };
  }

  // 9 — no high-priority route: the questionnaire arc is AUTHORIZED (last resort).
  return null;
}

/**
 * extractAllowedRemainder — mixed-intent split (build fix 2026-06-12). After a
 * guardrail refusal (G-1/G-2), the LAWFUL remainder of the same message is
 * routed with a clean intent history so the refusal can chain to it
 * (REFUSAL + PRESERVED_ALLOWED_GOAL) instead of erasing the user's goal.
 * Returns null when no lawful goal exists. The route layer decides which
 * refusal types may preserve goals (evasion/explicit deliberately may not).
 */
export function extractAllowedRemainder(message: string, journey: JourneyState): RouteDecision | null {
  const d = routeTurn(message, { ...journey, lastTurnIntent: null, recentTurnIntents: [] });
  return d && !d.refusal ? d : null;
}

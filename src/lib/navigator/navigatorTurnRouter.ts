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
  [/\bdome\s+(?:home|house)\b|\bearthship\b|\byurt\b|\bcontainer\s+home\b/i, "alternative dwelling"],
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

  // 8 — open discovery (no property / help me find one / no idea).
  const intent = detectPropertyIntent(message, null);
  if ((intent === "NO_PROPERTY_YET" || intent === "WANTS_PROPERTY_DISCOVERY") && !journey.guidedDiscovery) {
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

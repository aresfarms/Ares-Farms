/**
 * Novelty / Fantasy Build Code Reality Boundary (BUILD PATCH, Caitlin
 * 2026-06-11) — Navigator Playful Intent + Reality Engine doctrine.
 *
 * RULE: the Navigator may acknowledge unusual, funny, fantasy, or novelty build
 * ideas, but must immediately route them through real-world buildability.
 * Furlong does not help users pursue structures that are sexually explicit,
 * illegal, unsafe, unpermittable, or facially incompatible with ordinary state,
 * county, municipal, zoning, building-code, public-nuisance, HOA, or land-use
 * requirements.
 *
 * HARD RULE: no pathway cards, pro formas, financing structures, program
 * matches, or property suggestions may be generated for a novelty/fantasy build
 * until the concept is translated into a lawful, non-sexual, real-world,
 * code-checkable project. The six-flag gate below enforces that; the converse
 * route checks it before pathway generation.
 *
 * Response pattern (required): 1) briefly acknowledge the idea; 2) state the
 * reality boundary; 3) explain that building codes and local rules usually
 * control; 4) ask the user to translate the idea into a lawful, code-compliant
 * concept. NOVELTY_BOUNDARY_REPLY below is that pattern, locked.
 */

export type NoveltyCategory =
  | "SEXUAL_EXPLICIT"        // disallowed outright — refuse + redirect
  | "ILLEGAL_OR_UNSAFE"      // disallowed outright — refuse + redirect
  | "CODE_EVASION"           // structures designed to evade code — refuse
  | "FANTASY_OUT_OF_SCOPE"   // physically/jurisdictionally impossible siting
  | "NOVELTY_UNTRANSLATED";  // unusual but possibly translatable — ask for the real-world version

/** Code-compliance gate — ALL six must be true before pathway analysis. */
export interface NoveltyGate {
  concept_lawful: boolean | null;
  concept_non_sexual: boolean | null;
  concept_real_world_translated: boolean | null;
  code_compliance_possible: boolean | null;
  zoning_path_possible: boolean | null;
  permitting_path_possible: boolean | null;
}

export const NOVELTY_BOUNDARY_REPLY =
  "That is definitely an unusual idea. Furlong can help explore creative buildings, but only if the concept can be " +
  "translated into something lawful, safe, non-sexual, and likely capable of meeting state, county, local zoning, " +
  "building-code, utility, access, setback, and permitting rules. If you want, describe the real-world version of " +
  "the idea — for example a themed cabin, earth-sheltered home, observatory, farm structure, or hospitality " +
  "concept — and I’ll help test what may be realistic.";

export const NOVELTY_REFUSAL_REPLY =
  "That isn’t something Furlong can help build — we only work on lawful, safe, non-sexual projects that have a " +
  "real path through zoning, building codes, and permitting. If there’s a lawful, code-compliant version of what " +
  "you’re imagining, describe that and we can test what may be realistic.";

// ── detection (paraphrase-tolerant, deterministic) ───────────────────────────
// REFINED 2026-06-12 (over-refusal fix): the SEXUAL_EXPLICIT trigger is
// EXPLICIT CONTENT/SHAPE GENERATION — genital/breast-shaped structures,
// explicit sexual display, pornographic content. A lawful adult BUSINESS USE
// (adult retail store, adult-entertainment venue, gentlemen's club) is a
// legitimate, regulated land use and is answered as an ordinary ZONING
// question (see detectRegulatedUse) — adult subject matter alone is NOT a
// refusal trigger. Furlong reports what's lawful; it does not moralize.
const SEXUAL_RE: RegExp[] = [
  /\b(?:phallic|penis|genital|vagina|breast)[- ]?(?:shaped|themed)?\b.{0,30}\b(?:building|tower|structure|house|hotel|monument)\b/i,
  /\b(?:building|tower|structure|house|hotel|monument)\b.{0,40}\bshaped\s+like\s+(?:a\s+)?(?:penis|phallus|genitals?|breasts?|butt)\b/i,
  /\b(?:pornographic|obscene)\s+(?:content|display|building|structure|imagery)\b/i,
  /\bsexually\s+explicit\b.{0,30}\b(?:building|structure|venue|display|content)\b/i,
  /\b(?:generate|make|write|create)\b.{0,30}\b(?:porn|pornography|sexual\s+content|explicit\s+content)\b/i,
];
const ILLEGAL_UNSAFE_RE: RegExp[] = [
  /\b(?:meth|drug)\s+(?:lab|house)\b/i,
  /\bbrothel\b/i,
  /\billegal\s+(?:dwelling|grow|casino|club)\b/i,
  /\bbooby[- ]?trap/i,
  /\b(?:no|without)\s+(?:fire\s+)?exits?\b.{0,30}\b(?:building|venue|club)\b/i,
];
const CODE_EVASION_RE: RegExp[] = [
  /\b(?:without|skip|avoid|dodge|evade|bypass)\b.{0,30}\b(?:permits?|inspections?|inspectors?|zoning|building\s+codes?)\b/i,
  /\bhide\b.{0,40}\bfrom\s+the\s+(?:county|city|inspector|assessor|appraisal\s+district|building\s+department|code\s+enforcement)\b/i,
  /\b(?:trick|fool|get\s+around)\b.{0,30}\b(?:code|zoning|the\s+county|permitting)\b/i,
];

// ── LAWFUL-BUT-REGULATED business uses → ordinary zoning questions ───────────
// These must NEVER refuse. They get the normal three-answer model via the
// ordinance layer (adult-use overlays, buffer/distance rules, licensing are
// ordinance FACTS, not steering). Same engine as STR, pointed at the use.
const REGULATED_USE_RE: [RegExp, string][] = [
  [/\bcannabis|marijuana|dispensar(?:y|ies)\b/i, "licensed cannabis business"],
  [/\b(?:bar|tavern|pub|brewery|liquor[- ]licensed|liquor\s+store)\b/i, "bar or liquor-licensed establishment"],
  [/\badult[\s-]+(?:retail|book\s?store|store|shop|entertainment(?:[\s-]+venue)?|venue|business|use)\b/i, "adult-use business"],
  [/\b(?:strip\s+club|gentlemen'?s\s+club)\b/i, "adult-entertainment venue"],
  [/\bshort[- ]term\s+rental\b|\bairbnb\b|\bvrbo\b|\bvacation\s+rental\b/i, "short-term rental"],
  [/\btattoo\s+(?:parlor|shop|studio)\b/i, "tattoo studio"],
  [/\b(?:smoke|vape)\s+shop\b/i, "smoke/vape shop"],
  [/\b(?:firearms?\s+dealer|gun\s+(?:shop|store|range))\b/i, "firearms business"],
];

/** A lawful, regulated business use — answer via zoning, never refuse. */
export function detectRegulatedUse(message: string): string | null {
  // Explicit-content/shape asks are NOT regulated-use questions.
  if (SEXUAL_RE.some((re) => re.test(message))) return null;
  for (const [re, label] of REGULATED_USE_RE) if (re.test(message)) return label;
  return null;
}

export const CODE_EVASION_REPLY =
  "I can’t help with avoiding inspections or hiding work from the county — but here’s the lawful path for what " +
  "you’re describing: most jurisdictions need a permit application, plan review, and inspections, and unpermitted " +
  "work usually surfaces at sale or refinance anyway. Describe the project and I’ll help map the legitimate " +
  "permitting steps.";
const FANTASY_RE: RegExp[] = [
  /\b(?:outer\s+space|in\s+space|on\s+the\s+moon|on\s+mars|in\s+orbit|orbital|zero\s+gravity|zero-g)\b/i,
  /\b(?:floating|flying)\s+(?:castle|city|island|fortress)\b/i,
  /\bunderwater\s+(?:city|castle|mansion)\b/i,
  /\b(?:hogwarts|death\s+star|wizard\s+tower|dragon\s+lair|cloud\s+(?:city|palace))\b/i,
];
const NOVELTY_RE: RegExp[] = [
  /\b(?:building|house|home|hotel|barn|tower|structure)\b.{0,40}\bshaped\s+like\b/i,
  /\bgiant\s+(?:donut|doughnut|shoe|boot|pickle|banana|guitar|teapot)\b.{0,30}\b(?:building|house|structure|attraction)\b/i,
  /\bufo[- ]shaped\b/i,
];

/** A real-world translation the boundary reply explicitly invites. */
const TRANSLATION_RE =
  /\b(?:themed\s+(?:cabin|retreat|lodge|venue|airbnb|rental)|earth[- ]sheltered|observatory|farm\s+(?:structure|stay)|hospitality|glamping|event\s+venue|tiny\s+home|cabin|barn|agritourism)\b/i;

export function classifyNoveltyConcept(message: string): NoveltyCategory | null {
  if (SEXUAL_RE.some((re) => re.test(message))) return "SEXUAL_EXPLICIT";
  if (ILLEGAL_UNSAFE_RE.some((re) => re.test(message))) return "ILLEGAL_OR_UNSAFE";
  if (CODE_EVASION_RE.some((re) => re.test(message))) return "CODE_EVASION";
  if (FANTASY_RE.some((re) => re.test(message))) return "FANTASY_OUT_OF_SCOPE";
  if (NOVELTY_RE.some((re) => re.test(message))) return "NOVELTY_UNTRANSLATED";
  return null;
}

/** Build the gate for a freshly classified concept (unknowns stay null). */
export function gateForCategory(cat: NoveltyCategory): NoveltyGate {
  return {
    concept_lawful: cat === "ILLEGAL_OR_UNSAFE" || cat === "CODE_EVASION" ? false : null,
    concept_non_sexual: cat === "SEXUAL_EXPLICIT" ? false : null,
    concept_real_world_translated: cat === "FANTASY_OUT_OF_SCOPE" || cat === "NOVELTY_UNTRANSLATED" ? false : null,
    code_compliance_possible: cat === "CODE_EVASION" ? false : null,
    zoning_path_possible: null,
    permitting_path_possible: null,
  };
}

/** Permanently disallowed — no translation path is offered for these. */
export function isDisallowedOutright(cat: NoveltyCategory | null): boolean {
  return cat === "SEXUAL_EXPLICIT" || cat === "ILLEGAL_OR_UNSAFE" || cat === "CODE_EVASION";
}

/** True only when ALL six flags are affirmatively true. */
export function noveltyGateClear(gate: NoveltyGate | null | undefined): boolean {
  if (!gate) return true; // no novelty concept on the table — ordinary flow
  return (Object.values(gate) as (boolean | null)[]).every((v) => v === true);
}

/**
 * Did this message translate the idea into a lawful real-world concept the
 * boundary reply invited? If so the gate clears — pathway analysis (still
 * advisory, still honest) may proceed on the TRANSLATED concept.
 */
export function translatesToRealWorld(message: string): boolean {
  return TRANSLATION_RE.test(message) && !classifyNoveltyConcept(message);
}

export function clearedGate(): NoveltyGate {
  return {
    concept_lawful: true, concept_non_sexual: true, concept_real_world_translated: true,
    code_compliance_possible: true, zoning_path_possible: true, permitting_path_possible: true,
  };
}

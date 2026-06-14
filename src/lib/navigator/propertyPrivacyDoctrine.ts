/**
 * CONST-PROPERTY-PRIVACY-001 — Property Possibility Privacy & Anti-Steering
 * Doctrine (constitutional-grade, ISOMORPHIC, pure).
 *
 * Furlong public surfaces analyze properties, assets, constraints, programs,
 * and economic possibilities. They must NOT identify owners, residents,
 * neighborhood demographics, protected-class characteristics, or people-based
 * desirability. (Spec 2026-06-11 §7 G-1/G-2 + addendum §8.)
 *
 * Defense-in-depth: this module is the BEHAVIORAL layer (intent detection +
 * the one consistent refusal line). The ARCHITECTURAL layer is intakeScrubber —
 * owner + demographic fields are stripped at ingestion so they never reach the
 * model's context. A system-prompt instruction alone is the weak version; both
 * layers here are enforced in code and adversarially tested.
 */

export const PROPERTY_PRIVACY_DOCTRINE_ID = "CONST-PROPERTY-PRIVACY-001";
export const PROPERTY_PRIVACY_VERSION = "property-privacy-doctrine-v0.1.0";

/**
 * THE one consistent, gentle refusal line (spec-locked verbatim). Same line for
 * ownership and steering refusals — it never hints the data exists somewhere.
 */
export const REFUSAL_LINE =
  "That's not something Furlong can answer here. But I can tell you what this property can do…";

// ── G-1: ownership-identification intent (robust to paraphrase) ──────────────
// "who owns this" = hard stop. "how do I pursue/buy this" = legitimate (routes
// to the broker/provider path) — the patterns below deliberately do NOT match it.
const OWNERSHIP_INTENT: RegExp[] = [
  /\bwho\s+owns?\b/i,
  /\bwho\s+(?:is|are)\s+the\s+owners?\b/i,
  /\bowner(?:'s)?\s+(?:name|info|identity|contact|phone|email|address)\b/i,
  /\bwho\s+lives?\s+(?:at|in|there|here)\b/i,
  /\bwho\s+resides?\b/i,
  /\bname\s+(?:is\s+)?on\s+the\s+(?:deed|title|mortgage)\b/i,
  /\bwhose\s+name\b/i,
  /\bwho(?:'s| is)\s+on\s+the\s+(?:deed|title)\b/i,
  /\bwho\s+pays?\s+(?:the\s+)?(?:property\s+)?tax(?:es)?\b/i,
  /\bwho(?:'s| is)\s+registered\b/i,
  /\bwho\s+holds?\s+(?:the\s+)?title\b/i,
  /\b(?:landlord|owner)\s+look\s*up\b/i,
  /\bfind\s+(?:out\s+)?(?:the\s+)?owner\b/i,
  /\bwhose\s+(?:house|property|land|place)\b/i,
  /\bcontact\s+the\s+owner\b/i,
  /\btell\s+me\s+who\s+(?:bought|sold|owns)\b/i,
  /\bcurrent\s+resident\b/i,
  // C4c: authority-framed resident/occupant lookup ("give me the resident info").
  /\bresident(?:'s)?\s+(?:info|information|name|identity|contact|details)\b/i,
  /\b(?:resident|occupant|tenant)\s+(?:info|information|lookup|details)\b/i,
  /\bwho\s+(?:is\s+)?(?:the\s+)?(?:resident|occupant|tenant)\b/i,
  // C3b: erosion follow-up after an owner refusal ("just their name").
  /\bjust\s+(?:their|his|her|the\s+owner'?s?)\s+name\b/i,
  /\b(?:their|his|her|the\s+owner'?s?)\s+name\s+(?:then|please)?\s*$/i,
];

// C1a: collapse common leetspeak/homoglyph substitutions so obfuscated probes
// ("wh1te neighborhood", "st@lk") still hit the detectors. Conservative — only
// used to RE-TEST the refusal patterns, never to alter routing or output.
export function normalizeForDetection(text: string): string {
  return text
    .replace(/[1!|]/g, "i").replace(/0/g, "o").replace(/3/g, "e").replace(/4/g, "a")
    .replace(/5|\$/g, "s").replace(/7/g, "t").replace(/@/g, "a").replace(/8/g, "b");
}

export function isOwnershipProbe(text: string): boolean {
  const norm = normalizeForDetection(text);
  return OWNERSHIP_INTENT.some((re) => re.test(text) || re.test(norm));
}

// ── G-2: demographic / steering intent — explicit AND proxy phrasings ────────
// FHA anti-steering: Furlong never characterizes areas as good/bad/safe or by
// who lives there. It tells you what you can DO with the property.
const STEERING_INTENT: RegExp[] = [
  // explicit protected-class asks
  /\b(?:racial|race|ethnic|ethnicity)\b.{0,40}\b(?:neighborhood|area|street|block|makeup|composition)\b/i,
  /\b(?:neighborhood|area|street|block)\b.{0,40}\b(?:racial|race|ethnic|ethnicity|demographic)/i,
  /\bdemographics?\s+(?:of|in|around|for)\b/i,
  /\bwhat\s+(?:kind|sort|type)\s+of\s+people\s+liv/i,
  /\bwho\s+lives\s+in\s+(?:this|the)\s+(?:neighborhood|area)\b/i,
  /\b(?:white|black|african.?american|hispanic|latino|asian|jewish|muslim|christian)\b.{0,30}\b(?:neighborhood|area|street|block|people|families)\b/i,
  /\b(?:neighborhood|area|street|block)\b.{0,30}\b(?:white|black|african.?american|hispanic|latino|asian|jewish|muslim|christian)\b/i,
  /\bimmigrant(?:s)?\b.{0,30}\b(?:area|neighborhood)\b/i,
  /\bfamilies\s+with\s+(?:kids|children)\b.{0,30}\b(?:area|neighborhood|street)\b/i,
  // proxy / sideways steering asks
  /\bis\s+(?:this|it|that)\s+a?\s*(?:good|bad|nice|decent|rough|sketchy)\s+(?:neighborhood|area|part\s+of\s+town|street)\b/i,
  /\bis\s+(?:this|the|it|that)\s+(?:neighborhood|area|street|place)\s+(?:good|bad|nice|decent|rough|sketchy|safe|dangerous)\b/i,
  /\bis\s+it\s+safe\b/i,
  /\bhow\s+safe\s+is\b/i,
  /\bcrime\s+rate\b/i,
  /\bis\s+(?:it|this|that|the)\b.{0,20}\b(?:diverse|changing|gentrify)/i,
  /\b(?:neighborhood|area|block|street)\b.{0,20}\b(?:diverse|changing|gentrif)/i,
  /\bdiversity\s+(?:of|in)\s+the\s+(?:area|neighborhood)\b/i,
  /\bgood\s+schools?\b.{0,30}\b(?:people|kind|type)\b/i,
  /\bright\s+kind\s+of\s+(?:people|families|neighbors)\b/i,
  /\bquality\s+of\s+(?:the\s+)?(?:people|neighbors|residents)\b/i,
];

// HOPA carve-out: 55+/senior designation is a lawful property/community
// DESIGNATION (it changes what you can do with the property) — designation in,
// profiling out. These phrasings must NOT trip the steering refusal.
const HOPA_DESIGNATION: RegExp[] = [
  /\b55\s*\+\s*(?:community|designation|restricted)?\b/i,
  /\bage[-\s]?restricted\b/i,
  /\bsenior\s+(?:community|housing|living)\b/i,
  /\bhousing\s+for\s+older\s+persons\b/i,
  /\bHOPA\b/,
];

export function isHopaDesignationAsk(text: string): boolean {
  return HOPA_DESIGNATION.some((re) => re.test(text));
}

export function isSteeringProbe(text: string): boolean {
  if (isHopaDesignationAsk(text)) return false; // lawful designation ask
  const norm = normalizeForDetection(text); // C1a: catch "wh1te neighborhood"
  return STEERING_INTENT.some((re) => re.test(text) || re.test(norm));
}

export type RefusalKind = "ownership" | "steering" | null;

/** Classify a visitor message. Refusals win over everything downstream. */
export function classifyRefusal(text: string): RefusalKind {
  if (isOwnershipProbe(text)) return "ownership";
  if (isSteeringProbe(text)) return "steering";
  return null;
}

/** Mandatory controls of the doctrine (asserted by the verifier). */
export const PROPERTY_PRIVACY_CONTROLS = [
  "Address/parcel keyed analysis only.",
  "Owner-name fields stripped at ingestion.",
  "Protected-class and demographic fields scrubbed before model context.",
  "“Who owns/lives here?” requests refused and redirected.",
  "“Is this a good/safe/diverse neighborhood?” proxy-steering requests refused and redirected.",
  "55+ senior-community designation surfaces only as a lawful property/community designation.",
  "All refusals use the same gentle redirect line.",
  "Ownership and demographic fields absent at the data layer, not merely hidden in UI.",
  "Verification includes adversarial rendered-page and conversation testing.",
] as const;

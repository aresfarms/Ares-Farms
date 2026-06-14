/**
 * PROPOSED-SOLUTION-AS-HYPOTHESIS-001 — a conversation layer that runs BEFORE
 * narrow asset-route optimization.
 *
 * Doctrine: a user's stated asset / expansion plan is valid, but it is not
 * automatically the final destination. When a user proposes a SCALE / PORTFOLIO
 * / EXPANSION strategy ("buy 10 more laundromats", "five more farms", "a
 * portfolio of self-storage", "expand into Albuquerque", "a $10M property"),
 * Furlong first acknowledges the path, validates it might be right, and asks
 * what outcome they're actually trying to achieve — then offers to compare the
 * stated path against alternatives. The stated path is NEVER blocked, judged, or
 * decided for the user.
 *
 * It does NOT fire for an ordinary single goal ("I want a farm") — that routes
 * straight to the existing asset path. It does NOT fire when the user has
 * already been asked (journey.proposedSolutionAsked) or is explicitly confirming
 * ("I just want ten more laundromats") — those proceed to existing routing.
 *
 * Pure + deterministic. No I/O. No decision-for-user. No steering.
 */

const NUMBER_WORD =
  "two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|fifty|hundred|dozens?|several|multiple|a\\s+bunch\\s+of|a\\s+few|many";

// Asset-ish plural nouns that, with a count, mean MULTI-UNIT expansion. Kept
// deliberately distinct from units of measure (acres, sqft, miles, years,
// dollars, bedrooms, …) so "I want 100 acres" / a budget figure never mis-fires.
const ASSET_PLURAL =
  "laundromats|farms|ranches|vineyards|hotels|motels|rv\\s+parks|parks|houses|homes|rentals|" +
  "apartments|units|properties|businesses|stores|shops|locations|franchises|facilities|" +
  "warehouses|restaurants|car\\s+washes|gas\\s+stations|storage\\s+(?:units|facilities)|" +
  "self[-\\s]?storage|buildings|complexes|sites|lots|parcels";

// A scale/expansion/portfolio signal — the thing that turns a plain acquisition
// into a strategy hypothesis. Precise on purpose: a bare number alone never
// fires (that's a size or budget); it must pair with "more" or an asset plural.
const SCALE_SIGNALS: RegExp[] = [
  // "N more / additional / other [asset]"
  new RegExp(`\\b(?:${NUMBER_WORD}|\\d{1,4})\\s+(?:more|additional|other)\\b`, "i"),
  // "N <asset-plural>" (ten RV parks, 20 rental houses, 10 laundromats)
  new RegExp(`\\b(?:${NUMBER_WORD}|\\d{1,4})\\s+(?:[a-z][a-z-]*\\s+){0,2}(?:${ASSET_PLURAL})\\b`, "i"),
  // "buy/get/acquire/own/add/open N <asset-plural>" even without a unit word between
  new RegExp(`\\b(?:buy|get|acquire|own|add|open|build|want)\\s+(?:${NUMBER_WORD}|\\d{1,4})\\s+(?:[a-z][a-z-]*\\s+){0,2}(?:${ASSET_PLURAL})\\b`, "i"),
  /\bmore\s+of\s+(?:the\s+same|these|those|them)\b/i,
  /\banother\b/i,
  /\b(?:second|third|fourth|fifth)\s+[a-z]/i,
  /\bportfolio\s+of\b/i,
  /\bexpand(?:ing)?\s+(?:into|to|across)\b/i,
  /\bexpansion\b/i,
  /\bscale\s+(?:up|out|into|this)\b/i,
  /\bchain\s+of\b/i,
  /\b(?:roll[\s-]?up|rollup)\b/i,
  // big single-asset capital ("$10M property", "$10 million", "$5,000,000")
  /\$\s?\d[\d,.]*\s?(?:m\b|mm\b|million|billion)/i,
  /\$\s?\d{1,3}(?:,\d{3}){2,}/,
];

// The user is CONFIRMING the stated path — proceed, don't re-ask the objective.
const CONFIRMATION_SIGNALS: RegExp[] = [
  /\bi\s+just\s+(?:want|need|wanna)\b/i,
  /\bjust\s+(?:want|need|give\s+me|the)\b/i,
  /\bonly\s+want\b/i,
  /\bno[,\s]+just\b/i,
  /\byes[,\s]+just\b/i,
  /\b(?:still|definitely|absolutely)\s+want\b/i,
  /\bi'?ll\s+stick\s+with\b/i,
  /\bgo\s+with\s+(?:the|that)\b/i,
  /\bproceed\b/i,
  /\bskip\s+(?:the\s+)?(?:questions?|objective)\b/i,
];

export function isProposedSolutionConfirmation(message: string): boolean {
  return CONFIRMATION_SIGNALS.some((re) => re.test(message));
}

/**
 * Singularize a proposed-asset label so the EXISTING asset router (detectAssetGoal,
 * whose category regexes match singular nouns) can recognize a confirmed
 * expansion. "ten more laundromats" → asset "laundromats" → "laundromat".
 */
export function singularizeAsset(asset: string): string {
  const a = asset.trim().toLowerCase();
  if (/\b(?:houses|homes)$/.test(a)) return a.replace(/houses$/, "house").replace(/homes$/, "home");
  if (a.endsWith("ies")) return a.replace(/ies$/, "y");        // facilities → facility
  if (a.endsWith("ches") || a.endsWith("shes") || a.endsWith("sses")) return a.replace(/es$/, ""); // ranches→ranch, washes→wash
  if (a.endsWith("s") && !a.endsWith("ss")) return a.replace(/s$/, "");
  return a;
}

/** A probe sentence the existing asset router can classify for a confirmed path. */
export function confirmedAssetProbe(asset: string): string {
  return `I want to buy a ${singularizeAsset(asset)}`;
}

/**
 * Detect a proposed-solution / expansion hypothesis. Returns a short asset
 * label to reflect back ("ten more laundromats" → "laundromats"), or null.
 */
export function detectProposedSolution(message: string): { asset: string } | null {
  if (!SCALE_SIGNALS.some((re) => re.test(message))) return null;
  return { asset: extractAssetLabel(message) };
}

/** Best-effort plural asset noun for the acknowledgement; falls back to "that". */
function extractAssetLabel(message: string): string {
  const m = message.toLowerCase();
  // common multi-asset expansion nouns (kept generic — no routing meaning)
  const KNOWN = [
    "laundromats", "laundromat", "farms", "farm", "rv parks", "rv park",
    "hotels", "hotel", "self-storage", "storage facilities", "storage units", "storage",
    "rental houses", "rental homes", "rentals", "rental properties", "apartments",
    "restaurants", "car washes", "car wash", "gas stations", "warehouses",
    "vineyards", "ranches", "ranch", "motels", "motel", "properties", "businesses",
  ];
  for (const k of KNOWN) {
    if (new RegExp(`\\b${k.replace(/[-\s]/g, "[-\\s]")}\\b`, "i").test(m)) {
      return k.endsWith("s") ? k : `${k}s`;
    }
  }
  // generic: "<number> more <noun(s)>" capture
  const more = m.match(/\b(?:more|additional|other)\s+([a-z][a-z-]*(?:\s+[a-z][a-z-]*){0,2})\b/);
  if (more?.[1]) return more[1].trim();
  const numPlural = m.match(/\b(?:\d{1,4}|two|three|four|five|six|seven|eight|nine|ten|twenty)\s+([a-z][a-z-]*s)\b/);
  if (numPlural?.[1]) return numPlural[1].trim();
  return "that";
}

/**
 * Objective-discovery reply: acknowledge → validate → ask the destination →
 * offer alternative comparison → neutral concentration framing → keep the path
 * open. Human, calm, never a classifier label, never a decision.
 */
export function proposedSolutionReply(asset: string): string {
  const a = asset === "that" ? "that path" : asset;
  const lead = asset === "that" ? "That could be the right path." : `More ${a} could be the right path.`;
  return (
    `${lead} Before we assume it is — what are you actually trying to accomplish? ` +
    `More monthly income, building a company to sell someday, geographic expansion, passive ` +
    `ownership, replacing a job, family wealth, diversification, retirement income, or something else?\n\n` +
    `Once we know the destination, we can compare ${a === "that path" ? "this" : a} against other routes ` +
    `that might reach the same outcome with different risk, capital, time, and management demands — a ` +
    `smaller or larger version of the same plan, a diversified mix, a different asset class, or a wait-and-watch path.\n\n` +
    `Owning more of the same asset can build real scale, but it can also concentrate risk in one industry, ` +
    `one labor model, one utility profile, and one market — worth comparing before committing, not a reason to avoid it.\n\n` +
    `If you already know this is the path, just say so and we'll work through it directly.`
  );
}

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
  // HYPOTHESIS-002: NON-numeric expansion — "(buy/get/add/want/own) more
  // <asset-plural>", bare "more <asset-plural>", "add/expand into <asset>".
  // Gated on an asset plural so "want more time/money" never mis-fires.
  new RegExp(`\\b(?:buy|get|acquire|own|add|open|build|want|purchase)\\s+more\\s+(?:[a-z][a-z-]*\\s+){0,2}(?:${ASSET_PLURAL})\\b`, "i"),
  new RegExp(`\\bmore\\s+(?:[a-z][a-z-]*\\s+){0,2}(?:${ASSET_PLURAL})\\b`, "i"),
  new RegExp(`\\badd\\s+(?:more\\s+)?(?:[a-z][a-z-]*\\s+){0,2}(?:${ASSET_PLURAL})\\b`, "i"),
  new RegExp(`\\bexpand(?:ing)?\\s+into\\s+(?:[a-z][a-z-]*\\s+){0,2}(?:${ASSET_PLURAL})\\b`, "i"),
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

const STOPWORD_NOUN = /^(?:in|into|to|across|near|around|by|the|a|an|of|and|more|other|additional|them|these|those|here|there|buy|get|own|want|add|open|build|acquire|\d+|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|fifty|several|multiple|many|few)$/i;

/** Best-effort plural asset noun for the acknowledgement; falls back to "that". */
function extractAssetLabel(message: string): string {
  const m = message.toLowerCase();
  // 1) an asset-plural noun, with up to one leading qualifier ("pet stores",
  //    "rental houses", "self-storage facilities").
  const assetMatch = m.match(new RegExp(`\\b([a-z][a-z-]*\\s+)?(${ASSET_PLURAL})\\b`, "i"));
  if (assetMatch) {
    const lead = (assetMatch[1] ?? "").trim();
    const noun = assetMatch[2].trim();
    return lead && !STOPWORD_NOUN.test(lead) ? `${lead} ${noun}` : noun;
  }
  // 2) a SINGULAR asset root ("a laundromat … ten more") → pluralize it.
  const SINGULAR = "laundromat|farm|ranch|vineyard|hotel|motel|warehouse|restaurant|" +
    "car\\s+wash|gas\\s+station|store|shop|rv\\s+park|park|house|home|apartment|" +
    "storage\\s+(?:unit|facility)|self[-\\s]?storage|business|facility|complex|building";
  const sm = m.match(new RegExp(`\\b([a-z][a-z-]*\\s+)?(${SINGULAR})\\b`, "i"));
  if (sm) {
    const lead = (sm[1] ?? "").trim();
    const noun = pluralize(sm[2].trim());
    return lead && !STOPWORD_NOUN.test(lead) ? `${lead} ${noun}` : noun;
  }
  // 3) "<n> more <noun>" — but never a preposition/stopword (skip "more in NY").
  const more = m.match(/\b(?:more|additional|other)\s+([a-z][a-z-]*)\b/);
  if (more?.[1] && !STOPWORD_NOUN.test(more[1])) return pluralize(more[1].trim());
  return "that";
}

function pluralize(noun: string): string {
  if (/s$/.test(noun)) return noun;
  if (/(?:ch|sh|x|ss)$/.test(noun)) return `${noun}es`;
  if (/[^aeiou]y$/.test(noun)) return noun.replace(/y$/, "ies");
  return `${noun}s`;
}

// ── OBJECTIVE-DISCOVERY-001 ──────────────────────────────────────────────────
// After the hypothesis layer asks "what are you trying to accomplish", the next
// answer is an OBJECTIVE, not a constraints prompt. Categories, in priority
// order (most specific first).
export type ObjectiveCategory =
  | "passive_income" | "job_replacement" | "retirement" | "exit_sale"
  | "scale_enterprise" | "time_freedom" | "stability" | "wealth";

const OBJECTIVE_PATTERNS: [ObjectiveCategory, RegExp][] = [
  ["passive_income", /\b(?:passive\s+income|cash\s*flow|mailbox\s+money|income\s+stream|money\s+while\s+i\s+sleep|(?:more|monthly|extra|additional)\s+income|more\s+revenue)\b/i],
  ["job_replacement", /\b(?:quit|leave|replace|get\s+out\s+of)\s+(?:my\s+)?(?:job|9\s*[-to]*\s*5|day\s+job|career)\b|\breplace\s+my\s+(?:income|salary)\b|\bstop\s+working\b/i],
  ["retirement", /\b(?:retire|retirement|retire\s+early)\b/i],
  ["exit_sale", /\b(?:build\s+(?:something|a\s+(?:business|company))\s+(?:to\s+sell|i\s+can\s+sell)|sell\s+(?:it\s+)?someday|exit|flip\s+(?:it|them)|sell\s+the\s+(?:business|company))\b/i],
  ["scale_enterprise", /\b(?:scale|enterprise\s+value|build\s+(?:an?\s+)?empire|grow\s+(?:a\s+)?(?:company|business|portfolio)|operational\s+scale|bigger\s+business)\b/i],
  ["time_freedom", /\b(?:less\s+work|more\s+(?:time|freedom)|free\s+up\s+(?:my\s+)?time|lifestyle\s+(?:change|freedom)|work\s+less)\b/i],
  ["stability", /\b(?:stability|stable|secure|security|safe\s+(?:return|bet)|predictable)\b/i],
  ["wealth", /\b(?:be\s+rich|get\s+rich|rich|wealthy|wealth|generational\s+wealth|family\s+wealth|net\s+worth|financial\s+(?:freedom|independence)|make\s+(?:more|some)\s+money|more\s+money|build\s+wealth)\b/i],
];

const VAGUE_UNSURE = /^\s*(?:not\s+sure|i'?m\s+not\s+sure|idk|i\s+don'?t\s+know|dunno|no\s+idea|unsure|maybe)\b/i;

/**
 * Detect the objective in a reply to "what are you trying to accomplish".
 * Called ONLY while objective discovery is pending. A vague "not sure / idk"
 * with no signal still counts as an objective answer (it stays in objective
 * discovery — never a constraints prompt) and resolves to "wealth"-style
 * clarification by default.
 */
export function detectObjectivePending(message: string): ObjectiveCategory | null {
  for (const [cat, re] of OBJECTIVE_PATTERNS) if (re.test(message)) return cat;
  if (VAGUE_UNSURE.test(message)) return "wealth";
  return null;
}

/** Objective-clarification reply, tailored per category, referencing the asset. */
export function objectiveDiscoveryReply(category: ObjectiveCategory, assetLabel: string | null): string {
  const a = assetLabel && assetLabel !== "that" ? assetLabel : "that path";
  const beforeAssuming = `before assuming ${a === "that path" ? "that's" : `${a} is`} the best route`;
  switch (category) {
    case "passive_income":
      return (
        `Passive income is a real goal — and it points at very different routes. Let's pin it down ${beforeAssuming}: ` +
        `roughly how much monthly cash flow are you after, how hands-off does it need to be, and what's your risk and timeline?\n\n` +
        `Then we can compare ${a} against other income paths — self-storage, RV parks, rental housing, small hospitality, ` +
        `farmland leases, or a manager-run business — on yield, management burden, capital, and concentration.`
      );
    case "job_replacement":
      return (
        `Replacing your job is a clear, common goal. Let's define it ${beforeAssuming}: what monthly income would actually ` +
        `let you walk away, how much runway do you have, what's your risk tolerance, and how much management are you willing ` +
        `to take on?\n\n` +
        `Once we know the number and the management appetite, we can compare ${a} against other routes that hit the same ` +
        `income with different risk, time, and hands-on load.`
      );
    case "retirement":
      return (
        `Retirement income is the destination, not the asset. Let's define it ${beforeAssuming}: what annual income do you ` +
        `want it to throw off, when do you want it, and how much volatility can you live with?\n\n` +
        `Then we can compare ${a} against other retirement-income routes on durability, management, and how easily it ` +
        `converts back to cash.`
      );
    case "exit_sale":
      return (
        `Building something to sell is a real strategy — it changes what "good" looks like. Let's define it ${beforeAssuming}: ` +
        `what kind of exit and timeline, and what sale value are you aiming for?\n\n` +
        `Then we can compare ${a} against routes that build more enterprise/resale value per dollar and effort.`
      );
    case "scale_enterprise":
      return (
        `Scale and enterprise value are real goals. Let's define them ${beforeAssuming}: are you optimizing for the size of ` +
        `the operation, the value of a company you could sell, or both — and over what timeline?\n\n` +
        `Then we can compare multi-location same-asset expansion (like ${a}) against a diversified or different-asset build ` +
        `on risk, management, and exit value.`
      );
    case "time_freedom":
      return (
        `More time and less work is a real goal — and it rules some routes in and others out. Let's define it ${beforeAssuming}: ` +
        `how hands-off does this need to be, and how much income does it still need to produce?\n\n` +
        `Then we can compare ${a} against more passive or manager-friendly options.`
      );
    case "stability":
      return (
        `Stability is a real goal. Let's define it ${beforeAssuming}: are you after predictable income, durability through ` +
        `downturns, low management, or capital preservation — and over what timeline?\n\n` +
        `Then we can compare ${a} against steadier or more diversified routes on volatility and concentration.`
      );
    case "wealth":
    default:
      return (
        `Fair enough — wealth-building is a real goal. Let's define what "rich" means for you ${beforeAssuming}. ` +
        `Are you looking for monthly cash flow, higher net worth, a business you can sell someday, passive ownership, ` +
        `retirement income, financial independence, or something else?\n\n` +
        `Once we know the destination, we can compare ${a} against other routes that might get there with different risk, ` +
        `capital, time, and management demands.`
      );
  }
}

// ── LOCATION NORMALIZATION (HYPOTHESIS-002) ──────────────────────────────────
// Preserve a user-provided state/market so the hypothesis reply never asks
// "which market?" when they already said one. When several locations appear
// ("Cape May, NJ … 15 more in NY"), the EXPANSION TARGET — the LAST one — wins.
const US_STATES: [string, string][] = [
  ["Alabama", "AL"], ["Alaska", "AK"], ["Arizona", "AZ"], ["Arkansas", "AR"],
  ["California", "CA"], ["Colorado", "CO"], ["Connecticut", "CT"], ["Delaware", "DE"],
  ["Florida", "FL"], ["Georgia", "GA"], ["Hawaii", "HI"], ["Idaho", "ID"],
  ["Illinois", "IL"], ["Indiana", "IN"], ["Iowa", "IA"], ["Kansas", "KS"],
  ["Kentucky", "KY"], ["Louisiana", "LA"], ["Maine", "ME"], ["Maryland", "MD"],
  ["Massachusetts", "MA"], ["Michigan", "MI"], ["Minnesota", "MN"], ["Mississippi", "MS"],
  ["Missouri", "MO"], ["Montana", "MT"], ["Nebraska", "NE"], ["Nevada", "NV"],
  ["New Hampshire", "NH"], ["New Jersey", "NJ"], ["New Mexico", "NM"], ["New York", "NY"],
  ["North Carolina", "NC"], ["North Dakota", "ND"], ["Ohio", "OH"], ["Oklahoma", "OK"],
  ["Oregon", "OR"], ["Pennsylvania", "PA"], ["Rhode Island", "RI"], ["South Carolina", "SC"],
  ["South Dakota", "SD"], ["Tennessee", "TN"], ["Texas", "TX"], ["Utah", "UT"],
  ["Vermont", "VT"], ["Virginia", "VA"], ["Washington", "WA"], ["West Virginia", "WV"],
  ["Wisconsin", "WI"], ["Wyoming", "WY"], ["District of Columbia", "DC"],
];
const CODE_TO_STATE = new Map(US_STATES.map(([name, code]) => [code, name]));
const INFORMAL_ALIASES: [RegExp, string][] = [
  [/\bmass\b\.?/i, "Massachusetts"], [/\bcalif\b\.?/i, "California"], [/\bcali\b/i, "California"],
  [/\bpenn(?:a)?\b\.?/i, "Pennsylvania"], [/\btenn\b\.?/i, "Tennessee"], [/\bfla\b\.?/i, "Florida"],
  [/\btex\b\.?/i, "Texas"], [/\bconn\b\.?/i, "Connecticut"], [/\bwash\b\.?/i, "Washington"],
  [/\bmich\b\.?/i, "Michigan"], [/\bariz\b\.?/i, "Arizona"], [/\bcolo\b\.?/i, "Colorado"],
];

type LocHit = { index: number; state: string };

/**
 * Normalize a user-provided US state → canonical name (the LAST one mentioned —
 * the expansion target). Returns null if none. Also preserves a leading city:
 * detectStateLocation() returns the bare state; detectLocationPhrase() keeps
 * "Albuquerque, New Mexico".
 */
export function detectStateLocation(message: string): string | null {
  const hits: LocHit[] = [];
  // Full names (handles "N.Y."/"N.M." too via the code path below).
  for (const [name] of US_STATES) {
    const m = message.match(new RegExp(`\\b${name}\\b`, "i"));
    if (m && m.index !== undefined) hits.push({ index: m.index, state: name });
  }
  for (const [re, name] of INFORMAL_ALIASES) {
    const m = message.match(re);
    if (m && m.index !== undefined) hits.push({ index: m.index, state: name });
  }
  // Postal codes — uppercase, optionally dotted (NY / N.Y.); case-SENSITIVE so
  // lowercase words ("in", "or", "hi") never match.
  const codeRe = /\b([A-Z])\.?([A-Z])\.?(?=\s|,|\.|$)/g;
  for (let m = codeRe.exec(message); m; m = codeRe.exec(message)) {
    const code = m[1] + m[2];
    if (CODE_TO_STATE.has(code)) hits.push({ index: m.index, state: CODE_TO_STATE.get(code)! });
  }
  if (!hits.length) return null;
  // LAST mention wins (the expansion target, not an earlier current location).
  return hits.sort((a, b) => a.index - b.index).at(-1)!.state;
}

/** State, with a leading "City," preserved when present ("Albuquerque, New Mexico"). */
export function detectLocationPhrase(message: string): string | null {
  const state = detectStateLocation(message);
  if (!state) return null;
  // "City, <state-or-code>" immediately preceding the chosen state mention.
  const cityRe = new RegExp(
    `\\b([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){0,2}),\\s*(?:${state}\\b|${US_STATES.find(([n]) => n === state)?.[1]}\\b\\.?)`,
  );
  const cm = message.match(cityRe);
  if (cm) return `${cm[1]}, ${state}`;
  return state;
}

/**
 * Objective-discovery reply: acknowledge → validate → ask the destination →
 * offer alternative comparison → neutral concentration framing → keep the path
 * open. Human, calm, never a classifier label, never a decision.
 */
export function proposedSolutionReply(asset: string, location?: string | null): string {
  const a = asset === "that" ? "that path" : asset;
  const where = location ? ` in ${location}` : "";
  const lead = asset === "that"
    ? "That could be the right path."
    : `More ${a}${where} could be the right path.`;
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

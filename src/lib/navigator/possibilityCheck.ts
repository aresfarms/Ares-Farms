/**
 * Possibility checks — the THREE-ANSWER engine (spec §5) + Possibility
 * Confidence + "Why Furlong showed this" + effort/risk/profitability matrix +
 * the Discovery Graph (addendum §2–5). ISOMORPHIC, pure, deterministic.
 *
 * Every check returns one of three FIRST-CLASS states:
 *   YES — here's how · NO — here's why + the honest reroute ·
 *   CAN'T DETERMINE — here's why + who to confirm with (a real output, not a
 *   failure).
 *
 * NUMBERS ARE RANGES, never single figures, and only ever shown WITH a basis +
 * last-verified date. HONESTY RULE: this build does NOT fabricate market
 * dollar bands — until the Layer B comps synthesis is wired and verified, the
 * numeric side of a pathway degrades to CAN'T-DETERMINE ("market band pending —
 * confirm locally") rather than a made-up range. The range CONTRACT is
 * first-class now; the verified numbers arrive with Layer B.
 *
 * Legal/ordinance answers likewise stay honest: the Layer A ordinance engine is
 * not yet wired, so jurisdiction-dependent checks return CAN'T-DETERMINE with
 * the right confirm-with route; HOA-gated checks ALWAYS return CAN'T-DETERMINE
 * unless CC&Rs are supplied (Layer C is user-supplied by design).
 */

export const POSSIBILITY_CHECK_VERSION = "possibility-check-v0.1.0";

export type ThreeAnswer = "YES" | "NO" | "CANT_DETERMINE";
export type Confidence = "high" | "medium" | "low" | "cant-determine";
export type Level = "low" | "medium" | "high";

/** A numeric band — the ONLY legal shape for a number on this surface. */
export interface RangeBand {
  low: number;
  high: number;
  unit: string; // "$/mo", "$/acre/yr", "$/hr"
  basis: string; // what the band is derived from — never blank
  lastVerified: string; // ISO date — never blank
  framing: string; // the in-line probabilistic framing rendered WITH the number
}

export interface PathwayAssessment {
  id: string;
  title: string;
  answer: ThreeAnswer;
  /** YES → here's how; NO → here's why; CANT_DETERMINE → here's why. */
  detail: string;
  /** NO only — the honest reroute ("…but here's a real 'here'"). */
  reroute?: string;
  /** CANT_DETERMINE (and any pathway with open confirmations) — who confirms. */
  confirmWith: string[];
  confidence: Confidence;
  /** "We showed this because…" — evidence-linked, not generic. */
  whyShown: string;
  /** Null until Layer B synthesis is wired — never a fabricated band. */
  profitability: RangeBand | null;
  /** When profitability is null, the honest reason. */
  profitabilityNote: string | null;
  effort: Level;
  risk: Level;
  timeToStart: string;
  evidenceStrength: Level;
  requiredConfirmations: string[];
  /** Discovery-graph edges — connected pathways (cross, diverge, reconnect). */
  graphNeighbors: string[];
}

export interface PropertyContext {
  addressText: string | null;
  state: string | null;
  propertyKind: "residential" | "farm" | "commercial" | "unknown";
  hasPool: boolean | null; // null = unknown
  hasGarage: boolean | null;
  acreage: number | null;
  /** null = unknown — and unknown HOA status itself forces CAN'T-DETERMINE on HOA-gated checks. */
  inHoa: boolean | null;
  ccrsSupplied: boolean;
}

export const EMPTY_CONTEXT: PropertyContext = {
  addressText: null, state: null, propertyKind: "unknown",
  hasPool: null, hasGarage: null, acreage: null, inHoa: null, ccrsSupplied: false,
};

const ORDINANCE_PENDING =
  "We haven't verified this jurisdiction's ordinance yet (the ordinance layer for this town isn't wired) — confirm with the municipality before commencing.";
const MARKET_PENDING =
  "Market band pending — our comps synthesis for this area isn't verified yet, so we won't show you a made-up number. Confirm local rates before planning on revenue.";
const HOA_LINE =
  "We can't read your HOA's CC&Rs — they're private governing documents, not a public record. Supply them or confirm with your HOA before commencing.";

/** Discovery-graph chain (addendum §5 example, encoded as edges). */
const GRAPH: Record<string, string[]> = {
  "pool-rental": ["event-use"],
  "event-use": ["parking-rental", "pool-rental"],
  "parking-rental": ["storage-rental", "event-use"],
  "storage-rental": ["dog-park", "parking-rental", "rv-storage"],
  "dog-park": ["rv-storage", "storage-rental"],
  "rv-storage": ["micro-campground", "dog-park"],
  "micro-campground": ["rv-storage"],
  "room-rental": ["storage-rental"],
  "cropland-rent": ["crop-revenue"],
  "crop-revenue": ["sell-vs-hold", "cropland-rent"],
  "sell-vs-hold": ["crop-revenue"],
};

export function discoveryGraphChain(startId: string, maxLen = 7): string[] {
  const chain: string[] = [startId];
  const seen = new Set(chain);
  let cur = startId;
  while (chain.length < maxLen) {
    const next = (GRAPH[cur] ?? []).find((n) => !seen.has(n));
    if (!next) break;
    chain.push(next); seen.add(next); cur = next;
  }
  return chain;
}

type Def = {
  id: string; title: string; kinds: PropertyContext["propertyKind"][];
  hoaGated: boolean;
  assess: (c: PropertyContext) => Pick<PathwayAssessment, "answer" | "detail" | "reroute" | "confirmWith" | "confidence" | "whyShown" | "evidenceStrength">;
  effort: Level; risk: Level; timeToStart: string;
};

/** HOA gate applied uniformly: unknown/без-CC&Rs HOA status → CAN'T-DETERMINE. */
function hoaGate(c: PropertyContext): Pick<PathwayAssessment, "answer" | "detail" | "confirmWith" | "confidence"> | null {
  if (c.ccrsSupplied) return null; // CC&Rs in hand → the check may proceed (future: parse them)
  if (c.inHoa === false) return null; // known not in an HOA
  return { answer: "CANT_DETERMINE", detail: HOA_LINE, confirmWith: ["your HOA (supply the CC&Rs)"], confidence: "cant-determine" };
}

const DEFS: Def[] = [
  {
    id: "room-rental", title: "Rent a room (house-hacking)", kinds: ["residential", "unknown"], hoaGated: true,
    effort: "low", risk: "low", timeToStart: "weeks",
    assess: (c) => ({
      answer: "CANT_DETERMINE",
      detail: `Room rentals are commonly permitted for owner-occupied homes, but local rules differ. ${ORDINANCE_PENDING}`,
      confirmWith: ["the municipality (rental/occupancy rules)"],
      confidence: "cant-determine",
      whyShown: c.propertyKind === "residential"
        ? "We showed this because your property is a home — a spare room is the lowest-effort income a house can produce."
        : "We showed this because most homes can house-hack a spare room with little setup.",
      evidenceStrength: "low",
    }),
  },
  {
    id: "pool-rental", title: "Rent the pool by the hour", kinds: ["residential", "unknown"], hoaGated: true,
    effort: "medium", risk: "medium", timeToStart: "weeks",
    assess: (c) => {
      if (c.hasPool === false) return {
        answer: "NO",
        detail: "This property doesn't have a pool, so hourly pool rental isn't available here.",
        reroute: "Nearby properties with pools can run this — and YOUR lot may support the adjacent pathways instead (event use, parking, storage). Here's what this property CAN do.",
        confirmWith: [],
        confidence: "high",
        whyShown: "We checked this because pool rental is a common residential income pathway — and being honest about a NO opens the reroute.",
        evidenceStrength: "high",
      };
      return {
        answer: "CANT_DETERMINE",
        detail: `Hourly pool rental depends on local health/zoning rules and insurance. ${ORDINANCE_PENDING}`,
        confirmWith: ["the municipality (zoning/health)", "your insurer"],
        confidence: "cant-determine",
        whyShown: c.hasPool ? "We showed this because you told us the property has a pool — pools are rentable by the hour in many towns." : "We showed this in case the property has a pool — say so and we'll check it properly.",
        evidenceStrength: "low",
      };
    },
  },
  {
    id: "storage-rental", title: "Garage / attic / shed as storage", kinds: ["residential", "unknown"], hoaGated: true,
    effort: "low", risk: "low", timeToStart: "days",
    assess: (c) => ({
      answer: "CANT_DETERMINE",
      detail: `Renting enclosed storage is low-impact and frequently allowed, but some towns regulate commercial use of accessory structures. ${ORDINANCE_PENDING}`,
      confirmWith: ["the municipality (accessory-use rules)"],
      confidence: "cant-determine",
      whyShown: c.hasGarage ? "We showed this because the property has a garage — enclosed space rents with near-zero conversion cost." : "We showed this because most homes have unused enclosed space (garage, attic, shed).",
      evidenceStrength: "medium",
    }),
  },
  {
    id: "dog-park", title: "Backyard private dog park", kinds: ["residential", "unknown"], hoaGated: true,
    effort: "medium", risk: "medium", timeToStart: "weeks",
    assess: () => ({
      answer: "CANT_DETERMINE",
      detail: `Private-yard dog rental is an emerging use; towns differ on whether it's a home occupation. ${ORDINANCE_PENDING}`,
      confirmWith: ["the municipality (home-occupation rules)"],
      confidence: "cant-determine",
      whyShown: "We showed this because fenced yards rent by the hour on sniff-spot-style marketplaces — a pathway most owners don't know exists.",
      evidenceStrength: "low",
    }),
  },
  {
    id: "event-use", title: "Host small events on the property", kinds: ["residential", "farm", "unknown"], hoaGated: true,
    effort: "high", risk: "high", timeToStart: "months",
    assess: () => ({
      answer: "CANT_DETERMINE",
      detail: `Event hosting is usually the most-regulated residential use (noise, parking, assembly). ${ORDINANCE_PENDING}`,
      confirmWith: ["the municipality (special-use permits)", "your insurer"],
      confidence: "cant-determine",
      whyShown: "We showed this because it connects to the pool/parking/storage pathways — events are where several of them combine.",
      evidenceStrength: "low",
    }),
  },
  {
    id: "parking-rental", title: "Rent parking / driveway space", kinds: ["residential", "commercial", "unknown"], hoaGated: true,
    effort: "low", risk: "low", timeToStart: "days",
    assess: () => ({
      answer: "CANT_DETERMINE",
      detail: `Driveway/parking rental is commonly allowed, but some towns restrict commercial parking on residential lots. ${ORDINANCE_PENDING}`,
      confirmWith: ["the municipality (parking/land-use)"],
      confidence: "cant-determine",
      whyShown: "We showed this because paved space is the fastest income a lot can produce — no build-out at all.",
      evidenceStrength: "medium",
    }),
  },
  {
    id: "rv-storage", title: "RV / boat storage on the lot", kinds: ["residential", "farm", "unknown"], hoaGated: true,
    effort: "low", risk: "medium", timeToStart: "weeks",
    assess: (c) => ({
      answer: "CANT_DETERMINE",
      detail: `Outdoor vehicle storage hinges on lot size and local screening/land-use rules. ${ORDINANCE_PENDING}`,
      confirmWith: ["the municipality (land-use/screening)"],
      confidence: "cant-determine",
      whyShown: (c.acreage ?? 0) >= 1 ? "We showed this because your acreage gives real room for stored vehicles." : "We showed this because it chains naturally from storage and toward micro-campground use.",
      evidenceStrength: "low",
    }),
  },
  {
    id: "micro-campground", title: "Micro-campground / hipcamp-style sites", kinds: ["farm", "residential", "unknown"], hoaGated: true,
    effort: "high", risk: "high", timeToStart: "months",
    assess: (c) => {
      if (c.acreage !== null && c.acreage < 0.5) return {
        answer: "NO",
        detail: `At ~${c.acreage} acres this lot is too small for campsites with required setbacks in virtually every jurisdiction.`,
        reroute: "Larger nearby parcels can host camping — and this lot still has the parking/storage/dog-park chain open. Here's what fits here.",
        confirmWith: [],
        confidence: "medium",
        whyShown: "We checked this because it's the end of the outdoor-use pathway chain — and the honest answer here is a NO with a reroute.",
        evidenceStrength: "medium",
      };
      return {
        answer: "CANT_DETERMINE",
        detail: `Campsite use depends on county/state campground rules and septic/water requirements. ${ORDINANCE_PENDING}`,
        confirmWith: ["the county (campground/health rules)"],
        confidence: "cant-determine",
        whyShown: "We showed this because open acreage can host paid campsites — a pathway most landowners never consider.",
        evidenceStrength: "low",
      };
    },
  },
  {
    id: "cropland-rent", title: "Rent your cropland to a nearby operator", kinds: ["farm"], hoaGated: false,
    effort: "low", risk: "low", timeToStart: "season",
    assess: (c) => ({
      answer: "YES",
      detail: "Leasing cropland to a neighboring operator is a standard, broadly lawful arrangement — a written lease and a county-typical rate are the whole setup. County cash-rent benchmarks are public (USDA NASS).",
      confirmWith: ["your county USDA/extension office (current county cash-rent benchmark)"],
      confidence: "medium",
      whyShown: `We showed this because the property is farmland${c.acreage ? ` (~${c.acreage} acres)` : ""} — rental is the lowest-effort floor under every other farm pathway, and the county benchmark is public record.`,
      evidenceStrength: "medium",
    }),
  },
  {
    id: "crop-revenue", title: "Crop your fields (revenue by crop)", kinds: ["farm"], hoaGated: false,
    effort: "high", risk: "high", timeToStart: "season",
    assess: () => ({
      answer: "CANT_DETERMINE",
      detail: `Realistic revenue by crop on a field like yours needs the comps synthesis (county yields × public commodity prices). ${MARKET_PENDING}`,
      confirmWith: ["your county extension office", "your grain buyer"],
      confidence: "cant-determine",
      whyShown: "We showed this because commodity prices and county yields are public — the synthesis is what we assemble for you once verified.",
      evidenceStrength: "medium",
    }),
  },
  {
    id: "sell-vs-hold", title: "Sell at harvest vs hold to winter", kinds: ["farm"], hoaGated: false,
    effort: "low", risk: "medium", timeToStart: "at harvest",
    assess: () => ({
      answer: "CANT_DETERMINE",
      detail: `The sell-now-vs-hold prediction runs on the public commodity benchmark + storage costs (Layer D). The prediction layer isn't verified yet, so we won't guess. ${MARKET_PENDING}`,
      confirmWith: ["your grain buyer (current local bid vs the public benchmark)"],
      confidence: "cant-determine",
      whyShown: "We showed this because local grainery bids track the public commodity benchmark — once wired, you'll finally see whether the bid is fair.",
      evidenceStrength: "low",
    }),
  },
];

/** Run every applicable check for the context. Pure + deterministic. */
export function assessPathways(c: PropertyContext): PathwayAssessment[] {
  return DEFS.filter((d) => d.kinds.includes(c.propertyKind) || c.propertyKind === "unknown")
    .map((d) => {
      const gate = d.hoaGated ? hoaGate(c) : null;
      const base = gate
        ? { ...gate, reroute: undefined, whyShown: d.assess(c).whyShown, evidenceStrength: "low" as Level }
        : d.assess(c);
      return {
        id: d.id,
        title: d.title,
        answer: base.answer,
        detail: base.detail,
        reroute: "reroute" in base ? base.reroute : undefined,
        confirmWith: base.confirmWith,
        confidence: base.confidence,
        whyShown: base.whyShown,
        profitability: null, // Layer B not wired — never a fabricated band
        profitabilityNote: MARKET_PENDING,
        effort: d.effort,
        risk: d.risk,
        timeToStart: d.timeToStart,
        evidenceStrength: base.evidenceStrength,
        requiredConfirmations: base.confirmWith,
        graphNeighbors: GRAPH[d.id] ?? [],
      };
    });
}

import type { BriefFactLine } from "@/lib/property/propertyBriefIntelligence";

/**
 * Place-level brief — the interest-first ("I want to live in Athens, GA")
 * journey, founder direction 2026-07-20.
 *
 * PURE + ISOMORPHIC: no fs, no fetch, no PII. It takes facts the caller already
 * resolved plus the visitor's own stated interests (held in component state,
 * never sent anywhere) and produces the place-level read:
 *   (A) does this AREA line up with what you said you want,
 *   (B) what's here by lane,
 *   (C) the overall read + what genuinely needs a specific address.
 *
 * ── THE FABRICATION GUARD THAT DEFINES THIS MODULE ────────────────────────────
 * A place is not a parcel. County/area-published facts (HUD fair-market rents,
 * county schools, USDA rural county designation, county ag data, utility
 * territory) are legitimately true for a whole place. TRACT/PARCEL facts
 * (Opportunity Zone, NMTC, FEMA flood zone, historic listing, soil, condition)
 * vary block to block — asserting "Athens, GA is in an Opportunity Zone" from a
 * city-centroid geocode would be FALSE. So parcel-level facts are NEVER stated
 * area-wide here; they are deferred, by name, to "name a specific address."
 *
 * Governance: interests, not qualifications — this never scores the person and
 * never states eligibility (a licensed professional, the lender, or the agency
 * decides that). Facts-not-fabrication: every read cites the fact it came from.
 */

/** Facts that a county/area publication legitimately covers area-wide. */
const AREA_LEVEL_LABELS = new Set(
  [
    "County",
    "Annual property taxes",
    "Electric and utility rates",
    "Electric cost context",
    "Higher education",
    "Clinic or hospital",
    "Grocery access",
    "Daily-life amenities",
    "Daily life nearby",
    "Getting around",
    "Dinner out",
    "Grocery run",
    "Crop conditions",
    "Drought status",
    "Local grain bids",
    "Ground rent context",
    "Ground rent for open acreage",
    "Military installations",
    "Airports & flight paths",
    "Crime statistics",
    "Schools",
    "Fair market rent",
  ].map((l) => l.toLowerCase())
);

/**
 * Facts that are TRACT- or PARCEL-specific. Never asserted for a whole place —
 * each carries the plain reason it needs an address.
 */
const PARCEL_LEVEL_REASONS: Record<string, string> = {
  "flood zone": "FEMA flood zones follow the water, not the town line — they change street to street.",
  "opportunity zone": "Opportunity Zones are drawn by census tract; some tracts in a town are designated and others are not.",
  nmtc: "NMTC qualification is by census tract, so it varies within the same town.",
  hubzone: "HUBZone status can follow a census tract as well as a whole county, so the parcel decides it.",
  "historic status": "Historic listing attaches to a specific building or district, not a whole town.",
  "condition and repair scope": "Condition is a property fact — only an inspection of the actual building answers it.",
  "size, lot, and what conveys": "Acreage and what conveys come from that parcel's deed and the county parcel viewer.",
  broadband: "Broadband is reported per address on the FCC map — neighbours on one street can differ.",
  "broadband, cell service, and delivery":
    "Broadband is reported per address on the FCC map — neighbours on one street can differ.",
  "hoa or covenants": "Covenants attach to a specific parcel's title, not to the town.",
};

export function isAreaLevelFact(label: string): boolean {
  return AREA_LEVEL_LABELS.has(label.trim().toLowerCase());
}

export function parcelLevelReason(label: string): string | null {
  return PARCEL_LEVEL_REASONS[label.trim().toLowerCase()] ?? null;
}

/** A stated interest, in the visitor's own words plus a coarse tag. */
export type PlaceInterest = {
  /** Coarse tag chosen from the interview's option set. */
  tag: PlaceInterestTag;
  /** What the visitor actually said/selected — shown back verbatim. */
  said: string;
};

export type PlaceInterestTag =
  | "live-here"
  | "cost-of-living"
  | "schools-family"
  | "healthcare"
  | "remote-work"
  | "farm-land"
  | "business"
  | "amenities"
  | "risk";

/** Which fact labels speak to each interest (facts only — never a person-fit score). */
const INTEREST_FACTS: Record<PlaceInterestTag, string[]> = {
  "live-here": ["County", "Annual property taxes", "Fair market rent", "Getting around"],
  "cost-of-living": ["Fair market rent", "Annual property taxes", "Electric and utility rates", "Electric cost context"],
  "schools-family": ["Schools", "Higher education", "Clinic or hospital"],
  healthcare: ["Clinic or hospital"],
  "remote-work": ["Getting around", "Airports & flight paths"],
  "farm-land": ["Crop conditions", "Drought status", "Local grain bids", "Ground rent context", "Ground rent for open acreage"],
  business: ["County", "Higher education", "Getting around", "Airports & flight paths"],
  amenities: ["Grocery access", "Daily-life amenities", "Daily life nearby", "Dinner out", "Grocery run", "Getting around"],
  risk: ["Military installations", "Airports & flight paths", "Drought status"],
};

/** Plain-language framing per interest when we DO hold area facts. */
const INTEREST_LEAD: Record<PlaceInterestTag, string> = {
  "live-here": "What the area's own records say about living here",
  "cost-of-living": "What it published costs to be here",
  "schools-family": "What the area publishes about schools and care",
  healthcare: "What care is on the map here",
  "remote-work": "What the area says about getting out and getting online",
  "farm-land": "What the county's agricultural record says",
  business: "What the area offers an operating business",
  amenities: "What daily life looks like here",
  risk: "What sits around this area",
};

export type PlaceFitRead = {
  interest: PlaceInterest;
  /** The honest read — facts only, never "this is right for you". */
  lead: string;
  /** The verified area facts this read stands on (may be empty). */
  basis: BriefFactLine[];
  /** When we hold nothing verified for this interest, where it IS answered. */
  gap: string | null;
};

export type PlaceLaneAvailability = {
  slug: string;
  label: string;
  whatsHere: string;
  href: string;
};

export type PlaceLevelBrief = {
  placeName: string;
  /** (A) verified facts that legitimately describe the whole area. */
  areaFacts: BriefFactLine[];
  /** (A) the visitor's interests read against those area facts. */
  fitReads: PlaceFitRead[];
  /** (B) what Furlong can show here, by lane. */
  byLane: PlaceLaneAvailability[];
  /** (C) the overall read, in Furlong voice — never a recommendation. */
  overall: string;
  /** (C) what genuinely needs a specific address before it can be answered. */
  needsAnAddress: { label: string; why: string }[];
  /** (C) the rest of the open questions. */
  openQuestions: string[];
};

const LANES: Array<{ slug: string; label: string; whatsHere: string; tags: PlaceInterestTag[] }> = [
  { slug: "property-land", label: "Residential", whatsHere: "Homes and small parcels tracked here, plus the published rent and tax context.", tags: ["live-here", "cost-of-living", "schools-family", "amenities"] },
  { slug: "farms-agriculture", label: "Farms, Agriculture & Land", whatsHere: "County crop, drought, cash-rent and grain-bid context for working ground.", tags: ["farm-land"] },
  { slug: "small-business-growth", label: "Commercial Properties", whatsHere: "Commercial ground and the federal program context an operating business can test.", tags: ["business"] },
  { slug: "environmental-compliance", label: "Environmental", whatsHere: "Site-risk screening — the parcel-level checks that come once you have an address.", tags: ["risk"] },
  { slug: "financing-capital", label: "Financing & Capital", whatsHere: "Which federal lanes (SBA, USDA, FSA, FHA/VA) a purchase here could be tested against.", tags: ["live-here", "farm-land", "business", "cost-of-living"] },
  { slug: "programs-incentives", label: "Grants & State and Federal Programs", whatsHere: "Published state and federal programs that reach this area.", tags: ["business", "farm-land", "live-here"] },
];

/**
 * Build the place-level brief. `facts` is whatever the resolver returned for the
 * place; this function decides what may honestly be said area-wide.
 */
export function buildPlaceLevelBrief(args: {
  placeName: string;
  facts: BriefFactLine[];
  interests: PlaceInterest[];
  /** Labels the resolver attempted but that are parcel-level (optional). */
  attemptedLabels?: string[];
}): PlaceLevelBrief {
  const placeName = args.placeName.trim();
  const areaFacts = args.facts.filter((f) => isAreaLevelFact(f.label));

  // Parcel-level items are NEVER asserted area-wide — they become the honest
  // "name an address" list, drawn from what was attempted plus the standing set.
  const deferredLabels = new Set<string>();
  for (const f of args.facts) if (!isAreaLevelFact(f.label) && parcelLevelReason(f.label)) deferredLabels.add(f.label);
  for (const l of args.attemptedLabels ?? []) if (!isAreaLevelFact(l) && parcelLevelReason(l)) deferredLabels.add(l);
  // The standing four people always ask about a place but that only a parcel answers.
  for (const l of ["Flood zone", "Opportunity Zone", "NMTC", "Broadband"]) {
    if (!areaFacts.some((f) => f.label.toLowerCase() === l.toLowerCase())) deferredLabels.add(l);
  }
  const needsAnAddress = [...deferredLabels]
    .map((label) => ({ label, why: parcelLevelReason(label) ?? "This one is answered at the parcel, not the town." }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const factByLabel = new Map(areaFacts.map((f) => [f.label.toLowerCase(), f]));
  const fitReads: PlaceFitRead[] = args.interests.map((interest) => {
    const wanted = INTEREST_FACTS[interest.tag] ?? [];
    const basis = wanted
      .map((label) => factByLabel.get(label.toLowerCase()))
      .filter((f): f is BriefFactLine => Boolean(f));
    return {
      interest,
      lead: INTEREST_LEAD[interest.tag] ?? "What the area's records say",
      basis,
      gap:
        basis.length > 0
          ? null
          : `We do not hold a verified area fact for that in ${placeName} yet — it is answered by the county's own records, and by a specific address once you have one.`,
    };
  });

  const wantedTags = new Set(args.interests.map((i) => i.tag));
  const byLane = LANES.filter((lane) => lane.tags.some((t) => wantedTags.has(t)) || wantedTags.size === 0).map((lane) => ({
    slug: lane.slug,
    label: lane.label,
    whatsHere: lane.whatsHere,
    href: `/explore?lane=${lane.slug}`,
  }));

  const verifiedCount = areaFacts.length;
  const overall =
    verifiedCount > 0
      ? `${placeName} is charted here from ${verifiedCount} area-level fact${verifiedCount === 1 ? "" : "s"} that its own county and federal records publish — each one carries its source and date below. What a place cannot tell you is what a parcel can: the ${needsAnAddress.length} item${needsAnAddress.length === 1 ? "" : "s"} listed under "name an address" change street to street, so they stay open until you pick a specific property.`
      : `We have not resolved verified area facts for ${placeName} yet. Nothing below is guessed — where we hold no fact, we say so and point you at the record that answers it.`;

  const openQuestions = [
    `Whether any of this fits YOU — your money, your timing, your plans — is not ours to say. That is for a licensed professional, your lender, or the agency.`,
    `Furlong tracks a government-listing inventory, not the whole market; a local agent will see more listings in ${placeName} than we can.`,
  ];

  return { placeName, areaFacts, fitReads, byLane, overall, needsAnAddress, openQuestions };
}

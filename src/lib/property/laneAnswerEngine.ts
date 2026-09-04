/**
 * laneAnswerEngine — answers the RESIDENTIAL and COMMERCIAL lanes' burning
 * questions FOR THE SPECIFIC PROPERTY (founder direction 2026-07-20: the farm
 * lane got its per-property answer report; residential and commercial need the
 * same). Sibling to farmAnswerEngine — same discipline:
 *
 *   - Answer each question from the facts we actually hold for THIS property
 *     (flood, schools, county rent, amenities, property type, metro proximity).
 *   - Where the parcel-level fact is something we cannot see (this home's tax
 *     rate, this building's zoning, the lease), say so and point to where to
 *     confirm it — never guess, never appraise, never quote.
 *   - Facts and plain-English context only. "What should I pay / will I qualify"
 *     routes to authorized licensed professionals, never decided
 *     here.
 *
 * Deterministic + pure: same facts in → same answers out, no I/O.
 */

export interface LaneAnswer {
  id: string;
  /** The burning question, verbatim — this report shows the question + answer. */
  question: string;
  /** Answered FOR this property from the facts we hold. */
  answer: string;
  /** Honest "we can't see X for this parcel — confirm at Y" note, when relevant. */
  confirm: string | null;
}

function placeLabel(county: string | null, state: string | null): string {
  const where = [county && county !== "Unknown" ? `${county} County` : null, state]
    .filter(Boolean)
    .join(", ");
  return where ? ` in ${where}` : "";
}

// ── Residential ─────────────────────────────────────────────────────────────

export interface ResidentialFacts {
  county: string | null;
  state: string | null;
  town: string | null;
  /** FEMA flood zone for the parcel, when resolved (e.g. "AE", "X"). */
  floodZone: string | null;
  /** True when the flood zone is a Special Flood Hazard Area (A/V prefixed). */
  inFloodHazard: boolean | null;
  /** Count of public schools in the county / in the town, when resolved. */
  schoolsCount: number | null;
  schoolsInTown: number | null;
  /** HUD Fair Market Rent, 2BR / 3BR $/mo, when resolved. */
  rent2BR: number | null;
  rent3BR: number | null;
  /** Straight-line miles to the nearest mapped grocery, when resolved. */
  nearestGroceryMiles: number | null;
  diningNearby: boolean | null;
  parksNearby: boolean | null;
  /** A college/university sits in the county (shapes rentals + resale demand). */
  collegeNearby: boolean | null;
}

const FEMA_MSC = "the FEMA Flood Map Service Center (msc.fema.gov)";

/** Answer the residential lane's burning questions for this property. */
export function answerResidentialQuestions(f: ResidentialFacts): LaneAnswer[] {
  const where = placeLabel(f.county, f.state);
  const out: LaneAnswer[] = [];

  // 1. Cost to own
  const rentLine =
    f.rent3BR != null
      ? `The county rent benchmark is about $${f.rent3BR.toLocaleString("en-US")}/mo for a 3BR (HUD Fair Market Rent) — a yardstick for what shelter costs here, not this home's payment.`
      : "";
  out.push({
    id: "cost-to-own",
    question: "What will this actually cost me each month?",
    answer:
      `We can't compute THIS home's payment without its list price and today's rate — but the pieces that decide it are local. ${rentLine} ` +
      `Property tax rate and homeowner's insurance are set at the parcel and county level (insurance runs higher inside a flood zone). Bring the list price and a rate quote and the ownership-cost tools turn these into a full monthly number.`,
    confirm:
      "Your tax bill and insurance premium are parcel-specific — pull the county assessor's record for the tax rate and get an insurance quote for this exact address before you budget.",
  });

  // 2. Flood risk
  out.push({
    id: "flood-risk",
    question: "Is it going to flood — and what will insurance cost?",
    answer:
      f.floodZone != null
        ? f.inFloodHazard
          ? `This location maps to FEMA flood zone ${f.floodZone} — inside a Special Flood Hazard Area, so a federally-backed mortgage will require flood insurance, and premiums add real monthly cost. That's not a dealbreaker, but price the flood policy before you commit.`
          : `This location maps to FEMA flood zone ${f.floodZone} — outside the mapped high-risk Special Flood Hazard Area, so flood insurance generally isn't mandated. Low-risk is not no-risk; verify the current map, since zones are re-drawn.`
        : `We don't yet have a FEMA flood read for this exact parcel. Pull it free — it's the single biggest hidden cost on a home, and it decides whether flood insurance is mandatory.`,
    confirm:
      f.floodZone != null
        ? `Flood maps are re-issued — confirm the current effective zone at ${FEMA_MSC} and get a flood-insurance quote for the address.`
        : `Look up the parcel at ${FEMA_MSC} for its current flood zone.`,
  });

  // 3. Schools
  out.push({
    id: "schools",
    question: "How are the schools?",
    answer:
      f.schoolsCount != null && f.schoolsCount > 0
        ? `${f.schoolsCount.toLocaleString("en-US")} public school${f.schoolsCount === 1 ? "" : "s"} operate in this county${
            f.schoolsInTown != null && f.schoolsInTown > 0
              ? `, ${f.schoolsInTown} of them in ${f.town ?? "town"}`
              : ""
          } (NCES). Count and location are facts; quality is a fit judgment — assignment is usually by attendance zone, not just distance.`
        : `We don't have a mapped public-school count for this county yet. School quality and, crucially, the attendance-zone assignment for THIS address are what matter.`,
    confirm:
      "Confirm the exact attendance-zone assignment for this address with the local school district — proximity does not guarantee enrollment — and check current ratings (GreatSchools, state report cards).",
  });

  // 4. Rent it out
  out.push({
    id: "rent-it-out",
    question: "Could I rent it out?",
    answer:
      f.rent2BR != null || f.rent3BR != null
        ? `The county's HUD Fair Market Rents run ${[
            f.rent2BR != null ? `~$${f.rent2BR.toLocaleString("en-US")}/mo (2BR)` : null,
            f.rent3BR != null ? `~$${f.rent3BR.toLocaleString("en-US")}/mo (3BR)` : null,
          ]
            .filter(Boolean)
            .join(", ")} — a published market yardstick to sanity-check a rental plan against a mortgage payment. Local ordinances (short-term-rental rules, licensing, any HOA) decide what's actually allowed.`
        : `Renting comes down to the local market rent versus the carrying cost, and what the jurisdiction allows. We don't have a county rent benchmark resolved here yet.`,
    confirm:
      "Confirm short-term / long-term rental rules and any licensing with the municipality, and any HOA or deed restrictions, before counting on rental income.",
  });

  // 5. Daily life / amenities
  const dailyBits = [
    f.nearestGroceryMiles != null ? `nearest grocery ~${f.nearestGroceryMiles} mi` : null,
    f.diningNearby ? "dining nearby" : null,
    f.parksNearby ? "parks/green space nearby" : null,
    f.collegeNearby ? "a college in the county" : null,
  ].filter(Boolean);
  out.push({
    id: "daily-life",
    question: "What's daily life like around here?",
    answer:
      dailyBits.length > 0
        ? `Around this address${where}: ${dailyBits.join(", ")} (OpenStreetMap). That maps the errands-and-weekends footprint — how far the ordinary stuff is.`
        : `We don't have the nearby-amenities map resolved for this exact address yet — grocery, dining, and parks distances are what shape the daily footprint.`,
    confirm: null,
  });

  // 6. Resale / value
  out.push({
    id: "resale-value",
    question: "Will it hold its value?",
    answer:
      `We don't forecast an individual home's price — anyone who promises that is guessing. What actually drives resale here is knowable: school assignment, flood posture, walkable amenities, and job access to the nearest metro all show up in the numbers above. A home that's strong on those tends to hold value better than the block average.`,
    confirm:
      "The real value signal is recent comparable sales — ask an agent for the last 90 days of comparable closings near this address, and weigh them against the fundamentals above.",
  });

  return out;
}

// ── Commercial ──────────────────────────────────────────────────────────────

export interface CommercialFacts {
  county: string | null;
  state: string | null;
  town: string | null;
  /** The property-type string from the record (e.g. "retail", "warehouse"). */
  propertyType: string | null;
  floodZone: string | null;
  inFloodHazard: boolean | null;
  /** Straight-line miles to the nearest major/metro airport — a market-proximity proxy. */
  nearestMetroMiles: number | null;
}

/** Answer the commercial lane's burning questions for this property. */
export function answerCommercialQuestions(f: CommercialFacts): LaneAnswer[] {
  const where = placeLabel(f.county, f.state);
  const typeText = f.propertyType && f.propertyType.trim() ? f.propertyType.trim() : null;
  const out: LaneAnswer[] = [];

  // 1. Use / zoning
  out.push({
    id: "use-zoning",
    question: "What can I actually do with it?",
    answer:
      `The single most important fact — the zoning and any use restrictions — is not something we can read from the listing${where}. ${
        typeText
          ? `The record calls this ${typeText}, which points to its current use, `
          : ""
      }but what you're allowed to do (and change it to) is set by the local zoning code and any deed or covenant restrictions. Confirm that first; it decides the whole deal.`,
    confirm:
      "Pull the parcel's zoning designation and permitted uses from the county/city planning department, and check the deed for restrictions — before you write an offer, not after.",
  });

  // 2. Income potential
  out.push({
    id: "income-potential",
    question: "What could it earn?",
    answer:
      `Commercial value is the income it throws off — net operating income divided by the market cap rate. That turns entirely on the actual leases (rent, term, who pays expenses) and the tenant's credit. We can't see those from the outside, so any income number now would be fiction. Get the rent roll and the trailing operating statements; those are the real inputs.`,
    confirm:
      "Ask the seller for the rent roll, estoppel certificates, and 2–3 years of operating statements (T-12), and confirm the local market cap rate with a commercial broker.",
  });

  // 3. Financing fit
  out.push({
    id: "financing-fit",
    question: "How would I finance it?",
    answer:
      `If you'll occupy at least 51%, this typically points to SBA — 504 for buying/building (low ~10% down, long fixed term) or 7(a) for a more flexible mix; a rural location can open USDA B&I. If it's a pure investment (leased to others), it's conventional commercial financing. The program comparison on this lane lays out how each is built — but the fit and the terms are the licensed lender's call.`,
    confirm:
      "Bring the deal to an authorized licensed lender or broker through the Furlong Capital Desk — occupancy %, your financials, and the property type decide which program fits and what the terms would actually be.",
  });

  // 4. Deal-killers
  out.push({
    id: "deal-killers",
    question: "What kills these deals?",
    answer:
      `The recurring ones: environmental contamination (a Phase I assessment is standard, Phase II if it flags), a zoning or certificate-of-occupancy mismatch with your intended use, inadequate parking or ADA-accessibility gaps, and lease surprises hiding in the estoppels. ${
        f.floodZone != null && f.inFloodHazard
          ? `This site also maps to FEMA flood zone ${f.floodZone} (a Special Flood Hazard Area) — factor flood insurance and any build restrictions in.`
          : ""
      }`.trim(),
    confirm:
      "Budget for a Phase I environmental, a zoning/CO verification, and a lease/estoppel review during due diligence — these are the checks that most often blow up a commercial closing.",
  });

  // 5. Location / access
  const metro = f.nearestMetroMiles;
  out.push({
    id: "location-access",
    question: "Is the location right for the business?",
    answer:
      metro != null
        ? metro <= 40
          ? `The nearest major metro airport is ~${metro} mi out — close enough that this reads as a market-connected location, good for anything that needs visibility, labor, or logistics reach.`
          : metro <= 90
            ? `The nearest major metro airport is ~${metro} mi — a secondary-market position: fine for regional-serving uses, a longer reach for anything needing metro-scale foot traffic.`
            : `The nearest major metro airport is ~${metro} mi out — this is a rural/remote position, best for uses that serve the local trade area rather than metro traffic.`
        : `Location fit is about the trade area — daily traffic counts, visibility, access, and the labor pool. Those are use-specific; match them to what the business actually needs.`,
    confirm:
      "For retail or anything traffic-dependent, pull the DOT traffic counts for the frontage road and the trade area's retail-spending data before you commit.",
  });

  return out;
}

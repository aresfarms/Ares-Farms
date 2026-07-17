/**
 * farmEditorialCurated — the EDITORIAL layer of The Furlong Compass's farm
 * content (founder direction 2026-07-17: a farmer-first newsletter also needs
 * new technologies & techniques, safety programs, tax & end-of-year planning,
 * regulatory changes, and long-term planning — and it must remember not every
 * farmer here only does crops).
 *
 * These are FIRST-PARTY, team-written/approved briefs — the "articles" beside
 * the data signals — the same discipline as townCharacterCurated: verifiable
 * facts and official pointers, dated, never a prediction, a product pitch, or
 * a characterization. The team maintains this list; it is where seasonality
 * (tax deadlines, input-buying windows, program sign-ups) lives.
 *
 * `seasonMonths` (1–12) optionally scopes an item to the months it's timely;
 * `regions` optionally scopes it to specific newsletter regions. Empty = all.
 *
 * Scanned by verify:brief-copy. Refreshed by the team, not an ingest.
 */

export type FarmEditorialCategory =
  | "production"
  | "technology"
  | "safety"
  | "tax-planning"
  | "regulatory"
  | "long-term";

export interface FarmEditorialItem {
  category: FarmEditorialCategory;
  title: string;
  body: string;
  /** Official pointer — where the reader confirms/acts. */
  pointer: string;
  url?: string;
  /** Months (1–12) this is timely; empty = year-round. */
  seasonMonths?: number[];
  /** Newsletter region keys; empty = all regions. */
  regions?: string[];
}

const CATEGORY_LABEL: Record<FarmEditorialCategory, string> = {
  production: "Beyond the row crop",
  technology: "Tools & techniques",
  safety: "Stay safe out there",
  "tax-planning": "Tax & year-end planning",
  regulatory: "Programs & rule changes",
  "long-term": "The long view",
};

export function farmEditorialCategoryLabel(c: FarmEditorialCategory): string {
  return CATEGORY_LABEL[c];
}

const FARM_EDITORIAL: FarmEditorialItem[] = [
  // ── Production / diversification — not every farmer only does crops ──
  {
    category: "production",
    title: "On the Delmarva, the crop that pays is often the chicken house",
    body:
      "Broilers are the backbone of Delmarva agriculture — Maryland alone runs a roughly $1.5-billion, 320-million-bird broiler sector (USDA NASS), and Delaware and Virginia's Eastern Shore add to it. A drought that hurts corn also raises feed and cuts local grain a grower can buy, so integrators, contract terms, and litter/nutrient-management rules move the P&L as much as rainfall. If poultry, dairy, or livestock is your operation, watch feed cost and contract renewals as closely as commodity boards.",
    pointer: "Your integrator's grower relations office; USDA NASS state poultry data",
    regions: ["delmarva"],
  },
  {
    category: "production",
    title: "Diversified operations weather a bad crop year better",
    body:
      "A failed row-crop year lands differently on an operation with livestock, poultry, direct-market produce, or an agritourism line. USDA's value-added producer grants and local-food programs exist to support that diversification, and a drought year is when the case for a second income line gets concrete.",
    pointer: "USDA Rural Development value-added producer grants (rd.usda.gov)",
    url: "https://www.rd.usda.gov/programs-services/business-programs/value-added-producer-grants",
  },
  // ── Technology & techniques ──
  {
    category: "technology",
    title: "In a dry year, soil moisture is the technology that pays first",
    body:
      "Cover crops and reduced tillage hold moisture and soil through a drought, and USDA's EQIP and CSP programs cost-share both — practical in a year that punishes bare, tilled ground. On the equipment side, variable-rate application and soil-moisture sensing cut input waste exactly when fertilizer is up double digits. NRCS field staff will walk a plan and the cost-share at no charge.",
    pointer: "USDA NRCS EQIP / CSP — your county service center",
    url: "https://www.nrcs.usda.gov/getting-assistance",
  },
  // ── Safety ──
  {
    category: "safety",
    title: "Grain-bin and drought-brittle-crop safety before harvest",
    body:
      "Grain entrapment kills every year, and a stressed, uneven crop bins poorly — more crusting, more out-of-condition grain, more reason someone climbs in. Never enter a bin with the auger running or without a harness, lockout, and a spotter. Free grain-engulfment and rescue trainings run through the harvest season; many are offered by extension and grower associations at no cost.",
    pointer: "State extension farm-safety programs; local fire/rescue grain-safety trainings",
    seasonMonths: [8, 9, 10, 11],
  },
  // ── Tax & year-end planning ──
  {
    category: "tax-planning",
    title: "Year-end tax moves land hardest in a volatile-income year",
    body:
      "A bad crop can swing farm income sharply, which is exactly when the tools matter: Section 179 expensing and bonus depreciation on equipment, prepaying next year's seed and fertilizer to shift deductions, income averaging for farmers (Schedule J), and deferred crop-insurance or disaster payments. The rules and dollar limits change year to year — line these up with your tax preparer before December 31, not in April.",
    pointer: "IRS Farmer's Tax Guide (Pub. 225); your ag-experienced CPA",
    url: "https://www.irs.gov/forms-pubs/about-publication-225",
    seasonMonths: [10, 11, 12, 1],
  },
  // ── Regulatory / programs ──
  {
    category: "regulatory",
    title: "Know the USDA loan clock before you need the money",
    body:
      "Farm capital runs on FSA and USDA Rural Development programs, and timing is everything: FSA guaranteed loans typically move faster than direct loans, microloans and beginning-farmer/underserved terms have their own paths, and disaster designations (which a drought can trigger) open emergency loans and can extend deadlines. Approval and processing times vary by office and workload — start the paperwork with your county FSA office before the operating line is empty, not after.",
    pointer: "County USDA Farm Service Agency office (fsa.usda.gov/loans)",
    url: "https://www.fsa.usda.gov/resources/programs/farm-loan-programs",
  },
  {
    category: "regulatory",
    title: "A drought can open disaster programs — but only if you document",
    body:
      "Secretarial and USDA drought designations open FSA emergency loans, the Livestock Forage Disaster Program, and crop-insurance and NAP claim paths. Every one of them turns on records: production history, planting and loss dates, and photos. Document conditions now — the paperwork you skip in July is the claim you lose in the fall.",
    pointer: "County FSA office; your crop-insurance agent",
    seasonMonths: [6, 7, 8, 9],
  },
  // ── Poultry economics + diversification alternatives ──
  {
    category: "production",
    title: "Poultry economics: is the chicken house still worth it?",
    body:
      "Broiler integration is a contract business, and the math has tightened: house upgrades (tunnel " +
      "ventilation, controllers, litter systems) that integrators increasingly require run six figures, " +
      "financed against a contract that can change, while feed and energy — up double digits in a dry, hot " +
      "year — squeeze the grower's already thin per-bird margin. It still pencils for many operations with " +
      "modern houses and a solid integrator relationship, but a new entrant should run the full cost of the " +
      "houses against the contract terms, not the gross check. Extension farm-management specialists publish " +
      "enterprise budgets that model it honestly.",
    pointer: "State extension poultry enterprise budgets; your integrator's contract terms",
    regions: ["delmarva"],
  },
  {
    category: "production",
    title: "Alternatives with a similar revenue profile — worth the switch?",
    body:
      "When commodity corn and beans don't clear costs, the alternatives that come up — specialty and " +
      "food-grade grains, vegetables for the Mid-Atlantic fresh market, small-grain/cover-crop seed " +
      "production, hemp, aquaculture, and value-added or direct-market lines — each trade lower acreage for " +
      "higher management, different capital, and a market you have to build. The honest cost-benefit is rarely " +
      "'higher price per unit'; it's whether you have the labor, the buyer, and the working capital to carry a " +
      "new enterprise through its learning curve. USDA SARE and extension publish enterprise budgets and " +
      "case studies for exactly this comparison — run one before you switch an acre.",
    pointer: "USDA SARE (sare.org); state extension enterprise budgets",
    url: "https://www.sare.org/resources/",
  },
  // ── Grants & programs, with open/close dates ──
  {
    category: "regulatory",
    title: "Open now: the conservation and disaster programs worth a call",
    body:
      "Several USDA programs are taking applications: EQIP and CSP (conservation cost-share) run continuous " +
      "sign-up with periodic ranking cutoffs your NRCS office posts; NAP coverage for non-insured crops has " +
      "crop-specific sales-closing dates; and a drought designation opens FSA emergency loans and the " +
      "Livestock Forage Disaster Program with their own filing windows. Deadlines are set locally and move " +
      "year to year, so confirm the exact date with your county office before you count on it. Furlong can " +
      "help you gather records and prepare the paperwork for any federal or state farm program you may " +
      "qualify for — the way a good farm advisor or your county FSA officer would walk you through it. " +
      "Eligibility and every award decision rest with the agency; Furlong is not a lender or a government " +
      "office and does not decide, approve, or guarantee any application.",
    pointer: "County USDA Service Center (NRCS + FSA); your crop-insurance agent",
    url: "https://www.farmers.gov/loans-and-grants",
  },
  // ── Environmental — new/novel components ──
  {
    category: "technology",
    title: "New on the environmental side: nutrient markets, carbon, and water",
    body:
      "A few environmental programs are becoming real income and compliance lines for Mid-Atlantic farms: " +
      "Chesapeake Bay nutrient-credit and cover-crop cost-share programs pay for practices that also protect " +
      "yield in a dry year; emerging carbon and ecosystem-services markets pay for measured soil-carbon and " +
      "practice changes (read the contract term and measurement rules carefully — they vary widely); and " +
      "water-quality and irrigation-efficiency programs through NRCS and state agencies help fund the " +
      "moisture-holding practices drought makes urgent. These are opportunities and obligations both — the " +
      "state department of agriculture and your NRCS office have the current, verified terms.",
    pointer: "State dept. of agriculture; USDA NRCS; state conservation district",
  },
  // ── Energy / land-use trends affecting farmers ──
  {
    category: "long-term",
    title: "Data centers, solar, and battery farms: the new bidder for your ground",
    body:
      "Across the Mid-Atlantic, data centers, utility-scale solar, and battery storage are competing for " +
      "farmland — and it cuts both ways. Upside: a solar or storage lease can pay far more per acre than crop " +
      "rent, with a long fixed term that steadies income through drought years, and it's reversible on many " +
      "sites. Downside: it takes ground out of production, can strain local grid capacity and water for " +
      "cooling, may reshape a neighbor's viewshed and drainage, and long leases bind the land for decades — " +
      "with decommissioning and soil-restoration terms that matter enormously and are easy to underwrite " +
      "poorly. Read any option or lease with an ag attorney before you sign, and check the county's solar and " +
      "data-center zoning — several jurisdictions are rewriting it now.",
    pointer: "Ag attorney; county planning/zoning; extension solar-lease guides",
  },
  // ── Long-term ──
  {
    category: "long-term",
    title: "Bad years are when succession and land decisions actually get made",
    body:
      "A hard season pushes the questions most operations defer: whether to expand, sell ground, bring in the next generation, or restructure debt. Farmland here holds real value (see the regional farmland numbers above), which makes both estate planning and a deliberate hold-versus-sell decision worth a professional conversation before the pressure forces a rushed one.",
    pointer: "Your ag attorney and lender; extension farm-succession programs",
  },
];

/** Curated editorial items timely for a given month + region (deterministic). */
export function farmEditorialItems(month: number, regionKey: string): FarmEditorialItem[] {
  return FARM_EDITORIAL.filter((item) => {
    const inSeason = !item.seasonMonths || item.seasonMonths.length === 0 || item.seasonMonths.includes(month);
    const inRegion = !item.regions || item.regions.length === 0 || item.regions.includes(regionKey);
    return inSeason && inRegion;
  });
}

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

/**
 * newsletterEditions — per-audience newsletter composer (founder direction
 * 2026-07-17: one edition per property group plus a finance edition, each
 * leading with the LOCAL TRUTH and saying what it means for that reader —
 * the opposite of the generic industry newsletter that buries the story).
 *
 * Editorial spine, every edition:
 *   1. The Regional Read — the one thing this reader most needs to hear,
 *      grounded in a real number (for a drought region: the failing crop).
 *   2. By the Numbers — the sourced signals that matter to this audience.
 *   3. What It Means For You — the decision framing, audience-specific.
 *
 * Content only — the media-home surface renders it. Every line is sourced and
 * dated; nothing is a prediction or a characterization of a place.
 */

import {
  cashRentSignal,
  commercialFinanceSignal,
  commodityPriceSignal,
  cropConditionSignal,
  grainBidSignal,
  droughtSignal,
  electricitySignal,
  farmFinanceSignal,
  farmlandValueSignal,
  hospitalityFinanceSignal,
  inputCostSignal,
  landFinanceSignal,
  mhpFinanceSignal,
  mortgageRateSignal,
  NEWSLETTER_REGIONS,
  priceTrendSignal,
  type NewsletterSignal,
} from "./newsletterSignals";
import { farmEditorialItems, type FarmEditorialItem } from "./farmEditorialCurated";

export type NewsletterAudience =
  | "mixed"
  | "farm"
  | "residential"
  | "commercial"
  | "hospitality"
  | "mobile-home-park"
  | "land"
  | "finance";

export interface NewsletterSection {
  heading: string;
  items: NewsletterSignal[];
}

export interface NewsletterEdition {
  audience: NewsletterAudience;
  audienceLabel: string;
  regionKey: string;
  regionLabel: string;
  /** The Regional Read — the lead story, one paragraph. */
  lead: NewsletterSignal | null;
  sections: NewsletterSection[];
  /** What It Means For You — audience-specific decision framing. */
  meaning: string[];
  /** Editorial briefs (farm edition): tech, safety, tax, regulatory, long-view. */
  editorial?: FarmEditorialItem[];
  asOf: string;
  disclaimers: string[];
}

const AUDIENCE_LABEL: Record<NewsletterAudience, string> = {
  mixed: "The Full Read",
  farm: "Farms & Ranches",
  residential: "Home Buyers",
  commercial: "Commercial Property",
  hospitality: "Lodging & Hospitality",
  "mobile-home-park": "Mobile Home Park Owners",
  land: "Land Buyers",
  finance: "Lenders & Capital Partners",
};

const compact = (items: Array<NewsletterSignal | null>): NewsletterSignal[] =>
  items.filter((s): s is NewsletterSignal => s !== null);

/**
 * Compose one edition. `asOf` is passed in (deterministic; no clock in the
 * pure composer) so the same inputs always render the same edition.
 */
export function buildNewsletterEdition(
  audience: NewsletterAudience,
  regionKey: string,
  asOf: string
): NewsletterEdition | null {
  const region = NEWSLETTER_REGIONS[regionKey];
  if (!region) return null;
  const states = region.states;

  const drought = droughtSignal(states);
  const crop = cropConditionSignal(states);
  const rates = mortgageRateSignal();
  const price = priceTrendSignal(states);
  const rent = cashRentSignal(states);
  const power = electricitySignal(states);
  const grain = commodityPriceSignal();
  const bids = grainBidSignal(states);
  const farmland = farmlandValueSignal(states);
  const farmFin = farmFinanceSignal();
  const inputs = inputCostSignal();
  const commercialFin = commercialFinanceSignal();
  const hospitalityFin = hospitalityFinanceSignal();
  const mhpFin = mhpFinanceSignal();
  const landFin = landFinanceSignal();
  const month = Number((asOf.match(/-(\d{2})-/) || [])[1] || "1");
  const editorial = farmEditorialItems(month, regionKey);

  const base = {
    audience,
    audienceLabel: AUDIENCE_LABEL[audience],
    regionKey,
    regionLabel: region.label,
    asOf,
    disclaimers: [
      "Every figure above is a sourced, dated fact from a public dataset — U.S. Drought Monitor, USDA NASS, Freddie Mac, FHFA, EIA. Furlong reports the numbers; it does not predict prices, yields, or markets.",
      "Advisory context only — not investment, tax, legal, or agronomic advice. Furlong is not a lender.",
    ],
  };

  switch (audience) {
    case "mixed":
      // The flagship / free-tier digest: DELIBERATELY BROAD, not a rehash of
      // any tailored edition — ONE headline per domain, no depth. The tailored
      // editions carry the detail; this is the whole-picture skim.
      return {
        ...base,
        lead: crop ?? drought ?? rates,
        sections: [
          {
            heading: "One read across the region",
            items: compact([
              // The single most important signal from each domain — no more.
              drought ?? crop, // land/weather
              bids ?? grain, // ag markets
              rates, // housing money
              farmland ?? price, // value
            ]),
          },
        ],
        meaning: [
          "That's the month in one pass — weather and crop, grain markets, the cost of money, and land value. Which line matters most depends on which hat you wear, and each tailored edition of The Furlong Compass goes deep on one: Farms & Ranches, Home Buyers, Commercial, Lodging, Mobile Home Parks, Land, and Lenders.",
          "Furlong charts any property in the region with its verified place-facts, full cost picture, and financing path — free. Subscribe to the edition that fits your work, or read this Full Read for the whole board.",
        ],
      };
    case "farm":
      return {
        ...base,
        lead: crop ?? drought,
        sections: [
          { heading: "The water and the crop", items: compact([drought, crop]) },
          { heading: "Prices & inputs", items: compact([bids, grain, inputs]) },
          { heading: "Ground value & your capital", items: compact([rent, farmland, farmFin]) },
        ],
        meaning: [
          "A failing crop year reshapes decisions before it reshapes the balance sheet: cash-rent terms get renegotiated, input budgets get rebuilt against next year's fuel and fertilizer, and some operators sell ground to raise capital while others buy the parcels that come to market. And if your operation is poultry, livestock, or diversified, feed cost and contract terms move your P&L as much as the rain — read the desk notes below with that in mind.",
          "Practical moves this month: confirm crop-insurance and disaster-program claim deadlines with your agent and county FSA office, document conditions now (the July photo is the fall claim), and price next year's inputs against the trend above. Furlong charts each parcel — cropland, pasture, or poultry ground — with its water, soil, and USDA/FSA financing picture.",
        ],
        editorial,
      };
    case "finance":
      return {
        ...base,
        // Lenders lead with the CREDIT signal, not the weather — drought
        // matters here only as portfolio risk, and it's framed that way.
        lead: farmFin,
        sections: [
          { heading: "Ag portfolio risk this cycle", items: compact([crop, bids, inputs, rent]) },
          { heading: "Farm capital & collateral", items: compact([farmFin, farmland]) },
        ],
        meaning: [
          "The credit read this cycle: a weak crop and rising input costs thin operator cash flow and pressure ag operating lines, while farmland values (above) hold the collateral side up. Portfolios concentrated in the region's row-crop borrowers warrant a closer look at renewal terms, working-capital covenants, and reserve posture; diversified and poultry operations carry a different — often steadier — risk profile.",
          "Much of the region's farm capital moves through FSA and USDA guarantees rather than balance-sheet mortgages, which changes both the risk transfer and the timeline. Furlong can carry a property's verified place-facts, cost model, and financing picture straight into a lender file when a borrower moves — nothing re-keyed.",
        ],
      };
    case "residential":
      return {
        ...base,
        lead: rates,
        sections: [
          { heading: "The cost of buying now", items: compact([rates, price]) },
          { heading: "Living-cost and land context", items: compact([power, drought]) },
        ],
        meaning: [
          "The rate and the price trend together set what a home costs to buy and to carry this month. In a drought region, add one buyer's-eye check: homes on private wells feel a dry year first, so confirm well condition and depth before you commit.",
          "Furlong's free property chart runs the full cost picture for any listing — down payment by program, the income it takes to carry it, taxes, insurance, and the years-1-30 horizon — so the number that matters is on the table before you make an offer.",
        ],
      };
    case "commercial":
      return {
        ...base,
        lead: commercialFin,
        sections: [{ heading: "Capital and value context", items: compact([commercialFin, price]) }],
        meaning: [
          "Commercial debt is not a consumer mortgage — SBA 504/7(a) for owner-users, or conventional commercial debt underwritten on debt-service coverage, not a personal income ratio. In an ag-stressed region, watch demand tied to farm income: implement dealers, grain handling, and main-street retail in row-crop towns feel a bad crop year on a lag.",
          "Furlong charts each commercial listing with its zoning, environmental, and financing questions surfaced up front — the diligence that decides the deal, before the tour.",
        ],
      };
    case "hospitality":
      return {
        ...base,
        lead: hospitalityFin,
        sections: [{ heading: "Capital and demand context", items: compact([hospitalityFin, price]) }],
        meaning: [
          "Lodging is a specialized commercial asset — financed through SBA 504/7(a) and hospitality-experienced lenders on occupancy, ADR, and RevPAR, not a home mortgage. Demand tracks the region's draw, so a drought that dims farm income or recreation water can soften a shoulder season; confirm occupancy and rate history against the local tourism bureau before you underwrite.",
          "Furlong flags the lodging-specific questions — STR ordinance, life-safety, license transfer — that most often reprice a hospitality deal after the handshake.",
        ],
      };
    case "mobile-home-park":
      return {
        ...base,
        lead: mhpFin,
        sections: [{ heading: "Capital and operating context", items: compact([mhpFin, power]) }],
        meaning: [
          "Park capital runs through agency (Fannie/Freddie MHC), commercial banks, and SBA — underwritten on the lot-rent roll, occupancy, and utility structure, not a consumer mortgage. A stressed local farm economy can pressure tenant incomes, so read the rent roll alongside the region's conditions.",
          "Furlong surfaces the park-specific diligence — park-owned versus tenant-owned homes, master metering, and local rent-stabilization or closure ordinances — that decides the deal.",
        ],
      };
    case "land":
      return {
        ...base,
        lead: landFin,
        sections: [
          { heading: "Capital, ground value & water", items: compact([landFin, farmland, rent, drought]) },
        ],
        meaning: [
          "Land is financed on its own terms — land loans (higher down, shorter term), seller financing, or Farm Credit/USDA for rural and ag ground; a home mortgage generally does not apply. Value rides on water and rent, and a drought year pressures cash rents and brings ground to market — opportunity for a patient buyer, a reason for owners to reassess.",
          "Furlong charts each parcel with its water, soil (USDA Web Soil Survey), access, and mineral-rights questions up front — the diligence that decides whether the price is real.",
        ],
      };
    default:
      return null;
  }
}

/** All audiences, for generating the full set for a region. */
export const NEWSLETTER_AUDIENCES: NewsletterAudience[] = [
  "mixed",
  "farm",
  "residential",
  "commercial",
  "hospitality",
  "mobile-home-park",
  "land",
  "finance",
];

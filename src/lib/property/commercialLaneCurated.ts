/**
 * commercialLaneCurated — the Commercial Properties module's own content
 * (founder direction 2026-07-18: list the commercial options — hotels, mobile
 * home parks, laundromats, small business, etc. — and answer the questions
 * commercial owners really want to know AND the ones they never thought to ask).
 *
 * Discipline (Vol VI REVENUE-INTEL-001 posture, same as the farm lane): every
 * figure is a RANGE, sourced to broker/industry/SBA norms and labeled
 * illustrative — never a guarantee, never "your result." First-party curated;
 * maintained by the team. Scanned by verify:brief-copy.
 */

export interface CommercialType {
  name: string;
  /** How it's valued + the honest economics in one line. */
  economics: string;
  /** The one risk people underestimate. */
  watch: string;
}

/** The kinds of commercial property, with how each is actually valued. */
export const COMMERCIAL_TYPES: CommercialType[] = [
  {
    name: "Hotels & motels",
    economics: "Valued on RevPAR and going-concern, not just the building; cap rates commonly 8–11%. Flag/franchise vs independent changes everything.",
    watch: "Management-intensive and cyclical — you're buying an operating business, not passive real estate.",
  },
  {
    name: "Mobile home / manufactured-housing parks",
    economics: "Valued on lot-rent NOI; cap rates often 5–8% (demand has compressed them). Tenant-owned homes mean low capex for you.",
    watch: "Aging water/sewer/electric infrastructure is the hidden liability — get it inspected before you believe the NOI.",
  },
  {
    name: "Laundromats",
    economics: "Business + real estate: strong recurring cash flow, commonly valued at ~2.5–4× seller's discretionary earnings plus the RE. Card/app systems are the modern norm.",
    watch: "Equipment wears out and water/sewer is your biggest bill — verify utility costs and machine age.",
  },
  {
    name: "Self-storage",
    economics: "Low operating cost, often automated; cap rates commonly 5.5–7.5%. Scales well and defends in downturns.",
    watch: "Overbuilding in some markets — check how many facilities are within a few miles and what's in the permit pipeline.",
  },
  {
    name: "Retail & strip centers",
    economics: "Valued on lease income; cap rates commonly 6–8%. Tenant credit and remaining lease term drive the price more than the building.",
    watch: "One anchor leaving can sink the center — read every lease's term, options, and co-tenancy clauses.",
  },
  {
    name: "Car washes",
    economics: "Express-tunnel models throw off strong cash flow; typically financed SBA and valued on cash flow + real estate + equipment.",
    watch: "Heavy upfront equipment and site cost; membership churn and a new competitor down the road move the numbers fast.",
  },
  {
    name: "Warehouse, industrial & flex",
    economics: "The strong sector: long leases, low management, cap rates commonly 5–7%. Location and logistics access are the value.",
    watch: "Clear height, dock doors, and power spec date fast — a functionally obsolete building leases at a discount.",
  },
  {
    name: "Restaurants, offices & mixed-use",
    economics: "Restaurants trade on business value + RE (high turnover risk); office cap rates have risen with vacancy; mixed-use blends residential + commercial underwriting.",
    watch: "Office and restaurant carry the most vacancy/turnover risk right now — underwrite conservatively and check conversion options.",
  },
  {
    name: "Small business / franchise (with or without the building)",
    economics: "Valued on a multiple of seller's discretionary earnings; SBA 7(a) finances the business, 504 the real estate — often combined in one loan for owner-operators.",
    watch: "You're buying a job as much as an asset — and a franchise needs the franchisor's approval to transfer.",
  },
];

export const COMMERCIAL_TYPES_NOTE =
  "Cap-rate and multiple ranges are broker/industry norms, illustrative — the specific market, tenant credit, lease terms, and " +
  "condition move every number. A number that fits the category is not an appraisal or an opinion of value for one property.";

export interface CommercialBrief {
  id: string;
  question: string;
  answer: string;
  pointer: string;
  url?: string;
  /** Highlighted financing note where the lending is the crux. */
  financing?: string;
  /** Highlighted watch-out where a deal-killer hides. */
  watch?: string;
}

/** The questions commercial owners actually ask. */
export const COMMERCIAL_BRIEFS: CommercialBrief[] = [
  {
    id: "worth",
    question: "What is a commercial property actually worth?",
    answer:
      "Commercial value is income, not comparables the way a house is. The core math is NOI ÷ cap rate: net operating income " +
      "(rents minus real operating expenses, before debt) divided by the market cap rate for that property type and market. " +
      "A $120,000 NOI at a 7.5% cap is worth about $1.6M. So value is driven by two levers you can actually work: raising real " +
      "NOI (rents, occupancy, expense control) and the cap rate the market assigns (property type, location, lease quality, risk).",
    pointer: "A commercial appraiser or broker for the market cap rate; the property's real trailing-12-month operating statement",
  },
  {
    id: "financing",
    question: "How do I finance it — and how much down?",
    answer:
      "Owner-occupied commercial (you run a business in it) is the sweet spot: SBA 504 and SBA 7(a) finance owner-users with as " +
      "little as 10% down. Pure investment property runs conventional commercial (banks/credit unions), typically 20–30% down, " +
      "shorter terms with a balloon. Mobile-home parks and larger multifamily can reach agency (Fannie/Freddie) programs. The " +
      "number that decides approval is DSCR — debt-service coverage — where lenders want NOI to cover the payment about 1.20–1.25×.",
    pointer: "An SBA-preferred lender for owner-use; a commercial mortgage broker for investment; your CPA on entity structure",
    financing:
      "The move most buyers miss: SBA can finance the BUSINESS and the REAL ESTATE together in one loan (504 for the building, " +
      "7(a) for the business/working capital), at low down payment and long terms — often the best fit for someone buying a " +
      "hotel, laundromat, car wash, or franchise they'll operate. A pure investor can't use it; an owner-operator usually can.",
  },
  {
    id: "cashflow",
    question: "What's my real cash flow after the loan?",
    answer:
      "Start from NOI, then subtract annual debt service — what's left is pre-tax cash flow, and it's the number that actually " +
      "hits your account. Two disciplines separate winners: (1) underwrite REAL expenses (taxes, insurance, management, repairs, " +
      "and a replacement reserve), not the seller's optimistic pro forma; (2) hold a DSCR cushion so a few vacant months don't " +
      "put you underwater. Cash-on-cash return (cash flow ÷ cash invested) is how you compare deals, not the sticker cap rate.",
    pointer: "Your own rebuilt operating statement; a lender's DSCR test; a CPA on after-tax cash flow",
  },
  {
    id: "business-or-re",
    question: "Should I buy the business, the real estate, or both?",
    answer:
      "They're valued and financed differently, and the best deals separate them on purpose. The real estate is valued on NOI/cap " +
      "rate; the business on a multiple of earnings. Owning both lets you pay yourself market rent (moving profit between the two " +
      "for tax and financing reasons) and gives you the building's appreciation on top of the business cash flow. Many operators " +
      "buy both via one SBA package, then later sell the business but keep the building as a leased-back retirement asset.",
    pointer: "A business broker + commercial broker together; a CPA and attorney on how to structure the two",
  },
  {
    id: "leases",
    question: "NNN vs gross lease — who actually pays what?",
    answer:
      "The lease type decides your real return. In a TRIPLE-NET (NNN) lease the tenant pays taxes, insurance, and maintenance on " +
      "top of rent — predictable, low-management income, common in retail and industrial. In a GROSS lease you (the owner) cover " +
      "those, so a rising tax or insurance bill eats your margin. 'Modified gross' splits them. Always read the actual clauses: " +
      "who pays the roof and parking lot, the CAM (common-area) reconciliation, escalations, renewal options, and co-tenancy.",
    pointer: "Every lease, read in full, before the price is final; a commercial attorney on the lease abstract",
  },
];

/** The questions commercial owners DON'T think to ask — the value-add. */
export const COMMERCIAL_UNKNOWN_BRIEFS: CommercialBrief[] = [
  {
    id: "phase-one",
    question: "Do I need an environmental Phase I? (Almost always yes.)",
    answer:
      "Any commercial purchase with a loan will require a Phase I Environmental Site Assessment, and any site that ever held a gas " +
      "station, dry cleaner, auto shop, or industrial use can carry contamination that becomes YOUR liability the day you close. A " +
      "Phase I is a few thousand dollars; a Phase II and a cleanup can be six or seven figures and can kill the deal or the " +
      "financing. Make the purchase contingent on a clean Phase I, and never waive it to win a bid.",
    pointer: "An environmental consultant for the Phase I; the Environmental module on this platform; your lender's requirements",
    watch:
      "This is the deal-killer people skip: environmental liability transfers with the property. A contaminated site can cost more " +
      "to clean than it's worth, and lenders won't touch it. The Phase I contingency is not optional — it's your protection.",
  },
  {
    id: "sba-combined",
    question: "Can one loan cover the business AND the building?",
    answer:
      "Yes — and most first-time buyers don't know it. For an owner-operator, SBA 7(a) and 504 can finance the real estate, the " +
      "business, the equipment, and working capital together, with a low down payment (often 10%) and long amortization the " +
      "building alone couldn't get. It's the single biggest reason to buy a hotel, laundromat, car wash, or franchise as an " +
      "owner-operator rather than a passive investor — the financing is dramatically better when you run it.",
    pointer: "An SBA-preferred lender; the Financing & Capital module; a CPA on owner-occupancy tests",
  },
  {
    id: "cost-seg",
    question: "Am I leaving a fortune in depreciation on the table?",
    answer:
      "Commercial real estate depreciates over 39 years by default — but a COST SEGREGATION study reclassifies parts of the " +
      "building (fixtures, wiring, parking, landscaping) into 5-, 7-, and 15-year lives, pulling large deductions forward into the " +
      "early years when you need the cash. On a seven-figure building that can mean tens or hundreds of thousands in accelerated " +
      "deductions. It's a real, IRS-recognized strategy that most small buyers never run because no one told them to.",
    pointer: "A CPA and a cost-segregation specialist; run the study in year one for the biggest benefit",
  },
  {
    id: "going-concern",
    question: "Am I overpaying for 'blue sky'?",
    answer:
      "When you buy a business-plus-real-estate (a hotel, a car wash, a franchise), part of the price is the building and part is " +
      "GOING-CONCERN value — the goodwill of an operating business. That premium is real only if the income holds after you take " +
      "over. Separate the two: what is the real estate worth empty, and what are you paying for the operation? If the 'blue sky' " +
      "depends on the current owner's relationships or below-market labor, it can evaporate — underwrite the building as your floor.",
    pointer: "A business valuation separate from the real-estate appraisal; a CPA on allocation for tax and financing",
  },
  {
    id: "zoning-use",
    question: "Is the use actually legal — or just currently happening?",
    answer:
      "'It's been a bar for 30 years' does not mean a bar is a permitted use today. Many commercial properties run on a " +
      "grandfathered nonconforming use that can be lost if it lapses, or on a conditional-use permit that doesn't transfer " +
      "automatically. Before you close, confirm the current use is legal, whether your intended use is permitted, and whether any " +
      "change triggers ADA upgrades, parking minimums, or a new certificate of occupancy. A use variance can take months.",
    pointer: "The county/city zoning office and building department; a land-use attorney; the certificate of occupancy on file",
    watch:
      "ADA is the sleeper here: renovating or changing the use of a commercial building can trigger required accessibility " +
      "upgrades (ramps, restrooms, parking) that weren't in your budget. Ask before you buy, not during the permit review.",
  },
  {
    id: "reserves-estoppel",
    question: "What are replacement reserves and estoppels — and why do they matter?",
    answer:
      "Two unglamorous things that decide whether your numbers are real. REPLACEMENT RESERVES are money set aside for the roof, " +
      "HVAC, parking lot, and equipment that WILL fail — underwriters expect them, and a pro forma without them is fiction. " +
      "ESTOPPEL certificates are signed statements from each tenant confirming their rent, deposit, and lease terms — you get them " +
      "before closing so you're buying the leases that actually exist, not the ones the seller described. Skip either and the " +
      "surprises land after you own it.",
    pointer: "Your lender's reserve requirement; a commercial attorney to collect estoppels before closing",
  },
];

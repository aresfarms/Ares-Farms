"use client";

/**
 * ResidentialLaneWorkspace — the residential lane's OWN workspace (founder
 * decomposition, 2026-07-28). This file owns everything residential-specific
 * the customer sees inside the property workspace: the lane's tabs and
 * intros, its financing ranking and program notes, and its rate labels. It
 * evolves independently of the farm and commercial lanes; only the compliance
 * substrate is shared, through GovernedLaneChassis.
 */

import {
  GovernedLaneChassis,
  type FinancingRateContext,
  type LaneDefinition,
  type LaneWorkspaceProps,
} from "@/components/property/lanes/GovernedLaneChassis";

function rateLabel(name: string, rates: FinancingRateContext): string {
  const value = name.toLowerCase();
  if (/conventional/.test(value)) return rates?.mortgage30Pct != null ? `${rates.mortgage30Pct.toFixed(2)}% national 30-year benchmark${rates.mortgageWeekOf ? ` · week of ${rates.mortgageWeekOf}` : ""}` : "Lender quote required";
  if (/rural development housing|usda/.test(value)) return rates?.mortgage30Pct != null ? `${rates.mortgage30Pct.toFixed(2)}% national 30-year benchmark — not a USDA-RD quote` : "USDA-RD lender quote required";
  if (/fha|203\(k\)|\bva\b/.test(value)) return "Program lender quote required";
  if (/seller financing/.test(value)) return "Rate negotiated with seller";
  if (/hard money|asset-based bridge|private bridge/.test(value)) return "Private-lender quote required";
  return "Program-specific quote required";
}

function programNote(name: string) {
  const value = name.toLowerCase();
  if (value.includes("203(k)")) return { fit: "Renovation-oriented FHA path", why: "Relevant when the residence needs substantial repair and the acquisition and rehabilitation may be combined.", watch: "Requires eligible owner occupancy, an approved lender, appraisal support, and a documented rehabilitation scope." };
  if (value.includes("fha")) return { fit: "Owner-occupied residential path", why: "Potential fit for a primary residence with a lower down-payment structure.", watch: "Property condition, appraisal, flood insurance, mortgage insurance, and borrower eligibility still control." };
  if (/\bva\b/.test(value)) return { fit: "Veteran owner-occupant path", why: "Potentially strong when an eligible veteran intends to occupy the property.", watch: "COE, borrower qualification, VA appraisal/minimum-property requirements, and renovation-lender availability are handled in the personalized Financial module." };
  if (value.includes("conventional")) return { fit: "Standard residential financing", why: "Useful when appraisal and condition support ordinary mortgage collateral requirements.", watch: "A teardown or major rehabilitation may require renovation or construction financing instead." };
  if (value.includes("seller financing") || value.includes("seller-financed")) return { fit: "Seller-carried financing", why: "The seller may carry part or all of the purchase price through a negotiated note, sometimes alongside bank or buyer equity.", watch: "Price, down payment, interest rate, amortization, balloon date, lien priority, collateral, default remedies, due-on-sale terms, and independent legal and tax review must be documented before reliance." };
  if (value.includes("hard money") || value.includes("private asset-based") || value.includes("private bridge")) return { fit: "Private asset-based bridge financing (often called hard money)", why: "A short-term lender may underwrite primarily to collateral value and exit strategy when speed, condition, occupancy, or conventional seasoning prevents ordinary financing.", watch: "These loans are commonly higher-cost and shorter-term, with points, fees, conservative loan-to-value limits, extension charges, personal guarantees, and a required refinance or sale exit. They should be compared on total dollars and downside risk—not headline rate alone." };
  if (value.includes("construction") || value.includes("renovation")) return { fit: "Major-repair or replacement path", why: "Relevant when the existing structure has limited contributory value or needs extensive rehabilitation.", watch: "Requires plans, budget, contractor controls, appraisal-as-completed, and lender-specific draw administration." };
  if (value.includes("usda")) return { fit: "Owner-occupied rural housing pathway", why: "Potentially relevant only when this is an eligible primary residence in a USDA-eligible rural area.", watch: "Property geography, household income, owner occupancy, appraisal, condition, and program limits still control." };
  return { fit: "Property-relevant financing family", why: "Surfaced from the property type, intended use, location, and currently available evidence.", watch: "Price, appraisal, condition, occupancy, insurance, and borrower-specific eligibility still control final fit." };
}

const RESIDENTIAL_LANE: LaneDefinition = {
  id: "residential",
  consumerLaneLabel: "Residential",
  initialTab: "summary",
  tabs: [
    { id: "summary", label: "Summary", intro: "The whole property at a glance." },
    { id: "property", label: "Property", intro: "Lot size, parcel identity, bedrooms and bathrooms, price, taxes, deed, and core physical identity live here." },
    { id: "utilities", label: "Utilities", intro: "Electricity, water, sewer, septic, well, gas, broadband, and recurring infrastructure costs live here." },
    { id: "finance", label: "Finance", intro: "Current rate and term comparisons, ownership costs, cash to close, and home-relevant financing pathways — conventional, FHA, VA, USDA-RD — live here." },
    { id: "environmental", label: "Environmental", intro: "Flood, wetlands, hazards, contamination, historic constraints, soils, climate, and environmental diligence live here." },
    { id: "agriculture", label: "Yard & Garden", intro: "What grows well in this yard — garden plants matched to the parcel's actual soil, plus native plants for the region that support pollinators and need less water and care." },
    { id: "education", label: "Education", intro: "Assigned-school evidence, nearby public and private options, higher education, and state choice rules live here." },
    { id: "misc", label: "Misc. / Other", intro: "Location, amenities, transportation, market context, and facts that do not belong in the other dedicated sections live here." },
    { id: "report", label: "Report", intro: "View, download, print, save, and continue to the personalized pro forma from one place." },
  ],
  financingPriority: (name) => {
    const value = name.toLowerCase();
    if (/conventional/.test(value)) return 0;
    if (/fha(?!.*203)/.test(value)) return 1;
    if (/\bva\b/.test(value)) return 2;
    if (/usda|rural development housing/.test(value)) return 3;
    if (/203\(k\)|renovation|construction/.test(value)) return 4;
    if (/seller financing/.test(value)) return 5;
    if (/hard money|asset-based bridge|private bridge/.test(value)) return 6;
    return 10;
  },
  financingRateLabel: rateLabel,
  financingProgramNote: programNote,
  bestFirstPathNote: () => "Ranked first for a home purchase because it fits the widest range of owner-occupied residential deals.",
};

export function ResidentialLaneWorkspace(props: LaneWorkspaceProps) {
  return <GovernedLaneChassis {...props} lane={RESIDENTIAL_LANE} />;
}

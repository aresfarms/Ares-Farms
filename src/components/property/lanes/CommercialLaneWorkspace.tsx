"use client";

/**
 * CommercialLaneWorkspace — the commercial & business lane's OWN workspace
 * (founder decomposition, 2026-07-28). Covers the commercial, hospitality,
 * and mobile-home-park profiles. This file owns everything commercial-specific
 * the customer sees inside the property workspace: the lane's tabs and
 * intros, its financing ranking and program notes, and its rate labels. It
 * evolves independently of the farm and residential lanes; only the
 * compliance substrate is shared, through GovernedLaneChassis.
 */

import {
  GovernedLaneChassis,
  type FinancingRateContext,
  type LaneDefinition,
  type LaneWorkspaceProps,
} from "@/components/property/lanes/GovernedLaneChassis";

function rateLabel(name: string, rates: FinancingRateContext): string {
  void rates;
  const value = name.toLowerCase();
  if (/seller financing/.test(value)) return "Rate negotiated with seller";
  if (/hard money|asset-based bridge|private bridge/.test(value)) return "Private-lender quote required";
  if (/sba/.test(value)) return "SBA-participating-lender quote required";
  return "Participating-lender quote required";
}

function programNote(name: string) {
  const value = name.toLowerCase();
  if (value.includes("sba")) return { fit: "Business-purpose pathway", why: "Potential fit only when the property supports an eligible operating business rather than passive ownership.", watch: "Business use, borrower/entity eligibility, injection, repayment ability, and collateral rules are reviewed in the Financial module." };
  if (value.includes("conventional")) return { fit: "Conventional commercial real-estate financing", why: "Useful when the property value, permitted use, occupancy, and operating cash flow support ordinary commercial real-estate underwriting.", watch: "Lenders will still test appraisal, debt-service coverage, borrower strength, environmental risk, property condition, tenant or owner occupancy, and any business or equipment value included in the purchase." };
  if (value.includes("seller financing") || value.includes("seller-financed")) return { fit: "Seller-carried financing", why: "The seller may carry part or all of the purchase price through a negotiated note, sometimes alongside bank, SBA, or buyer equity.", watch: "Price, down payment, interest rate, amortization, balloon date, lien priority, collateral, default remedies, due-on-sale terms, and independent legal and tax review must be documented before reliance." };
  if (value.includes("hard money") || value.includes("private asset-based") || value.includes("private bridge")) return { fit: "Private asset-based bridge financing (often called hard money)", why: "A short-term lender may underwrite primarily to collateral value and exit strategy when speed, condition, occupancy, or conventional seasoning prevents ordinary financing.", watch: "These loans are commonly higher-cost and shorter-term, with points, fees, conservative loan-to-value limits, extension charges, personal guarantees, and a required refinance or sale exit. They should be compared on total dollars and downside risk—not headline rate alone." };
  if (value.includes("construction") || value.includes("renovation")) return { fit: "Commercial acquisition, renovation, or value-add financing", why: "Commercial lenders commonly finance acquisition and approved improvements together through a bank portfolio loan, SBA structure, bridge facility, or construction-to-permanent execution; it is not automatically a separate residential-style construction loan.", watch: "The lender will size proceeds to purchase price, stabilized value, renovation budget, debt-service coverage, borrower liquidity, environmental condition, permits, contractor controls, and the timing of business or tenant occupancy." };
  if (value.includes("usda")) return { fit: "Rural business-purpose financing", why: "Potentially relevant when the property supports an eligible operating business in a USDA-eligible rural area.", watch: "Rural eligibility, eligible business purpose, lender participation, repayment ability, collateral, appraisal, environmental review, and use-of-proceeds rules still control." };
  return { fit: "Property-relevant financing family", why: "Surfaced from the property type, intended use, location, and currently available evidence.", watch: "Price, appraisal, condition, occupancy, insurance, and borrower-specific eligibility still control final fit." };
}

const COMMERCIAL_LANE: LaneDefinition = {
  id: "commercial",
  consumerLaneLabel: "Commercial & business",
  initialTab: "summary",
  tabs: [
    { id: "summary", label: "Summary", intro: "The whole property at a glance." },
    { id: "property", label: "Property", intro: "Building and lot identity, zoning, permitted use, price, taxes, deed, occupancy posture, and core physical identity live here." },
    { id: "utilities", label: "Utilities", intro: "Electric service, water, sewer, gas, broadband capacity, and recurring infrastructure costs that shape operating expenses live here." },
    { id: "finance", label: "Finance", intro: "Ownership costs, cash to close, and business-relevant financing pathways — SBA, conventional commercial, USDA rural business — live here." },
    { id: "environmental", label: "Environmental", intro: "Flood, hazards, contamination and Phase-I posture, historic constraints, climate, and environmental diligence live here." },
    { id: "education", label: "Education", intro: "Nearby schools and higher-education institutions that shape workforce, customer base, and location value live here." },
    { id: "misc", label: "Misc. / Other", intro: "Location, traffic and access, market context, operations, and facts that do not belong in the other dedicated sections live here." },
    { id: "report", label: "Report", intro: "View, download, print, save, and continue to the personalized pro forma from one place." },
  ],
  financingPriority: (name) => {
    const value = name.toLowerCase();
    if (/sba/.test(value)) return 0;
    if (/conventional/.test(value)) return 1;
    if (/usda/.test(value)) return 2;
    if (/construction|renovation/.test(value)) return 3;
    if (/seller financing/.test(value)) return 4;
    if (/hard money|asset-based bridge|private bridge/.test(value)) return 5;
    return 10;
  },
  financingRateLabel: rateLabel,
  financingProgramNote: programNote,
  bestFirstPathNote: () => "Ranked first for a business-property acquisition because it is built for owner-operated commercial real estate.",
  categorizeFact: (label) => {
    const value = label.toLowerCase();
    if (/zoning|permitted use|occupancy|tenant|lease/.test(value)) return "property";
    if (/traffic|parking|access|visibility/.test(value)) return "misc";
    return null;
  },
};

export function CommercialLaneWorkspace(props: LaneWorkspaceProps) {
  return <GovernedLaneChassis {...props} lane={COMMERCIAL_LANE} />;
}

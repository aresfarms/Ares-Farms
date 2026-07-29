"use client";

/**
 * FarmLaneWorkspace — the farm & agricultural lane's OWN workspace (founder
 * decomposition, 2026-07-28). This file owns everything farm-specific the
 * customer sees inside the property workspace: the lane's tabs and intros,
 * its financing ranking and program notes, and its rate labels. It evolves
 * independently of the residential and commercial lanes; only the compliance
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
  if (/fsa.*farm ownership|farm ownership.*fsa/.test(value)) return rates?.fsaOwnershipDirectPct != null ? `${rates.fsaOwnershipDirectPct.toFixed(3).replace(/\.?0+$/, "")}% published FSA direct rate` : "Current FSA rate unavailable";
  if (/rural development housing/.test(value)) return rates?.mortgage30Pct != null ? `${rates.mortgage30Pct.toFixed(2)}% national 30-year benchmark — not a USDA-RD quote` : "USDA-RD lender quote required";
  if (/farm credit|conventional farm|mixed-use/.test(value)) return "Participating-lender quote required";
  if (/seller financing/.test(value)) return "Rate negotiated with seller";
  if (/hard money|private agricultural|asset-based bridge/.test(value)) return "Private-lender quote required";
  return "Program-specific quote required";
}

function programNote(name: string) {
  const value = name.toLowerCase();
  if (value.includes("conventional")) return { fit: "Conventional agricultural real-estate financing", why: "Useful when land value, improvements, farm cash flow, and collateral quality support a conventional agricultural mortgage.", watch: "Production history, farm income, appraisal, water and access rights, environmental condition, and the value of included improvements or equipment still control." };
  if (value.includes("seller financing") || value.includes("seller-financed")) return { fit: "Seller-carried financing", why: "The seller may carry part or all of the purchase price through a negotiated note, sometimes alongside bank, SBA, Farm Credit, or buyer equity.", watch: "Price, down payment, interest rate, amortization, balloon date, lien priority, collateral, default remedies, due-on-sale terms, and independent legal and tax review must be documented before reliance." };
  if (value.includes("hard money") || value.includes("private asset-based") || value.includes("private bridge") || value.includes("private agricultural")) return { fit: "Private asset-based bridge financing (often called hard money)", why: "A short-term lender may underwrite primarily to collateral value and exit strategy when speed, condition, occupancy, or conventional seasoning prevents ordinary financing.", watch: "These loans are commonly higher-cost and shorter-term, with points, fees, conservative loan-to-value limits, extension charges, personal guarantees, and a required refinance or sale exit. They should be compared on total dollars and downside risk—not headline rate alone." };
  if (value.includes("construction") || value.includes("renovation")) return { fit: "Agricultural improvement or construction financing", why: "Farm and agricultural lenders may combine land acquisition with eligible building, drainage, fencing, equipment, or rehabilitation costs when the operating plan supports repayment.", watch: "Plans, budget, appraisal, farm cash flow, permits, contractor controls, and program-specific eligible-use rules still govern." };
  if (value.includes("usda") || value.includes("fsa")) return { fit: "Agricultural or rural-property financing", why: "Potentially relevant when the farm, land, or owner-occupied rural use matches the specific USDA or FSA program.", watch: "The exact program, geography, farm or household eligibility, repayment ability, appraisal, occupancy, and use-of-proceeds rules still control." };
  if (value.includes("farm credit")) return { fit: "Cooperative agricultural lender path", why: "Farm Credit associations underwrite agricultural land and operations as their core business, often with patronage structures.", watch: "Membership eligibility, farm income, appraisal, collateral quality, and association-specific underwriting still control." };
  if (value.includes("sba")) return { fit: "Business-purpose pathway", why: "Potential fit only when the property supports an eligible operating business rather than passive ownership.", watch: "Business use, borrower/entity eligibility, injection, repayment ability, and collateral rules are reviewed in the Financial module." };
  return { fit: "Property-relevant financing family", why: "Surfaced from the property type, intended use, location, and currently available evidence.", watch: "Price, appraisal, condition, occupancy, insurance, and borrower-specific eligibility still control final fit." };
}

const FARM_LANE: LaneDefinition = {
  id: "farm",
  consumerLaneLabel: "Farm & agricultural",
  initialTab: "property",
  tabs: [
    { id: "summary", label: "Summary", intro: "The whole tract at a glance." },
    { id: "property", label: "Property", intro: "Acreage, parcel identity, land use, price, taxes, deed, structures, and the core physical identity of the tract live here." },
    { id: "agriculture", label: "Agriculture", intro: "What this ground grows best — ranked crop and enterprise options (row crops, orchard, hay, flowers, vines, and more) from the actual soil, county yields, and market signals, plus whether one anchor crop or a diversified mix fits this parcel." },
    { id: "utilities", label: "Utilities", intro: "Electricity, water, wells, septic, irrigation access, gas, broadband, and recurring infrastructure costs live here." },
    { id: "finance", label: "Finance", intro: "Current rate and term comparisons, ownership costs, cash to close, and farm-relevant financing pathways — FSA, Farm Credit, conventional agricultural — live here." },
    { id: "environmental", label: "Environmental", intro: "Flood, wetlands, soils, drought posture, hazards, contamination, historic constraints, climate, and environmental diligence live here." },
    { id: "education", label: "Education", intro: "Assigned-school evidence, nearby public and private options, higher education and extension programs, and state choice rules live here." },
    { id: "misc", label: "Misc. / Other", intro: "Location, market context, equipment and outbuilding notes, operations, and facts that do not belong in the other dedicated sections live here." },
    { id: "report", label: "Report", intro: "View, download, print, save, and continue to the personalized pro forma from one place." },
  ],
  financingPriority: (name) => {
    const value = name.toLowerCase();
    if (/fsa.*farm ownership|farm ownership.*fsa/.test(value)) return 0;
    if (/farm credit/.test(value)) return 1;
    if (/conventional farm|mixed-use/.test(value)) return 2;
    if (/seller financing/.test(value)) return 3;
    if (/rural development housing/.test(value)) return 4;
    if (/hard money|private agricultural|asset-based bridge/.test(value)) return 5;
    return 10;
  },
  financingRateLabel: rateLabel,
  financingProgramNote: programNote,
  bestFirstPathNote: () => "Ranked first for a farm acquisition because it is purpose-built for eligible farm ownership.",
  categorizeFact: (label) => {
    const value = label.toLowerCase();
    if (/soil|drought|crop|grazing|irrigat|water right|conservation easement/.test(value)) return "environmental";
    if (/outbuilding|barn|grain|silo|fence|tillable|pasture/.test(value)) return "property";
    return null;
  },
};

export function FarmLaneWorkspace(props: LaneWorkspaceProps) {
  return <GovernedLaneChassis {...props} lane={FARM_LANE} />;
}

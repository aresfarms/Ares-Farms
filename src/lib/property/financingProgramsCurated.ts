/**
 * financingProgramsCurated — the FIRST-PARTY, cited registry of financing
 * programs a property or operation may ALSO qualify for, beyond the mortgage/
 * FSA payment lanes the cost model already prices (founder direction
 * 2026-07-17: "for farms it should include USDA Rural Development, REAP, SBA
 * programs and their rates, and if the property qualifies — same for
 * commercial").
 *
 * These are AWARENESS items, not payment scenarios. Most are grants (a share
 * of a project, no interest rate) or loan guarantees (a lender sets the rate) —
 * showing a fabricated monthly payment for them would be dishonest, so each
 * carries its real mechanism, the honest rate/grant figure, the eligibility
 * signal, and where to confirm. Every figure is dated and sourced; nothing
 * here is an offer, a quote, an approval, or a determination.
 *
 * The team maintains this list (like townCharacterCurated / farmEditorial) —
 * program terms, guarantee percentages, and grant caps are re-published
 * annually. Scanned by verify:brief-copy.
 *
 * Sources: USDA Rural Development (rd.usda.gov), USDA FSA (fsa.usda.gov),
 * U.S. SBA (sba.gov) program pages, verified 2026-07-17.
 */

import { FSA_RATES, FSA_RATES_PROVENANCE } from "@/lib/property/fsaRatesGenerated";
import type { PropertyProfileId } from "@/lib/property/propertyProfile";

export type FinancingMechanism =
  | "Direct loan"
  | "Loan guarantee"
  | "Grant"
  | "Grant + loan guarantee"
  | "Intermediary loan";

export interface FinancingProgram {
  id: string;
  name: string;
  agency: string;
  mechanism: FinancingMechanism;
  /** Honest terms — a rate where one exists, the grant share where it's a grant. */
  terms: string;
  /** Who/what qualifies — the eligibility signal, never a determination. */
  eligibility: string;
  /** Where the reader confirms current terms and applies. */
  confirmAt: string;
  url?: string;
  /** As-of / effective date for the terms shown. */
  asOf: string;
  source: string;
}

export interface FinancingProgramGroup {
  /** Optional profile-specific framing (e.g. the SBA-vs-FSA farm rule). */
  note: string | null;
  programs: FinancingProgram[];
  disclaimer: string;
}

const GROUP_DISCLAIMER =
  "These are programs the property or operation may qualify for — not offers, quotes, approvals, or advice. Grant shares, guarantee percentages, and dollar caps are set annually and application windows change; loan rates move and lock only at closing. Eligibility is decided by the lender, the CDC, or the agency on the specific deal. Furlong is not a lender or a government office.";

// ── Program definitions (defined once, composed per profile) ────────────────

const fsaEff = FSA_RATES_PROVENANCE.effective ? `, effective ${FSA_RATES_PROVENANCE.effective}` : "";

const FSA_FARM: FinancingProgram = {
  id: "fsa-farm",
  name: "USDA FSA Farm Ownership & Operating loans",
  agency: "USDA Farm Service Agency",
  mechanism: "Direct loan",
  terms:
    `The farm-buying lanes in the cost picture above: FSA Direct Farm Ownership at ${FSA_RATES.ownershipDirect}% ` +
    `and Direct Operating at ${FSA_RATES.operatingDirect}% (FSA's own published rates${fsaEff}), plus FSA-guaranteed ` +
    `loans made through a commercial lender with an FSA guarantee. Direct farm-ownership terms run up to 40 years.`,
  eligibility:
    "Family-size farms and ranches, with dedicated beginning-farmer, underserved, microloan, and down-payment terms. " +
    "Qualifying turns on the operation's cash flow, not a household paycheck.",
  confirmAt: "Your county FSA office",
  url: "https://www.fsa.usda.gov/resources/programs/farm-loan-programs",
  asOf: FSA_RATES_PROVENANCE.effective ?? "current",
  source: "USDA FSA Farm Loan Programs (fsa.usda.gov)",
};

const REAP: FinancingProgram = {
  id: "reap",
  name: "REAP — Rural Energy for America Program",
  agency: "USDA Rural Development",
  mechanism: "Grant + loan guarantee",
  terms:
    "A grant covers up to 25% of an eligible energy project — up to 50% for energy-efficiency, zero-emission, " +
    "energy-community, or Tribal projects. Renewable-system grants reach $1,000,000, efficiency grants $500,000. " +
    "An 80% loan guarantee (term to 40 years) can stack on top, up to 75% of project cost combined. A grant is a " +
    "share of the project, not a loan — it carries no interest rate.",
  eligibility:
    "Agricultural producers (50%+ of gross income from farming — and, unusually, they may be in a rural OR non-rural " +
    "area) and rural small businesses (in a rural area, within SBA size standards). Covers solar, wind, geothermal, " +
    "biomass, and efficiency retrofits — including replacing an aging grain dryer with an efficient model.",
  confirmAt: "Your state USDA Rural Development Energy Coordinator (windows are competitive and change)",
  url: "https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvement-grants",
  asOf: "FY2025–2026 terms",
  source: "USDA Rural Development, REAP (rd.usda.gov)",
};

const VAPG: FinancingProgram = {
  id: "vapg",
  name: "Value-Added Producer Grants",
  agency: "USDA Rural Development",
  mechanism: "Grant",
  terms:
    "A grant, not a loan: planning grants up to $50,000 and working-capital grants up to $200,000 (FY26 notice), " +
    "with a required 1:1 match, over up to 36 months. First-time and smaller applicants get priority.",
  eligibility:
    "Independent agricultural producers and producer cooperatives adding value to a raw commodity — processing, " +
    "branding, packaging, aggregation, or direct-to-market sales.",
  confirmAt: "USDA Rural Development (the annual notice sets the caps)",
  url: "https://www.rd.usda.gov/programs-services/business-programs/value-added-producer-grants",
  asOf: "FY2026 notice",
  source: "USDA Rural Development, VAPG (rd.usda.gov)",
};

const BI: FinancingProgram = {
  id: "usda-bi",
  name: "USDA Business & Industry Guaranteed Loan",
  agency: "USDA Rural Development",
  mechanism: "Loan guarantee",
  terms:
    "A commercial lender makes the loan and sets the rate; USDA guarantees roughly 80% of it (FY2025). Up to $25 " +
    "million, terms to 30 years on real estate. A 3% guarantee fee and a 0.55% annual fee apply.",
  eligibility:
    "Rural for-profit or non-profit businesses in a community of 50,000 or fewer people. Primary agricultural " +
    "production is generally not an eligible use — this is a rural-business lane, not a farm-operating loan.",
  confirmAt: "A USDA-approved lender under the OneRD Guarantee framework",
  url: "https://www.rd.usda.gov/programs-services/business-programs/business-and-industry-guaranteed-loan",
  asOf: "FY2025 terms",
  source: "USDA Rural Development, B&I (rd.usda.gov)",
};

const SBA_504: FinancingProgram = {
  id: "sba-504",
  name: "SBA 504",
  agency: "U.S. Small Business Administration",
  mechanism: "Direct loan",
  terms:
    "Three parts: 50% from a bank, 40% from an SBA-backed CDC debenture, 10% down (15% for a startup or a " +
    "special-use building, 20% for both). The debenture is a long fixed rate — about 5.0% in July 2026, roughly " +
    "6.2% all-in with fees, priced monthly and locked at funding — over 20 or 25 years. The CDC portion reaches " +
    "$5.5 million.",
  eligibility:
    "Owner-occupied commercial real estate only: you occupy at least 51% of an existing building (60% of new " +
    "construction), not passive investment property. For-profit, within SBA size standards. Fits office, retail, " +
    "industrial, medical, lodging, and self-storage.",
  confirmAt: "A local Certified Development Company (CDC) and the SBA",
  url: "https://www.sba.gov/funding-programs/loans/504-loans",
  asOf: "rates effective 2026-07-09",
  source: "U.S. SBA 504 program (sba.gov)",
};

const SBA_7A: FinancingProgram = {
  id: "sba-7a",
  name: "SBA 7(a)",
  agency: "U.S. Small Business Administration",
  mechanism: "Loan guarantee",
  terms:
    "A bank loan with an SBA guarantee. The rate is a base rate (WSJ Prime, about 6.75% in early July 2026) plus a " +
    "lender spread the SBA caps by loan size — a ceiling near Prime + 3.0% (about 9.75%) on larger real-estate " +
    "loans, and often lower. Terms to 25 years on real estate, up to $5 million, typically about 10% down. These " +
    "are ceilings, not the offered rate.",
  eligibility:
    "Owner-occupied (at least 51% of an existing building, 60% of new construction). More flexible than the 504 — " +
    "it can bundle real estate with working capital, a business acquisition, or a refinance in one loan.",
  confirmAt: "An SBA-preferred lender",
  url: "https://www.sba.gov/partners/lenders/7a-loan-program/terms-conditions-eligibility",
  asOf: "Prime as of 2026-07-02",
  source: "U.S. SBA 7(a) program (sba.gov)",
};

const SBA_504_7A_FARM: FinancingProgram = {
  id: "sba-value-added",
  name: "SBA 504 / 7(a) — for the value-added or commercial side",
  agency: "U.S. Small Business Administration",
  mechanism: "Loan guarantee",
  terms:
    "The SBA's owner-occupied real-estate loans (504's long fixed rate ~6.2% all-in; 7(a) at a capped Prime-plus " +
    "spread) — but for the commercial side of an operation, not the field.",
  eligibility:
    "The SBA directs primary crop and livestock production to USDA/FSA and does not finance it. What CAN use the " +
    "SBA is the value-added or main-street side: a packing or processing facility, cold storage, a farm store, " +
    "agritourism, or a nursery — a commercial business structured as one, not the farming itself.",
  confirmAt: "An SBA-preferred lender or a local CDC (eligibility is decided deal-by-deal)",
  url: "https://www.sba.gov/funding-programs/loans/504-loans",
  asOf: "2026 terms",
  source: "U.S. SBA (sba.gov); SBA/FSA coordination",
};

const MHC_AGENCY: FinancingProgram = {
  id: "mhc-agency",
  name: "Fannie Mae / Freddie Mac MHC programs",
  agency: "Fannie Mae, Freddie Mac",
  mechanism: "Loan guarantee",
  terms:
    "The agencies run dedicated manufactured-housing-community loan programs — often the best terms for a " +
    "stabilized park — priced by an agency-approved lender, alongside commercial bank debt and SBA for smaller or " +
    "value-add deals.",
  eligibility:
    "Underwritten on the lot-rent roll, occupancy, and utility structure — a consumer home mortgage does not apply " +
    "to a park. Tenant protections and community standards can attach.",
  confirmAt: "A Fannie Mae / Freddie Mac MHC-approved lender",
  url: "https://multifamily.fanniemae.com/financing-options/specialty-financing/manufactured-housing-communities",
  asOf: "current programs",
  source: "Fannie Mae / Freddie Mac MHC programs",
};

// ── Per-profile composition ─────────────────────────────────────────────────

const FARM_NOTE =
  "Beyond the FSA lanes priced above, a farm can reach USDA Rural Development's energy and value-added programs. " +
  "One rule to know: the SBA sends primary crop and livestock production to USDA/FSA — the SBA's own loans are for " +
  "the value-added or commercial side of an operation, not the field.";

const PROFILE_PROGRAMS: Record<PropertyProfileId, FinancingProgram[]> = {
  farm: [FSA_FARM, REAP, VAPG, SBA_504_7A_FARM],
  commercial: [SBA_504, SBA_7A, BI, REAP],
  hospitality: [SBA_504, SBA_7A, BI],
  "mobile-home-park": [MHC_AGENCY, SBA_504, REAP],
  land: [],
  residential: [],
};

const PROFILE_NOTE: Partial<Record<PropertyProfileId, string>> = {
  farm: FARM_NOTE,
  commercial:
    "Rural commercial property adds two USDA lanes to the SBA options: REAP for an on-site energy project, and the " +
    "Business & Industry guarantee for a business in a community of 50,000 or fewer.",
  "mobile-home-park":
    "Parks have their own capital stack — agency (Fannie/Freddie MHC) programs sit alongside the SBA for smaller " +
    "or value-add deals.",
};

/**
 * The financing-awareness group for a property profile, or null where the
 * priced mortgage/FSA/land lanes already cover it (residential, land).
 */
export function financingProgramsFor(profileId: PropertyProfileId): FinancingProgramGroup | null {
  const programs = PROFILE_PROGRAMS[profileId];
  if (!programs || programs.length === 0) return null;
  return {
    note: PROFILE_NOTE[profileId] ?? null,
    programs,
    disclaimer: GROUP_DISCLAIMER,
  };
}

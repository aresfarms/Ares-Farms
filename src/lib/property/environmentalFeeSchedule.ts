/**
 * environmentalFeeSchedule — the Environmental module's typical fee chart
 * (founder direction 2026-07-19; the founder is the licensed PE).
 *
 * HONEST DATA RULE: the only fee filled in here is the founder-provided general
 * hourly rate ($300/hr). Every fixed-service fee is "Quoted to scope" until the
 * PE provides the real typical figure — we never fabricate a professional fee.
 * The service list is seeded from the founder's stated capabilities (soil
 * mapping, conservation easements, site monitoring, etc.) plus standard non-lab
 * field/consulting services; the PE confirms and edits it.
 *
 * Guild: members receive credits toward these services (the exact credit values
 * are set with the membership tiers — founders + counsel — so this shows the
 * structure, not a specific discount, until those are fixed).
 *
 * Master Volume Governance:
 * - CANON-TREASURY-001 §9.1: fees disclosed up front; every engagement is
 *   quoted and approved before any work — no post-hoc fees.
 * - PE ethics: the fee is for professional work performed and is independent of
 *   any loan or transaction outcome; never contingent.
 */

export const ENV_GENERAL_HOURLY_USD = 300;

export interface EnvFeeLine {
  service: string;
  detail: string;
  /** Displayed fee. "$300/hr" for hourly; "Quoted to scope" until a real fixed fee is provided. */
  fee: string;
  /** True once a real, PE-provided figure replaces the "Quoted to scope" placeholder. */
  feeConfirmed: boolean;
}

export const ENVIRONMENTAL_FEE_LINES: EnvFeeLine[] = [
  {
    service: "General environmental / chemical engineering",
    detail: "Consulting, review, and stamped professional judgment, billed by the hour.",
    fee: `$${ENV_GENERAL_HOURLY_USD}/hr`,
    feeConfirmed: true,
  },
  {
    service: "Site monitoring & inspection",
    detail: "Ongoing site monitoring and compliance inspections (no laboratory required).",
    fee: `$${ENV_GENERAL_HOURLY_USD}/hr`,
    feeConfirmed: true,
  },
  {
    service: "Soil mapping / survey",
    detail: "Soil mapping and field survey for a site's condition and suitability.",
    fee: "Quoted to scope",
    feeConfirmed: false,
  },
  {
    service: "Conservation easement — baseline & documentation",
    detail: "Baseline documentation and reporting to support a conservation easement.",
    fee: "Quoted to scope",
    feeConfirmed: false,
  },
  {
    service: "Wetland delineation",
    detail: "Field delineation of wetland boundaries for permitting and planning.",
    fee: "Quoted to scope",
    feeConfirmed: false,
  },
  {
    service: "Phase I Environmental Site Assessment",
    detail: "ASTM E1527 records + history + site-walk review (no sampling).",
    fee: "Quoted to scope",
    feeConfirmed: false,
  },
  {
    service: "Stormwater / erosion & sediment control planning",
    detail: "Engineered stormwater and erosion-control plans for permitting.",
    fee: "Quoted to scope",
    feeConfirmed: false,
  },
  {
    service: "Environmental permitting & NEPA support",
    detail: "Permit strategy and NEPA screening/documentation support.",
    fee: `$${ENV_GENERAL_HOURLY_USD}/hr`,
    feeConfirmed: true,
  },
  {
    service: "Water rights consulting",
    detail: "Review of water-right seniority, transfer, and use questions.",
    fee: `$${ENV_GENERAL_HOURLY_USD}/hr`,
    feeConfirmed: true,
  },
];

export const ENVIRONMENTAL_FEE_NOTES = {
  guild:
    "Guild members receive credits toward these services — the more complete tiers include one or more assessments outright.",
  labs:
    "These are field and consulting services. Where laboratory analysis is required (for example Phase II sampling), it is coordinated with a certified laboratory and quoted separately.",
  disclosure:
    "Typical fees are illustrative. Every engagement is quoted in writing and approved before any work begins — there are no post-hoc fees, and the fee is never contingent on a loan or transaction.",
};

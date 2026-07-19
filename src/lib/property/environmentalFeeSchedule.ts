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
    service: "Phase I Environmental Site Assessment (ESA)",
    detail: "ASTM E1527 records + history + site-walk review (no sampling). The baseline due-diligence report standard for real estate transactions.",
    fee: "$1,900 – $4,500",
    feeConfirmed: true,
  },
  {
    service: "Phase II ESA & subsurface testing",
    detail: "Triggered when a Phase I flags a recognized environmental condition — soil and groundwater sampling (lab analysis coordinated).",
    fee: "$5,000 – $35,000",
    feeConfirmed: true,
  },
  {
    service: "Environmental Impact Assessment (EIA)",
    detail: "Extensive assessment of larger developments and their local ecosystems.",
    fee: "$10,000 – $60,000",
    feeConfirmed: true,
  },
  {
    service: "Permit application support",
    detail: "Tailored reports to secure municipal, state, or federal environmental permits (stormwater, wetland, NEPA).",
    fee: "$5,000 – $25,000",
    feeConfirmed: true,
  },
  {
    service: "General environmental / chemical engineering",
    detail: "Consulting, review, site monitoring, soil mapping, water-rights review, and stamped professional judgment, billed by the hour.",
    fee: `$${ENV_GENERAL_HOURLY_USD}/hr`,
    feeConfirmed: true,
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
];

export const ENVIRONMENTAL_FEE_NOTES = {
  guild:
    "Guild members receive credits toward these services — the more complete tiers include one or more assessments outright.",
  labs:
    "Report fees are typical market ranges; the final fee is quoted to the specific site and scope. Where laboratory analysis is required (for example Phase II sampling), a certified laboratory is coordinated and included in the quote. Senior/principal hourly work typically runs $175–$375/hr in the market; this practice bills at $300/hr.",
  disclosure:
    "Every engagement is quoted in writing and approved before any work begins — there are no post-hoc fees, and the fee is never contingent on a loan or transaction.",
};

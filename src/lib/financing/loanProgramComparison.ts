/**
 * loanProgramComparison — an informational side-by-side of the main SBA + USDA
 * loan programs (the inverse-MMCG idea: help someone see which program FITS a
 * project, without quoting a rate or implying qualification).
 *
 * HONEST + NOT ADVICE: these are the programs' published structural facts (max
 * size, use of proceeds, term, how the rate is set, the eligibility hinge) —
 * NOT a quote, a pre-approval, or a determination. "A program fitting a project
 * is not the same as you qualifying" — the licensed lender confirms the fit.
 *
 * Master Volume Governance: CONST-PATHWAY-001 / FACILITATION-001 (facilitate,
 * not decide); Section 1071 firewall (no borrower data collected here — this is
 * static program education).
 */

export interface LoanProgram {
  code: string;
  name: string;
  guarantor: string;
  /** Published maximum loan size (structural fact). */
  maxSize: string;
  bestFor: string;
  useOfProceeds: string;
  term: string;
  /** How the rate is SET (structural) — never a quoted number. */
  rateStructure: string;
  /** The one eligibility hinge that most often decides fit. */
  keyHinge: string;
}

export const LOAN_PROGRAMS: LoanProgram[] = [
  {
    code: "sba_7a",
    name: "SBA 7(a)",
    guarantor: "SBA-guaranteed, bank-originated",
    maxSize: "Up to $5 million",
    bestFor: "The flexible all-rounder for owner-operated small business",
    useOfProceeds: "Working capital, equipment, owner-occupied real estate, business acquisition, or debt refinance",
    term: "Up to 25 yr (real estate), ~10 yr (equipment / working capital)",
    rateStructure: "Prime + a lender-negotiated spread (SBA-capped); variable or fixed",
    keyHinge: "Owner-occupied / operating small business that meets SBA size standards",
  },
  {
    code: "sba_504",
    name: "SBA 504",
    guarantor: "Bank + CDC (SBA debenture)",
    maxSize: "Up to $5 million (more for some manufacturing / energy)",
    bestFor: "Buying or building owner-occupied real estate + long-term fixed assets",
    useOfProceeds: "Owner-occupied commercial real estate and heavy equipment (fixed assets) — not working capital",
    term: "10, 20, or 25 yr",
    rateStructure: "Fixed, set at the monthly debenture sale; ~50% bank / 40% CDC / 10% you",
    keyHinge: "Fixed-asset purchase you'll occupy (≥51%); a low 10% down structure",
  },
  {
    code: "usda_bi",
    name: "USDA B&I",
    guarantor: "USDA-guaranteed, lender-originated",
    maxSize: "Commonly up to $25 million (higher in select cases)",
    bestFor: "Larger rural business projects",
    useOfProceeds: "Real estate, equipment, working capital, acquisition, or refinance for a rural business",
    term: "Up to 30 yr (real estate), 15 yr (equipment), 7 yr (working capital)",
    rateStructure: "Lender-negotiated, backed by a USDA guarantee",
    keyHinge: "The business is in an eligible rural area (generally population < 50,000)",
  },
  {
    code: "sba_express",
    name: "SBA Express",
    guarantor: "SBA-guaranteed, bank-originated",
    maxSize: "Up to $500,000",
    bestFor: "Smaller needs that want a fast answer",
    useOfProceeds: "Similar to 7(a); a revolving line is also available",
    term: "Up to 25 yr (real estate), ~7–10 yr (other); revolving up to 10 yr",
    rateStructure: "Prime + a lender-negotiated spread; faster turnaround, lower SBA guarantee (50%)",
    keyHinge: "A smaller loan where speed matters more than the lowest possible rate",
  },
];

export const LOAN_COMPARISON_NOTE =
  "This compares how the programs are built — not a quote, a pre-approval, or a decision. A program fitting your project is not the same as you qualifying; the licensed lender confirms what actually fits and what the terms would be, disclosed to you in writing. Bring your deal and they'll map it to the right program.";

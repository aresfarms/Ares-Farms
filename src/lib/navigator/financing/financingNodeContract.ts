/**
 * Furlong financing node — property-anchored program comparison (SPEC CONTRACT,
 * 2026-06-12). DEFERRED BUILD: this file is the typed contract + counsel-DRAFT
 * disclaimer for the Navigator "Programs" node. It ships NO live behavior.
 *
 * HARD GATES:
 *  - FINANCING_NODE_LIVE = false           → the node renders nothing yet.
 *  - DISCLAIMER_COUNSEL_REVIEW_REQUIRED    → the disclaimer is a DRAFT; counsel
 *    must approve final wording before any publish (ties to LEGAL-REVIEW + the
 *    licensed-module preconditions).
 *  - NO live FRED / FOIA / rule fetcher here — public-data sources are listed by
 *    citation only; a live fetcher waits on the LIVE_FETCH activation gate.
 *
 * DOCTRINE (informational, NOT advice): Furlong identifies/compares/reality-
 * checks financing PATHS from public program data + property-derived figures.
 * It is not a lender/broker/advisor, makes no credit/qualification decision, and
 * never decides for the user. "A program fitting a project is not the same as
 * you qualifying." Every figure is a RANGE with basis + as-of date — never a
 * fabricated single number. Sequencing: build AFTER discovery merges and the
 * property + ordinance layers are live (this node consumes their outputs).
 */

import type { AssetClass } from "../universalIntentClassifier";

export const FINANCING_NODE_LIVE = false;
export const DISCLAIMER_COUNSEL_REVIEW_REQUIRED = true;
/** No live rate/loan-data fetcher until this is cleared by human review. */
export const FINANCING_LIVE_FETCH_ACTIVE = false;

// ── Derived project-cost RANGE (the inversion: from property, not typed) ─────
export interface RangeWithBasis {
  low: number | null;
  high: number | null;
  basis: string;        // where the figure comes from
  lastVerified: string; // as-of date the underlying data was checked
  framing: string;      // in-line uncertainty note
}

export interface DerivedProjectCost {
  acquisition: RangeWithBasis;       // listing/comps/recorded sale
  buildout: RangeWithBasis;          // driven by intended use
  softCosts: RangeWithBasis;         // permits/fees (ordinance layer) + contingency
  total: RangeWithBasis;             // = the comparison input, run at low/mid/high
  /** Optional power-user override — never required. */
  userOverride: number | null;
}

// ── Program registry (selected by asset/use class; ag foregrounded) ──────────
export interface FinancingProgram {
  id: string;
  name: string;
  family: "SBA" | "USDA" | "FarmCredit" | "Other";
  fitsAsset: AssetClass[];
  citation: string; // public federal rule citation
}

export const FINANCING_PROGRAMS: FinancingProgram[] = [
  // Agricultural / land — FOREGROUNDED for Furlong's base.
  { id: "usda-bi", name: "USDA Business & Industry (B&I)", family: "USDA", fitsAsset: ["agricultural", "commercial", "specialty"], citation: "7 CFR Part 5001; 91 FR 11272" },
  { id: "usda-fsa-farm", name: "USDA FSA Farm Ownership / Operating Loans", family: "USDA", fitsAsset: ["agricultural"], citation: "7 U.S.C. §1922 et seq.; 7 CFR Part 764" },
  { id: "farm-credit", name: "Farm Credit System lenders", family: "FarmCredit", fitsAsset: ["agricultural"], citation: "12 U.S.C. §2001 et seq." },
  { id: "usda-reap", name: "USDA REAP / rural energy & development", family: "USDA", fitsAsset: ["agricultural", "commercial"], citation: "7 U.S.C. §8107" },
  // CRE / business — SBA centered.
  { id: "sba-504", name: "SBA 504 (CDC/504)", family: "SBA", fitsAsset: ["commercial", "institutional", "specialty"], citation: "SBA SOP 50 10 8 (eff. 2026-03-01)" },
  { id: "sba-7a", name: "SBA 7(a)", family: "SBA", fitsAsset: ["commercial", "institutional"], citation: "SBA SOP 50 10 8; SBA Notice 5000-872051" },
  { id: "sba-express", name: "SBA Express", family: "SBA", fitsAsset: ["commercial"], citation: "SBA SOP 50 10 8" },
];

/** Programs that fit an asset class — ag/USDA/FSA first for land. */
export function programsForAsset(assetClass: AssetClass): FinancingProgram[] {
  const fit = FINANCING_PROGRAMS.filter((p) => p.fitsAsset.includes(assetClass));
  const rank = (p: FinancingProgram) => (assetClass === "agricultural" ? (p.family === "SBA" ? 1 : 0) : (p.family === "SBA" ? 0 : 1));
  return [...fit].sort((a, b) => rank(a) - rank(b));
}

// ── Public data sources (citation only — NO live fetcher in this contract) ───
export const FINANCING_DATA_SOURCES = [
  "SBA SOP 50 10 8 (eff. 2026-03-01)",
  "SBA Notice 5000-872051 (FY2026 fee schedule)",
  "Federal Register 91 FR 11272 (USDA B&I FY2026 rule)",
  "7 CFR Part 5001; 7 CFR §5001.454(d); 7 U.S.C. §1932(a)",
  "USDA FSA farm-loan authorities (7 U.S.C. §1922 et seq.) where surfaced",
  "FRED series DPRIME, DGS10, SOFR30DAYAVG",
  "NADCO / DCFC monthly 504 debenture pricing",
] as const;

/** Locked doctrine line — always visible on the node. */
export const PROGRAM_FIT_NOT_QUALIFY = "A program fitting this project is not the same as you qualifying.";

// ── Furlong disclaimer — DRAFT (counsel must review before publish) ──────────
export const FINANCING_DISCLAIMER_DRAFT =
  "Financing comparison — informational only. This comparison is generated from publicly available federal " +
  "program data and FOIA loan-level datasets, combined with the property facts you provided or that we derived " +
  "from public records, for preliminary, educational comparison only. It is not a loan offer, loan commitment, " +
  "credit or underwriting decision, or financial, investment, tax, or legal advice. Furlong is not a lender, " +
  "broker, or financial advisor — it does not lend, commit funds, decide credit or eligibility, recommend a loan, " +
  "or issue approvals. A program fitting a project is not the same as you qualifying. Actual terms, rates, fees, " +
  "and borrowing capacity depend on the lender, your creditworthiness, collateral, the specific project, " +
  "capital-market conditions, and regulatory changes, and require review by a licensed professional. Figures are " +
  "shown as ranges with their basis and the date the underlying rates and rules were checked, and may change. " +
  "Anonymous: no information you enter is sold, or submitted to any lender or provider, without your explicit " +
  "action. To act on this, you can connect with a licensed lender or feasibility provider.";

/** The node may render only when live AND counsel has cleared the disclaimer. */
export function financingNodeRenderable(disclaimerApprovedByCounsel: boolean): boolean {
  return FINANCING_NODE_LIVE && disclaimerApprovedByCounsel && !DISCLAIMER_COUNSEL_REVIEW_REQUIRED;
}

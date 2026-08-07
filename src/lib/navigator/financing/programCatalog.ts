/**
 * programCatalog — the STATIC federal financing-program registry (names,
 * families, asset fit, public rule citations). Split out of the gated
 * financingNodeContract (sweep fix 2026-08-06) so rendered surfaces can
 * cite programs WITHOUT importing the deferred financing node — the
 * node's separability lock (verify:financing-node) stays intact. This
 * module is citation metadata only: no rates, no fetchers, no disclaimer,
 * no determinations.
 */

import type { AssetClass } from "@/lib/navigator/universalIntentClassifier";

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

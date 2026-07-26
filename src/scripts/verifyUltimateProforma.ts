/**
 * verify:ultimate-proforma — the Master Template v2.1 gate + render harness.
 *
 * EVERY name, figure, and contact below is invented — no real borrower data
 * (the founder's template and package are FORMAT/CONTENT authority only).
 *
 * Proves, in order:
 *  1. The PART V generation gate BLOCKS output when REQUIRED intake is missing
 *     (good-standing certs removed → GenerationGateError naming U1).
 *  2. Lane conditionality: a Lane A build renders Module A only.
 *  3. A complete Lane A input renders the full document to a sample PDF.
 */
import * as fs from "node:fs";

import { generateLoanProformaPdf } from "@/lib/pdf/generateLoanProformaPdf";
import {
  buildUltimateProformaDocument,
  evaluateGenerationGate,
  GenerationGateError,
  type UltimateProformaInput,
} from "@/lib/pdf/ultimateProformaTemplate";

const YEARS = ["2024A", "2025A", "2026A", "2027P", "2028P", "2029P", "2030P", "2031P", "2032P", "2033P", "2034P", "2035P", "2036P"];
const series = (start: number, step: number) => YEARS.map((_, i) => `$${(start + step * i).toLocaleString()}`);

const input: UltimateProformaInput = {
  branding: { logoPath: "/brand/furlong-logo.png" },
  manifest: {
    clientLegalName: "Meadowline Farm, Inc. / Stonebriar Holdings, Inc.",
    guarantorNames: "Jordan Q. Sample, PE",
    lane: "A",
    programVariant: "SBA 7(a) — Preferred Lender",
    lenderContactAndInstitution: "A. Banker, VP SBA BDO — Sample Community Bank",
    documentId: "FURLONG-MEADOWLINE-A-2026-01",
    generationDate: "2026-07-26",
  },
  partI: {
    identity: {
      operatingEntity: "Meadowline Farm, Inc. — VA S-corp, EIN 00-0000001, operations began 2019",
      holdingEntity: "Stonebriar Holdings, Inc. — VA S-corp, EIN 00-0000002 (real estate)",
      dbaNotes: "Styled 'Meadowline Farm'; registered names follow IRS/state records",
      taxElectionStatus: "S-elections current for both entities",
      goodStandingCerts: "VA SCC certificates for both entities, issued 2026-07-01",
      ownershipTable: "Jordan Q. Sample — 100% of both entities; TIN and home address on file",
      guarantorProfile: "Jordan Q. Sample, PE — operator since 2019; independent CPA oversight",
      creditContext: "One late tradeline 2021, resolved",
      creditEventsDocumented: true,
      primaryContact: "Jordan Q. Sample · jordan@example.com · 555-010-0102",
    },
    sourcesAndUses: {
      rows: [
        { use: "Purchase — Meadowline Farm, VA (150 ac)", amount: "$2,400,000", notes: "Primary residence; 20-stall barn" },
        { use: "Purchase — Stonebriar Creek Farm, NC (120 ac)", amount: "$800,000", notes: "Premium hay operation" },
        { use: "Existing NC mortgage payoff (rolled in)", amount: "$90,000", notes: "Retired at close; one consolidated note" },
      ],
      totalProjectCost: "$3,290,000",
      loanAmount: "$3,290,000",
      loanCalcBasis: "SBA 7(a): 90% of purchase + payoff; under $5M — 85% guarantee tier",
      injectionProvided: "$330,000",
      injectionSource: "Unencumbered equipment equity — sole-owned; valuation per dealer appraisal 2026-06",
    },
    collateral: {
      discountPct: "80%",
      rows: [
        { asset: "Meadowline Farm, VA (purchased)", stated: "$2,400,000", discounted: "$1,920,000", lien: "Financed — first lien" },
        { asset: "Stonebriar Creek Farm, NC (purchased)", stated: "$800,000", discounted: "$640,000", lien: "Financed — first lien" },
        { asset: "Owned equipment", stated: "$1,200,000", discounted: "$960,000", lien: "Pledged — additional" },
      ],
      statedTotal: "$4,400,000",
      discountedTotal: "$3,520,000",
      coveragePct: "107%",
      guaranteesAndExclusions: "Jordan Q. Sample guarantees (100% owner). No third-party or trust assets pledged.",
    },
    guarantorPfs: {
      asOfDate: "2026-06-30",
      docBasis: "IRS transcripts, filed returns, appraisals/AVMs",
      assets: [
        { label: "Cash — checking / savings", value: "$70,000" },
        { label: "Retirement accounts (IRA / 401k)", value: "$1,400,000" },
        { label: "Business equity — both entities (book basis)", value: "$1,600,000" },
        { label: "Vehicles (personal)", value: "$30,000" },
      ],
      liabilitiesAndIncome: [
        { label: "Student loans", value: "$18,000" },
        { label: "Auto loan", value: "$14,000" },
        { label: "Wages (documented, 2025)", value: "$210,000" },
        { label: "Consulting income (recurring)", value: "$120,000" },
      ],
      totalAssets: "$3,100,000",
      totalLiabilities: "$32,000",
      netWorth: "$3,068,000",
      totalAnnualIncome: "$330,000",
      contingentAssets: "Pending equipment-lease claim, est. $40k–$90k — excluded from totals",
    },
    balanceSheet: {
      current: {
        assets: "Cash $70k; hay inventory 400t @ $210/t; growing crops 80 ac @ $340/ac; supplies $12k",
        liabilities: "Payables $9k; taxes payable $6k; current portions of term debt $38k",
      },
      intermediate: {
        assets: "Machinery & equipment $1,200k (register I.5); breeding stock 40 hd @ $2,100",
        liabilities: "Term note (tractor) 5 yr — $62k @ 6.9%",
      },
      longTerm: {
        assets: "Buildings & improvements $850k; land 270 ac total / 190 crop ac, 100% owned",
        liabilities: "Mortgages per I.2 (retired at close)",
      },
      totalFarmAssets: "$4,690,000",
      totalAssetsCombined: "$7,790,000",
      totalFarmLiabilities: "$115,000",
      totalEquity: "$7,675,000",
    },
    assetRegisters: {
      equipmentPledged: true,
      equipmentRegister: "22 items — qty, description, manufacturer, size/type, condition, year, serial #, value (full register attached)",
      vehiclesPledged: false,
      isAgOperation: true,
      cropRegister: "Hay 400t @ $210; small grain 60 ac @ $290/ac; growing crops itemized",
      isLivestockOperation: true,
      livestockRegister: "Beef 38 hd avg 1,150 lb; sheep 60 hd; layers 400 — raised/purchased flagged",
    },
    revenueUnits: [
      {
        unitName: "Meadowline Farm (VA)",
        unitDescription: "150 ac — diversified produce, value-added livestock, lodging, private equine layup",
        lines: [
          { label: "Vegetables (8 ac)", conservative: "$176,000", stabilized: "$176,000" },
          { label: "Cut flowers (6 ac)", conservative: "$132,000", stabilized: "$132,000" },
          { label: "Equine layup board", conservative: "$180,000", stabilized: "$204,000" },
          { label: "Guest-wing B&B", conservative: "$36,000", stabilized: "$36,000" },
          { label: "Livestock (beef, sheep, poultry)", conservative: "$67,700", stabilized: "$75,800" },
          { label: "Other (honey, mushrooms, orchard)", conservative: "$35,000", stabilized: "$64,000" },
        ],
        subtotalConservative: "$626,700",
        subtotalStabilized: "$687,800",
        methodology: "County-market pricing; layup at 75% modeled occupancy; ramp per Section IV.2",
      },
      {
        unitName: "Stonebriar Creek (NC)",
        unitDescription: "120 ac; ~80 ac premium hay into the regional shortage market",
        lines: [
          { label: "Premium hay — alfalfa/clover (~80 ac)", conservative: "$410,000", stabilized: "$410,000" },
          { label: "Vegetables + flowers (6 ac)", conservative: "$132,000", stabilized: "$132,000" },
          { label: "Mushrooms + cottage rental", conservative: "$30,000", stabilized: "$36,000" },
        ],
        subtotalConservative: "$572,000",
        subtotalStabilized: "$578,000",
        methodology: "Hay at county cash-bid average less hauling; winter-premium timing via storage barn",
      },
    ],
    workingCapital: {
      rows: [
        { item: "Debt-service reserve (12 months)", amount: "$268,000", justification: "Pre-funds loan payments while revenue ramps" },
        { item: "Labor (2 FTE + burden)", amount: "$120,000", justification: "Two on-site employees @ $55k + payroll burden" },
        { item: "Operating lines (utilities, insurance, feed, marketing)", amount: "$77,000", justification: "Row detail retained in intake" },
        { item: "Professional services · contingency", amount: "$21,000", justification: "CPA, attorney; operational contingency" },
      ],
      total: "$486,000",
      shortfallNote: "Conservative reserve; modeled net Year-1 shortfall is far smaller",
    },
    upside: {
      items: [
        { opportunity: "Value-added dairy expansion", basisAndExclusion: "Commercial-kitchen maturity; excluded from all ratios" },
        { opportunity: "Equine capacity beyond model", basisAndExclusion: "20-stall barn vs modeled count; excluded from all ratios" },
      ],
    },
  },
  partII: {
    laneRationale:
      "Operating small business acquiring specialized ag real estate under $5M with an EPC/OC structure — squarely Lane A. FSA limits are below project size; no public-entity revenue pledge exists for Lane C.",
    eligibilityNarrative:
      "Credit-elsewhere: conventional lenders do not write mortgages on 120+ acre specialized agricultural parcels; documented declinations retained in intake.",
    lanesRejected: "B — FSA limits below project size; C — no project-finance revenue pledge",
  },
  moduleA: {
    applicants: [
      {
        designation: "OC",
        legalName: "Meadowline Farm, Inc.",
        naics: "112990 (matches IRS filings)",
        samUei: "SAMPLEUEI001",
        entityType: "S-corp; no special ownership type",
        addresses: "Business + project: 100 Meadowline Ln, Sample County, VA (no P.O. Box)",
        employees: "3 incl. owner (all affiliates); 2 FTE created",
        loanPurposeAllocation: "RE purchase $3,200,000 · debt refi $90,000 (ties to I.2)",
        ownershipAndDemographics: "Jordan Q. Sample — 100%, TIN/home address on file; demographics declined (voluntary)",
      },
      {
        designation: "EPC",
        legalName: "Stonebriar Holdings, Inc.",
        naics: "531190 (matches IRS filings)",
        samUei: "None (attested)",
        entityType: "S-corp; no special ownership type",
        addresses: "Business + project: 100 Meadowline Ln, Sample County, VA (no P.O. Box)",
        employees: "0 (passive real-estate holder)",
        loanPurposeAllocation: "RE purchase allocation per EPC/OC split (ties to I.2)",
        ownershipAndDemographics: "Jordan Q. Sample — 100%, TIN/home address on file; demographics declined (voluntary)",
      },
    ],
    questionAnswers: [
      { number: 1, answer: "No" },
      { number: 2, answer: "No" },
      { number: 3, answer: "Yes", detail: "EPC/OC affiliate — Addendum A attached (TINs, %, relationship)" },
      { number: 4, answer: "No" },
      { number: 5, answer: "No" },
      { number: 6, answer: "No" },
      { number: 7, answer: "No" },
      { number: 8, answer: "No" },
      { number: 9, answer: "No" },
      { number: 10, answer: "No" },
      { number: 11, answer: "No" },
      { number: 12, answer: "No" },
      { number: 13, answer: "No" },
    ],
    epcOcLease: "Written EPC→OC lease executed; rent ≤ debt service + expenses",
    floodDeterminations: "Zone X both parcels (FEMA NFHL); no mandatory purchase requirement",
  },
  partIV: {
    twoCase: {
      revenue: { conservative: "$1,198,700", stabilized: "$1,265,800" },
      opex: { conservative: "$(820,000)", stabilized: "$(878,000)" },
      noi: { conservative: "$378,700", stabilized: "$387,800" },
      margins: { conservative: "32%", stabilized: "31%" },
      debtService: "$268,000",
      dscrStandalone: { conservative: "1.41x", stabilized: "1.45x" },
      dscrGlobal: { conservative: "1.9x", stabilized: "2.0x" },
      dscrFloor: "1.25x",
      stressDescription: "hay price −20%",
      dscrStress: "1.27x",
    },
    debtServiceAssumptions: { rate: "Prime + 2.25%", term: "25 yr", amortization: "Fully amortizing after IO", ioPeriod: "6 months" },
    yearModel: {
      yearLabels: YEARS,
      rows: [
        { family: "Revenue", label: "Total by segment (ties to I.6)", values: series(940_000, 32_000) },
        { family: "Expenses", label: "Fixed + variable + D&A", values: series(700_000, 18_000) },
        { family: "Income", label: "Net Operating Income", values: series(240_000, 14_000) },
        { family: "Cash flow", label: "FFO / Free Cash Flow", values: series(205_000, 12_000) },
        { family: "Debt", label: "Service (interest + principal; IO months 1–6)", values: YEARS.map((_, i) => (i < 3 ? "—" : "$268,000")) },
        { family: "Coverage", label: "DSCR standalone (1.25x floor)", values: YEARS.map((_, i) => (i < 3 ? "—" : `${(1.25 + 0.03 * (i - 3)).toFixed(2)}x`)) },
      ],
    },
  },
};

/* 1 — the gate BLOCKS missing REQUIRED intake. */
const broken: UltimateProformaInput = JSON.parse(JSON.stringify(input));
broken.partI.identity.goodStandingCerts = "";
broken.partII.laneRationale = "";
let blocked = false;
try {
  buildUltimateProformaDocument(broken);
} catch (e) {
  blocked = e instanceof GenerationGateError && e.failures.some((f) => f.id === "U1") && e.failures.some((f) => f.id === "U13");
}
if (!blocked) {
  console.error("✗ GATE FAILURE: missing REQUIRED intake did not block generation");
  process.exit(1);
}

/* 2 — lane conditionality: Lane A renders Module A only. */
const model = buildUltimateProformaDocument(input);
const titles = model.sections.map((s) => s.title).join(" | ");
if (!/MODULE A/.test(titles) || /MODULE B|MODULE C/.test(titles)) {
  console.error("✗ LANE FAILURE: Lane A build must render Module A and only Module A");
  process.exit(1);
}

/* 3 — full render. */
const gate = evaluateGenerationGate(input);
const docStream = generateLoanProformaPdf(model);
const chunks: Buffer[] = [];
docStream.on("data", (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
docStream.on("end", () => {
  const out = "/tmp/furlong-ultimate-proforma-sample.pdf";
  fs.writeFileSync(out, Buffer.concat(chunks));
  console.log("━━━ verify:ultimate-proforma ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  gate blocks missing REQUIRED intake: yes (U1 + U13 named)");
  console.log("  lane conditionality (A only):        yes");
  console.log(`  gate on complete input:              ${gate.length === 0 ? "green" : "RED"}`);
  console.log(`  sections rendered:                   ${model.sections.length}`);
  console.log(`  sample:                              ${out} (${Buffer.concat(chunks).length} bytes)`);
  console.log("✓ verify:ultimate-proforma PASS");
});

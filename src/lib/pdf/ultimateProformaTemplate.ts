import type { LoanProformaInput, ProformaSection, ProformaTable } from "@/lib/pdf/generateLoanProformaPdf";

/**
 * FURLONG Ultimate Pro Forma & Loan Report — Master Template v2.1.
 *
 * TEMPLATE AUTHORITY (founder direction 2026-07-26): the founder's
 * FURLONG_Ultimate_Pro_Forma_Report_Template_v2_1.docx governs the CONTENT of
 * the ultimate pro forma; the banker-accepted package clone
 * (generateLoanProformaPdf.ts) governs its LOOK. This module is the bridge:
 * a typed document model mirroring the template's Parts I–V, the PART V
 * generation gate as EXECUTABLE code, and a builder that emits the render
 * model for the existing generator.
 *
 * Template rules carried into code:
 *  - Parts I, IV, V render for every customer; Part II records the lane match;
 *    Part III renders ONLY the matched lane's module (A · SBA 7(a),
 *    B · USDA/FSA, C · Infrastructure/project finance).
 *  - REQUIRED marks generation-blocking intake: evaluateGenerationGate()
 *    returns every unmet blocking item, and buildUltimateProformaDocument()
 *    refuses to build a customer output while the gate is red (a DRAFT build
 *    is allowed only with an explicit draft flag and carries a DRAFT banner).
 *  - Module A honors SBA Form 1919 (02/2025) conduct rules: Question 4 is
 *    PERSONALLY INITIALED (rendered as an initial box, never prefilled) and
 *    certifications are acknowledgments executed at signing — never rendered
 *    as already made. Ownership demographics are VOLUNTARY and never block.
 *  - Upside (I.8) never enters DSCR, collateral, or injection math.
 *  - No real borrower data lives in this module: fixed template prose only.
 */

export type LoanLane = "A" | "B" | "C";

export const LANE_LABELS: Record<LoanLane, string> = {
  A: "Lane A — SBA 7(a)",
  B: "Lane B — USDA / FSA",
  C: "Lane C — Infrastructure / Project Finance",
};

/* ── Input model (Parts I–IV; Part V is computed) ─────────────────────────── */

export interface UltimateProformaInput {
  authority: {
    reviewedAt: string;
    formVersion: string;
    officialSourceRefs: string[];
    programTermsNote: string;
    coverageThresholdBasis: string;
  };
  branding: { logoPath: string };
  manifest: {
    clientLegalName: string;
    guarantorNames: string;
    lane: LoanLane;
    programVariant?: string;
    lenderContactAndInstitution: string;
    /** FURLONG-<CLIENT>-<LANE>-<YYYY>-<NN> — caller allocates; builder renders. */
    documentId: string;
    generationDate: string;
  };
  partI: {
    identity: {
      operatingEntity: string;
      holdingEntity?: string;
      dbaNotes?: string;
      taxElectionStatus?: string;
      goodStandingCerts: string; // REQUIRED (U1)
      ownershipTable: string; // REQUIRED (U2)
      guarantorProfile: string;
      creditContext?: string; // U12 pairs with letters of explanation
      creditEventsDocumented?: boolean;
      primaryContact: string;
    };
    sourcesAndUses: {
      rows: Array<{ use: string; amount: string; notes: string }>;
      totalProjectCost: string;
      loanAmount: string;
      loanCalcBasis: string; // U3
      injectionProvided: string;
      injectionSource: string;
    };
    collateral: {
      discountPct: string;
      rows: Array<{ asset: string; stated: string; discounted: string; lien: string }>;
      statedTotal: string;
      discountedTotal: string;
      coveragePct: string; // U4
      guaranteesAndExclusions: string;
    };
    guarantorPfs: {
      asOfDate: string; // U5
      docBasis: string;
      exclusions?: string;
      assets: Array<{ label: string; value: string }>;
      liabilitiesAndIncome: Array<{ label: string; value: string }>;
      totalAssets: string;
      totalLiabilities: string;
      netWorth: string;
      totalAnnualIncome: string;
      contingentAssets?: string;
    };
    balanceSheet: {
      // FSA-2037 three-tier discipline for every customer (U6).
      current: { assets: string; liabilities: string };
      intermediate: { assets: string; liabilities: string };
      longTerm: { assets: string; liabilities: string };
      totalFarmAssets: string;
      totalAssetsCombined: string;
      totalFarmLiabilities: string;
      totalEquity: string;
    };
    assetRegisters: {
      // U7 — blocking where pledged/operated.
      equipmentRegister?: string;
      equipmentPledged: boolean;
      vehicleRegister?: string;
      vehiclesPledged: boolean;
      cropRegister?: string;
      isAgOperation: boolean;
      livestockRegister?: string;
      isLivestockOperation: boolean;
    };
    revenueUnits: Array<{
      // U8 — itemized, no rollups; subtotals tie to Part IV.
      unitName: string;
      unitDescription: string;
      lines: Array<{ label: string; conservative: string; stabilized: string }>;
      subtotalConservative: string;
      subtotalStabilized: string;
      methodology: string;
    }>;
    workingCapital: {
      // U11
      rows: Array<{ item: string; amount: string; justification: string }>;
      total: string;
      shortfallNote: string;
    };
    upside: {
      items: Array<{ opportunity: string; basisAndExclusion: string }>;
    };
  };
  partII: {
    laneRationale: string; // REQUIRED (U13)
    eligibilityNarrative: string; // REQUIRED (U13)
    lanesRejected?: string;
  };
  moduleA?: {
    applicants: Array<{
      designation: "OC" | "EPC";
      legalName: string;
      naics: string;
      samUei: string;
      entityType: string;
      addresses: string;
      employees: string;
      loanPurposeAllocation: string;
      ownershipAndDemographics: string;
    }>;
    questionAnswers: Array<{ number: number; answer: "Yes" | "No"; detail?: string }>;
    epcOcLease?: string;
    feeDisclosures?: string;
    floodDeterminations?: string;
    refinanceBusinessPurposeDocs?: string;
    babaaSourcingPlan?: string;
  };
  moduleB?: {
    scheduleNotes?: string;
    countyOffice: string;
  };
  moduleC?: {
    historicalYears: number; // template mandates 3
    projectedYears: number; // template mandates 10
    publicSectorCredit: boolean;
    tranches: string;
  };
  partIV: {
    twoCase: {
      revenue: { conservative: string; stabilized: string };
      opex: { conservative: string; stabilized: string };
      noi: { conservative: string; stabilized: string };
      margins: { conservative: string; stabilized: string };
      debtService: string;
      dscrStandalone: { conservative: string; stabilized: string };
      dscrGlobal: { conservative: string; stabilized: string };
      dscrFloor: string;
      stressDescription: string;
      dscrStress: string;
    };
    debtServiceAssumptions: { rate: string; term: string; amortization: string; ioPeriod: string }; // U9
    yearModel: {
      // U10 — up to 3 historical + 10 projected; columns chunk portrait-safe.
      yearLabels: string[];
      rows: Array<{ family: string; label: string; values: string[] }>;
    };
  };
}

/* ── PART V — the generation gate, as code ────────────────────────────────── */

export interface GateFailure {
  id: string;
  item: string;
}

const has = (s: string | undefined | null): boolean => Boolean(s && s.trim().length > 0);

export function evaluateGenerationGate(input: UltimateProformaInput): GateFailure[] {
  const f: GateFailure[] = [];
  const p = input.partI;

  if (!has(p.identity.goodStandingCerts)) f.push({ id: "U1", item: "Good-standing certificates for every borrowing entity (I.1)" });
  if (!has(p.identity.ownershipTable)) f.push({ id: "U2", item: "Complete ownership tables — every ≥20% owner with TIN and address" });
  if (!has(p.sourcesAndUses.loanCalcBasis) || p.sourcesAndUses.rows.length === 0)
    f.push({ id: "U3", item: "Sources & uses reconcile; loan amount ties to stated calculation basis" });
  if (!has(p.collateral.coveragePct) || p.collateral.rows.length === 0)
    f.push({ id: "U4", item: "Collateral schedule with stated + discounted values; coverage computed" });
  if (!has(p.guarantorPfs.asOfDate) || !has(p.guarantorPfs.docBasis))
    f.push({ id: "U5", item: "Guarantor PFS complete with documentation basis and as-of date" });
  if (!has(p.balanceSheet.totalEquity))
    f.push({ id: "U6", item: "Business balance sheet in the three-tier structure (I.4)" });
  if (p.assetRegisters.equipmentPledged && !has(p.assetRegisters.equipmentRegister))
    f.push({ id: "U7", item: "Equipment register (serial-level) — equipment is pledged" });
  if (p.assetRegisters.vehiclesPledged && !has(p.assetRegisters.vehicleRegister))
    f.push({ id: "U7", item: "Vehicle register (VIN-level) — vehicles are pledged" });
  if (p.assetRegisters.isAgOperation && !has(p.assetRegisters.cropRegister))
    f.push({ id: "U7", item: "Crop inventory & growing-crops register — ag operation" });
  if (p.assetRegisters.isLivestockOperation && !has(p.assetRegisters.livestockRegister))
    f.push({ id: "U7", item: "Livestock & products register — livestock operation" });
  if (p.revenueUnits.length === 0 || p.revenueUnits.some((u) => u.lines.length === 0))
    f.push({ id: "U8", item: "Revenue segments itemized per unit; subtotals tie to Part IV" });
  const a = input.partIV.debtServiceAssumptions;
  if (![a.rate, a.term, a.amortization, a.ioPeriod].every(has))
    f.push({ id: "U9", item: "Debt-service assumptions stated (rate, term, amortization, IO)" });
  if (input.partIV.yearModel.yearLabels.length === 0 || input.partIV.yearModel.rows.length === 0)
    f.push({ id: "U10", item: "Year-by-year model complete; two-case summary ties out" });
  if (p.workingCapital.rows.length === 0)
    f.push({ id: "U11", item: "Working capital detailed with justifications" });
  if (has(p.identity.creditContext) && !p.identity.creditEventsDocumented)
    f.push({ id: "U12", item: "Credit events documented with Letters of Explanation" });
  if (!has(input.partII.laneRationale) || !has(input.partII.eligibilityNarrative))
    f.push({ id: "U13", item: "Lane match recorded with rationale and eligibility narrative (Part II)" });

  // Lane-specific blocking items.
  if (input.manifest.lane === "A") {
    const m = input.moduleA;
    if (!m || m.applicants.length === 0)
      f.push({ id: "A", item: "Form 1919 per co-applicant — Part A fields complete" });
    else {
      const q = new Map((m.questionAnswers ?? []).map((x) => [x.number, x]));
      for (let n = 1; n <= 13; n += 1) {
        if (!q.has(n)) f.push({ id: "A", item: `Form 1919 Question ${n} unconfirmed` });
      }
      for (const ans of m.questionAnswers)
        if (ans.answer === "Yes" && !has(ans.detail))
          f.push({ id: "A", item: `Form 1919 Question ${ans.number} answered Yes without required detail` });
    }
  }
  if (input.manifest.lane === "B" && !input.moduleB?.countyOffice)
    f.push({ id: "B", item: "FSA county-office filing package identified" });
  if (input.manifest.lane === "C") {
    const m = input.moduleC;
    if (!m || m.historicalYears < 3 || m.projectedYears < 10)
      f.push({ id: "C", item: "3 historical + 10 projected years with per-tranche debt schedules" });
  }
  return f;
}

/* ── Fixed template content (Part II matrix, Module A/B/C, gate list) ─────── */

const PART_II_MATRIX: ProformaTable = {
  columns: [
    { header: "Criterion", width: 0.16, align: "left" },
    { header: "Lane A — SBA 7(a)", width: 0.28, align: "left" },
    { header: "Lane B — USDA / FSA", width: 0.28, align: "left" },
    { header: "Lane C — Infrastructure / Project", width: 0.28, align: "left" },
  ],
  rows: [
    { cells: ["Typical size", "Up to $5,000,000 for most 7(a) loans; guaranty percentage varies by loan amount and program and must be confirmed from current SBA authority", "FSA direct/guaranteed program limits (below large-project scale)", "Large-scale; multi-tranche (senior + subordinate/WIFIA-style)"] },
    { cells: ["Borrower / use fit", "Operating small business; RE purchase, construction, equipment, refi, working capital; EPC/OC structures", "Family farm operations; ag RE, operating loans, farm ownership", "Public or project entities; infrastructure with long-dated revenue"] },
    { cells: ["Collateral character", "Commercial/ag RE + business assets; specialized collateral acceptable", "Farm RE, crops, livestock, equipment (FSA-2037 schedules)", "Project revenues / system net revenue pledges"] },
    { cells: ["Key eligibility test", "Credit-elsewhere: conventional financing unavailable on reasonable terms", "Program eligibility + size limits; county office filing", "LOI + investment-grade path; coverage & liquidity metrics"] },
    { cells: ["Coverage convention", "Standalone + global DSCR against the lender-specific threshold recorded in Part IV", "Feasibility per farm business plan (FSA-2037 series)", "Senior DSCR & Total DSCR by tranche; FFO/interest; days cash"] },
    { cells: ["Governing intake", "Current SBA Form 1919 (version and effective date bound in the authority snapshot)", "FSA-2037 (+ companion FSA plan forms)", "LOI pro forma (3-yr historical + 10-yr projection)"] },
  ],
};

const MODULE_A_QUESTIONS: Array<{ n: number; q: string }> = [
  { n: 1, q: "Debarred / suspended / ineligible / in bankruptcy (either co-applicant or any Associate)?" },
  { n: 2, q: "Delinquent or defaulted on any federal loan (SBA, USDA, FSA, FHA…) or guarantor on one?" },
  { n: 3, q: "Applicant or any owner owns another business?" },
  { n: 4, q: "Incarcerated / sentence / indictment for felony or financial-misconduct crime? (PERSONALLY INITIALED)" },
  { n: 5, q: "Exports now or planned (or EWCP)?" },
  { n: 6, q: "Fee paid/committed to lender, packager, referral agent, or broker?" },
  { n: 7, q: "Revenue from gambling, loan packaging, lending, lobbying, or prurient content?" },
  { n: 8, q: "≥10% owner an SBA employee or household member?" },
  { n: 9, q: "Any party a former SBA employee separated < 1 year?" },
  { n: 10, q: "≥10% owner / household member in Congress or legislative/judicial branch?" },
  { n: 11, q: "≥10% owner / household member a federal employee or military GS-13+?" },
  { n: 12, q: "≥10% owner / household member on Small Business Advisory Council or SCORE?" },
  { n: 13, q: "Any present legal action (including divorce)?" },
];

const MODULE_A_CERTIFICATIONS: string[] = [
  "The applicant must review and execute the current SBA Form 1919 and lender-required certifications at signing; this Furlong preparation report does not replace the official form.",
  "No certification, eligibility conclusion, legal representation, or program approval is pre-made by Furlong.",
  "Current program terms, eligibility rules, fees, guaranty percentages, collateral requirements, and environmental or flood obligations must be confirmed by the participating lender against current official SBA authority.",
  "Any applicant answer requiring explanation remains subject to lender and SBA review and must be supported by the source documents identified in the evidence manifest.",
];

const GATE_ITEMS: Array<{ id: string; item: string }> = [
  { id: "U1", item: "Identity & governance complete (I.1) incl. good-standing certificates for every borrowing entity" },
  { id: "U2", item: "Complete ownership tables — every ≥20% owner identified (TIN, address); guarantors confirmed" },
  { id: "U3", item: "Sources & uses reconcile; loan amount ties to stated calculation basis" },
  { id: "U4", item: "Collateral schedule with stated + discounted values; coverage computed" },
  { id: "U5", item: "Guarantor PFS complete with documentation basis and as-of date" },
  { id: "U6", item: "Business balance sheet in three-tier structure (I.4) for every borrowing entity" },
  { id: "U7", item: "Asset registers complete where pledged/operated (I.5) — serial/VIN-level" },
  { id: "U8", item: "Revenue segments itemized; subtotals tie to Part IV" },
  { id: "U9", item: "Debt-service assumptions stated (rate, term, amortization, IO)" },
  { id: "U10", item: "Year-by-year model complete (IV.2); two-case summary ties out" },
  { id: "U11", item: "Working capital detailed with justifications" },
  { id: "U12", item: "Credit events documented with Letters of Explanation" },
  { id: "U13", item: "Lane match recorded with rationale and eligibility narrative (Part II)" },
];

/* ── Builder — emits the render model for generateLoanProformaPdf ─────────── */

export class GenerationGateError extends Error {
  failures: GateFailure[];
  constructor(failures: GateFailure[]) {
    super(
      `Generation gate is not clear — ${failures.length} blocking item(s): ` +
        failures.map((x) => `[${x.id}] ${x.item}`).join("; ")
    );
    this.name = "GenerationGateError";
    this.failures = failures;
  }
}

export function buildUltimateProformaDocument(
  input: UltimateProformaInput,
  opts: { allowDraft?: boolean } = {}
): LoanProformaInput {
  const failures = evaluateGenerationGate(input);
  if (failures.length > 0 && !opts.allowDraft) throw new GenerationGateError(failures);
  const draft = failures.length > 0;

  const m = input.manifest;
  const p = input.partI;
  const laneLabel = LANE_LABELS[m.lane];

  const sections: ProformaSection[] = [];

  // Report manifest (the template's cover key-value block).
  sections.push({
    title: "REPORT MANIFEST",
    tables: [
      {
        table: {
          columns: [
            { header: "Item", width: 0.26, align: "left" },
            { header: "Detail", width: 0.74, align: "left" },
          ],
          rows: [
            { cells: ["Client", m.clientLegalName] },
            { cells: ["Guarantor(s)", m.guarantorNames] },
            { cells: ["Matched loan lane", `${laneLabel}${m.programVariant ? ` · ${m.programVariant}` : ""}`] },
            { cells: ["Lender / recipient", m.lenderContactAndInstitution] },
            { cells: ["Document ID", m.documentId] },
            { cells: ["Date / status", `${m.generationDate}  ·  CONFIDENTIAL — prepared for the named recipient only${draft ? "  ·  DRAFT — GENERATION GATE NOT CLEAR" : ""}`] },
          ],
        },
      },
    ],
  });

  // ── PART I — Universal Client Profile ──
  sections.push({
    title: "PART I — UNIVERSAL CLIENT PROFILE",
    paragraphs: ["Rendered for every customer, every lane. This is the data Furlong always captures."],
  });

  sections.push({
    title: "I.1 — Identity & Governance",
    tables: [
      {
        table: {
          columns: [
            { header: "Item", width: 0.34, align: "left" },
            { header: "Detail", width: 0.66, align: "left" },
          ],
          rows: [
            { cells: ["Operating entity", p.identity.operatingEntity] },
            ...(p.identity.holdingEntity ? [{ cells: ["Holding / passive entity", p.identity.holdingEntity] }] : []),
            ...(p.identity.dbaNotes ? [{ cells: ["DBA / tradenames", p.identity.dbaNotes] }] : []),
            ...(p.identity.taxElectionStatus ? [{ cells: ["Tax-election status", p.identity.taxElectionStatus] }] : []),
            { cells: ["Good-standing certificates", p.identity.goodStandingCerts] },
            { cells: ["Ownership table", p.identity.ownershipTable] },
            { cells: ["Guarantor(s)", p.identity.guarantorProfile] },
            ...(p.identity.creditContext ? [{ cells: ["Credit context / Letters of Explanation", p.identity.creditContext] }] : []),
            { cells: ["Primary contact", p.identity.primaryContact] },
          ],
        },
      },
    ],
  });

  sections.push({
    title: "I.2 — Transaction: Sources & Uses, Collateral, Equity",
    tables: [
      {
        table: {
          columns: [
            { header: "Sources & Uses", width: 0.4, align: "left" },
            { header: "Amount", width: 0.18 },
            { header: "Notes", width: 0.42 },
          ],
          rows: [
            ...p.sourcesAndUses.rows.map((r) => ({ cells: [r.use, r.amount, r.notes] })),
            { cells: ["TOTAL PROJECT COST", p.sourcesAndUses.totalProjectCost, "Must equal sum of uses"], emphasis: true },
            { cells: ["TOTAL LOAN REQUEST", p.sourcesAndUses.loanAmount, p.sourcesAndUses.loanCalcBasis], emphasis: true },
            { cells: ["Equity injection / borrower contribution", p.sourcesAndUses.injectionProvided, p.sourcesAndUses.injectionSource] },
          ],
        },
      },
      {
        table: {
          columns: [
            { header: "Collateral", width: 0.4, align: "left" },
            { header: "Stated Value", width: 0.2 },
            { header: `Discounted (${p.collateral.discountPct})`, width: 0.2 },
            { header: "Lien / Status", width: 0.2 },
          ],
          rows: [
            ...p.collateral.rows.map((r) => ({ cells: [r.asset, r.stated, r.discounted, r.lien] })),
            { cells: ["TOTAL / COVERAGE", p.collateral.statedTotal, p.collateral.discountedTotal, `${p.collateral.coveragePct} of loan`], emphasis: true },
          ],
        },
      },
    ],
    paragraphs: [`Guarantees & exclusions: ${p.collateral.guaranteesAndExclusions}`],
  });

  sections.push({
    title: "I.3 — Guarantor Personal Financial Statement",
    leadIns: [
      {
        text: `As of ${p.guarantorPfs.asOfDate} · documentation basis: ${p.guarantorPfs.docBasis}${p.guarantorPfs.exclusions ? ` · exclusions & rationale: ${p.guarantorPfs.exclusions}` : ""}`,
      },
    ],
    tables: [
      {
        table: {
          columns: [
            { header: "Assets", width: 0.7, align: "left" },
            { header: "Value", width: 0.3 },
          ],
          rows: [
            ...p.guarantorPfs.assets.map((r) => ({ cells: [r.label, r.value] })),
            { cells: ["TOTAL ASSETS", p.guarantorPfs.totalAssets], emphasis: true },
          ],
        },
      },
      {
        table: {
          columns: [
            { header: "Liabilities & Income", width: 0.7, align: "left" },
            { header: "Value", width: 0.3 },
          ],
          rows: [
            ...p.guarantorPfs.liabilitiesAndIncome.map((r) => ({ cells: [r.label, r.value] })),
            { cells: ["TOTAL LIABILITIES", p.guarantorPfs.totalLiabilities], emphasis: true },
            { cells: ["NET WORTH", p.guarantorPfs.netWorth], emphasis: true },
            { cells: ["TOTAL ANNUAL INCOME", p.guarantorPfs.totalAnnualIncome], emphasis: true },
          ],
        },
      },
    ],
    paragraphs: p.guarantorPfs.contingentAssets
      ? [`Contingent assets — disclosed, excluded from totals: ${p.guarantorPfs.contingentAssets}`]
      : [],
  });

  sections.push({
    title: "I.4 — Business Balance Sheet (FSA-2037 discipline)",
    leadIns: [
      {
        text: "Every customer's business balance sheet is captured in the FSA-2037 three-tier structure regardless of lane — the most granular of the source formats; it downgrades cleanly to any lender's schedule.",
      },
    ],
    tables: [
      {
        table: {
          columns: [
            { header: "Tier", width: 0.14, align: "left" },
            { header: "Assets (itemized)", width: 0.43, align: "left" },
            { header: "Liabilities (itemized)", width: 0.43, align: "left" },
          ],
          rows: [
            { cells: ["Current", p.balanceSheet.current.assets, p.balanceSheet.current.liabilities] },
            { cells: ["Intermediate", p.balanceSheet.intermediate.assets, p.balanceSheet.intermediate.liabilities] },
            { cells: ["Long-term", p.balanceSheet.longTerm.assets, p.balanceSheet.longTerm.liabilities] },
            {
              cells: [
                "Totals",
                `${p.balanceSheet.totalFarmAssets} → with personal: ${p.balanceSheet.totalAssetsCombined}`,
                `${p.balanceSheet.totalFarmLiabilities} → equity: ${p.balanceSheet.totalEquity}`,
              ],
              emphasis: true,
            },
          ],
        },
      },
    ],
  });

  const registerRows: Array<{ cells: string[] }> = [];
  const reg = p.assetRegisters;
  if (reg.equipmentPledged || reg.equipmentRegister)
    registerRows.push({ cells: ["Machinery & equipment", reg.equipmentRegister ?? "—", reg.equipmentPledged ? "REQUIRED — pledged" : "Provided"] });
  if (reg.vehiclesPledged || reg.vehicleRegister)
    registerRows.push({ cells: ["Farm/business vehicles", reg.vehicleRegister ?? "—", reg.vehiclesPledged ? "REQUIRED — pledged" : "Provided"] });
  if (reg.isAgOperation || reg.cropRegister)
    registerRows.push({ cells: ["Crop inventory & growing crops", reg.cropRegister ?? "—", reg.isAgOperation ? "REQUIRED — ag operation" : "Provided"] });
  if (reg.isLivestockOperation || reg.livestockRegister)
    registerRows.push({ cells: ["Livestock & products", reg.livestockRegister ?? "—", reg.isLivestockOperation ? "REQUIRED — livestock operation" : "Provided"] });
  if (registerRows.length > 0) {
    sections.push({
      title: "I.5 — Asset Registers",
      tables: [
        {
          table: {
            columns: [
              { header: "Register", width: 0.26, align: "left" },
              { header: "Contents (FSA-2037 J/K columns)", width: 0.54, align: "left" },
              { header: "Status", width: 0.2, align: "left" },
            ],
            rows: registerRows,
          },
        },
      ],
    });
  }

  sections.push({
    title: "I.6 — Operations & Revenue Segments",
    leadIns: [
      { text: "One subsection per property / business unit. Every revenue line itemized — no rollups — with Conservative and Stabilized columns that tie exactly to Part IV." },
    ],
    tables: p.revenueUnits.map((unit) => ({
      intro: `${unit.unitName} — ${unit.unitDescription}`,
      introBold: true,
      table: {
        columns: [
          { header: "Revenue segment", width: 0.56, align: "left" as const },
          { header: "Conservative", width: 0.22 },
          { header: "Stabilized", width: 0.22 },
        ],
        rows: [
          ...unit.lines.map((l) => ({ cells: [l.label, l.conservative, l.stabilized] })),
          { cells: [`SUBTOTAL — ${unit.unitName}`, unit.subtotalConservative, unit.subtotalStabilized], emphasis: true },
        ],
      },
    })),
    paragraphs: p.revenueUnits.map((u) => `Methodology — ${u.unitName}: ${u.methodology}`),
  });

  sections.push({
    title: "I.7 — Year-1 Working Capital",
    tables: [
      {
        table: {
          columns: [
            { header: "Line Item", width: 0.34, align: "left" },
            { header: "Amount", width: 0.16 },
            { header: "Justification", width: 0.5 },
          ],
          rows: [
            ...p.workingCapital.rows.map((r) => ({ cells: [r.item, r.amount, r.justification] })),
            { cells: ["TOTAL WORKING CAPITAL", p.workingCapital.total, p.workingCapital.shortfallNote], emphasis: true },
          ],
        },
      },
    ],
  });

  sections.push({
    title: "I.8 — Upside / Phase 2 (never in the ratios)",
    tables: [
      {
        table: {
          columns: [
            { header: "Opportunity", width: 0.34, align: "left" },
            { header: "Basis & exclusion note", width: 0.66, align: "left" },
          ],
          rows: p.upside.items.map((u) => ({ cells: [u.opportunity, u.basisAndExclusion] })),
        },
      },
    ],
    paragraphs: ["Policy: upside never enters DSCR, collateral, or injection math."],
  });

  // ── PART II — Loan Lane Matching ──
  sections.push({
    title: "PART II — LOAN LANE MATCHING",
    leadIns: [{ text: "Records why this customer is in this lane. Rendered for every customer." }],
    tables: [
      { table: PART_II_MATRIX },
      {
        table: {
          columns: [
            { header: "Lane decision", width: 0.3, align: "left" },
            { header: "Detail", width: 0.7, align: "left" },
          ],
          rows: [
            { cells: ["Matched lane + program variant", `${laneLabel}${m.programVariant ? ` · ${m.programVariant}` : ""}`], emphasis: true },
            { cells: ["Match rationale", input.partII.laneRationale] },
            { cells: ["Credit-elsewhere / eligibility narrative", input.partII.eligibilityNarrative] },
            ...(input.partII.lanesRejected ? [{ cells: ["Lanes considered and rejected", input.partII.lanesRejected] }] : []),
          ],
        },
      },
    ],
  });

  // ── PART III — matched lane module ONLY ──
  if (m.lane === "A" && input.moduleA) {
    const mod = input.moduleA;
    sections.push({
      title: `PART III · MODULE A — SBA 7(a) (official form authority: ${input.authority.formVersion})`,
      leadIns: [
        {
          text: `Preparation rules: applicant and ownership information must reconcile across the package; the current official Form 1919 and lender instructions control. Owners of 20% or more are flagged for lender guaranty review. This report is not the official form and makes no eligibility or approval determination. Authority reviewed ${input.authority.reviewedAt}.`,
        },
      ],
      tables: [
        ...mod.applicants.map((ap) => ({
          intro: `A.1 — Applicant information: ${ap.legalName} (${ap.designation})`,
          introBold: true,
          table: {
            columns: [
              { header: "Form 1919 field", width: 0.4, align: "left" as const },
              { header: "Response", width: 0.6, align: "left" as const },
            ],
            rows: [
              { cells: ["NAICS (6-digit, matches IRS filings)", ap.naics] },
              { cells: ["SAM.gov Unique Entity ID", ap.samUei] },
              { cells: ["Entity type / special ownership type", ap.entityType] },
              { cells: ["Business & project addresses (no P.O. Box)", ap.addresses] },
              { cells: ["Employees (incl. owners + affiliates); FTE saved/created", ap.employees] },
              { cells: ["Purpose of loan by category (auto-allocated from I.2)", ap.loanPurposeAllocation] },
              { cells: ["Ownership & demographics (demographics VOLUNTARY)", ap.ownershipAndDemographics] },
            ],
          },
        })),
        {
          intro: "A.2 — Questions 1–13 (drafted from intake; the client confirms each; Question 4 is personally initialed — the initial box below is never prefilled)",
          introBold: true,
          table: {
            columns: [
              { header: "#", width: 0.06, align: "left" },
              { header: "Question (abbreviated)", width: 0.66, align: "left" },
              { header: "Answer", width: 0.28, align: "left" },
            ],
            rows: MODULE_A_QUESTIONS.map(({ n, q }) => {
              const ans = mod.questionAnswers.find((x) => x.number === n);
              const value =
                n === 4
                  ? `${ans ? ans.answer : "—"}   ·   INITIAL HERE: ______`
                  : ans
                    ? `${ans.answer}${ans.detail ? ` — ${ans.detail}` : ""}`
                    : "—";
              return { cells: [String(n), q, value] };
            }),
          },
        },
        {
          intro: "A.3 — Certifications executed at signing (mandatory acknowledgments — never rendered as already made)",
          introBold: true,
          table: {
            columns: [
              { header: "Acknowledgment", width: 0.88, align: "left" },
              { header: "At signing", width: 0.12, align: "left" },
            ],
            rows: MODULE_A_CERTIFICATIONS.map((c) => ({ cells: [c, "[  ]"] })),
          },
        },
      ],
      paragraphs: [
        ...(mod.epcOcLease ? [`EPC/OC lease: ${mod.epcOcLease}`] : []),
        ...(mod.feeDisclosures ? [`Fee disclosures (Q6): ${mod.feeDisclosures}`] : []),
        ...(mod.floodDeterminations ? [`Flood determinations + insurance: ${mod.floodDeterminations}`] : []),
        ...(mod.refinanceBusinessPurposeDocs ? [`Refinanced-debt business-purpose documentation: ${mod.refinanceBusinessPurposeDocs}`] : []),
        ...(mod.babaaSourcingPlan ? [`BABAA sourcing plan: ${mod.babaaSourcingPlan}`] : []),
      ],
    });
  }
  if (m.lane === "B" && input.moduleB) {
    sections.push({
      title: "PART III · MODULE B — USDA / FSA (governing form: FSA-2037, 11-04-10)",
      leadIns: [
        {
          text: "Structural rules: the complete FSA-2037 balance sheet files with the county FSA office; Part I §4–5 data populates it directly. Feasibility is demonstrated through the farm business plan series; the signature certifies truth/completeness under 18 U.S.C. 1001.",
        },
      ],
      tables: [
        {
          table: {
            columns: [
              { header: "FSA-2037 schedule", width: 0.26, align: "left" },
              { header: "Content (populated from Part I)", width: 0.56, align: "left" },
              { header: "Status", width: 0.18, align: "left" },
            ],
            rows: [
              { cells: ["1A–1U Current assets", "Cash, securities, receivables; crop inventory (measure/units/$-unit); growing crops (acres/cost-acre); market livestock (head/weight/$-unit); livestock products; prepaid & supplies", "REQUIRED"] },
              { cells: ["2A–2N Current liabilities", "Payables; taxes payable; notes due <12 mo (creditor, purpose, rate, accrued interest, payment, next due, principal); accrued interest; current portions of term debt", "REQUIRED"] },
              { cells: ["3A–3I Intermediate assets", "Machinery/equipment total (from J/K registers); breeding stock (raised/purchased, head, $/head); notes receivable; non-marketable securities", "REQUIRED"] },
              { cells: ["5A–5H Intermediate liabilities", "Term notes 1–7 yr with full creditor detail", "REQUIRED"] },
              { cells: ["4A–4I Long-term assets", "Buildings & improvements; land by tract (total acres, crop acres, % owned, $/acre)", "REQUIRED"] },
              { cells: ["6A–6J Long-term liabilities & farm equity", "Mortgages/long-term notes; total farm equity computation", "REQUIRED"] },
              { cells: ["7A–8K Personal assets, liabilities & total equity", "Auto-populated from I.3 PFS", "Auto"] },
              { cells: ["Sections J/K equipment & vehicle registers", "Auto-populated from I.5 registers (serial/VIN-level)", "Auto"] },
              { cells: ["9A/9B Signature & date; 10 Comments", `Executed at filing with the county FSA office (${input.moduleB.countyOffice})`, "At filing"] },
            ],
          },
        },
      ],
      paragraphs: input.moduleB.scheduleNotes ? [input.moduleB.scheduleNotes] : [],
    });
  }
  if (m.lane === "C" && input.moduleC) {
    const mc = input.moduleC;
    sections.push({
      title: "PART III · MODULE C — INFRASTRUCTURE / PROJECT FINANCE (governing format: LOI sample pro forma)",
      leadIns: [
        {
          text: `Structural rules: the LOI pro forma format governs — ${mc.historicalYears} historical + ${mc.projectedYears} projected years, full income statement, cash-flow adjustments, multi-tier debt schedules (${mc.tranches}), and the coverage/liquidity ratio family. A borrower with an existing model of equal or greater detail may submit that model instead — Furlong renders it into this structure.`,
        },
      ],
      tables: [
        {
          table: {
            columns: [
              { header: "Statement block", width: 0.26, align: "left" },
              { header: "Required rows (per sample pro forma)", width: 0.56, align: "left" },
              { header: "Status", width: 0.18, align: "left" },
            ],
            rows: [
              { cells: ["Income statement", "Revenue by source (row per source); fixed expenses; variable costs; pension/OPEB expense (public-sector credits); depreciation; amortization; operating income; interest; taxes; net income", "REQUIRED"] },
              { cells: ["Cash-flow adjustments", "Change in net pension/OPEB liabilities; change in working capital; non-cash add-backs; Funds From Operations (FFO); capital expenditures; Free Cash Flow", "REQUIRED"] },
              { cells: ["Debt schedules (by tranche)", "Existing debt · senior debt · subordinate/WIFIA-style debt: annual service and ending balances per year", "REQUIRED"] },
              { cells: ["Coverage & liquidity ratios", "Net system revenue; Senior DSCR; Total DSCR; FFO/interest; days cash on hand; (GO credits only: debt as % assessed value, long-term liability burden)", "REQUIRED"] },
              { cells: ["Unfunded liabilities", "Unfunded pension/OPEB liability by year (public-sector credits; omit for private borrowers)", mc.publicSectorCredit ? "REQUIRED" : "Omitted — private borrower"] },
            ],
          },
        },
      ],
    });
  }

  // ── PART IV — Pro Forma Output ──
  const tc = input.partIV.twoCase;
  sections.push({
    title: "PART IV — PRO FORMA OUTPUT · IV.1 — Two-Case Summary",
    tables: [
      {
        table: {
          columns: [
            { header: "Metric", width: 0.34, align: "left" },
            { header: "Conservative", width: 0.22 },
            { header: "Stabilized", width: 0.22 },
            { header: "Floor / Test", width: 0.22 },
          ],
          rows: [
            { cells: ["Gross revenue", tc.revenue.conservative, tc.revenue.stabilized, "—"] },
            { cells: ["Operating expenses", tc.opex.conservative, tc.opex.stabilized, "—"] },
            { cells: [`Net Operating Income (margin)`, `${tc.noi.conservative} (${tc.margins.conservative})`, `${tc.noi.stabilized} (${tc.margins.stabilized})`, "—"] },
            { cells: ["Annual debt service", tc.debtService, tc.debtService, "—"] },
            { cells: ["DSCR — standalone", tc.dscrStandalone.conservative, tc.dscrStandalone.stabilized, `${tc.dscrFloor} (${input.authority.coverageThresholdBasis})`], emphasis: true },
            { cells: ["DSCR — global / total", tc.dscrGlobal.conservative, tc.dscrGlobal.stabilized, `${tc.dscrFloor} (${input.authority.coverageThresholdBasis})`] },
            { cells: [`Stress case: ${tc.stressDescription}`, tc.dscrStress, "—", tc.dscrFloor] },
          ],
        },
      },
    ],
    paragraphs: [
      `Debt-service assumptions (always stated so coverage is verifiable): rate ${input.partIV.debtServiceAssumptions.rate} · term ${input.partIV.debtServiceAssumptions.term} · amortization ${input.partIV.debtServiceAssumptions.amortization} · interest-only period ${input.partIV.debtServiceAssumptions.ioPeriod}.`,
    ],
  });

  // IV.2 — year-by-year model, chunked ≤5 year-columns per table (portrait-safe).
  const ym = input.partIV.yearModel;
  const CHUNK = 5;
  const yearTables: Array<{ intro?: string; introBold?: boolean; table: ProformaTable }> = [];
  for (let start = 0; start < ym.yearLabels.length; start += CHUNK) {
    const years = ym.yearLabels.slice(start, start + CHUNK);
    const label = `Years ${years[0]} – ${years[years.length - 1]}`;
    const colW = 0.66 / years.length;
    yearTables.push({
      intro: label,
      introBold: true,
      table: {
        columns: [
          { header: "Row", width: 0.34, align: "left" },
          ...years.map((yl) => ({ header: yl, width: colW })),
        ],
        rows: ym.rows.map((r) => ({
          cells: [
            `${r.family} · ${r.label}`,
            ...r.values.slice(start, start + CHUNK).map((v) => v || "—"),
          ],
          emphasis: /dscr|net operating income|free cash flow/i.test(r.label),
        })),
      },
    });
  }
  sections.push({
    title: "IV.2 — Year-by-Year Model",
    leadIns: [{ text: "Up to 3 historical + 10 projected years. Rows flex by lane; revenue ties to I.6 segments." }],
    tables: yearTables,
  });

  // ── PART V — Generation Gate (rendered as evidence of completeness) ──
  sections.push({
    title: "PART V — GENERATION GATE",
    leadIns: [
      { text: draft
          ? "DRAFT — the engine blocks customer output until every applicable row is green. Open items are marked below."
          : "The engine blocks customer output until every applicable row is green. All applicable items were green at generation." },
    ],
    tables: [
      {
        table: {
          columns: [
            { header: "#", width: 0.08, align: "left" },
            { header: "Item", width: 0.78, align: "left" },
            { header: "Status", width: 0.14, align: "left" },
          ],
          rows: GATE_ITEMS.map((g) => {
            const failed = failures.some((x) => x.id === g.id);
            return { cells: [g.id, g.item, failed ? "OPEN" : "Green"], emphasis: failed };
          }),
        },
      },
    ],
  });

  return {
    branding: {
      logoPath: input.branding.logoPath,
      footerIdentity: `${m.clientLegalName} — Furlong Ultimate Pro Forma & Loan Report · Master Template v2.1`,
    },
    cover: {
      docTitle: "ULTIMATE PRO FORMA & LOAN REPORT",
      subtitle: m.clientLegalName,
      propertyLine: `${laneLabel}${m.programVariant ? ` · ${m.programVariant}` : ""}`,
      preparedFor: [{ name: m.lenderContactAndInstitution }],
      borrowerLine: m.clientLegalName,
      principalLine: `Guarantor(s): ${m.guarantorNames}`,
      dateLine: `${m.generationDate} · ${m.documentId}`,
      confidential: true,
    },
    introParagraphs: [],
    sections,
    signatureBlock: {
      certification:
        "Certification: The undersigned certifies that the information in this report is true, accurate, and complete as of the date stated, submitted in connection with a commercial loan application. Asset values are stated at conservative documented amounts; contingent assets are disclosed but excluded from stated totals. Financing decisions belong to licensed lenders — Furlong prepares and formats the borrower's own documented information and never approves, guarantees, or determines eligibility.",
      signerName: m.guarantorNames,
      finePrint:
        "Generated by the Furlong engine from the borrower's own intake under the Ultimate Pro Forma Master Template v2.1. Supporting documents and evidence lineage remain controlled by Furlong and are available only through authorized review.",
    },
  };
}

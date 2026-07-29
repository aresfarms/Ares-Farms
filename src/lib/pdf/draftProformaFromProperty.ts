/**
 * draftProformaFromProperty — property-side DRAFT of the Ultimate Pro Forma
 * (founder direction 2026-07-29: the downloadable pro forma must be the REAL
 * SBA/USDA-structured document, not the property report).
 *
 * Maps what Furlong verifiably knows about the PROPERTY (price, acreage,
 * county economics, modeled enterprise NOI, published FSA rate) into the
 * UltimateProformaInput (Parts I–IV). Everything borrower-side — identity,
 * ownership tables, guarantor PFS, balance sheet, registers — is left empty
 * ON PURPOSE, so the Part V generation gate stays red, the document renders
 * with the DRAFT banner, and the gate checklist page lists exactly what SBA
 * and USDA underwriting still requires. Deterministic: same inputs → same
 * document (generationDate is supplied by the caller).
 */

import type { LoanLane, UltimateProformaInput } from "@/lib/pdf/ultimateProformaTemplate";

export interface DraftProformaRevenueUnit {
  unitName: string;
  unitDescription: string;
  conservativeAnnualNoi: number;
  stabilizedAnnualNoi: number;
  methodology: string;
}

export interface DraftProformaAdditionalProperty {
  title: string;
  location: string | null;
  /** Parsed asking price when the saved record carries one. */
  price: number | null;
}

export interface DraftProformaPropertyArgs {
  propertyTitle: string;
  exactAddress: string | null;
  county: string | null;
  state: string | null;
  lane: LoanLane;
  generationDate: string; // YYYY-MM-DD
  acquisitionPrice: number | null;
  acreage: number | null;
  /** Published FSA direct farm-ownership rate, percent (screening basis). */
  fsaRatePct: number | null;
  /** Where acquisitionPrice came from — printed with every figure it drives
      (entered offer > listing price > assessed value > state-average screen). */
  valuationNote: string | null;
  revenueUnits: DraftProformaRevenueUnit[];
  /** OPTIONAL multi-property acquisition (founder direction 2026-07-29):
      when the visitor includes other saved properties, each becomes its own
      Sources & Uses acquisition row and collateral line, and combined totals
      drive the loan sizing. One property → the document reflects only it. */
  additionalProperties?: DraftProformaAdditionalProperty[];
}

const TO_SUPPLY = "TO BE SUPPLIED AT UNDERWRITING";
// Personal financial statement fields route through Furlong's licensed
// Financial module, not a generic underwriting hand-off (founder 2026-07-29).
const VIA_FINANCIAL_MODULE = "INCLUDED WITH THE PERSONAL FINANCIAL MODULE";

const dollars = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

/** Level annual payment on principal at ratePct over years (screening math). */
function levelDebtService(principal: number, ratePct: number, years: number): number {
  const r = ratePct / 100;
  if (r <= 0) return principal / years;
  return (principal * r) / (1 - Math.pow(1 + r, -years));
}

const LANE_AUTHORITY: Record<LoanLane, { refs: string[]; formVersion: string }> = {
  A: {
    formVersion: "SBA Form 1919 (borrower information); current version confirmation required at generation",
    refs: [
      "https://www.sba.gov/document/sba-form-1919-borrower-information-form",
      "https://www.sba.gov/partners/lenders/7a-loan-program/terms-conditions-eligibility",
    ],
  },
  B: {
    formVersion: "FSA-2001 (application) / FSA-2037 (balance sheet) / FSA-2038 (cash-flow); current version confirmation required at generation",
    refs: [
      "https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/farm-ownership-loans/index",
      "https://www.rd.usda.gov/programs-services/business-programs/business-industry-loan-guarantees",
    ],
  },
  C: {
    formVersion: "Program-specific application package; confirmed at generation",
    refs: ["https://www.rd.usda.gov/programs-services/all-programs"],
  },
};

export function buildDraftProformaInput(args: DraftProformaPropertyArgs): UltimateProformaInput {
  const price = args.acquisitionPrice;
  const where = [args.county, args.state].filter(Boolean).join(", ");
  const authority = LANE_AUTHORITY[args.lane];

  // ── Multi-property acquisition (optional) ─────────────────────────────────
  // One property → everything below reflects only it. With additional
  // properties, each priced one contributes to the combined acquisition;
  // unpriced ones appear as rows whose figures await appraisal/offer.
  const additional = args.additionalProperties ?? [];
  const pricedAdditional = additional.filter((p): p is DraftProformaAdditionalProperty & { price: number } => p.price != null && p.price > 0);
  const combinedPrice =
    price != null || pricedAdditional.length > 0
      ? (price ?? 0) + pricedAdditional.reduce((sum, p) => sum + p.price, 0)
      : null;
  const propertyCount = 1 + additional.length;
  const unmodeledIncomeNote =
    additional.length > 0
      ? ` Income is modeled for the primary property only — run each included property through its own Furlong report to model its income; until then combined coverage is understated.`
      : "";

  // ── Screening finance math (every assumption stated in the document) ──────
  const LTV = 0.8;
  const AMORT_YEARS = args.lane === "B" ? 40 : 25;
  const loanAmount = combinedPrice != null ? combinedPrice * LTV : null;
  const closingEstimate = combinedPrice != null ? combinedPrice * 0.03 : null;
  const workingCapitalReserve = combinedPrice != null ? combinedPrice * 0.1 : null;
  const totalProject = combinedPrice != null ? combinedPrice + (closingEstimate ?? 0) + (workingCapitalReserve ?? 0) : null;
  const injection = combinedPrice != null && totalProject != null && loanAmount != null ? totalProject - loanAmount : null;
  const rate = args.fsaRatePct;
  const annualDebtService = loanAmount != null && rate != null ? levelDebtService(loanAmount, rate, AMORT_YEARS) : null;

  const consNoi = args.revenueUnits.reduce((sum, u) => sum + u.conservativeAnnualNoi, 0);
  const stabNoi = args.revenueUnits.reduce((sum, u) => sum + u.stabilizedAnnualNoi, 0);
  const dscr = (noi: number) => (annualDebtService && annualDebtService > 0 ? (noi / annualDebtService).toFixed(2) + "x" : "Requires price + rate");
  const stressNoi = consNoi * 0.75;

  const yearLabels = Array.from({ length: 10 }, (_, i) => `Year ${i + 1}P`);
  const noiSeries = yearLabels.map((_, i) => dollars(i === 0 ? consNoi : stabNoi));
  const dsSeries = yearLabels.map(() => (annualDebtService != null ? dollars(annualDebtService) : "TBD"));
  const cushionSeries = yearLabels.map((_, i) =>
    annualDebtService != null ? dollars((i === 0 ? consNoi : stabNoi) - annualDebtService) : "TBD"
  );

  return {
    authority: {
      reviewedAt: args.generationDate,
      formVersion: authority.formVersion,
      officialSourceRefs: authority.refs,
      reviewedContentHashes: {},
      programTermsNote:
        "Program terms referenced are current-source snapshots, not lender approval or an eligibility determination. " +
        "Official form versions and content hashes are recorded at the underwriting review that finalizes this document.",
      coverageThresholdBasis: "Illustrative lender underwriting assumption; lender-specific confirmation required.",
    },
    branding: { logoPath: "/brand/furlong-logo.png" },
    manifest: {
      clientLegalName: `DRAFT — borrower entity ${TO_SUPPLY.toLowerCase()}`,
      guarantorNames: TO_SUPPLY,
      lane: args.lane,
      programVariant: args.lane === "B" ? "USDA FSA Farm Ownership (screening)" : undefined,
      lenderContactAndInstitution: "Lender/recipient designated at underwriting",
      documentId: `FURLONG-DRAFT-${args.lane}-${args.generationDate.slice(0, 4)}-00`,
      generationDate: args.generationDate,
    },
    partI: {
      identity: {
        operatingEntity: TO_SUPPLY,
        goodStandingCerts: "", // U1 stays red on purpose — DRAFT
        ownershipTable: "", // U2 stays red on purpose — DRAFT
        guarantorProfile: TO_SUPPLY,
        primaryContact: TO_SUPPLY,
      },
      sourcesAndUses: {
        rows: [
          ...(price != null
            ? [{ use: `Acquisition — ${args.propertyTitle}${where ? ` (${where})` : ""}`, amount: dollars(price), notes: args.valuationNote ?? "Asking price / intended offer as entered; appraisal governs" }]
            : []),
          ...additional.map((p) => ({
            use: `Acquisition — ${p.title}${p.location ? ` (${p.location})` : ""}`,
            amount: p.price != null ? dollars(p.price) : "Price TBD",
            notes: p.price != null ? "Saved-record asking price; appraisal governs" : "Included property — price set at offer/appraisal",
          })),
          ...(combinedPrice != null
            ? [
                { use: "Closing, title & diligence (screening estimate)", amount: dollars(closingEstimate!), notes: `≈3% of combined acquisition${propertyCount > 1 ? ` (${propertyCount} properties)` : ""} — itemized at underwriting` },
                { use: "Working capital reserve (screening estimate)", amount: dollars(workingCapitalReserve!), notes: "≈10% of combined acquisition — set from the operating budget" },
              ]
            : []),
        ],
        totalProjectCost: totalProject != null ? dollars(totalProject) : "Requires acquisition price",
        loanAmount: loanAmount != null ? dollars(loanAmount) : "Requires acquisition price",
        loanCalcBasis: combinedPrice != null
          ? `Screening basis: ${Math.round(LTV * 100)}% of combined acquisition price${propertyCount > 1 ? ` across ${propertyCount} properties` : ""}${args.valuationNote ? ` (${args.valuationNote})` : ""}; final loan amount set by program rules, appraisal, and lender underwriting`
          : "",
        injectionProvided: injection != null ? dollars(injection) : TO_SUPPLY,
        injectionSource: TO_SUPPLY,
      },
      collateral: {
        discountPct: "25%",
        rows: [
          ...(price != null
            ? [{ asset: `Subject real estate — ${args.propertyTitle}`, stated: dollars(price), discounted: dollars(price * 0.75), lien: "1st REM (anticipated)" }]
            : []),
          ...additional.map((p) => ({
            asset: `Included real estate — ${p.title}${p.location ? ` (${p.location})` : ""}`,
            stated: p.price != null ? dollars(p.price) : "Appraisal required",
            discounted: p.price != null ? dollars(p.price * 0.75) : "—",
            lien: "1st REM (anticipated)",
          })),
        ],
        statedTotal: combinedPrice != null ? dollars(combinedPrice) : "Requires acquisition price",
        discountedTotal: combinedPrice != null ? dollars(combinedPrice * 0.75) : "Requires acquisition price",
        coveragePct: combinedPrice != null && loanAmount != null ? `${Math.round(((combinedPrice * 0.75) / loanAmount) * 100)}%` : "",
        guaranteesAndExclusions: "Personal guarantees per program rules; additional collateral identified at underwriting.",
      },
      guarantorPfs: {
        asOfDate: "", // U5 stays red on purpose — DRAFT
        docBasis: "",
        assets: [{ label: "Guarantor assets", value: VIA_FINANCIAL_MODULE }],
        liabilitiesAndIncome: [{ label: "Guarantor liabilities & income", value: VIA_FINANCIAL_MODULE }],
        totalAssets: VIA_FINANCIAL_MODULE,
        totalLiabilities: VIA_FINANCIAL_MODULE,
        netWorth: VIA_FINANCIAL_MODULE,
        totalAnnualIncome: VIA_FINANCIAL_MODULE,
      },
      // The opening balance sheet is borrower financial data too — it is
      // collected through the personal Financial module alongside the PFS
      // (founder 2026-07-29), not left to a generic underwriting hand-off.
      balanceSheet: {
        current: { assets: VIA_FINANCIAL_MODULE, liabilities: VIA_FINANCIAL_MODULE },
        intermediate: { assets: VIA_FINANCIAL_MODULE, liabilities: VIA_FINANCIAL_MODULE },
        longTerm: { assets: VIA_FINANCIAL_MODULE, liabilities: VIA_FINANCIAL_MODULE },
        totalFarmAssets: VIA_FINANCIAL_MODULE,
        totalAssetsCombined: VIA_FINANCIAL_MODULE,
        totalFarmLiabilities: VIA_FINANCIAL_MODULE,
        totalEquity: "", // U6 stays red on purpose — DRAFT
      },
      assetRegisters: {
        equipmentPledged: false,
        vehiclesPledged: false,
        isAgOperation: args.lane === "B", // crop register required for the final — stays red
        isLivestockOperation: false,
      },
      revenueUnits: args.revenueUnits.map((unit) => ({
        unitName: unit.unitName,
        unitDescription: unit.unitDescription,
        lines: [
          {
            label: "Modeled annual net operating income",
            conservative: dollars(unit.conservativeAnnualNoi),
            stabilized: dollars(unit.stabilizedAnnualNoi),
          },
        ],
        subtotalConservative: dollars(unit.conservativeAnnualNoi),
        subtotalStabilized: dollars(unit.stabilizedAnnualNoi),
        methodology: unit.methodology,
      })),
      workingCapital: {
        rows: workingCapitalReserve != null
          ? [{ item: "Operating reserve (screening estimate)", amount: dollars(workingCapitalReserve), justification: "≈10% of acquisition; final figure set from the enterprise operating budget" }]
          : [],
        total: workingCapitalReserve != null ? dollars(workingCapitalReserve) : "Requires acquisition price",
        shortfallNote: "Screening estimate only — the final working-capital requirement comes from the borrower's operating budget at underwriting.",
      },
      upside: {
        items: [
          {
            opportunity: "Program stacking (cost-share, conservation, energy) identified in the property report",
            basisAndExclusion: "Excluded from all debt-service coverage above; pursued separately with the agency after closing.",
          },
        ],
      },
    },
    partII: {
      laneRationale:
        args.lane === "B"
          ? `USDA/FSA farm-ownership is the screening lane for an agricultural acquisition${where ? ` in ${where}` : ""}: purpose-built for farm real estate, ${AMORT_YEARS}-year terms, and the published direct rate used in the debt-service model. Final lane selection is made with the lender against the borrower's full file.`
          : `SBA 7(a) is the screening lane for an owner-operated business acquisition${where ? ` in ${where}` : ""}. Final lane selection is made with the lender against the borrower's full file.`,
      eligibilityNarrative:
        `Property-side screening only: the figures in Parts I and IV come from the ${propertyCount > 1 ? `${propertyCount} included properties'` : "property's"} verified record${propertyCount > 1 ? "s" : ""}, county economics, and modeled enterprise income.${unmodeledIncomeNote} Borrower eligibility, credit, injection capacity, and program qualification are determined exclusively at underwriting — this DRAFT makes no eligibility finding.`,
    },
    ...(args.lane === "B"
      ? { moduleB: { countyOffice: args.county ? `${args.county}${/county/i.test(args.county) ? "" : " County"} USDA Service Center` : "County USDA Service Center (identified from the parcel county)" } }
      : {}),
    partIV: {
      twoCase: {
        revenue: { conservative: dollars(consNoi), stabilized: dollars(stabNoi) },
        opex: { conservative: "Netted in modeled NOI", stabilized: "Netted in modeled NOI" },
        noi: { conservative: dollars(consNoi), stabilized: dollars(stabNoi) },
        margins: { conservative: "NOI-modeled", stabilized: "NOI-modeled" },
        debtService: annualDebtService != null ? dollars(annualDebtService) : "Requires acquisition price + rate",
        dscrStandalone: { conservative: dscr(consNoi), stabilized: dscr(stabNoi) },
        dscrGlobal: { conservative: "Requires borrower's full obligations", stabilized: "Requires borrower's full obligations" },
        dscrFloor: "1.25x screening threshold",
        stressDescription: `Conservative-case net operating income stressed a further -25%.${unmodeledIncomeNote}`,
        dscrStress: dscr(stressNoi),
      },
      debtServiceAssumptions: {
        rate: rate != null ? `${rate}% (published FSA direct farm-ownership rate — screening basis)` : "",
        term: `${AMORT_YEARS} years`,
        amortization: `${AMORT_YEARS}-year level amortization`,
        ioPeriod: "None assumed",
      },
      yearModel: {
        yearLabels,
        rows: [
          { family: "Operations", label: "Modeled net operating income (Year 1 conservative; stabilized thereafter)", values: noiSeries },
          { family: "Debt", label: "Annual debt service (screening assumptions)", values: dsSeries },
          { family: "Coverage", label: "Cash cushion after debt service", values: cushionSeries },
        ],
      },
    },
  };
}

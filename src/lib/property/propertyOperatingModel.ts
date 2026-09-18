import { annualLevelDebtService, principalFromAnnualDebtService } from "@/lib/property/calculationMath";
/**
 * Property operating-model calculator.
 *
 * Math is deterministic. AI may explain the result, ask for missing inputs,
 * or suggest diligence, but AI never supplies or changes the financial math.
 */

export type OperatingRevenueCadence = "nightly" | "monthly";
export type OperatingUseType =
  | "hotel"
  | "extended_stay"
  | "senior_independent_living"
  | "senior_assisted_living"
  | "other_units";

export interface OperatingExpenseInput {
  payrollMonthly?: number | null;
  utilitiesMonthly?: number | null;
  insuranceMonthly?: number | null;
  propertyTaxMonthly?: number | null;
  maintenanceHousekeepingMonthly?: number | null;
  foodServicesMonthly?: number | null;
  managementMarketingMonthly?: number | null;
  licensingOtherMonthly?: number | null;
}

export interface PropertyOperatingModelInput {
  useType: OperatingUseType;
  revenueCadence: OperatingRevenueCadence;
  unitCount: number;
  occupancyPct: number;
  averageUnitRevenue: number;
  ancillaryRevenueMonthly?: number | null;
  replacementReservePct?: number | null;
  expenses: OperatingExpenseInput;
  acquisitionPrice?: number | null;
  conversionCapex?: number | null;
  professionalSoftCost?: number | null;
  contingencyPct?: number | null;
  loanAmount?: number | null;
  interestRatePct?: number | null;
  amortizationYears?: number | null;
  targetDscr?: number | null;
}

export type CoveragePosture = "STRONG" | "CLEARS_TARGET" | "THIN" | "SHORT" | "NO_DEBT_MODEL" | "NEEDS_EVIDENCE";

export interface OperatingSensitivityCase {
  label: string;
  occupancyPct: number;
  averageUnitRevenue: number;
  annualRevenue: number;
  noi: number | null;
  dscr: number | null;
}

export interface PropertyOperatingModelResult {
  version: "property-operating-model-v1.1.0";
  annualUnitRevenue: number;
  annualAncillaryRevenue: number;
  annualRevenue: number;
  annualFixedOperatingExpenses: number;
  annualReplacementReserve: number;
  annualOperatingExpenses: number | null;
  noi: number | null;
  noiMarginPct: number | null;
  annualDebtService: number | null;
  dscr: number | null;
  targetDscr: number;
  coveragePosture: CoveragePosture;
  annualNoiRequiredForTarget: number | null;
  annualCoverageGap: number | null;
  breakEvenOccupancyPct: number | null;
  maxLoanSupportedAtTarget: number | null;
  totalProjectCost: number | null;
  equityRequired: number | null;
  equityRequiredPct: number | null;
  sensitivity: OperatingSensitivityCase[];
  missingInputs: string[];
  warnings: string[];
}

const finite = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const nonNegative = (value: unknown): number => Math.max(0, finite(value));
const pct = (value: unknown, fallback: number): number => Math.min(100, Math.max(0, finite(value, fallback)));

const expenseKeys = ["payrollMonthly", "utilitiesMonthly", "insuranceMonthly", "propertyTaxMonthly", "maintenanceHousekeepingMonthly", "foodServicesMonthly", "managementMarketingMonthly", "licensingOtherMonthly"] as const;
const suppliedNonNegative = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

function fixedExpensesAnnual(expenses: OperatingExpenseInput): number {
  return 12 * [
    expenses.payrollMonthly,
    expenses.utilitiesMonthly,
    expenses.insuranceMonthly,
    expenses.propertyTaxMonthly,
    expenses.maintenanceHousekeepingMonthly,
    expenses.foodServicesMonthly,
    expenses.managementMarketingMonthly,
    expenses.licensingOtherMonthly,
  ].reduce<number>((sum, value) => sum + nonNegative(value), 0);
}

function annualPotentialUnitRevenue(input: PropertyOperatingModelInput, occupancyPct = input.occupancyPct, averageUnitRevenue = input.averageUnitRevenue): number {
  const units = nonNegative(input.unitCount);
  const occupancy = pct(occupancyPct, 0) / 100;
  const unitRevenue = nonNegative(averageUnitRevenue);
  return input.revenueCadence === "nightly"
    ? units * 365 * occupancy * unitRevenue
    : units * 12 * occupancy * unitRevenue;
}

function sensitivityCase(input: PropertyOperatingModelInput, occupancyPct: number, averageUnitRevenue: number, ads: number | null): OperatingSensitivityCase {
  const unitRevenue = annualPotentialUnitRevenue(input, occupancyPct, averageUnitRevenue);
  const ancillary = nonNegative(input.ancillaryRevenueMonthly) * 12;
  const revenue = unitRevenue + ancillary;
  const reserveRate = pct(input.replacementReservePct, 3) / 100;
  const fixed = fixedExpensesAnnual(input.expenses);
  const noi = revenue - fixed - revenue * reserveRate;
  return {
    label: `${occupancyPct.toFixed(0)}% occupancy / ${averageUnitRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${input.revenueCadence === "nightly" ? "ADR" : "per unit/mo"}`,
    occupancyPct,
    averageUnitRevenue,
    annualRevenue: Math.round(revenue),
    noi: Math.round(noi),
    dscr: ads && ads > 0 ? noi / ads : null,
  };
}

export function calculatePropertyOperatingModel(input: PropertyOperatingModelInput): PropertyOperatingModelResult {
  const targetDscr = Math.max(1, finite(input.targetDscr, 1.25));
  const occupancy = pct(input.occupancyPct, 0);
  const averageUnitRevenue = nonNegative(input.averageUnitRevenue);
  const annualUnitRevenue = annualPotentialUnitRevenue(input, occupancy, averageUnitRevenue);
  const annualAncillaryRevenue = nonNegative(input.ancillaryRevenueMonthly) * 12;
  const annualRevenue = annualUnitRevenue + annualAncillaryRevenue;
  const annualFixedOperatingExpenses = fixedExpensesAnnual(input.expenses);
  const reserveRate = pct(input.replacementReservePct, 3) / 100;
  const annualReplacementReserve = annualRevenue * reserveRate;
  const annualOperatingExpenses = annualFixedOperatingExpenses + annualReplacementReserve;
  const noi = annualRevenue - annualOperatingExpenses;
  const noiMarginPct = annualRevenue > 0 ? (noi / annualRevenue) * 100 : null;

  const loanAmount = nonNegative(input.loanAmount);
  const rate = finite(input.interestRatePct, 0);
  const amortYears = finite(input.amortizationYears, 0);
  const debtTermsPresent = suppliedNonNegative(input.interestRatePct) && suppliedNonNegative(input.amortizationYears) && amortYears > 0;
  const missingExpenses = expenseKeys.filter(key => !suppliedNonNegative(input.expenses[key]));
  const operatingInputsComplete = missingExpenses.length === 0 && suppliedNonNegative(input.unitCount) &&
    input.unitCount > 0 && suppliedNonNegative(input.occupancyPct) && input.occupancyPct <= 100 &&
    suppliedNonNegative(input.averageUnitRevenue) && suppliedNonNegative(input.ancillaryRevenueMonthly) &&
    suppliedNonNegative(input.replacementReservePct) && input.replacementReservePct <= 100;
  const ads = debtTermsPresent && loanAmount > 0 ? annualLevelDebtService(loanAmount, rate, amortYears, 12) : null;
  const dscr = operatingInputsComplete && ads && ads > 0 ? noi / ads : null;
  const annualNoiRequiredForTarget = operatingInputsComplete && ads ? ads * targetDscr : null;
  const annualCoverageGap = annualNoiRequiredForTarget == null ? null : Math.max(0, annualNoiRequiredForTarget - noi);
  const coveragePosture: CoveragePosture = !operatingInputsComplete ? "NEEDS_EVIDENCE" : dscr == null
    ? "NO_DEBT_MODEL"
    : dscr >= Math.max(1.35, targetDscr + 0.1)
      ? "STRONG"
      : dscr >= targetDscr
        ? "CLEARS_TARGET"
        : dscr >= 1
          ? "THIN"
          : "SHORT";

  const unitPotentialAt100 = input.revenueCadence === "nightly"
    ? nonNegative(input.unitCount) * 365 * averageUnitRevenue
    : nonNegative(input.unitCount) * 12 * averageUnitRevenue;
  const netRevenueFactor = 1 - reserveRate;
  const breakEvenOccupancy = operatingInputsComplete && ads && unitPotentialAt100 > 0 && netRevenueFactor > 0
    ? ((ads + annualFixedOperatingExpenses - annualAncillaryRevenue * netRevenueFactor) / (unitPotentialAt100 * netRevenueFactor)) * 100
    : null;

  const maxAdsAtTarget = noi > 0 ? noi / targetDscr : null;
  const maxLoanSupportedAtTarget = operatingInputsComplete && maxAdsAtTarget && debtTermsPresent
    ? principalFromAnnualDebtService(maxAdsAtTarget, rate, amortYears, 12)
    : null;

  const acquisitionPrice = nonNegative(input.acquisitionPrice);
  const conversionCapex = nonNegative(input.conversionCapex);
  const professionalSoftCost = nonNegative(input.professionalSoftCost);
  const contingencyRate = pct(input.contingencyPct, 10) / 100;
  const projectBase = acquisitionPrice + conversionCapex + professionalSoftCost;
  const contingency = conversionCapex * contingencyRate;
  const projectInputsComplete = suppliedNonNegative(input.acquisitionPrice) && suppliedNonNegative(input.conversionCapex) && suppliedNonNegative(input.professionalSoftCost) && suppliedNonNegative(input.contingencyPct);
  const totalProjectCost = projectInputsComplete && projectBase > 0 ? projectBase + contingency : null;
  const equityRequired = totalProjectCost == null || !suppliedNonNegative(input.loanAmount) ? null : Math.max(0, totalProjectCost - loanAmount);
  const equityRequiredPct = totalProjectCost && equityRequired != null ? (equityRequired / totalProjectCost) * 100 : null;

  const missingInputs: string[] = missingExpenses.map(key => key + " (enter an amount or explicit zero)");
  if (!suppliedNonNegative(input.ancillaryRevenueMonthly)) missingInputs.push("ancillary revenue or explicit zero");
  if (!suppliedNonNegative(input.replacementReservePct)) missingInputs.push("replacement reserve percentage or explicit zero");
  if (!projectInputsComplete) missingInputs.push("complete acquisition, conversion, soft-cost and contingency budget");
  if (!(input.unitCount > 0)) missingInputs.push("room/unit count");
  if (!suppliedNonNegative(input.occupancyPct) || input.occupancyPct > 100) missingInputs.push("stabilized occupancy assumption");
  if (!(input.averageUnitRevenue > 0)) missingInputs.push(input.revenueCadence === "nightly" ? "average daily rate" : "monthly revenue per occupied unit");
  if (!(loanAmount > 0)) missingInputs.push("proposed loan amount");
  if (!suppliedNonNegative(input.interestRatePct)) missingInputs.push("interest-rate assumption");
  if (!(amortYears > 0)) missingInputs.push("amortization term");

  const warnings: string[] = [
    ...(!operatingInputsComplete ? ["Incomplete operating inputs: revenue, expense and NOI subtotals are partial scenario arithmetic only; coverage, capacity and break-even conclusions are withheld."] : []),
    "Screening model only: replace assumptions with verified property/project operating statements, rent/room data, staffing plan, taxes, insurance, utility quotes, licensing requirements and contractor pricing as they become available.",
    "DSCR here is property/project-side math, not a credit decision or financing approval. Furlong does not use personal credit, personal income, household assets, DTI or other personal financial-profile data to score this nonresidential property. A selected lender/program may separately require borrower underwriting before approval.",
  ];
  if (/senior_assisted_living/.test(input.useType)) {
    warnings.push("Assisted-living/care models require state-specific licensing, staffing and service-cost assumptions; independent-living economics must not be reused as a care-facility model.");
  }
  if (breakEvenOccupancy != null && breakEvenOccupancy > 100) {
    warnings.push("The current assumptions require more than 100% occupancy to cover modeled debt service; price, debt structure, revenue or operating costs must change for this property-side case to work.");
  }

  const occCases = [Math.max(0, occupancy - 10), Math.max(0, occupancy - 5), occupancy, Math.min(100, occupancy + 5)];
  const rateCases = [0.9, 1, 1.1];
  const sensitivity = [
    ...occCases.map((o) => sensitivityCase(input, o, averageUnitRevenue, operatingInputsComplete ? ads : null)),
    ...rateCases.filter((m) => m !== 1).map((m) => sensitivityCase(input, occupancy, averageUnitRevenue * m, operatingInputsComplete ? ads : null)),
  ];

  return {
    version: "property-operating-model-v1.1.0",
    annualUnitRevenue: Math.round(annualUnitRevenue),
    annualAncillaryRevenue: Math.round(annualAncillaryRevenue),
    annualRevenue: Math.round(annualRevenue),
    annualFixedOperatingExpenses: Math.round(annualFixedOperatingExpenses),
    annualReplacementReserve: Math.round(annualReplacementReserve),
    annualOperatingExpenses: operatingInputsComplete ? Math.round(annualOperatingExpenses) : null,
    noi: operatingInputsComplete ? Math.round(noi) : null,
    noiMarginPct: operatingInputsComplete ? noiMarginPct : null,
    annualDebtService: ads == null ? null : Math.round(ads),
    dscr,
    targetDscr,
    coveragePosture,
    annualNoiRequiredForTarget: annualNoiRequiredForTarget == null ? null : Math.round(annualNoiRequiredForTarget),
    annualCoverageGap: annualCoverageGap == null ? null : Math.round(annualCoverageGap),
    breakEvenOccupancyPct: breakEvenOccupancy == null ? null : Math.max(0, breakEvenOccupancy),
    maxLoanSupportedAtTarget: maxLoanSupportedAtTarget == null ? null : Math.max(0, Math.round(maxLoanSupportedAtTarget)),
    totalProjectCost: totalProjectCost == null ? null : Math.round(totalProjectCost),
    equityRequired: equityRequired == null ? null : Math.round(equityRequired),
    equityRequiredPct,
    sensitivity: operatingInputsComplete ? sensitivity : sensitivity.map(row => ({...row, noi: null, dscr: null})),
    missingInputs,
    warnings,
  };
}

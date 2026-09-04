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

export type CoveragePosture = "STRONG" | "CLEARS_TARGET" | "THIN" | "SHORT" | "NO_DEBT_MODEL";

export interface OperatingSensitivityCase {
  label: string;
  occupancyPct: number;
  averageUnitRevenue: number;
  annualRevenue: number;
  noi: number;
  dscr: number | null;
}

export interface PropertyOperatingModelResult {
  version: "property-operating-model-v1.0.0";
  annualUnitRevenue: number;
  annualAncillaryRevenue: number;
  annualRevenue: number;
  annualFixedOperatingExpenses: number;
  annualReplacementReserve: number;
  annualOperatingExpenses: number;
  noi: number;
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

function annualDebtService(principal: number, ratePct: number, years: number): number | null {
  if (!(principal > 0) || !(years > 0)) return null;
  const monthlyRate = Math.max(0, ratePct) / 100 / 12;
  const periods = years * 12;
  const payment = monthlyRate === 0
    ? principal / periods
    : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -periods));
  return payment * 12;
}

function loanPrincipalFromAnnualDebtService(ads: number, ratePct: number, years: number): number | null {
  if (!(ads > 0) || !(years > 0)) return null;
  const monthlyPayment = ads / 12;
  const monthlyRate = Math.max(0, ratePct) / 100 / 12;
  const periods = years * 12;
  if (monthlyRate === 0) return monthlyPayment * periods;
  return monthlyPayment * (1 - Math.pow(1 + monthlyRate, -periods)) / monthlyRate;
}

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
  const ads = annualDebtService(loanAmount, rate, amortYears);
  const dscr = ads && ads > 0 ? noi / ads : null;
  const annualNoiRequiredForTarget = ads ? ads * targetDscr : null;
  const annualCoverageGap = annualNoiRequiredForTarget == null ? null : Math.max(0, annualNoiRequiredForTarget - noi);
  const coveragePosture: CoveragePosture = dscr == null
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
  const breakEvenOccupancy = ads && unitPotentialAt100 > 0 && netRevenueFactor > 0
    ? ((ads + annualFixedOperatingExpenses - annualAncillaryRevenue * netRevenueFactor) / (unitPotentialAt100 * netRevenueFactor)) * 100
    : null;

  const maxAdsAtTarget = noi > 0 ? noi / targetDscr : null;
  const maxLoanSupportedAtTarget = maxAdsAtTarget && rate >= 0 && amortYears > 0
    ? loanPrincipalFromAnnualDebtService(maxAdsAtTarget, rate, amortYears)
    : null;

  const acquisitionPrice = nonNegative(input.acquisitionPrice);
  const conversionCapex = nonNegative(input.conversionCapex);
  const professionalSoftCost = nonNegative(input.professionalSoftCost);
  const contingencyRate = pct(input.contingencyPct, 10) / 100;
  const projectBase = acquisitionPrice + conversionCapex + professionalSoftCost;
  const contingency = conversionCapex * contingencyRate;
  const totalProjectCost = projectBase > 0 ? projectBase + contingency : null;
  const equityRequired = totalProjectCost == null ? null : Math.max(0, totalProjectCost - loanAmount);
  const equityRequiredPct = totalProjectCost && equityRequired != null ? (equityRequired / totalProjectCost) * 100 : null;

  const missingInputs: string[] = [];
  if (!(input.unitCount > 0)) missingInputs.push("room/unit count");
  if (!(input.occupancyPct > 0)) missingInputs.push("stabilized occupancy assumption");
  if (!(input.averageUnitRevenue > 0)) missingInputs.push(input.revenueCadence === "nightly" ? "average daily rate" : "monthly revenue per occupied unit");
  if (!(loanAmount > 0)) missingInputs.push("proposed loan amount");
  if (!(rate > 0)) missingInputs.push("interest-rate assumption");
  if (!(amortYears > 0)) missingInputs.push("amortization term");

  const warnings: string[] = [
    "Screening model only: replace assumptions with verified operating statements, rent/room data, staffing plan, taxes, insurance, utility quotes, licensing requirements and contractor pricing as they become available.",
    "DSCR is property-side math, not a credit decision or financing approval. Each lender/program applies its own coverage, guarantor, credit, collateral, equity, eligibility and documentation rules.",
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
    ...occCases.map((o) => sensitivityCase(input, o, averageUnitRevenue, ads)),
    ...rateCases.filter((m) => m !== 1).map((m) => sensitivityCase(input, occupancy, averageUnitRevenue * m, ads)),
  ];

  return {
    version: "property-operating-model-v1.0.0",
    annualUnitRevenue: Math.round(annualUnitRevenue),
    annualAncillaryRevenue: Math.round(annualAncillaryRevenue),
    annualRevenue: Math.round(annualRevenue),
    annualFixedOperatingExpenses: Math.round(annualFixedOperatingExpenses),
    annualReplacementReserve: Math.round(annualReplacementReserve),
    annualOperatingExpenses: Math.round(annualOperatingExpenses),
    noi: Math.round(noi),
    noiMarginPct,
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
    sensitivity,
    missingInputs,
    warnings,
  };
}

/** Canonical deterministic arithmetic. Vol III TECH-PROV-001 / Vol V CANON-EXPL-001.
 * Null is missing/invalid, never zero debt, zero expense or a substitute price.
 * Payment frequency must be explicit: annual farm payments are not mortgages.
 */
export const CALCULATION_MATH_VERSION = "calculation-math-v1.0.0" as const;
export const finiteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
export const positiveNumber = (v: unknown): v is number => finiteNumber(v) && v > 0;
export function annualLevelDebtService(principal: number, ratePct: number, years: number, paymentsPerYear: 1 | 12): number | null {
  if (![1, 12].includes(paymentsPerYear) || !finiteNumber(principal) || principal < 0 || !finiteNumber(ratePct) || ratePct < 0 || !positiveNumber(years) || years > 100) return null;
  if (principal === 0) return 0;
  const periods = years * paymentsPerYear;
  const rate = ratePct / 100 / paymentsPerYear;
  const result = rate === 0 ? principal / years : principal * rate / -Math.expm1(-periods * Math.log1p(rate)) * paymentsPerYear;
  return finiteNumber(result) ? result : null;
}
export function principalFromAnnualDebtService(annualPayment: number, ratePct: number, years: number, paymentsPerYear: 1 | 12): number | null {
  const factor = annualLevelDebtService(1, ratePct, years, paymentsPerYear);
  return positiveNumber(annualPayment) && positiveNumber(factor) ? annualPayment / factor : null;
}
export function debtCoverage(noi: number | null, debtService: number | null): number | null {
  return finiteNumber(noi) && positiveNumber(debtService) ? noi / debtService : null;
}
/** Explicit asking price, contract or intended offer only. Proxies are not accepted. */
export function transactionPrice(value: unknown): number | null { return positiveNumber(value) ? value : null; }

/** Manual sensitivity only; this does not establish market-derived NOI or cap rates. */
export interface IncomeCapScenario {
  version: typeof CALCULATION_MATH_VERSION;
  role: "user-assumption-scenario";
  lowUsd: number;
  midUsd: number;
  highUsd: number;
  method: string;
}
export function incomeCapScenario(noi: number | null, capA: number | null, capB: number | null): IncomeCapScenario | null {
  if (!positiveNumber(noi) || !positiveNumber(capA) || !positiveNumber(capB) || capA > 100 || capB > 100) return null;
  const lowUsd = noi / (Math.max(capA, capB) / 100);
  const highUsd = noi / (Math.min(capA, capB) / 100);
  const midUsd = noi / ((capA + capB) / 200);
  if (![lowUsd, highUsd, midUsd].every(finiteNumber)) return null;
  return { version: CALCULATION_MATH_VERSION, role: "user-assumption-scenario", lowUsd, midUsd, highUsd,
    method: "Entered NOI divided by entered cap rates. These assumptions have not been verified against the property or market. This is not a market-value finding, acquisition price, BPO, or appraisal." };
}

/** Form boundary: an empty or malformed field is missing, not an explicit zero. */
export function parseScenarioNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
export function remainingLoanBalance(principal: number, ratePct: number, years: number, paymentsMade: number, frequency: 1 | 12): number | null {
  if (annualLevelDebtService(principal, ratePct, years, frequency) == null || !Number.isInteger(paymentsMade) || paymentsMade < 0) return null;
  const periods = years * frequency;
  if (paymentsMade >= periods) return 0;
  const rate = ratePct / 100 / frequency;
  if (rate === 0) return principal * (1 - paymentsMade / periods);
  const remainingFraction = -Math.expm1(-(periods - paymentsMade) * Math.log1p(rate)) / -Math.expm1(-periods * Math.log1p(rate));
  return principal * remainingFraction;
}

export type FinancingScenarioInput = {
  id: string;
  label: string;
  projectCostUsd: number;
  equityPct: number;
  annualRatePct: number;
  amortizationYears: number;
  termYears: number;
  upfrontFeePct: number;
  annualNoiUsd?: number | null;
};

export type FinancingScenarioResult = FinancingScenarioInput & {
  loanAmountUsd: number;
  equityCashUsd: number;
  upfrontFeeUsd: number;
  estimatedCashBeforeOtherClosingCostsUsd: number;
  monthlyPrincipalInterestUsd: number;
  annualDebtServiceUsd: number;
  termMonths: number;
  amortizationMonths: number;
  scheduledPaymentsThroughTermUsd: number;
  principalReductionThroughTermUsd: number;
  interestThroughTermUsd: number;
  remainingBalanceAtTermUsd: number;
  screeningFinancingCostThroughTermUsd: number;
  dscr: number | null;
  hasBalloon: boolean;
};

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function assertInput(input: FinancingScenarioInput): void {
  if (!finite(input.projectCostUsd) || input.projectCostUsd <= 0) throw new Error("Project cost must be greater than zero.");
  if (!finite(input.equityPct) || input.equityPct < 0 || input.equityPct >= 100) throw new Error("Equity must be between 0% and less than 100%.");
  if (!finite(input.annualRatePct) || input.annualRatePct < 0 || input.annualRatePct > 50) throw new Error("Annual rate must be between 0% and 50%.");
  if (!finite(input.amortizationYears) || input.amortizationYears <= 0 || input.amortizationYears > 50) throw new Error("Amortization must be between 1 and 50 years.");
  if (!finite(input.termYears) || input.termYears <= 0 || input.termYears > input.amortizationYears) throw new Error("Term must be greater than zero and no longer than amortization.");
  if (!finite(input.upfrontFeePct) || input.upfrontFeePct < 0 || input.upfrontFeePct > 20) throw new Error("Upfront fee must be between 0% and 20%.");
  if (input.annualNoiUsd != null && (!finite(input.annualNoiUsd) || input.annualNoiUsd < 0)) throw new Error("NOI must be zero or greater when provided.");
}

export function monthlyPrincipalInterest(principal: number, annualRatePct: number, amortizationYears: number): number {
  if (principal <= 0) return 0;
  const months = Math.round(amortizationYears * 12);
  const rate = annualRatePct / 100 / 12;
  if (rate === 0) return principal / months;
  return principal * rate / (1 - Math.pow(1 + rate, -months));
}

export function remainingBalanceAfterPayments(
  principal: number,
  annualRatePct: number,
  amortizationYears: number,
  paymentsMade: number,
): number {
  const months = Math.round(amortizationYears * 12);
  const k = Math.min(Math.max(0, Math.round(paymentsMade)), months);
  if (k >= months) return 0;
  const payment = monthlyPrincipalInterest(principal, annualRatePct, amortizationYears);
  const rate = annualRatePct / 100 / 12;
  if (rate === 0) return Math.max(0, principal - payment * k);
  const factor = Math.pow(1 + rate, k);
  return Math.max(0, principal * factor - payment * ((factor - 1) / rate));
}

export function compareFinancingScenario(input: FinancingScenarioInput): FinancingScenarioResult {
  assertInput(input);
  const loanAmountUsd = input.projectCostUsd * (1 - input.equityPct / 100);
  const equityCashUsd = input.projectCostUsd - loanAmountUsd;
  const upfrontFeeUsd = loanAmountUsd * input.upfrontFeePct / 100;
  const monthlyPrincipalInterestUsd = monthlyPrincipalInterest(loanAmountUsd, input.annualRatePct, input.amortizationYears);
  const amortizationMonths = Math.round(input.amortizationYears * 12);
  const termMonths = Math.min(Math.round(input.termYears * 12), amortizationMonths);
  const remainingBalanceAtTermUsd = remainingBalanceAfterPayments(
    loanAmountUsd,
    input.annualRatePct,
    input.amortizationYears,
    termMonths,
  );
  const principalReductionThroughTermUsd = Math.max(0, loanAmountUsd - remainingBalanceAtTermUsd);
  const scheduledPaymentsThroughTermUsd = monthlyPrincipalInterestUsd * termMonths;
  const interestThroughTermUsd = Math.max(0, scheduledPaymentsThroughTermUsd - principalReductionThroughTermUsd);
  const annualDebtServiceUsd = monthlyPrincipalInterestUsd * 12;
  const dscr = input.annualNoiUsd != null && annualDebtServiceUsd > 0 ? input.annualNoiUsd / annualDebtServiceUsd : null;

  return {
    ...input,
    loanAmountUsd,
    equityCashUsd,
    upfrontFeeUsd,
    estimatedCashBeforeOtherClosingCostsUsd: equityCashUsd + upfrontFeeUsd,
    monthlyPrincipalInterestUsd,
    annualDebtServiceUsd,
    termMonths,
    amortizationMonths,
    scheduledPaymentsThroughTermUsd,
    principalReductionThroughTermUsd,
    interestThroughTermUsd,
    remainingBalanceAtTermUsd,
    screeningFinancingCostThroughTermUsd: interestThroughTermUsd + upfrontFeeUsd,
    dscr,
    hasBalloon: termMonths < amortizationMonths && remainingBalanceAtTermUsd > 0,
  };
}

export function compareFinancingScenarios(inputs: FinancingScenarioInput[]): FinancingScenarioResult[] {
  return inputs.map(compareFinancingScenario);
}

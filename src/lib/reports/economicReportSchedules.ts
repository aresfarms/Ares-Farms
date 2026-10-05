import type { EnterpriseEconomicEvidencePackage, SupportedEconomicMetric } from "@/lib/intelligence/economicEvidencePackage";
import type { ComparableEnterpriseCandidate } from "@/lib/intelligence/propertyComparisonRanking";
import type { ExpenseCategory } from "@/lib/intelligence/enterpriseProjection";
import { annualLevelDebtService, remainingLoanBalance } from "@/lib/property/calculationMath";

/** Vol III TECH-PROV-001 / Vol V CANON-EXPL-001. These schedules disclose the
 * exact inputs of the existing governed calculation, without adding estimates.
 * They travel in the immutable report model and its digest for replay.
 */
export type EconomicReportSchedule = {
  title: string;
  rows: Array<{ label: string; value: string }>;
  notes: string[];
};
const usd = (n: number | null) => n === null ? "Not established" :
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const number = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 6 });
const expenses: Record<ExpenseCategory, string> = {
  payroll: "Payroll", employeeBenefits: "Employee benefits", healthInsurance: "Health insurance",
  retirement: "Retirement", utilities: "Utilities", insurance: "Insurance", propertyTax: "Property tax",
  maintenance: "Maintenance", replacementReserve: "Replacement reserve", marketing: "Marketing",
  materials: "Materials", professionalFees: "Professional fees", other: "Other operating costs",
};

export function economicReportSchedules(
  evidence: EnterpriseEconomicEvidencePackage,
  candidate: ComparableEnterpriseCandidate,
): EconomicReportSchedule[] {
  if (candidate.projection.status !== "complete") return [];
  const title = evidence.candidate.title;
  const methods: string[] = [];
  const metric = (value: SupportedEconomicMetric) => {
    const note = `${value.basis.replaceAll("-", " ")}: ${value.method} Sources: ${value.sourceRefs.join("; ")}.`;
    let index = methods.indexOf(note);
    if (index < 0) { index = methods.length; methods.push(note); }
    const formatted = value.value === null ? "Not established" :
      value.unit === "usd" || value.unit === "usd-per-year" ? usd(value.value) :
      value.unit === "percent" ? number(value.value) + "%" :
      value.unit === "years" ? number(value.value) + " years" :
      value.unit === "hours-per-week" ? number(value.value) + " hours/week" : number(value.value);
    return `${formatted} [M${index + 1}]`;
  };
  const row = (label: string, value: SupportedEconomicMetric) => ({ label, value: metric(value) });
  const cost = evidence.projectCosts, operating = evidence.operations, finance = evidence.financing;
  const projection = candidate.projection;
  const annualExpenses = Object.values(operating.annualExpenses).reduce((sum, value) => sum + value.value!, 0);
  const verifiedCapital = finance.otherCapitalSources.filter(source => source.status === "verified")
    .reduce((sum, source) => sum + source.amount.value!, 0);
  const debtMaturity = Math.min(finance.termYears.value!, finance.amortizationYears.value!);
  const annualDebtService = annualLevelDebtService(finance.loanAmount.value!, finance.annualRatePct.value!, finance.amortizationYears.value!, 12);
  const balloon = remainingLoanBalance(finance.loanAmount.value!, finance.annualRatePct.value!,
    finance.amortizationYears.value!, finance.termYears.value! * 12, 12);
  const schedules: EconomicReportSchedule[] = [
    { title: `${title} — Acquisition and Startup`, rows: [
      row("Asking-price evidence", cost.askingPrice), row("Modeled purchase price", cost.proposedPurchasePrice),
      row("Closing costs", cost.closingCosts), row("Conversion costs", cost.conversionCosts),
      row("Equipment", cost.equipmentCosts), row("Working capital", cost.workingCapital),
      row("Other project costs", cost.otherProjectCosts), { label: "Total project cost", value: usd(candidate.totalProjectCost) },
    ], notes: ["The modeled purchase price enters total project cost once. The asking price is comparison evidence, not an additional expense or an independent valuation."] },
    { title: `${title} — Annual Operating Budget`, rows: [
      row("First-year revenue", operating.baseAnnualRevenue), row("Annual revenue growth", operating.annualRevenueGrowthPct),
      ...Object.entries(expenses).map(([key, label]) => ({ label,
        value: `${metric(operating.annualExpenses[key as ExpenseCategory])}/year; annual escalation ${metric(operating.annualExpenseInflationPct[key as ExpenseCategory])}` })),
      { label: "Total annual expenses", value: usd(annualExpenses) },
      { label: "First-year NOI", value: `${usd(operating.baseAnnualRevenue.value! - annualExpenses)} = revenue less annual operating expenses` },
    ], notes: ["Employee benefits exclude separately listed health insurance and retirement. Maintenance excludes replacement reserves. Periodic capital below excludes costs already funded by the annual reserve."] },
    { title: `${title} — Staffing and Financing`, rows: [
      row("Full-time equivalents", evidence.labor.fullTimeEquivalentEmployees), row("Owner time", evidence.labor.ownerHoursPerWeek),
      { label: "Owner compensation", value: evidence.labor.ownerLaborTreatment.replaceAll("-", " ") },
      { label: "Financing scenario", value: finance.programFamily },
      row("Loan principal", finance.loanAmount), row("Project cash contribution", finance.cashContribution),
      row("Annual interest rate", finance.annualRatePct), row("Amortization", finance.amortizationYears), row("Loan term", finance.termYears),
      ...finance.otherCapitalSources.map(source => ({ label: `${source.label} (${source.status})`, value: metric(source.amount) })),
      { label: "Total counted capital", value: `${usd(finance.loanAmount.value! + finance.cashContribution.value! + verifiedCapital)}; only verified other capital is counted` },
      { label: "Annual scheduled debt", value: `${usd(annualDebtService)}; monthly level payments, before any maturity payoff` },
      { label: "Maturity principal payoff", value: `${usd(balloon)} in year ${number(debtMaturity)}; deducted in that year's cash flow` },
      { label: "Project DSCR", value: `${candidate.dscr?.toFixed(2) ?? "Not established"}; first-year NOI / annual scheduled debt service` },
      ...operating.periodicCapitalCosts.map(capital => ({ label: `Year ${capital.year}: ${capital.label}`, value: metric(capital.amount) })),
    ], notes: [
      `Labor sources: ${evidence.labor.sourceRefs.join("; ")}. Financing sources: ${finance.sourceRefs.join("; ")}.`,
      ...(operating.periodicCapitalCosts.length ? [] : ["No separate periodic capital expense is included in the supplied schedule; annual reserves remain in operating expenses."]),
      "Loan terms are a project scenario, not a lender commitment or borrower eligibility finding. Conditional or identified assistance does not close a funding gap.",
    ] },
    { title: `${title} — Cash-Flow Milestones`, rows: [...new Set([1, 5, 10, debtMaturity, 30])].sort((a, b) => a - b).map(year => {
      const value = projection.years[year - 1];
      return { label: `Year ${year}`, value: `Revenue ${usd(value.revenue)}; operating costs ${usd(value.operatingExpenses)}; NOI ${usd(value.noi)}. Debt including maturity payoff ${usd(value.debtService)}; periodic capital ${usd(value.periodicCapitalCosts)}. Net ${usd(value.netAfterDebtAndCapital)}; cumulative net ${usd(value.cumulativeNet)}; annual outside-income shortfall ${usd(value.outsideIncomeRequired)}.` };
    }), notes: [
      "Each year's revenue and each expense grow independently from year one at the disclosed rates. Net equals NOI less debt and periodic capital. Cumulative net sums those annual cash flows; it is not investment profit, return on equity, or sale proceeds and does not subtract the initial cash contribution.",
      "Figures are nominal dollars, rounded for display. No property resale, appreciation, refinancing or personal income-tax outcome is included. Monthly and quarterly figures are annual averages, not a seasonal cash-flow forecast.",
    ] },
  ];
  schedules.push({ title: `${title} — Input Methods and Sources`, rows: [],
    notes: methods.map((method, index) => `[M${index + 1}] ${method}`) });
  return schedules;
}

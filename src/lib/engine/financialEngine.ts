import { FarmProfile } from "@/lib/schemas/farmProfileSchema";

/**
 * 💰 PHASE 2D — FINANCIAL ENGINE
 * Converts production + expenses into cashflow intelligence
 */

export function financialEngine(input: {
  production: any;
  economic: any;
  expenses: any;
  risk: any;
}) {
  const { production, expenses, risk } = input;

  /**
   * 🌾 REVENUE MODEL (SIMPLIFIED FARM OUTPUT VALUE)
   */
  const cropRevenue = (production.crops?.length || 0) * 18000;
  const livestockRevenue = (production.livestock?.length || 0) * 12000;

  const totalRevenue = cropRevenue + livestockRevenue;

  /**
   * 💸 EXPENSES (FROM PHASE 2B)
   */
  const totalExpenses = expenses?.totals?.totalExpenses || 0;

  /**
   * 📊 GROSS PROFIT
   */
  const grossProfit = totalRevenue - totalExpenses;

  /**
   * 📉 MARGIN ANALYSIS
   */
  const profitMargin =
    totalRevenue > 0 ? grossProfit / totalRevenue : 0;

  /**
   * 🧠 CASHFLOW PRESSURE INDEX
   * (how stressed the farm is financially)
   */
  let cashflowPressure = 0;

  if (profitMargin < 0) {
    cashflowPressure = 1; // critical loss
  } else if (profitMargin < 0.1) {
    cashflowPressure = 0.8;
  } else if (profitMargin < 0.25) {
    cashflowPressure = 0.5;
  } else {
    cashflowPressure = 0.2;
  }

  /**
   * 🏦 LOAN READINESS SIGNAL
   */
  const liquidity = risk?.liquidity || 0.5;
  const stabilityFactor = 1 - (risk?.volatility || 0.3);

  const loanReadiness =
    liquidity * 0.4 +
    stabilityFactor * 0.3 +
    profitMargin * 0.3;

  /**
   * 🚨 FINANCIAL FLAGS
   */
  const flags = {
    negativeCashflow: grossProfit < 0,
    highRiskLoan: loanReadiness < 0.5,
    marginStress: profitMargin < 0.15,
    liquidityConcern: liquidity < 0.4,
  };

  /**
   * 📦 OUTPUT MODEL
   */
  return {
    revenue: {
      cropRevenue,
      livestockRevenue,
      totalRevenue,
    },

    expenses: {
      totalExpenses,
    },

    profit: {
      grossProfit,
      profitMargin,
    },

    risk: {
      cashflowPressure,
      loanReadiness,
    },

    flags,
  };
}

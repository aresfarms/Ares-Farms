import { COMMODITY_PRICES, COMMODITY_PRICES_PROVENANCE } from "@/lib/property/commodityPricesGenerated";

export type AgriculturalProFormaInputs = {
  tractAcres: number;
  purchasePrice: number;
  tillablePct: number;
  cornSharePct: number;
  cornYieldBu: number;
  soybeanYieldBu: number;
  cornPrice: number;
  soybeanPrice: number;
  cornVariableCostPerAcre: number;
  soybeanVariableCostPerAcre: number;
  fixedOverheadPerAcre: number;
  downPaymentPct: number;
  annualRatePct: number;
  amortizationYears: number;
  cashRentLowPerAcre: number;
  cashRentHighPerAcre: number;
};

export type AgriculturalProForma = ReturnType<typeof buildAgriculturalProForma>;

const payment = (principal: number, ratePct: number, years: number): number => {
  const months = years * 12;
  const r = ratePct / 100 / 12;
  if (!r) return principal / months;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
};

export function defaultAgriculturalProFormaInputs(args: {
  tractAcres: number;
  purchasePrice: number;
  annualRatePct: number;
}): AgriculturalProFormaInputs {
  return {
    tractAcres: args.tractAcres,
    purchasePrice: args.purchasePrice,
    tillablePct: 80,
    cornSharePct: 50,
    cornYieldBu: 180,
    soybeanYieldBu: 50,
    cornPrice: COMMODITY_PRICES.corn?.pricePerBushel ?? 4.5,
    soybeanPrice: COMMODITY_PRICES.soybeans?.pricePerBushel ?? 10.5,
    cornVariableCostPerAcre: 720,
    soybeanVariableCostPerAcre: 430,
    fixedOverheadPerAcre: 85,
    downPaymentPct: 20,
    annualRatePct: args.annualRatePct,
    amortizationYears: 40,
    cashRentLowPerAcre: 170,
    cashRentHighPerAcre: 220,
  };
}

export function buildAgriculturalProForma(input: AgriculturalProFormaInputs) {
  const tillableAcres = input.tractAcres * input.tillablePct / 100;
  const nonTillableAcres = Math.max(0, input.tractAcres - tillableAcres);
  const cornAcres = tillableAcres * input.cornSharePct / 100;
  const soybeanAcres = Math.max(0, tillableAcres - cornAcres);
  const cornRevenue = cornAcres * input.cornYieldBu * input.cornPrice;
  const soybeanRevenue = soybeanAcres * input.soybeanYieldBu * input.soybeanPrice;
  const grossCropRevenue = cornRevenue + soybeanRevenue;
  const cornVariableCosts = cornAcres * input.cornVariableCostPerAcre;
  const soybeanVariableCosts = soybeanAcres * input.soybeanVariableCostPerAcre;
  const fixedOverhead = tillableAcres * input.fixedOverheadPerAcre;
  const totalOperatingExpense = cornVariableCosts + soybeanVariableCosts + fixedOverhead;
  const netOperatingIncome = grossCropRevenue - totalOperatingExpense;
  const loanAmount = input.purchasePrice * (1 - input.downPaymentPct / 100);
  const annualDebtService = payment(loanAmount, input.annualRatePct, input.amortizationYears) * 12;
  const dscr = annualDebtService > 0 ? netOperatingIncome / annualDebtService : null;
  const cashRentLow = tillableAcres * input.cashRentLowPerAcre;
  const cashRentHigh = tillableAcres * input.cashRentHighPerAcre;
  const cashRentDscrLow = annualDebtService > 0 ? cashRentLow / annualDebtService : null;
  const cashRentDscrHigh = annualDebtService > 0 ? cashRentHigh / annualDebtService : null;
  return {
    inputs: input,
    acreage: { tillableAcres, nonTillableAcres, cornAcres, soybeanAcres },
    revenue: { cornRevenue, soybeanRevenue, grossCropRevenue, cashRentLow, cashRentHigh },
    expenses: { cornVariableCosts, soybeanVariableCosts, fixedOverhead, totalOperatingExpense },
    debt: { loanAmount, annualDebtService, dscr, cashRentDscrLow, cashRentDscrHigh, threshold: 1.25 },
    provenance: {
      commodityPrices: `${COMMODITY_PRICES_PROVENANCE.source}, snapshot ${COMMODITY_PRICES_PROVENANCE.asOf ?? "date unavailable"}`,
      yields: "Editable operator assumptions pending USDA NASS Caroline County yield snapshot",
      costs: "Editable planning assumptions pending operator crop budgets, supplier quotes, MPCI election, and machinery records",
      cashRent: "Editable Eastern Shore planning range pending USDA NASS county cash-rent and local lease evidence",
    },
    readiness: [
      "NRCS Web Soil Survey map-unit acreage and capability classification",
      "FSA-156EZ acreage, crop base, and PLC yield records",
      "Five-year APH or production history and crop-insurance elections",
      "Irrigation-well permit, tested pumping capacity, and annual power use",
      "Drainage district, tax-ditch, buffer, wetland, and conservation obligations",
      "Equipment register, custom-hire plan, and replacement-capital schedule",
      "Current farm balance sheet, liabilities, working capital, and global debt service",
    ],
  };
}

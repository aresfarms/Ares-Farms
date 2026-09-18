/**
 * stateElectricityGenerated — GENERATED FILE. Do not edit by hand.
 *
 * State-average electricity prices and typical residential bills from the
 * U.S. Energy Information Administration (EIA) — public domain. State
 * AVERAGES only; the serving utility's tariff decides actuals.
 * Re-run: EIA_API_KEY=<key> npm run ingest:eia-electricity
 */

export const STATE_ELECTRICITY_PROVENANCE = {
  asOf: "2026-07-17" as string | null,
  source: "U.S. EIA electricity retail sales (api.eia.gov)",
  year: 2025 as number | null,
  resolvedStates: 51,
} as const;

export interface StateElectricity {
  /** Average residential price, cents/kWh. */
  resPriceCentsKwh: number;
  /** Average residential monthly bill, dollars (revenue / customers / 12). */
  resAvgMonthlyBill: number | null;
  /** Average commercial price, cents/kWh. */
  comPriceCentsKwh: number | null;
}

export const STATE_ELECTRICITY: Record<string, StateElectricity> = {
  "AK": {"resPriceCentsKwh":26.09,"resAvgMonthlyBill":146,"comPriceCentsKwh":22.32},
  "AL": {"resPriceCentsKwh":16.1,"resAvgMonthlyBill":184,"comPriceCentsKwh":14.52},
  "AR": {"resPriceCentsKwh":12.84,"resAvgMonthlyBill":137,"comPriceCentsKwh":10.76},
  "AZ": {"resPriceCentsKwh":15.32,"resAvgMonthlyBill":156,"comPriceCentsKwh":12.47},
  "CA": {"resPriceCentsKwh":32.54,"resAvgMonthlyBill":151,"comPriceCentsKwh":26.36},
  "CO": {"resPriceCentsKwh":15.85,"resAvgMonthlyBill":107,"comPriceCentsKwh":12.47},
  "CT": {"resPriceCentsKwh":29.38,"resAvgMonthlyBill":204,"comPriceCentsKwh":23.11},
  "DC": {"resPriceCentsKwh":21.94,"resAvgMonthlyBill":140,"comPriceCentsKwh":20.41},
  "DE": {"resPriceCentsKwh":17.13,"resAvgMonthlyBill":159,"comPriceCentsKwh":12.64},
  "FL": {"resPriceCentsKwh":15.24,"resAvgMonthlyBill":166,"comPriceCentsKwh":11.47},
  "GA": {"resPriceCentsKwh":14.73,"resAvgMonthlyBill":159,"comPriceCentsKwh":11.5},
  "HI": {"resPriceCentsKwh":40.59,"resAvgMonthlyBill":207,"comPriceCentsKwh":36.37},
  "IA": {"resPriceCentsKwh":13.72,"resAvgMonthlyBill":117,"comPriceCentsKwh":11.05},
  "ID": {"resPriceCentsKwh":11.82,"resAvgMonthlyBill":109,"comPriceCentsKwh":9.25},
  "IL": {"resPriceCentsKwh":17.69,"resAvgMonthlyBill":127,"comPriceCentsKwh":13.07},
  "IN": {"resPriceCentsKwh":16.23,"resAvgMonthlyBill":154,"comPriceCentsKwh":13.88},
  "KS": {"resPriceCentsKwh":14.56,"resAvgMonthlyBill":128,"comPriceCentsKwh":11.35},
  "KY": {"resPriceCentsKwh":13.24,"resAvgMonthlyBill":149,"comPriceCentsKwh":11.88},
  "LA": {"resPriceCentsKwh":12.57,"resAvgMonthlyBill":154,"comPriceCentsKwh":11.2},
  "MA": {"resPriceCentsKwh":30.48,"resAvgMonthlyBill":175,"comPriceCentsKwh":23.08},
  "MD": {"resPriceCentsKwh":19.48,"resAvgMonthlyBill":184,"comPriceCentsKwh":14.74},
  "ME": {"resPriceCentsKwh":27.78,"resAvgMonthlyBill":147,"comPriceCentsKwh":20.96},
  "MI": {"resPriceCentsKwh":20.01,"resAvgMonthlyBill":127,"comPriceCentsKwh":14.48},
  "MN": {"resPriceCentsKwh":15.82,"resAvgMonthlyBill":117,"comPriceCentsKwh":12.27},
  "MO": {"resPriceCentsKwh":13.49,"resAvgMonthlyBill":142,"comPriceCentsKwh":10.63},
  "MS": {"resPriceCentsKwh":14.03,"resAvgMonthlyBill":165,"comPriceCentsKwh":13.03},
  "MT": {"resPriceCentsKwh":12.98,"resAvgMonthlyBill":110,"comPriceCentsKwh":11.88},
  "NC": {"resPriceCentsKwh":14.02,"resAvgMonthlyBill":145,"comPriceCentsKwh":10.25},
  "ND": {"resPriceCentsKwh":11.81,"resAvgMonthlyBill":126,"comPriceCentsKwh":7.4},
  "NE": {"resPriceCentsKwh":12.34,"resAvgMonthlyBill":119,"comPriceCentsKwh":8.79},
  "NH": {"resPriceCentsKwh":24.56,"resAvgMonthlyBill":156,"comPriceCentsKwh":20.16},
  "NJ": {"resPriceCentsKwh":22.63,"resAvgMonthlyBill":148,"comPriceCentsKwh":16.63},
  "NM": {"resPriceCentsKwh":15.08,"resAvgMonthlyBill":98,"comPriceCentsKwh":11.23},
  "NV": {"resPriceCentsKwh":13.15,"resAvgMonthlyBill":113,"comPriceCentsKwh":9.36},
  "NY": {"resPriceCentsKwh":26.39,"resAvgMonthlyBill":154,"comPriceCentsKwh":21.07},
  "OH": {"resPriceCentsKwh":16.96,"resAvgMonthlyBill":149,"comPriceCentsKwh":11.6},
  "OK": {"resPriceCentsKwh":13.12,"resAvgMonthlyBill":140,"comPriceCentsKwh":9.08},
  "OR": {"resPriceCentsKwh":15.37,"resAvgMonthlyBill":133,"comPriceCentsKwh":10.56},
  "PA": {"resPriceCentsKwh":19.3,"resAvgMonthlyBill":163,"comPriceCentsKwh":12.44},
  "RI": {"resPriceCentsKwh":29.46,"resAvgMonthlyBill":165,"comPriceCentsKwh":23.46},
  "SC": {"resPriceCentsKwh":14.96,"resAvgMonthlyBill":159,"comPriceCentsKwh":11.05},
  "SD": {"resPriceCentsKwh":13.38,"resAvgMonthlyBill":134,"comPriceCentsKwh":10.89},
  "TN": {"resPriceCentsKwh":13.18,"resAvgMonthlyBill":159,"comPriceCentsKwh":12.87},
  "TX": {"resPriceCentsKwh":15.47,"resAvgMonthlyBill":171,"comPriceCentsKwh":8.64},
  "UT": {"resPriceCentsKwh":13.07,"resAvgMonthlyBill":101,"comPriceCentsKwh":10.04},
  "VA": {"resPriceCentsKwh":15.28,"resAvgMonthlyBill":162,"comPriceCentsKwh":9.55},
  "VT": {"resPriceCentsKwh":22.92,"resAvgMonthlyBill":135,"comPriceCentsKwh":19.92},
  "WA": {"resPriceCentsKwh":13.11,"resAvgMonthlyBill":124,"comPriceCentsKwh":10.95},
  "WI": {"resPriceCentsKwh":18.16,"resAvgMonthlyBill":120,"comPriceCentsKwh":13.06},
  "WV": {"resPriceCentsKwh":15.41,"resAvgMonthlyBill":165,"comPriceCentsKwh":11.75},
  "WY": {"resPriceCentsKwh":13.38,"resAvgMonthlyBill":113,"comPriceCentsKwh":9.54},
};

/**
 * stateHpiGenerated — GENERATED FILE. Do not edit by hand.
 *
 * State house-price trend factors from the FHFA House Price Index
 * (traditional, all-transactions, quarterly). factorSinceBase multiplies a
 * 2023 dollar value forward to the latest quarter. State TRENDS only.
 * Re-run: npm run ingest:fhfa-hpi
 */

export const STATE_HPI_PROVENANCE = {
  asOf: "2026-07-17" as string | null,
  source: "FHFA House Price Index master file (fhfa.gov)",
  baseYear: 2023,
  resolvedStates: 51,
} as const;

export interface StateHpi {
  /** Multiply a 2023 dollar value by this to walk it to the latest quarter. */
  factorSinceBase: number;
  /** Latest quarter in the series, e.g. "2026Q1". */
  latestQuarter: string;
  /** The state's PUBLISHED long-run annualized price change, percent —
      basis for equity-outlook scenarios (history, never a prediction). */
  longRunAnnualPct: number;
  /** Years the long-run rate spans (~30). */
  longRunSpanYears: number;
}

export const STATE_HPI: Record<string, StateHpi> = {
  "AK": {"factorSinceBase":1.1388,"latestQuarter":"2026Q1","longRunAnnualPct":4,"longRunSpanYears":30},
  "AL": {"factorSinceBase":1.1172,"latestQuarter":"2026Q1","longRunAnnualPct":3.68,"longRunSpanYears":30},
  "AR": {"factorSinceBase":1.1199,"latestQuarter":"2026Q1","longRunAnnualPct":3.73,"longRunSpanYears":30},
  "AZ": {"factorSinceBase":1.0773,"latestQuarter":"2026Q1","longRunAnnualPct":5.09,"longRunSpanYears":30},
  "CA": {"factorSinceBase":1.0779,"latestQuarter":"2026Q1","longRunAnnualPct":5.37,"longRunSpanYears":30},
  "CO": {"factorSinceBase":1.0445,"latestQuarter":"2026Q1","longRunAnnualPct":5.05,"longRunSpanYears":30},
  "CT": {"factorSinceBase":1.2065,"latestQuarter":"2026Q1","longRunAnnualPct":3.92,"longRunSpanYears":30},
  "DC": {"factorSinceBase":1.033,"latestQuarter":"2026Q1","longRunAnnualPct":5.83,"longRunSpanYears":30},
  "DE": {"factorSinceBase":1.1395,"latestQuarter":"2026Q1","longRunAnnualPct":4.06,"longRunSpanYears":30},
  "FL": {"factorSinceBase":1.0616,"latestQuarter":"2026Q1","longRunAnnualPct":5.35,"longRunSpanYears":30},
  "GA": {"factorSinceBase":1.105,"latestQuarter":"2026Q1","longRunAnnualPct":4.3,"longRunSpanYears":30},
  "HI": {"factorSinceBase":1.0929,"latestQuarter":"2026Q1","longRunAnnualPct":4.47,"longRunSpanYears":30},
  "IA": {"factorSinceBase":1.112,"latestQuarter":"2026Q1","longRunAnnualPct":3.61,"longRunSpanYears":30},
  "ID": {"factorSinceBase":1.0914,"latestQuarter":"2026Q1","longRunAnnualPct":5.14,"longRunSpanYears":30},
  "IL": {"factorSinceBase":1.1804,"latestQuarter":"2026Q1","longRunAnnualPct":3.29,"longRunSpanYears":30},
  "IN": {"factorSinceBase":1.145,"latestQuarter":"2026Q1","longRunAnnualPct":3.69,"longRunSpanYears":30},
  "KS": {"factorSinceBase":1.1463,"latestQuarter":"2026Q1","longRunAnnualPct":4.04,"longRunSpanYears":30},
  "KY": {"factorSinceBase":1.1454,"latestQuarter":"2026Q1","longRunAnnualPct":3.92,"longRunSpanYears":30},
  "LA": {"factorSinceBase":1.057,"latestQuarter":"2026Q1","longRunAnnualPct":3.49,"longRunSpanYears":30},
  "MA": {"factorSinceBase":1.1431,"latestQuarter":"2026Q1","longRunAnnualPct":5.08,"longRunSpanYears":30},
  "MD": {"factorSinceBase":1.1134,"latestQuarter":"2026Q1","longRunAnnualPct":4.08,"longRunSpanYears":30},
  "ME": {"factorSinceBase":1.1601,"latestQuarter":"2026Q1","longRunAnnualPct":5.12,"longRunSpanYears":30},
  "MI": {"factorSinceBase":1.1598,"latestQuarter":"2026Q1","longRunAnnualPct":3.74,"longRunSpanYears":30},
  "MN": {"factorSinceBase":1.0976,"latestQuarter":"2026Q1","longRunAnnualPct":4.24,"longRunSpanYears":30},
  "MO": {"factorSinceBase":1.1396,"latestQuarter":"2026Q1","longRunAnnualPct":4.03,"longRunSpanYears":30},
  "MS": {"factorSinceBase":1.1147,"latestQuarter":"2026Q1","longRunAnnualPct":3.43,"longRunSpanYears":30},
  "MT": {"factorSinceBase":1.1135,"latestQuarter":"2026Q1","longRunAnnualPct":5.25,"longRunSpanYears":30},
  "NC": {"factorSinceBase":1.1119,"latestQuarter":"2026Q1","longRunAnnualPct":4.31,"longRunSpanYears":30},
  "ND": {"factorSinceBase":1.1159,"latestQuarter":"2026Q1","longRunAnnualPct":4.38,"longRunSpanYears":30},
  "NE": {"factorSinceBase":1.1176,"latestQuarter":"2026Q1","longRunAnnualPct":4.04,"longRunSpanYears":30},
  "NH": {"factorSinceBase":1.1712,"latestQuarter":"2026Q1","longRunAnnualPct":5.27,"longRunSpanYears":30},
  "NJ": {"factorSinceBase":1.2059,"latestQuarter":"2026Q1","longRunAnnualPct":4.68,"longRunSpanYears":30},
  "NM": {"factorSinceBase":1.1123,"latestQuarter":"2026Q1","longRunAnnualPct":3.69,"longRunSpanYears":30},
  "NV": {"factorSinceBase":1.1004,"latestQuarter":"2026Q1","longRunAnnualPct":4.36,"longRunSpanYears":30},
  "NY": {"factorSinceBase":1.1853,"latestQuarter":"2026Q1","longRunAnnualPct":4.76,"longRunSpanYears":30},
  "OH": {"factorSinceBase":1.1639,"latestQuarter":"2026Q1","longRunAnnualPct":3.47,"longRunSpanYears":30},
  "OK": {"factorSinceBase":1.1011,"latestQuarter":"2026Q1","longRunAnnualPct":3.92,"longRunSpanYears":30},
  "OR": {"factorSinceBase":1.0579,"latestQuarter":"2026Q1","longRunAnnualPct":4.8,"longRunSpanYears":30},
  "PA": {"factorSinceBase":1.1596,"latestQuarter":"2026Q1","longRunAnnualPct":4.09,"longRunSpanYears":30},
  "RI": {"factorSinceBase":1.1843,"latestQuarter":"2026Q1","longRunAnnualPct":4.94,"longRunSpanYears":30},
  "SC": {"factorSinceBase":1.141,"latestQuarter":"2026Q1","longRunAnnualPct":4.49,"longRunSpanYears":30},
  "SD": {"factorSinceBase":1.1073,"latestQuarter":"2026Q1","longRunAnnualPct":4.49,"longRunSpanYears":30},
  "TN": {"factorSinceBase":1.1128,"latestQuarter":"2026Q1","longRunAnnualPct":4.61,"longRunSpanYears":30},
  "TX": {"factorSinceBase":1.0556,"latestQuarter":"2026Q1","longRunAnnualPct":4.64,"longRunSpanYears":30},
  "UT": {"factorSinceBase":1.0898,"latestQuarter":"2026Q1","longRunAnnualPct":4.9,"longRunSpanYears":30},
  "VA": {"factorSinceBase":1.1403,"latestQuarter":"2026Q1","longRunAnnualPct":4.57,"longRunSpanYears":30},
  "VT": {"factorSinceBase":1.156,"latestQuarter":"2026Q1","longRunAnnualPct":4.67,"longRunSpanYears":30},
  "WA": {"factorSinceBase":1.0858,"latestQuarter":"2026Q1","longRunAnnualPct":5.26,"longRunSpanYears":30},
  "WI": {"factorSinceBase":1.1698,"latestQuarter":"2026Q1","longRunAnnualPct":4.1,"longRunSpanYears":30},
  "WV": {"factorSinceBase":1.1563,"latestQuarter":"2026Q1","longRunAnnualPct":3.34,"longRunSpanYears":30},
  "WY": {"factorSinceBase":1.1235,"latestQuarter":"2026Q1","longRunAnnualPct":4.64,"longRunSpanYears":30},
};

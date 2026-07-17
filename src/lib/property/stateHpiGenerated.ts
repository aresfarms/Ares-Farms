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
}

export const STATE_HPI: Record<string, StateHpi> = {
  "AK": {"factorSinceBase":1.1388,"latestQuarter":"2026Q1"},
  "AL": {"factorSinceBase":1.1172,"latestQuarter":"2026Q1"},
  "AR": {"factorSinceBase":1.1199,"latestQuarter":"2026Q1"},
  "AZ": {"factorSinceBase":1.0773,"latestQuarter":"2026Q1"},
  "CA": {"factorSinceBase":1.0779,"latestQuarter":"2026Q1"},
  "CO": {"factorSinceBase":1.0445,"latestQuarter":"2026Q1"},
  "CT": {"factorSinceBase":1.2065,"latestQuarter":"2026Q1"},
  "DC": {"factorSinceBase":1.033,"latestQuarter":"2026Q1"},
  "DE": {"factorSinceBase":1.1395,"latestQuarter":"2026Q1"},
  "FL": {"factorSinceBase":1.0616,"latestQuarter":"2026Q1"},
  "GA": {"factorSinceBase":1.105,"latestQuarter":"2026Q1"},
  "HI": {"factorSinceBase":1.0929,"latestQuarter":"2026Q1"},
  "IA": {"factorSinceBase":1.112,"latestQuarter":"2026Q1"},
  "ID": {"factorSinceBase":1.0914,"latestQuarter":"2026Q1"},
  "IL": {"factorSinceBase":1.1804,"latestQuarter":"2026Q1"},
  "IN": {"factorSinceBase":1.145,"latestQuarter":"2026Q1"},
  "KS": {"factorSinceBase":1.1463,"latestQuarter":"2026Q1"},
  "KY": {"factorSinceBase":1.1454,"latestQuarter":"2026Q1"},
  "LA": {"factorSinceBase":1.057,"latestQuarter":"2026Q1"},
  "MA": {"factorSinceBase":1.1431,"latestQuarter":"2026Q1"},
  "MD": {"factorSinceBase":1.1134,"latestQuarter":"2026Q1"},
  "ME": {"factorSinceBase":1.1601,"latestQuarter":"2026Q1"},
  "MI": {"factorSinceBase":1.1598,"latestQuarter":"2026Q1"},
  "MN": {"factorSinceBase":1.0976,"latestQuarter":"2026Q1"},
  "MO": {"factorSinceBase":1.1396,"latestQuarter":"2026Q1"},
  "MS": {"factorSinceBase":1.1147,"latestQuarter":"2026Q1"},
  "MT": {"factorSinceBase":1.1135,"latestQuarter":"2026Q1"},
  "NC": {"factorSinceBase":1.1119,"latestQuarter":"2026Q1"},
  "ND": {"factorSinceBase":1.1159,"latestQuarter":"2026Q1"},
  "NE": {"factorSinceBase":1.1176,"latestQuarter":"2026Q1"},
  "NH": {"factorSinceBase":1.1712,"latestQuarter":"2026Q1"},
  "NJ": {"factorSinceBase":1.2059,"latestQuarter":"2026Q1"},
  "NM": {"factorSinceBase":1.1123,"latestQuarter":"2026Q1"},
  "NV": {"factorSinceBase":1.1004,"latestQuarter":"2026Q1"},
  "NY": {"factorSinceBase":1.1853,"latestQuarter":"2026Q1"},
  "OH": {"factorSinceBase":1.1639,"latestQuarter":"2026Q1"},
  "OK": {"factorSinceBase":1.1011,"latestQuarter":"2026Q1"},
  "OR": {"factorSinceBase":1.0579,"latestQuarter":"2026Q1"},
  "PA": {"factorSinceBase":1.1596,"latestQuarter":"2026Q1"},
  "RI": {"factorSinceBase":1.1843,"latestQuarter":"2026Q1"},
  "SC": {"factorSinceBase":1.141,"latestQuarter":"2026Q1"},
  "SD": {"factorSinceBase":1.1073,"latestQuarter":"2026Q1"},
  "TN": {"factorSinceBase":1.1128,"latestQuarter":"2026Q1"},
  "TX": {"factorSinceBase":1.0556,"latestQuarter":"2026Q1"},
  "UT": {"factorSinceBase":1.0898,"latestQuarter":"2026Q1"},
  "VA": {"factorSinceBase":1.1403,"latestQuarter":"2026Q1"},
  "VT": {"factorSinceBase":1.156,"latestQuarter":"2026Q1"},
  "WA": {"factorSinceBase":1.0858,"latestQuarter":"2026Q1"},
  "WI": {"factorSinceBase":1.1698,"latestQuarter":"2026Q1"},
  "WV": {"factorSinceBase":1.1563,"latestQuarter":"2026Q1"},
  "WY": {"factorSinceBase":1.1235,"latestQuarter":"2026Q1"},
};

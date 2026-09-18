/**
 * stateDroughtGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Current drought severity by state from the U.S. Drought Monitor
 * (USDA/NOAA/NDMC), public domain, updated weekly. Percent of state area in
 * each non-overlapping category. Re-run: npm run ingest:usdm-drought
 */

export const STATE_DROUGHT_PROVENANCE = {
  asOf: "2026-07-17" as string | null,
  mapDate: "2026-07-14" as string | null,
  source: "U.S. Drought Monitor (droughtmonitor.unl.edu) — USDA/NOAA/NDMC",
  resolvedStates: 50,
} as const;

export interface StateDrought {
  /** Weekly map date, YYYY-MM-DD. */
  mapDate: string;
  /** Percent area, non-overlapping: D0 abnormally dry … D4 exceptional. */
  d0: number; d1: number; d2: number; d3: number; d4: number;
  /** Severe drought or worse (D2+D3+D4), percent of state. */
  severePlus: number;
  /** Extreme drought or worse (D3+D4), percent of state. */
  extremePlus: number;
}

export const STATE_DROUGHT: Record<string, StateDrought> = {
  "DE": {"mapDate":"2026-07-14","d0":8.6,"d1":10.3,"d2":34.2,"d3":46.9,"d4":0,"severePlus":81.2,"extremePlus":46.9},
  "DC": {"mapDate":"2026-07-14","d0":0,"d1":48.5,"d2":51.5,"d3":0,"d4":0,"severePlus":51.5,"extremePlus":0},
  "FL": {"mapDate":"2026-07-14","d0":16.8,"d1":20.6,"d2":39,"d3":16.2,"d4":0,"severePlus":55.2,"extremePlus":16.2},
  "GA": {"mapDate":"2026-07-14","d0":52.6,"d1":26.9,"d2":6.1,"d3":0,"d4":0,"severePlus":6.1,"extremePlus":0},
  "ID": {"mapDate":"2026-07-14","d0":19.1,"d1":27.1,"d2":22.2,"d3":23.1,"d4":8.4,"severePlus":53.7,"extremePlus":31.5},
  "IL": {"mapDate":"2026-07-14","d0":6,"d1":0,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "IN": {"mapDate":"2026-07-14","d0":0.6,"d1":0,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "IA": {"mapDate":"2026-07-14","d0":19.2,"d1":11.3,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "KS": {"mapDate":"2026-07-14","d0":14,"d1":20.4,"d2":6.2,"d3":0,"d4":0,"severePlus":6.2,"extremePlus":0},
  "KY": {"mapDate":"2026-07-14","d0":10.2,"d1":8.8,"d2":2.8,"d3":0,"d4":0,"severePlus":2.8,"extremePlus":0},
  "LA": {"mapDate":"2026-07-14","d0":25,"d1":0.3,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "ME": {"mapDate":"2026-07-14","d0":17.4,"d1":2.4,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "MD": {"mapDate":"2026-07-14","d0":4.2,"d1":21,"d2":51.8,"d3":16.6,"d4":0,"severePlus":68.4,"extremePlus":16.6},
  "MA": {"mapDate":"2026-07-14","d0":11.1,"d1":50.7,"d2":38.2,"d3":0,"d4":0,"severePlus":38.2,"extremePlus":0},
  "MI": {"mapDate":"2026-07-14","d0":7.4,"d1":2.5,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "MN": {"mapDate":"2026-07-14","d0":39,"d1":25,"d2":13.2,"d3":0,"d4":0,"severePlus":13.2,"extremePlus":0},
  "MS": {"mapDate":"2026-07-14","d0":15,"d1":7,"d2":4.2,"d3":3.1,"d4":0.9,"severePlus":8.2,"extremePlus":4},
  "MO": {"mapDate":"2026-07-14","d0":12.9,"d1":2.4,"d2":0.4,"d3":0,"d4":0,"severePlus":0.4,"extremePlus":0},
  "MT": {"mapDate":"2026-07-14","d0":33,"d1":32.3,"d2":20,"d3":0.6,"d4":0,"severePlus":20.6,"extremePlus":0.6},
  "NE": {"mapDate":"2026-07-14","d0":15.5,"d1":13.2,"d2":36.7,"d3":21.1,"d4":2.9,"severePlus":60.8,"extremePlus":24.1},
  "NV": {"mapDate":"2026-07-14","d0":24.6,"d1":29.9,"d2":29.8,"d3":13.4,"d4":2.3,"severePlus":45.5,"extremePlus":15.7},
  "NH": {"mapDate":"2026-07-14","d0":11.3,"d1":22.6,"d2":3.2,"d3":0,"d4":0,"severePlus":3.2,"extremePlus":0},
  "NJ": {"mapDate":"2026-07-14","d0":24.3,"d1":40.8,"d2":31.5,"d3":3.4,"d4":0,"severePlus":34.9,"extremePlus":3.4},
  "NM": {"mapDate":"2026-07-14","d0":2.8,"d1":15.9,"d2":41.5,"d3":36.1,"d4":0,"severePlus":77.6,"extremePlus":36.1},
  "NY": {"mapDate":"2026-07-14","d0":7.9,"d1":4.5,"d2":1.6,"d3":0,"d4":0,"severePlus":1.6,"extremePlus":0},
  "NC": {"mapDate":"2026-07-14","d0":5.1,"d1":15.5,"d2":40.6,"d3":33.4,"d4":5.3,"severePlus":79.3,"extremePlus":38.7},
  "ND": {"mapDate":"2026-07-14","d0":32.3,"d1":10.7,"d2":0.3,"d3":0,"d4":0,"severePlus":0.3,"extremePlus":0},
  "OH": {"mapDate":"2026-07-14","d0":2.6,"d1":0,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "OK": {"mapDate":"2026-07-14","d0":20.9,"d1":8.4,"d2":19.5,"d3":14,"d4":1.6,"severePlus":35,"extremePlus":15.5},
  "OR": {"mapDate":"2026-07-14","d0":9,"d1":30.5,"d2":37.5,"d3":20.3,"d4":0,"severePlus":57.8,"extremePlus":20.3},
  "PA": {"mapDate":"2026-07-14","d0":12.4,"d1":8.8,"d2":6.5,"d3":0,"d4":0,"severePlus":6.5,"extremePlus":0},
  "RI": {"mapDate":"2026-07-14","d0":0,"d1":52,"d2":48,"d3":0,"d4":0,"severePlus":48,"extremePlus":0},
  "SC": {"mapDate":"2026-07-14","d0":13.6,"d1":30.6,"d2":31.3,"d3":24.5,"d4":0,"severePlus":55.9,"extremePlus":24.5},
  "SD": {"mapDate":"2026-07-14","d0":33.4,"d1":30.7,"d2":14.1,"d3":4.1,"d4":0,"severePlus":18.2,"extremePlus":4.1},
  "TN": {"mapDate":"2026-07-14","d0":33,"d1":14.5,"d2":7.6,"d3":0,"d4":0,"severePlus":7.6,"extremePlus":0},
  "TX": {"mapDate":"2026-07-14","d0":15.3,"d1":16.9,"d2":7.8,"d3":1,"d4":0,"severePlus":8.9,"extremePlus":1},
  "UT": {"mapDate":"2026-07-14","d0":0,"d1":5.3,"d2":55.1,"d3":39.3,"d4":0.3,"severePlus":94.7,"extremePlus":39.6},
  "VT": {"mapDate":"2026-07-14","d0":1.1,"d1":0,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "VA": {"mapDate":"2026-07-14","d0":13.2,"d1":35.5,"d2":33.3,"d3":16.8,"d4":0,"severePlus":50.1,"extremePlus":16.8},
  "WA": {"mapDate":"2026-07-14","d0":22.3,"d1":55.6,"d2":7.2,"d3":0.9,"d4":0,"severePlus":8.1,"extremePlus":0.9},
  "WV": {"mapDate":"2026-07-14","d0":30.4,"d1":14.3,"d2":2.5,"d3":0,"d4":0,"severePlus":2.5,"extremePlus":0},
  "WI": {"mapDate":"2026-07-14","d0":55.4,"d1":13.8,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "WY": {"mapDate":"2026-07-14","d0":0.3,"d1":16,"d2":38.6,"d3":45,"d4":0,"severePlus":83.7,"extremePlus":45},
  "AL": {"mapDate":"2026-07-14","d0":8.7,"d1":1.5,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "AK": {"mapDate":"2026-07-14","d0":11.8,"d1":0,"d2":0,"d3":0,"d4":0,"severePlus":0,"extremePlus":0},
  "AZ": {"mapDate":"2026-07-14","d0":7.2,"d1":26.9,"d2":61,"d3":1.5,"d4":0,"severePlus":62.5,"extremePlus":1.5},
  "AR": {"mapDate":"2026-07-14","d0":29.8,"d1":32.5,"d2":14.9,"d3":6,"d4":1,"severePlus":21.9,"extremePlus":7},
  "CA": {"mapDate":"2026-07-14","d0":54.8,"d1":5,"d2":0.7,"d3":0,"d4":0,"severePlus":0.7,"extremePlus":0},
  "CO": {"mapDate":"2026-07-14","d0":6.8,"d1":10.4,"d2":34.2,"d3":33.5,"d4":12.2,"severePlus":79.9,"extremePlus":45.7},
  "CT": {"mapDate":"2026-07-14","d0":28.9,"d1":69.4,"d2":1.7,"d3":0,"d4":0,"severePlus":1.7,"extremePlus":0},
};

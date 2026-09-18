/**
 * stateCropConditionsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Latest weekly corn & soybean CONDITION ratings by state from USDA NASS
 * Crop Progress. Good-or-Excellent and Poor-or-Very-Poor percent of crop.
 * Re-run: NASS_API_KEY=<key> npm run ingest:nass-crop-conditions
 */

export const STATE_CROP_CONDITIONS_PROVENANCE = {
  asOf: "2026-07-17" as string | null,
  source: "USDA NASS Crop Progress (quickstats.nass.usda.gov)",
  year: 2026,
  latestWeek: 28,
  resolvedStates: 41,
} as const;

export interface CropCondition {
  /** Crop-progress week number. */
  week: number;
  /** Percent of the crop rated Good or Excellent. */
  goodExcellent: number;
  /** Percent of the crop rated Poor or Very Poor. */
  poorVeryPoor: number;
}

export interface StateCropConditions {
  corn: CropCondition | null;
  soybeans: CropCondition | null;
}

export const STATE_CROP_CONDITIONS: Record<string, StateCropConditions> = {
  "AL": {"corn":{"week":28,"goodExcellent":89,"poorVeryPoor":1},"soybeans":{"week":28,"goodExcellent":88,"poorVeryPoor":1}},
  "AR": {"corn":{"week":28,"goodExcellent":87,"poorVeryPoor":1},"soybeans":{"week":28,"goodExcellent":78,"poorVeryPoor":3}},
  "CO": {"corn":{"week":28,"goodExcellent":50,"poorVeryPoor":21},"soybeans":null},
  "CT": {"corn":{"week":28,"goodExcellent":45,"poorVeryPoor":0},"soybeans":null},
  "DE": {"corn":{"week":28,"goodExcellent":64,"poorVeryPoor":13},"soybeans":{"week":28,"goodExcellent":55,"poorVeryPoor":11}},
  "GA": {"corn":{"week":28,"goodExcellent":62,"poorVeryPoor":10},"soybeans":{"week":28,"goodExcellent":61,"poorVeryPoor":9}},
  "IA": {"corn":{"week":28,"goodExcellent":78,"poorVeryPoor":4},"soybeans":{"week":28,"goodExcellent":74,"poorVeryPoor":6}},
  "IL": {"corn":{"week":28,"goodExcellent":58,"poorVeryPoor":14},"soybeans":{"week":28,"goodExcellent":56,"poorVeryPoor":14}},
  "IN": {"corn":{"week":28,"goodExcellent":62,"poorVeryPoor":10},"soybeans":{"week":28,"goodExcellent":63,"poorVeryPoor":10}},
  "KS": {"corn":{"week":28,"goodExcellent":64,"poorVeryPoor":11},"soybeans":{"week":28,"goodExcellent":69,"poorVeryPoor":8}},
  "KY": {"corn":{"week":28,"goodExcellent":74,"poorVeryPoor":6},"soybeans":{"week":28,"goodExcellent":76,"poorVeryPoor":6}},
  "LA": {"corn":{"week":28,"goodExcellent":67,"poorVeryPoor":5},"soybeans":{"week":28,"goodExcellent":58,"poorVeryPoor":7}},
  "MA": {"corn":{"week":28,"goodExcellent":50,"poorVeryPoor":0},"soybeans":null},
  "MD": {"corn":{"week":28,"goodExcellent":29,"poorVeryPoor":33},"soybeans":{"week":28,"goodExcellent":30,"poorVeryPoor":37}},
  "ME": {"corn":{"week":28,"goodExcellent":73,"poorVeryPoor":0},"soybeans":null},
  "MI": {"corn":{"week":28,"goodExcellent":72,"poorVeryPoor":3},"soybeans":{"week":28,"goodExcellent":60,"poorVeryPoor":5}},
  "MN": {"corn":{"week":28,"goodExcellent":84,"poorVeryPoor":3},"soybeans":{"week":28,"goodExcellent":81,"poorVeryPoor":4}},
  "MO": {"corn":{"week":28,"goodExcellent":68,"poorVeryPoor":7},"soybeans":{"week":28,"goodExcellent":57,"poorVeryPoor":7}},
  "MS": {"corn":{"week":28,"goodExcellent":58,"poorVeryPoor":3},"soybeans":{"week":28,"goodExcellent":63,"poorVeryPoor":1}},
  "MT": {"corn":{"week":28,"goodExcellent":34,"poorVeryPoor":5},"soybeans":null},
  "NC": {"corn":{"week":28,"goodExcellent":14,"poorVeryPoor":51},"soybeans":{"week":28,"goodExcellent":40,"poorVeryPoor":17}},
  "ND": {"corn":{"week":28,"goodExcellent":71,"poorVeryPoor":6},"soybeans":{"week":28,"goodExcellent":57,"poorVeryPoor":9}},
  "NE": {"corn":{"week":28,"goodExcellent":63,"poorVeryPoor":7},"soybeans":{"week":28,"goodExcellent":65,"poorVeryPoor":5}},
  "NH": {"corn":{"week":28,"goodExcellent":85,"poorVeryPoor":0},"soybeans":null},
  "NJ": {"corn":{"week":28,"goodExcellent":18,"poorVeryPoor":17},"soybeans":{"week":28,"goodExcellent":54,"poorVeryPoor":9}},
  "NM": {"corn":{"week":28,"goodExcellent":93,"poorVeryPoor":0},"soybeans":null},
  "NY": {"corn":{"week":28,"goodExcellent":77,"poorVeryPoor":6},"soybeans":{"week":28,"goodExcellent":76,"poorVeryPoor":5}},
  "OH": {"corn":{"week":28,"goodExcellent":64,"poorVeryPoor":7},"soybeans":{"week":28,"goodExcellent":63,"poorVeryPoor":9}},
  "OK": {"corn":{"week":28,"goodExcellent":58,"poorVeryPoor":21},"soybeans":{"week":28,"goodExcellent":35,"poorVeryPoor":32}},
  "PA": {"corn":{"week":28,"goodExcellent":82,"poorVeryPoor":1},"soybeans":{"week":28,"goodExcellent":84,"poorVeryPoor":0}},
  "RI": {"corn":{"week":28,"goodExcellent":50,"poorVeryPoor":0},"soybeans":null},
  "SC": {"corn":{"week":28,"goodExcellent":36,"poorVeryPoor":33},"soybeans":{"week":28,"goodExcellent":49,"poorVeryPoor":22}},
  "SD": {"corn":{"week":28,"goodExcellent":64,"poorVeryPoor":7},"soybeans":{"week":28,"goodExcellent":63,"poorVeryPoor":7}},
  "TN": {"corn":{"week":28,"goodExcellent":77,"poorVeryPoor":6},"soybeans":{"week":28,"goodExcellent":75,"poorVeryPoor":7}},
  "TX": {"corn":{"week":28,"goodExcellent":43,"poorVeryPoor":26},"soybeans":{"week":28,"goodExcellent":57,"poorVeryPoor":10}},
  "UT": {"corn":{"week":28,"goodExcellent":55,"poorVeryPoor":14},"soybeans":null},
  "VA": {"corn":{"week":28,"goodExcellent":34,"poorVeryPoor":14},"soybeans":{"week":28,"goodExcellent":41,"poorVeryPoor":20}},
  "VT": {"corn":{"week":28,"goodExcellent":66,"poorVeryPoor":0},"soybeans":null},
  "WI": {"corn":{"week":28,"goodExcellent":83,"poorVeryPoor":3},"soybeans":{"week":28,"goodExcellent":78,"poorVeryPoor":4}},
  "WV": {"corn":{"week":28,"goodExcellent":44,"poorVeryPoor":6},"soybeans":{"week":28,"goodExcellent":11,"poorVeryPoor":36}},
  "WY": {"corn":{"week":28,"goodExcellent":33,"poorVeryPoor":0},"soybeans":null},
};

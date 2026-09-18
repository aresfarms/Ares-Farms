/**
 * fsaFarmInventoryGenerated — GENERATED FILE. Do not edit by hand.
 *
 * USDA FSA Farm & Ranch inventory-property monitor snapshot (official USDA
 * eGov resales portal; U.S. government work). FSA farm inventory is episodic —
 * loan-default properties surface and sell down to zero — so this records the
 * live counts each run. Re-run: npm run ingest:fsa-farm-inventory
 *
 * NOT displayed anywhere until inventory exists AND the source clears
 * Module 23 (legal) + Module 22 (activation) review.
 */

export const FSA_FARM_INVENTORY_PROVENANCE = {
  checkedAt: "2026-07-18T02:46:08.188Z",
  source: "USDA-RD/FSA property search (properties.sc.egov.usda.gov), Farm & Ranch",
  license: "U.S. government work; portal listed on data.gov under the CC0 1.0 resale dataset",
} as const;

export interface FsaFarmStateCount {
  stateCode: string;
  found: number;
  propertyIds: string[];
}

export const FSA_FARM_INVENTORY: FsaFarmStateCount[] = [
  {
    "stateCode": "ALL",
    "found": 0,
    "propertyIds": []
  },
  {
    "stateCode": "06",
    "found": 0,
    "propertyIds": []
  },
  {
    "stateCode": "72",
    "found": 0,
    "propertyIds": []
  }
];

/** Highest count seen this run (0 = no farm inventory nationally). */
export const FSA_FARM_INVENTORY_TOTAL = 0;

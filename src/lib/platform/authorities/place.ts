import {
  HUBZONE_PLACE_FACT_ACTIVATION,
  OZ_PLACE_FACT_ACTIVATION,
  PLACE_FACT_ACTIVATIONS,
  PLACE_FACT_SOURCE_IDS,
} from "@/lib/place-facts/placeFactActivation";

/** Stable public boundary for the canonical Place domain. */
export const canonicalPlaceAuthority = Object.freeze({
  activations: PLACE_FACT_ACTIVATIONS,
  hubzone: HUBZONE_PLACE_FACT_ACTIVATION,
  opportunityZone: OZ_PLACE_FACT_ACTIVATION,
  sourceIds: PLACE_FACT_SOURCE_IDS,
});

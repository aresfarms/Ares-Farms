import {
  PLACE_FACT_ACTIVATIONS,
  PLACE_FACT_SOURCE_IDS,
} from "@/lib/place-facts/placeFactActivation";

/** Stable public boundary for the canonical Place domain. */
export const canonicalPlaceAuthority = Object.freeze({
  activations: PLACE_FACT_ACTIVATIONS,
  sourceIds: PLACE_FACT_SOURCE_IDS,
});

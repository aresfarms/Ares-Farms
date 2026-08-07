export * from "@/lib/source-stack/sourceStackRuntime";

import {
  CANONICAL_ENTITY_PROFILES,
  SOURCE_STACK_REGISTRY,
  canonicalizationPipeline,
  sourceStackOverview,
} from "@/lib/source-stack/sourceStackRuntime";

/** Stable public boundary for the canonical Source domain. */
export const canonicalSourceAuthority = Object.freeze({
  entityProfiles: CANONICAL_ENTITY_PROFILES,
  registry: SOURCE_STACK_REGISTRY,
  canonicalize: canonicalizationPipeline,
  overview: sourceStackOverview,
});

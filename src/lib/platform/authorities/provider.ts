import {
  PROVIDERS,
  licenseModelStatement,
  providerBySlug,
  providersForLane,
} from "@/lib/providers/providerRegistry";

/** Stable public boundary for the canonical Provider domain. */
export const canonicalProviderAuthority = Object.freeze({
  all: PROVIDERS,
  bySlug: providerBySlug,
  forLane: providersForLane,
  licenseModelStatement,
});

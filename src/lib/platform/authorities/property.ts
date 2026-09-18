import {
  INSTITUTIONAL_VALIDATION_SOURCES,
  canonicalProperty,
} from "@/lib/canonical-properties";

/** Stable public boundary for the canonical Property domain. */
export const canonicalPropertyAuthority = Object.freeze({
  resolve: canonicalProperty,
  validationSources: INSTITUTIONAL_VALIDATION_SOURCES,
});

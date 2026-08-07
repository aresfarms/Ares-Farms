/** Stable public boundary for the canonical Case domain. */
export const canonicalCaseAuthority = Object.freeze({
  domain: "case",
  canonicalIdField: "case_id",
  authorityVersion: "case-authority-v1",
  projectionOnly: true,
} as const);

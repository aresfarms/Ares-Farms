/** Stable public boundary for the canonical Person domain. */
export const canonicalPersonAuthority = Object.freeze({
  domain: "person",
  canonicalIdField: "person_id",
  authorityVersion: "person-authority-v1",
  projectionOnly: true,
} as const);

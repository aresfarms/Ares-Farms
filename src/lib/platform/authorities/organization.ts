/** Stable public boundary for the canonical Organization domain. */
export const canonicalOrganizationAuthority = Object.freeze({
  domain: "organization",
  canonicalIdField: "organization_id",
  authorityVersion: "organization-authority-v1",
  projectionOnly: true,
} as const);

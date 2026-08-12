/** Stable public boundary for the canonical Operation domain. */
export const canonicalOperationAuthority = Object.freeze({
  domain: "operation",
  canonicalIdField: "operation_id",
  authorityVersion: "operation-authority-v1",
  projectionOnly: true,
} as const);

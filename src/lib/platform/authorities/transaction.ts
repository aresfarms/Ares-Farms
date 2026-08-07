/** Stable public boundary for the canonical Transaction domain. */
export const canonicalTransactionAuthority = Object.freeze({
  domain: "transaction",
  canonicalIdField: "transaction_id",
  authorityVersion: "transaction-authority-v1",
  projectionOnly: true,
} as const);

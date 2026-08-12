/** Stable public boundary for the canonical Asset domain. */
export const canonicalAssetAuthority = Object.freeze({
  domain: "asset",
  canonicalIdField: "asset_id",
  authorityVersion: "asset-authority-v1",
  projectionOnly: true,
} as const);

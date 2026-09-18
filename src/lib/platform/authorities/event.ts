/** Stable public boundary for the canonical Event domain. */
export const canonicalEventAuthority = Object.freeze({
  domain: "event",
  canonicalIdField: "event_id",
  authorityVersion: "event-authority-v1",
  projectionOnly: true,
} as const);

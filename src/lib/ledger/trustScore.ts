export function computeTrustScore(canonical: any) {
  if (!canonical) return 0;

  if (canonical.status === "VALID") return 1;
  if (canonical.status === "WARNING") return 0.6;
  if (canonical.status === "GENESIS") return 0.9;
  return 0.2; // BROKEN
}

/**
 * Boundary Pipeline Safe Normalization
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes deterministic normalization authority.
 *
 * - Vol II: Regulatory Governance
 *   Prevents malformed scoring inputs from bypassing controlled review.
 *
 * - Vol III: Technical Infrastructure
 *   Provides stable numeric normalization utilities.
 *
 * - Vol IV: Operational Runbooks
 *   Supports predictable recovery from bad or missing numeric inputs.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enables replayable, explainable, and observable scoring behavior.
 */

export function safeNumber(value: unknown, fallback = 0): number {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : fallback;

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function clamp01(value: unknown): number {
  const numericValue = safeNumber(value, 0);

  if (numericValue < 0) {
    return 0;
  }

  if (numericValue > 1) {
    return 1;
  }

  return numericValue;
}

/**
 * Boundary Pipeline Constants
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes governed decision thresholds.
 *
 * - Vol II: Regulatory Governance
 *   Supports controlled scoring and compliance review boundaries.
 *
 * - Vol III: Technical Infrastructure
 *   Centralizes deterministic scoring constants.
 *
 * - Vol IV: Operational Runbooks
 *   Supports predictable operational decision behavior.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enables replayability, explainability, versioning, and anomaly review.
 */

export const SCORING_WEIGHTS = {
  credit: 0.25,
  liquidity: 0.2,
  experience: 0.2,
  collateral: 0.15,
  acreage: 0.1,
  compliance: 0.1,

  financial: 0.4,
  operational: 0.25,
  risk: 0.1,
} as const;

export const SCORING_LIMITS = {
  min: 0,
  max: 100,

  credit: 850,
  liquidity: 1_000_000,
  experience: 40,
  collateral: 1_000_000,
  acreage: 1_000,
  compliance: 100,
} as const;

export const DECISION_THRESHOLDS = {
  APPROVE: 75,
  REVIEW: 50,
  DECLINE: 0,

  approve: 75,
  review: 50,
  decline: 0,
} as const;

import { SCORING_WEIGHTS, SCORING_LIMITS, DECISION_THRESHOLDS } from "./constants";
import { safeNumber, clamp01 } from "./safeNormalize";
import { PipelineResult } from "./contracts";

const SYSTEM_VERSION = "1.0.0";
const PIPELINE_VERSION = "sba-v1";
const SCHEMA_VERSION = "audit-v1";

export async function runPipeline(input: any): Promise<PipelineResult> {
  const normalized = {
    credit: safeNumber(input?.creditScore),
    liquidity: safeNumber(input?.liquidity),
    experience: safeNumber(input?.experienceLevel),
    collateral: safeNumber(input?.collateralEquity),
    acreage: safeNumber(input?.acreage),

    userId: input?.userId ?? "unknown",
    name: input?.name ?? "Test Farm",
  };

  const features = {
    credit: clamp01(normalized.credit / SCORING_LIMITS.credit),
    liquidity: clamp01(normalized.liquidity / SCORING_LIMITS.liquidity),
    experience: clamp01(normalized.experience / SCORING_LIMITS.experience),
    collateral: clamp01(normalized.collateral / SCORING_LIMITS.collateral),
    acreage: clamp01(normalized.acreage / SCORING_LIMITS.acreage),
  };

  const sba =
    features.credit * SCORING_WEIGHTS.credit +
    features.liquidity * SCORING_WEIGHTS.liquidity +
    features.experience * SCORING_WEIGHTS.experience +
    features.collateral * SCORING_WEIGHTS.collateral +
    features.acreage * SCORING_WEIGHTS.acreage;

  const riskScore = clamp01(1 - sba);

  const decision =
    sba >= DECISION_THRESHOLDS.APPROVE
      ? "APPROVE"
      : sba >= DECISION_THRESHOLDS.REVIEW
      ? "REVIEW"
      : "REJECT";

  return {
    userId: normalized.userId,
    name: normalized.name,

    scores: {
      credit: features.credit,
      liquidity: features.liquidity,
      experience: features.experience,
      collateral: features.collateral,
      acreage: features.acreage,
      sba,
    },

    risk: {
      riskScore,
    },

    decision: {
      decision,
      compositeScore: sba,
    },

    recommendations: {
      crops: [],
      livestock: [],
      equipment: [],
      vendors: [],
    },

    meta: {
      systemVersion: SYSTEM_VERSION,
      pipelineVersion: PIPELINE_VERSION,
      schemaVersion: SCHEMA_VERSION,
    },
  };
}

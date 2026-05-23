/**
 * Boundary Pipeline Contracts
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes governed pipeline result authority.
 *
 * - Vol II: Regulatory Governance
 *   Supports compliance-aware decision result envelopes.
 *
 * - Vol III: Technical Infrastructure
 *   Provides stable typed contracts for deterministic pipeline execution.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational inspection, recovery, and repeatable scoring.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enables replayability, explainability, observability, versioning,
 *   anomaly review, and future simulation/sandbox equivalence.
 */

export type PipelineDecisionValue =
  | "APPROVE"
  | "REVIEW"
  | "DECLINE"
  | "REJECT"
  | "REVIEW_REQUIRED";

export type PipelineDecisionEnvelope = {
  decision: PipelineDecisionValue;
  compositeScore: number;
};

export type PipelineRiskEnvelope = {
  riskScore: number;
  [key: string]: unknown;
};

export type PipelineRecommendations = {
  crops: unknown[];
  livestock: unknown[];
  equipment: unknown[];
  [key: string]: unknown;
};

export type PipelineTrace = {
  traceId: string;
  systemVersion: string;
  pipelineVersion: string;
  timestamp: string;
};

export type PipelineMeta = {
  systemVersion?: string;
  pipelineVersion?: string;
  schemaVersion?: string;
  [key: string]: unknown;
};

export type PipelineResult = {
  userId?: string;
  name?: string;

  scores?: Record<string, number>;
  risk?: PipelineRiskEnvelope;
  recommendations?: PipelineRecommendations;
  meta?: PipelineMeta;

  decision: PipelineDecisionEnvelope;
  compositeScore?: number;

  breakdown?: Record<string, number>;
  metadata?: Record<string, unknown>;
  explanation?: string[];

  ranking?: unknown;
  trace?: PipelineTrace | string;
};

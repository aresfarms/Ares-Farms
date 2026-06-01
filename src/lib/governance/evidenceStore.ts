import { db } from "@/lib/db";
import {
  dataClassificationRegistry,
  observabilityEvents,
  replayVerification,
  versionRegistry,
} from "@/db/schema";
import type {
  ClassificationMetadata,
} from "@/lib/runtime/classificationRuntime";
import type {
  ObservabilityEvent,
} from "@/lib/runtime/observabilityRuntime";
import type {
  VersionRuntimeResult,
} from "@/lib/runtime/versionRuntime";

/**
 * Canonical Governance Evidence Store
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional evidence of governed runtime activity.
 * - Vol II: Stores regulated access, classification, and operational evidence.
 * - Vol III: Makes version, classification, observability, and replay evidence durable.
 * - Vol IV: Supports operational review, incident response, recovery, and audit prep.
 * - Vol V: Implements canonical classification, observability, versioning, replay,
 *   source authority, and evidence-preservation doctrine.
 *
 * Purpose:
 * API routes can return governance metadata to callers, but the backend must
 * also preserve that metadata as durable evidence. This module is the canonical
 * writer for that runtime evidence.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const EVIDENCE_STORE_VERSION = "governance-evidence-store-v0.1.0";

export type ClassificationEvidenceInput = {
  resourceType: string;
  resourceId: string;
  classification: ClassificationMetadata;
  traceId: string;
  replayRef?: string | null;
  metadata?: Record<string, unknown>;
};

export type ReplayVerificationEvidenceInput = {
  traceId: string;
  replayRef: string;
  targetType: string;
  targetId?: string | null;
  verificationStatus: string;
  deterministic: boolean;
  replaySafe: boolean;
  sourceVersion: string;
  replayVersion: string;
  eventCount?: number;
  mismatchCount?: number;
  result?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  verifiedBy?: string | null;
};

export type GovernanceEvidenceInput = {
  traceId: string;
  replayRef?: string | null;
  versionRuntime?: VersionRuntimeResult | null;
  classifications?: ClassificationEvidenceInput[];
  observability?: ObservabilityEvent | null;
  replayVerification?: ReplayVerificationEvidenceInput | null;
  metadata?: Record<string, unknown>;
};

export type GovernanceEvidenceReceipt = {
  ok: true;
  traceId: string;
  persisted: {
    versions: number;
    classifications: number;
    observability: number;
    replayVerification: number;
  };
  evidenceStoreVersion: string;
  persistedAt: string;
};

function toDate(value?: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeReplayRef(
  explicitReplayRef: string | null | undefined,
  fallbackTraceId: string
): string {
  return explicitReplayRef ?? fallbackTraceId;
}

export async function persistVersionRuntimeEvidence(
  versionRuntime: VersionRuntimeResult,
  metadata: Record<string, unknown> = {}
): Promise<number> {
  if (versionRuntime.versions.length === 0) {
    return 0;
  }

  await db.insert(versionRegistry).values(
    versionRuntime.versions.map((versionRef) => ({
      versionDomain: versionRef.domain,
      version: versionRef.version,
      source: versionRef.source,
      status: versionRuntime.ok ? "active" : "runtime-warning",
      effectiveAt: toDate(versionRef.effectiveAt),
      supersededAt: null,
      governanceVersion: GOVERNANCE_VERSION,
      replayRef: normalizeReplayRef(
        versionRef.replayRef,
        versionRuntime.traceId
      ),
      traceId: versionRuntime.traceId,
      metadata: {
        ...metadata,
        operation: versionRuntime.operation,
        module: versionRuntime.module,
        replaySafe: versionRuntime.replaySafe,
        missingDomains: versionRuntime.missingDomains,
        evidenceStoreVersion: EVIDENCE_STORE_VERSION,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  return versionRuntime.versions.length;
}

export async function persistClassificationEvidence(
  input: ClassificationEvidenceInput
): Promise<number> {
  const classification = input.classification;
  const replayContext = classification.replayClassificationContext;

  await db.insert(dataClassificationRegistry).values({
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    classificationLevel: classification.classificationLevel,
    sensitivityScope: classification.sensitivityScope,
    jurisdictionScope: classification.jurisdictionScope,
    disclosureAudience: classification.disclosureAudience,
    sharingPermissions: classification.sharingPermissions,
    aiUsagePermissions: classification.aiUsagePermissions,
    exportRestrictions: classification.exportRestrictions,
    redactionRequirements: classification.redactionRequirements,
    consentRequirements: classification.consentRequirements,
    retentionRequirement: classification.retentionRequirements,
    legalHoldStatus: classification.legalHoldStatus,
    vaultRequired: classification.vaultRequired,
    classificationSource: replayContext.classificationSource,
    classificationVersion: replayContext.classificationVersion,
    governanceVersion: GOVERNANCE_VERSION,
    replayRef: normalizeReplayRef(input.replayRef, input.traceId),
    traceId: input.traceId,
    metadata: {
      ...input.metadata,
      evidenceStoreVersion: EVIDENCE_STORE_VERSION,
    },
    classifiedAt: toDate(replayContext.classifiedAt),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return 1;
}

export async function persistObservabilityEvidence(
  event: ObservabilityEvent,
  metadata: Record<string, unknown> = {}
): Promise<number> {
  await db.insert(observabilityEvents).values({
    eventType: event.eventType,
    domain: event.domain,
    severity: event.severity,
    message: event.message,
    traceId: event.traceId,
    replayRef: event.replayRef,
    actorId: event.actorId,
    module: event.module,
    anomalyCandidate: event.anomalyCandidate,
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    governanceVersion: GOVERNANCE_VERSION,
    metadata: {
      ...metadata,
      ...event.metadata,
      runtimeObservabilityId: event.id,
      evidenceStoreVersion: EVIDENCE_STORE_VERSION,
    },
    createdAt: toDate(event.timestamp),
  });

  return 1;
}

export async function persistReplayVerificationEvidence(
  input: ReplayVerificationEvidenceInput
): Promise<number> {
  await db.insert(replayVerification).values({
    traceId: input.traceId,
    replayRef: input.replayRef,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    verificationStatus: input.verificationStatus,
    deterministic: input.deterministic,
    replaySafe: input.replaySafe,
    sourceVersion: input.sourceVersion,
    replayVersion: input.replayVersion,
    governanceVersion: GOVERNANCE_VERSION,
    eventCount: input.eventCount ?? 0,
    mismatchCount: input.mismatchCount ?? 0,
    result: input.result ?? {},
    metadata: {
      ...input.metadata,
      evidenceStoreVersion: EVIDENCE_STORE_VERSION,
    },
    verifiedBy: input.verifiedBy ?? "governance-evidence-store",
    verifiedAt: new Date(),
    createdAt: new Date(),
  });

  return 1;
}

export async function persistGovernanceEvidence(
  input: GovernanceEvidenceInput
): Promise<GovernanceEvidenceReceipt> {
  let versions = 0;
  let classifications = 0;
  let observability = 0;
  let replayVerificationCount = 0;

  if (input.versionRuntime) {
    versions = await persistVersionRuntimeEvidence(
      input.versionRuntime,
      input.metadata
    );
  }

  for (const classification of input.classifications ?? []) {
    classifications += await persistClassificationEvidence(classification);
  }

  if (input.observability) {
    observability = await persistObservabilityEvidence(
      input.observability,
      input.metadata
    );
  }

  if (input.replayVerification) {
    replayVerificationCount = await persistReplayVerificationEvidence(
      input.replayVerification
    );
  }

  return {
    ok: true,
    traceId: input.traceId,
    persisted: {
      versions,
      classifications,
      observability,
      replayVerification: replayVerificationCount,
    },
    evidenceStoreVersion: EVIDENCE_STORE_VERSION,
    persistedAt: new Date().toISOString(),
  };
}

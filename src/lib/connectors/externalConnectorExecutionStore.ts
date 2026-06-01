import { eq } from "drizzle-orm";

import {
  certifiedConnectorAdapters,
  externalConnectorExecutions,
  externalDataConnectorRuns,
  externalDataSources,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical External Connector Execution Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for external connector execution.
 * - Vol II: Blocks USDA, SBA, property, borrower, or institutional source
 *   data reliance until certified execution controls are complete.
 * - Vol III: Provides deterministic, replay-safe execution authorization
 *   without an uncontrolled live external call or official data fetch.
 * - Vol IV: Supports credentials, outage handling, retry/recovery,
 *   isolation, escalation, and audit preparation.
 * - Vol V: Enforces source authority, classification, observability, replay,
 *   version lineage, schema contracts, consent, and isolation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const CONNECTOR_EXECUTION_SOURCE = "external-connector-execution-runtime";

type ConnectorRun = typeof externalDataConnectorRuns.$inferSelect;
type ExternalSource = typeof externalDataSources.$inferSelect;
type CertifiedAdapter = typeof certifiedConnectorAdapters.$inferSelect;

export type PersistExternalConnectorExecutionInput = {
  traceId: string;
  connectorRunId?: string | null;
  adapterId?: string | null;
  sourceId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  executionRef?: string | null;
  operationalRunbookRef?: string | null;
  operationalRunbookStatus?: string | null;
  consentRef?: string | null;
  consentStatus?: string | null;
  isolationRef?: string | null;
  isolationStatus?: string | null;
  schemaContractStatus?: string | null;
  metadata?: Record<string, unknown>;
};

export type ExternalConnectorExecutionGates = {
  connectorRunFound: boolean;
  applicationMatches: boolean;
  sourceMatches: boolean;
  connectorRunNotPreviouslyLive: boolean;
  sourceLiveCallsAllowed: boolean;
  adapterFound: boolean;
  adapterSourceMatches: boolean;
  adapterCertified: boolean;
  adapterLiveCallsAllowed: boolean;
  sourceAuthorityPresent: boolean;
  credentialRefPresent: boolean;
  credentialApproved: boolean;
  outagePolicyPresent: boolean;
  outagePolicyTested: boolean;
  replayPolicyPresent: boolean;
  replayPolicyVerified: boolean;
  schemaContractPresent: boolean;
  schemaContractVerified: boolean;
  consentRefPresent: boolean;
  consentVerified: boolean;
  isolationRefPresent: boolean;
  isolationVerified: boolean;
  operationalRunbookPresent: boolean;
  operationalRunbookApproved: boolean;
  liveCallPerformed: false;
  officialDataFetched: false;
};

export type ExternalConnectorExecutionResult = {
  connectorRun: ConnectorRun;
  source: ExternalSource;
  adapter: CertifiedAdapter;
  execution: typeof externalConnectorExecutions.$inferSelect;
  gates: ExternalConnectorExecutionGates;
  executionAllowed: boolean;
  executionStatus: string;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredText(value: unknown, label: string): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function approvedStatus(value: unknown): boolean {
  const normalized = normalizeText(value)?.toUpperCase();

  return normalized === "APPROVED" || normalized === "CERTIFIED";
}

function verifiedStatus(value: unknown): boolean {
  const normalized = normalizeText(value)?.toUpperCase();

  return normalized === "VERIFIED" || normalized === "APPROVED";
}

function testedStatus(value: unknown): boolean {
  const normalized = normalizeText(value)?.toUpperCase();

  return normalized === "TESTED" || normalized === "VERIFIED";
}

async function loadConnectorRun(connectorRunId: string): Promise<ConnectorRun> {
  const rows = await db
    .select()
    .from(externalDataConnectorRuns)
    .where(eq(externalDataConnectorRuns.id, connectorRunId))
    .limit(1);
  const connectorRun = rows[0] ?? null;

  if (!connectorRun) {
    throw new Error("External connector run not found for execution.");
  }

  return connectorRun;
}

async function loadSource(sourceId: string): Promise<ExternalSource> {
  const rows = await db
    .select()
    .from(externalDataSources)
    .where(eq(externalDataSources.id, sourceId))
    .limit(1);
  const source = rows[0] ?? null;

  if (!source) {
    throw new Error("External data source not found for execution.");
  }

  return source;
}

async function loadAdapter(adapterId: string): Promise<CertifiedAdapter> {
  const rows = await db
    .select()
    .from(certifiedConnectorAdapters)
    .where(eq(certifiedConnectorAdapters.adapterId, adapterId))
    .limit(1);
  const adapter = rows[0] ?? null;

  if (!adapter) {
    throw new Error("Certified connector adapter not found for execution.");
  }

  return adapter;
}

function executionGates(input: {
  connectorRun: ConnectorRun;
  source: ExternalSource;
  adapter: CertifiedAdapter;
  requestedSourceId?: string | null;
  applicationId?: string | null;
  operationalRunbookRef?: string | null;
  operationalRunbookStatus?: string | null;
  consentRef?: string | null;
  consentStatus?: string | null;
  isolationRef?: string | null;
  isolationStatus?: string | null;
  schemaContractStatus?: string | null;
}): ExternalConnectorExecutionGates {
  const applicationId = normalizeText(input.applicationId);
  const requestedSourceId = normalizeText(input.requestedSourceId);
  const operationalRunbookPresent = Boolean(
    normalizeText(input.operationalRunbookRef)
  );
  const consentRefPresent = Boolean(normalizeText(input.consentRef));
  const isolationRefPresent = Boolean(normalizeText(input.isolationRef));
  const sourceAuthorityPresent = Boolean(
    normalizeText(input.adapter.sourceAuthorityRef)
  );
  const credentialRefPresent = Boolean(normalizeText(input.adapter.credentialRef));
  const outagePolicyPresent = Boolean(
    normalizeText(input.adapter.outagePolicyRef)
  );
  const replayPolicyPresent = Boolean(
    normalizeText(input.adapter.replayPolicyRef)
  );
  const schemaContractPresent = Boolean(
    normalizeText(input.adapter.schemaContractVersion)
  );

  return {
    connectorRunFound: true,
    applicationMatches:
      !applicationId || input.connectorRun.applicationId === applicationId,
    sourceMatches:
      (!requestedSourceId || input.connectorRun.sourceId === requestedSourceId) &&
      input.connectorRun.sourceId === input.source.id,
    connectorRunNotPreviouslyLive:
      input.connectorRun.liveCallPerformed === false,
    sourceLiveCallsAllowed: input.source.liveCallsAllowed === true,
    adapterFound: true,
    adapterSourceMatches:
      input.adapter.sourceId === input.connectorRun.sourceId,
    adapterCertified: input.adapter.certificationStatus === "CERTIFIED",
    adapterLiveCallsAllowed: input.adapter.liveCallsAllowed === true,
    sourceAuthorityPresent,
    credentialRefPresent,
    credentialApproved: input.adapter.credentialStatus === "APPROVED",
    outagePolicyPresent,
    outagePolicyTested: input.adapter.outageStatus === "TESTED",
    replayPolicyPresent,
    replayPolicyVerified: input.adapter.replayStatus === "VERIFIED",
    schemaContractPresent,
    schemaContractVerified: verifiedStatus(input.schemaContractStatus),
    consentRefPresent,
    consentVerified: verifiedStatus(input.consentStatus),
    isolationRefPresent,
    isolationVerified: verifiedStatus(input.isolationStatus),
    operationalRunbookPresent,
    operationalRunbookApproved: approvedStatus(input.operationalRunbookStatus),
    liveCallPerformed: false,
    officialDataFetched: false,
  };
}

function gatesComplete(gates: ExternalConnectorExecutionGates): boolean {
  return (
    gates.connectorRunFound &&
    gates.applicationMatches &&
    gates.sourceMatches &&
    gates.connectorRunNotPreviouslyLive &&
    gates.sourceLiveCallsAllowed &&
    gates.adapterFound &&
    gates.adapterSourceMatches &&
    gates.adapterCertified &&
    gates.adapterLiveCallsAllowed &&
    gates.sourceAuthorityPresent &&
    gates.credentialRefPresent &&
    gates.credentialApproved &&
    gates.outagePolicyPresent &&
    gates.outagePolicyTested &&
    gates.replayPolicyPresent &&
    gates.replayPolicyVerified &&
    gates.schemaContractPresent &&
    gates.schemaContractVerified &&
    gates.consentRefPresent &&
    gates.consentVerified &&
    gates.isolationRefPresent &&
    gates.isolationVerified &&
    gates.operationalRunbookPresent &&
    gates.operationalRunbookApproved &&
    gates.liveCallPerformed === false &&
    gates.officialDataFetched === false
  );
}

function executionStatus(allowed: boolean): string {
  return allowed
    ? "LIVE_CONNECTOR_EXECUTION_AUTHORIZED_NOT_CALLED"
    : "LIVE_CONNECTOR_EXECUTION_BLOCKED";
}

export async function persistExternalConnectorExecution(
  input: PersistExternalConnectorExecutionInput
): Promise<ExternalConnectorExecutionResult> {
  const connectorRunId = normalizeRequiredText(
    input.connectorRunId,
    "connectorRunId"
  );
  const adapterId = normalizeRequiredText(input.adapterId, "adapterId");
  const connectorRun = await loadConnectorRun(connectorRunId);
  const source = await loadSource(connectorRun.sourceId);
  const adapter = await loadAdapter(adapterId);
  const gates = executionGates({
    connectorRun,
    source,
    adapter,
    requestedSourceId: input.sourceId,
    applicationId: input.applicationId,
    operationalRunbookRef: input.operationalRunbookRef,
    operationalRunbookStatus: input.operationalRunbookStatus,
    consentRef: input.consentRef,
    consentStatus: input.consentStatus,
    isolationRef: input.isolationRef,
    isolationStatus: input.isolationStatus,
    schemaContractStatus: input.schemaContractStatus,
  });
  const executionAllowed = gatesComplete(gates);
  const status = executionStatus(executionAllowed);
  const now = new Date();
  const executionRows = await db
    .insert(externalConnectorExecutions)
    .values({
      connectorRunId,
      adapterId,
      sourceId: connectorRun.sourceId,
      sourceName: connectorRun.sourceName,
      connectorType: connectorRun.connectorType,
      queryType: connectorRun.queryType,
      applicationId:
        normalizeText(input.applicationId) ?? connectorRun.applicationId,
      borrowerId: normalizeText(input.borrowerId) ?? connectorRun.borrowerId,
      tenantId: normalizeText(input.tenantId) ?? connectorRun.tenantId,
      actorId: normalizeText(input.actorId),
      executionStatus: status,
      executionRef: normalizeText(input.executionRef),
      sourceAuthorityRef: normalizeText(adapter.sourceAuthorityRef),
      credentialRef: normalizeText(adapter.credentialRef),
      outagePolicyRef: normalizeText(adapter.outagePolicyRef),
      replayPolicyRef: normalizeText(adapter.replayPolicyRef),
      operationalRunbookRef: normalizeText(input.operationalRunbookRef),
      schemaContractVersion: normalizeText(adapter.schemaContractVersion),
      consentRef: normalizeText(input.consentRef),
      isolationRef: normalizeText(input.isolationRef),
      connectorRunFound: gates.connectorRunFound,
      applicationMatches: gates.applicationMatches,
      sourceMatches: gates.sourceMatches,
      connectorRunNotPreviouslyLive: gates.connectorRunNotPreviouslyLive,
      sourceLiveCallsAllowed: gates.sourceLiveCallsAllowed,
      adapterFound: gates.adapterFound,
      adapterSourceMatches: gates.adapterSourceMatches,
      adapterCertified: gates.adapterCertified,
      adapterLiveCallsAllowed: gates.adapterLiveCallsAllowed,
      sourceAuthorityPresent: gates.sourceAuthorityPresent,
      credentialApproved: gates.credentialApproved,
      outagePolicyTested: gates.outagePolicyTested,
      replayPolicyVerified: gates.replayPolicyVerified,
      schemaContractVerified: gates.schemaContractVerified,
      consentVerified: gates.consentVerified,
      isolationVerified: gates.isolationVerified,
      operationalRunbookApproved: gates.operationalRunbookApproved,
      executionAllowed,
      liveCallPerformed: false,
      officialDataFetched: false,
      humanReviewRequired: true,
      executionAuthorizedAt: executionAllowed ? now : null,
      liveCallAt: null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: CONNECTOR_EXECUTION_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        gates,
        sourceLiveCallsAllowed: source.liveCallsAllowed,
        adapterCertificationStatus: adapter.certificationStatus,
        adapterLiveCallsAllowed: adapter.liveCallsAllowed,
        credentialStatus: adapter.credentialStatus,
        outageStatus: adapter.outageStatus,
        replayStatus: adapter.replayStatus,
        schemaContractStatus: normalizeText(input.schemaContractStatus),
        consentStatus: normalizeText(input.consentStatus),
        isolationStatus: normalizeText(input.isolationStatus),
        operationalRunbookStatus: normalizeText(
          input.operationalRunbookStatus
        ),
        liveCallPerformed: false,
        officialDataFetched: false,
        externalConnectorExecutionRuntimeVersion:
          "external-connector-execution-runtime-v0.1.0",
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const execution = executionRows[0];

  const updatedConnectorRun =
    executionAllowed
      ? (
          await db
            .update(externalDataConnectorRuns)
            .set({
              status,
              liveCallPerformed: false,
              humanReviewRequired: true,
              normalizedResult: {
                advisoryOnly: true,
                sourceId: connectorRun.sourceId,
                sourceName: connectorRun.sourceName,
                sourceType: connectorRun.connectorType,
                queryType: connectorRun.queryType,
                status,
                executionId: execution.id,
                liveCallPerformed: false,
                officialDataFetched: false,
                humanReviewRequired: true,
                message:
                  "External connector execution was authorized but no live external call or official data fetch was performed by this runtime.",
              },
              metadata: {
                connectorRunMetadata: connectorRun.metadata,
                externalConnectorExecutionId: execution.id,
                externalConnectorExecutionTraceId: input.traceId,
                externalConnectorExecutionStatus: status,
                liveCallPerformed: false,
                officialDataFetched: false,
              },
              updatedAt: now,
            })
            .where(eq(externalDataConnectorRuns.id, connectorRunId))
            .returning()
        )[0] ?? connectorRun
      : connectorRun;

  return {
    connectorRun: updatedConnectorRun,
    source,
    adapter,
    execution,
    gates,
    executionAllowed,
    executionStatus: status,
  };
}

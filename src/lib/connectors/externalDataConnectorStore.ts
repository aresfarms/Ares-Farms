import { eq } from "drizzle-orm";

import {
  applications,
  externalDataConnectorRuns,
  externalDataSources,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  normalizeConnectorText,
  normalizeExternalQueryType,
  resolveCanonicalExternalSource,
} from "@/lib/connectors/connectorSourceRegistry";

/**
 * Canonical External Data Connector Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves governed external source authority.
 * - Vol II: Prevents ungoverned reliance on USDA, SBA, property, borrower,
 *   or institutional external data.
 * - Vol III: Records replay-safe connector requests before live connector
 *   execution is allowed.
 * - Vol IV: Supports connector certification, outage review, escalation,
 *   and operator audit preparation.
 * - Vol V: Enforces source authority, classification, consent, replay,
 *   observability, version lineage, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const CONNECTOR_STATUS = "PENDING_LIVE_CONNECTOR_CERTIFICATION";
const CERTIFIED_NO_CALL_STATUS = "LIVE_CONNECTOR_CERTIFIED_NOT_EXECUTED";

export type PersistExternalConnectorInput = {
  traceId: string;
  sourceId: string;
  queryType: string;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  requestPayload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type ExternalConnectorResult = {
  source: typeof externalDataSources.$inferSelect;
  connectorRun: typeof externalDataConnectorRuns.$inferSelect;
  normalizedResult: Record<string, unknown>;
};

async function loadApplication(applicationId?: string | null) {
  const normalizedApplicationId = normalizeConnectorText(applicationId);

  if (!normalizedApplicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, normalizedApplicationId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Application not found for external connector request.");
  }

  return rows[0];
}

async function upsertSource(
  sourceId: string,
  traceId: string
): Promise<typeof externalDataSources.$inferSelect> {
  const source = resolveCanonicalExternalSource(sourceId);
  const now = new Date();
  const existingRows = await db
    .select()
    .from(externalDataSources)
    .where(eq(externalDataSources.id, source.id))
    .limit(1);
  const existingSource = existingRows[0];
  const liveCallsAllowed = existingSource?.liveCallsAllowed === true;
  const metadata = {
    allowedQueryTypes: source.allowedQueryTypes,
    liveDataStatus: liveCallsAllowed
      ? "certified-adapter-registered"
      : "not-configured",
    certificationRequired: !liveCallsAllowed,
    sourceCheckLiveCallPerformed: false,
  };

  const rows = await db
    .insert(externalDataSources)
    .values({
      id: source.id,
      sourceName: source.sourceName,
      sourceType: source.sourceType,
      authorityLevel: source.authorityLevel,
      status: "ACTIVE",
      liveCallsAllowed,
      baseUrl: null,
      sourceVersion: source.sourceVersion,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: traceId,
      metadata,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: externalDataSources.id,
      set: {
        sourceName: source.sourceName,
        sourceType: source.sourceType,
        authorityLevel: source.authorityLevel,
        status: "ACTIVE",
        liveCallsAllowed,
        sourceVersion: source.sourceVersion,
        governanceVersion: GOVERNANCE_VERSION,
        classification: CLASSIFICATION,
        replayRef: traceId,
        metadata,
        updatedAt: now,
      },
    })
    .returning();

  return rows[0];
}

export async function persistExternalConnectorRequest(
  input: PersistExternalConnectorInput
): Promise<ExternalConnectorResult> {
  const sourceConfig = resolveCanonicalExternalSource(input.sourceId);
  const queryType = normalizeExternalQueryType(input.queryType, sourceConfig);
  const application = await loadApplication(input.applicationId);
  const source = await upsertSource(sourceConfig.id, input.traceId);
  const now = new Date();
  const connectorStatus = source.liveCallsAllowed
    ? CERTIFIED_NO_CALL_STATUS
    : CONNECTOR_STATUS;

  const normalizedResult = {
    advisoryOnly: true,
    sourceId: sourceConfig.id,
    sourceName: sourceConfig.sourceName,
    sourceType: sourceConfig.sourceType,
    queryType,
    status: connectorStatus,
    liveCallPerformed: false,
    officialDataFetched: false,
    certificationRequired: !source.liveCallsAllowed,
    humanReviewRequired: true,
    message: source.liveCallsAllowed
      ? "External source governance was recorded. A certified adapter exists, but this source-check route did not perform a live USDA, SBA, or property-record request."
      : "External source governance was recorded. No live USDA, SBA, or property-record request was performed by this route.",
  };

  const connectorRows = await db
    .insert(externalDataConnectorRuns)
    .values({
      sourceId: sourceConfig.id,
      sourceName: sourceConfig.sourceName,
      connectorType: sourceConfig.sourceType,
      queryType,
      applicationId: normalizeConnectorText(input.applicationId),
      borrowerId:
        normalizeConnectorText(input.borrowerId) ??
        application?.borrowerId ??
        null,
      tenantId:
        normalizeConnectorText(input.tenantId) ?? application?.tenantId ?? null,
      propertyId: application?.propertyId ?? null,
      actorId: normalizeConnectorText(input.actorId),
      status: connectorStatus,
      liveCallPerformed: false,
      humanReviewRequired: true,
      requestPayload: input.requestPayload ?? {},
      normalizedResult,
      sourceVersion: sourceConfig.sourceVersion,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      metadata: {
        ...(input.metadata ?? {}),
        externalDataConnectorRuntimeVersion:
          "external-data-connector-runtime-v0.1.0",
        liveCallPerformed: false,
        officialDataFetched: false,
        certifiedAdapterAvailable: source.liveCallsAllowed,
        certificationRequired: !source.liveCallsAllowed,
      },
      requestedAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    source,
    connectorRun: connectorRows[0],
    normalizedResult,
  };
}

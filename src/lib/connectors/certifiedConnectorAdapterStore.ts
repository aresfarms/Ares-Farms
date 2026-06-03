import { and, desc, eq } from "drizzle-orm";

import {
  certifiedConnectorAdapters,
  externalDataSources,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  normalizeConnectorText,
  resolveCanonicalExternalSource,
} from "@/lib/connectors/connectorSourceRegistry";

/**
 * Canonical Certified Connector Adapter Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves governed connector-promotion authority.
 * - Vol II: Blocks unapproved external data reliance in regulated workflows.
 * - Vol III: Provides deterministic, replay-safe adapter certification state.
 * - Vol IV: Supports credential review, outage handling, isolation,
 *   escalation, and operational audit preparation.
 * - Vol V: Enforces source authority, consent, classification, replay,
 *   observability, version lineage, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "RESTRICTED";
const ADAPTER_RUNTIME_SOURCE = "certified-connector-adapter-runtime";

export type PersistCertifiedConnectorAdapterInput = {
  traceId: string;
  adapterId?: string | null;
  adapterName?: string | null;
  adapterType?: string | null;
  sourceId?: string | null;
  sourceAuthorityRef?: string | null;
  certificationStatus?: string | null;
  credentialRef?: string | null;
  credentialStatus?: string | null;
  outagePolicyRef?: string | null;
  outageStatus?: string | null;
  replayPolicyRef?: string | null;
  replayStatus?: string | null;
  schemaContractVersion?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

export type ListCertifiedConnectorAdapterInput = {
  sourceId?: string | null;
  certificationStatus?: string | null;
  liveCallsAllowed?: boolean | null;
  limit?: number | null;
};

export type ConnectorCertificationControls = {
  sourceAuthorityPresent: boolean;
  credentialRefPresent: boolean;
  credentialApproved: boolean;
  outagePolicyPresent: boolean;
  outagePolicyTested: boolean;
  replayPolicyPresent: boolean;
  replayPolicyVerified: boolean;
  schemaContractPresent: boolean;
  connectorConsentRequired: true;
  isolationRequired: true;
  humanReviewRequired: true;
  liveCallPerformed: false;
  officialDataFetched: false;
};

export type CertifiedConnectorAdapterResult = {
  adapter: typeof certifiedConnectorAdapters.$inferSelect;
  source: typeof externalDataSources.$inferSelect;
  controls: ConnectorCertificationControls;
  liveCallsAllowed: boolean;
  certificationStatus: string;
  message: string;
};

function normalizeRequiredText(value: unknown, label: string): string {
  const normalized = normalizeConnectorText(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function normalizeAdapterType(value: unknown, fallback: string): string {
  const normalized = normalizeConnectorText(value)?.toUpperCase();
  const allowed = new Set(["USDA", "SBA", "PROPERTY", "GOVERNMENT", "DATA"]);

  if (normalized && allowed.has(normalized)) {
    return normalized;
  }

  return fallback;
}

function normalizeCertificationStatus(value: unknown): string {
  const normalized = normalizeConnectorText(value)?.toUpperCase();
  const allowed = new Set([
    "PENDING_CERTIFICATION",
    "CERTIFIED",
    "CERTIFICATION_BLOCKED",
    "SUSPENDED",
    "REVOKED",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "PENDING_CERTIFICATION";
}

function normalizeCredentialStatus(value: unknown): string {
  const normalized = normalizeConnectorText(value)?.toUpperCase();
  const allowed = new Set([
    "MISSING",
    "PENDING_REVIEW",
    "APPROVED",
    "REVOKED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "MISSING";
}

function normalizeOutageStatus(value: unknown): string {
  const normalized = normalizeConnectorText(value)?.toUpperCase();
  const allowed = new Set([
    "NOT_TESTED",
    "PENDING_TEST",
    "TESTED",
    "FAILED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "NOT_TESTED";
}

function normalizeReplayStatus(value: unknown): string {
  const normalized = normalizeConnectorText(value)?.toUpperCase();
  const allowed = new Set([
    "NOT_VERIFIED",
    "PENDING_VERIFICATION",
    "VERIFIED",
    "FAILED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "NOT_VERIFIED";
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 25;
  }

  return Math.min(value, 100);
}

function certificationControls(input: {
  sourceAuthorityRef?: string | null;
  credentialRef?: string | null;
  credentialStatus: string;
  outagePolicyRef?: string | null;
  outageStatus: string;
  replayPolicyRef?: string | null;
  replayStatus: string;
  schemaContractVersion?: string | null;
}): ConnectorCertificationControls {
  const sourceAuthorityPresent = Boolean(
    normalizeConnectorText(input.sourceAuthorityRef)
  );
  const credentialRefPresent = Boolean(
    normalizeConnectorText(input.credentialRef)
  );
  const outagePolicyPresent = Boolean(
    normalizeConnectorText(input.outagePolicyRef)
  );
  const replayPolicyPresent = Boolean(
    normalizeConnectorText(input.replayPolicyRef)
  );
  const schemaContractPresent = Boolean(
    normalizeConnectorText(input.schemaContractVersion)
  );

  return {
    sourceAuthorityPresent,
    credentialRefPresent,
    credentialApproved: input.credentialStatus === "APPROVED",
    outagePolicyPresent,
    outagePolicyTested: input.outageStatus === "TESTED",
    replayPolicyPresent,
    replayPolicyVerified: input.replayStatus === "VERIFIED",
    schemaContractPresent,
    connectorConsentRequired: true,
    isolationRequired: true,
    humanReviewRequired: true,
    liveCallPerformed: false,
    officialDataFetched: false,
  };
}

function controlsComplete(controls: ConnectorCertificationControls): boolean {
  return (
    controls.sourceAuthorityPresent &&
    controls.credentialRefPresent &&
    controls.credentialApproved &&
    controls.outagePolicyPresent &&
    controls.outagePolicyTested &&
    controls.replayPolicyPresent &&
    controls.replayPolicyVerified &&
    controls.schemaContractPresent
  );
}

function finalCertificationStatus(
  requestedStatus: string,
  controlsAreComplete: boolean
): string {
  if (requestedStatus === "REVOKED" || requestedStatus === "SUSPENDED") {
    return requestedStatus;
  }

  if (requestedStatus === "CERTIFIED" && controlsAreComplete) {
    return "CERTIFIED";
  }

  if (requestedStatus === "CERTIFIED" && !controlsAreComplete) {
    return "CERTIFICATION_BLOCKED";
  }

  return requestedStatus;
}

async function upsertExternalSource(input: {
  sourceId: string;
  traceId: string;
  liveCallsAllowed: boolean;
  certificationStatus: string;
  adapterId: string;
}) {
  const source = resolveCanonicalExternalSource(input.sourceId);
  const now = new Date();
  const existingRows = await db
    .select()
    .from(externalDataSources)
    .where(eq(externalDataSources.id, source.id))
    .limit(1);
  const existingSource = existingRows[0];
  const sourceLiveCallsAllowed =
    input.liveCallsAllowed || existingSource?.liveCallsAllowed === true;
  const metadata = {
    allowedQueryTypes: source.allowedQueryTypes,
    liveDataStatus: sourceLiveCallsAllowed
      ? "certified-adapter-registered"
      : "certification-required",
    certificationRequired: !sourceLiveCallsAllowed,
    certificationStatus: input.certificationStatus,
    certifiedAdapterRuntimeVersion:
      "certified-connector-adapter-runtime-v0.1.0",
    adapterId: input.adapterId,
    liveCallPerformedByCertificationRoute: false,
  };

  const rows = await db
    .insert(externalDataSources)
    .values({
      id: source.id,
      sourceName: source.sourceName,
      sourceType: source.sourceType,
      authorityLevel: source.authorityLevel,
      status: "ACTIVE",
      liveCallsAllowed: sourceLiveCallsAllowed,
      baseUrl: null,
      sourceVersion: source.sourceVersion,
      governanceVersion: GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: input.traceId,
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
        liveCallsAllowed: sourceLiveCallsAllowed,
        sourceVersion: source.sourceVersion,
        governanceVersion: GOVERNANCE_VERSION,
        classification: "CONFIDENTIAL",
        replayRef: input.traceId,
        metadata,
        updatedAt: now,
      },
    })
    .returning();

  return rows[0];
}

export async function persistCertifiedConnectorAdapter(
  input: PersistCertifiedConnectorAdapterInput
): Promise<CertifiedConnectorAdapterResult> {
  const source = resolveCanonicalExternalSource(input.sourceId);
  const adapterId = normalizeRequiredText(input.adapterId, "adapterId");
  const adapterName = normalizeRequiredText(input.adapterName, "adapterName");
  const adapterType = normalizeAdapterType(input.adapterType, source.sourceType);
  const requestedCertificationStatus = normalizeCertificationStatus(
    input.certificationStatus
  );
  const credentialStatus = normalizeCredentialStatus(input.credentialStatus);
  const outageStatus = normalizeOutageStatus(input.outageStatus);
  const replayStatus = normalizeReplayStatus(input.replayStatus);
  const controls = certificationControls({
    sourceAuthorityRef: input.sourceAuthorityRef,
    credentialRef: input.credentialRef,
    credentialStatus,
    outagePolicyRef: input.outagePolicyRef,
    outageStatus,
    replayPolicyRef: input.replayPolicyRef,
    replayStatus,
    schemaContractVersion: input.schemaContractVersion,
  });
  const complete = controlsComplete(controls);
  const certificationStatus = finalCertificationStatus(
    requestedCertificationStatus,
    complete
  );
  const liveCallsAllowed = certificationStatus === "CERTIFIED";
  const now = new Date();
  const externalSource = await upsertExternalSource({
    sourceId: source.id,
    traceId: input.traceId,
    liveCallsAllowed,
    certificationStatus,
    adapterId,
  });
  const metadata = {
    ...(input.metadata ?? {}),
    actorId: normalizeConnectorText(input.actorId),
    requestedCertificationStatus,
    controls,
    controlsComplete: complete,
    liveCallPerformed: false,
    officialDataFetched: false,
    adapterRuntimeVersion: "certified-connector-adapter-runtime-v0.1.0",
  };

  const rows = await db
    .insert(certifiedConnectorAdapters)
    .values({
      adapterId,
      adapterName,
      adapterType,
      sourceId: source.id,
      sourceName: source.sourceName,
      sourceType: source.sourceType,
      sourceAuthorityRef: normalizeConnectorText(input.sourceAuthorityRef),
      certificationStatus,
      liveCallsAllowed,
      credentialRef: normalizeConnectorText(input.credentialRef),
      credentialStatus,
      credentialVaultRequired: true,
      outagePolicyRef: normalizeConnectorText(input.outagePolicyRef),
      outageStatus,
      replayPolicyRef: normalizeConnectorText(input.replayPolicyRef),
      replayStatus,
      schemaContractVersion: normalizeConnectorText(
        input.schemaContractVersion
      ),
      connectorConsentRequired: true,
      isolationRequired: true,
      humanReviewRequired: true,
      lastCertifiedAt: liveCallsAllowed ? now : null,
      revokedAt: certificationStatus === "REVOKED" ? now : null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: ADAPTER_RUNTIME_SOURCE,
      metadata,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: certifiedConnectorAdapters.adapterId,
      set: {
        adapterName,
        adapterType,
        sourceId: source.id,
        sourceName: source.sourceName,
        sourceType: source.sourceType,
        sourceAuthorityRef: normalizeConnectorText(input.sourceAuthorityRef),
        certificationStatus,
        liveCallsAllowed,
        credentialRef: normalizeConnectorText(input.credentialRef),
        credentialStatus,
        credentialVaultRequired: true,
        outagePolicyRef: normalizeConnectorText(input.outagePolicyRef),
        outageStatus,
        replayPolicyRef: normalizeConnectorText(input.replayPolicyRef),
        replayStatus,
        schemaContractVersion: normalizeConnectorText(
          input.schemaContractVersion
        ),
        connectorConsentRequired: true,
        isolationRequired: true,
        humanReviewRequired: true,
        lastCertifiedAt: liveCallsAllowed ? now : null,
        revokedAt: certificationStatus === "REVOKED" ? now : null,
        governanceVersion: GOVERNANCE_VERSION,
        classification: CLASSIFICATION,
        replayRef: input.traceId,
        traceId: input.traceId,
        source: ADAPTER_RUNTIME_SOURCE,
        metadata,
        updatedAt: now,
      },
    })
    .returning();

  return {
    adapter: rows[0],
    source: externalSource,
    controls,
    liveCallsAllowed,
    certificationStatus,
    message: liveCallsAllowed
      ? "Connector adapter certification was recorded. This route did not perform a live external data call."
      : "Connector adapter certification was blocked or remains pending until source authority, credentials, outage handling, replay controls, and schema contract are complete.",
  };
}

export async function listCertifiedConnectorAdapters(
  input: ListCertifiedConnectorAdapterInput
) {
  const filters = [
    normalizeConnectorText(input.sourceId)
      ? eq(
          certifiedConnectorAdapters.sourceId,
          resolveCanonicalExternalSource(input.sourceId).id
        )
      : undefined,
    normalizeConnectorText(input.certificationStatus)
      ? eq(
          certifiedConnectorAdapters.certificationStatus,
          normalizeCertificationStatus(input.certificationStatus)
        )
      : undefined,
    input.liveCallsAllowed === true || input.liveCallsAllowed === false
      ? eq(certifiedConnectorAdapters.liveCallsAllowed, input.liveCallsAllowed)
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  if (whereClause) {
    return db
      .select()
      .from(certifiedConnectorAdapters)
      .where(whereClause)
      .orderBy(desc(certifiedConnectorAdapters.updatedAt))
      .limit(normalizeLimit(input.limit));
  }

  return db
    .select()
    .from(certifiedConnectorAdapters)
    .orderBy(desc(certifiedConnectorAdapters.updatedAt))
    .limit(normalizeLimit(input.limit));
}

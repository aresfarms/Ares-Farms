import { eq } from "drizzle-orm";

import {
  applications,
  credentialedScrapingEvents,
  credentialVaultRefs,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Credentialed Agency Ingestion Runtime
 *
 * Master Volume Governance:
 * - Vol I §3.37: AI can fetch authenticated external data only as a bounded
 *   execution instrument of a credentialed human actor.
 * - Vol II §3.25: ToS attestation, license governance, data isolation,
 *   residency, and anti-bulk-acquisition controls are mandatory.
 * - Vol III TECH-CONN-001: credentialed_scraping_events and
 *   credential_vault_refs are canonical connector governance objects.
 * - Vol IV OPS-CONN-002: no external request can transmit until credential,
 *   whitelist, ToS, baseline, isolation, and provenance gates are recorded.
 * - Vol V CANON-EXTSOURCE-001: external data cannot influence scores,
 *   eligibility, underwriting, or decisions without source trust,
 *   provenance, replay, and license-bound authorization.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "RESTRICTED";
const INGESTION_SOURCE = "credentialed-agency-ingestion-runtime";

type ApplicationRecord = typeof applications.$inferSelect;

export type PersistCredentialedAgencyIngestionInput = {
  traceId: string;
  actorId?: string | null;
  initiatingActorId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  externalTargetDomain?: string | null;
  vaultRefId?: string | null;
  credentialType?: string | null;
  externalPlatform?: string | null;
  holdingActorId?: string | null;
  licenseType?: string | null;
  licenseScope?: Record<string, unknown> | null;
  expiryTimestamp?: string | null;
  renewalStatus?: string | null;
  revocationEventRef?: string | null;
  acquisitionMethod?: string | null;
  sourceType?: string | null;
  sourceTrustClassification?: string | null;
  requestedDataCategories?: string[];
  humanAuthorizationRef?: string | null;
  sourceAuthorityRef?: string | null;
  dataResidencyZone?: string | null;
  sovereigntyClassification?: string | null;
  tosComplianceAttestationRef?: string | null;
  tosPermitsAccess?: boolean | null;
  licenseAuthorizesCategories?: boolean | null;
  useWithinLicenseScope?: boolean | null;
  whitelistApproved?: boolean | null;
  baselineSyncRef?: string | null;
  isolationBoundaryConfirmed?: boolean | null;
  provenanceEnvelopeRef?: string | null;
  bulkAcquisitionRequested?: boolean | null;
  metadata?: Record<string, unknown>;
};

export type CredentialedAgencyIngestionGates = Record<string, boolean>;

export type CredentialedAgencyIngestionResult = {
  credential: typeof credentialVaultRefs.$inferSelect;
  ingestionEvent: typeof credentialedScrapingEvents.$inferSelect;
  gates: CredentialedAgencyIngestionGates;
  blockerReasons: string[];
  readyForSession: boolean;
  sessionOutcome: string;
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

function normalizeCredentialType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set(["API_KEY", "SESSION_TOKEN", "LOGIN_CREDENTIAL"]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "SESSION_TOKEN";
}

function normalizeRenewalStatus(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "ACTIVE",
    "PENDING_RENEWAL",
    "EXPIRED",
    "REVOKED",
    "SUSPENDED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "ACTIVE";
}

function normalizeAcquisitionMethod(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set(["API", "SESSION", "SCRAPE"]);

  return normalized && allowed.has(normalized) ? normalized : "SESSION";
}

function normalizeSourceType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "LICENSED_API",
    "CREDENTIALED_SESSION",
    "GOVERNMENT_PORTAL",
    "LICENSED_FEED",
    "PUBLIC_REGISTRY",
    "MLS_REAL_ESTATE",
    "COMMODITY_EXCHANGE",
    "FINANCIAL_MARKET",
    "ENVIRONMENTAL_GIS",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "CREDENTIALED_SESSION";
}

function normalizeSourceTrustClassification(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "AUTHORITATIVE",
    "ADVISORY",
    "DERIVED",
    "UNVERIFIABLE",
    "STALE",
    "SUPERSEDED",
    "INSTITUTION_CERTIFIED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "ADVISORY";
}

function parseExpiry(value: string | null | undefined): Date | null {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function credentialExpired(expiry: Date | null, now: Date): boolean {
  return Boolean(expiry && expiry.getTime() <= now.getTime());
}

function credentialRevoked(input: {
  renewalStatus: string;
  revocationEventRef?: string | null;
}): boolean {
  return (
    input.renewalStatus === "REVOKED" ||
    input.renewalStatus === "SUSPENDED" ||
    Boolean(normalizeText(input.revocationEventRef))
  );
}

function credentialValid(input: {
  expiry: Date | null;
  renewalStatus: string;
  revocationEventRef?: string | null;
  now: Date;
}): boolean {
  return (
    !credentialExpired(input.expiry, input.now) &&
    !credentialRevoked(input) &&
    input.renewalStatus !== "EXPIRED"
  );
}

function blockerReasons(gates: CredentialedAgencyIngestionGates): string[] {
  return Object.entries(gates)
    .filter(([, passed]) => !passed)
    .map(([gate]) => gate);
}

function allGatesPass(gates: CredentialedAgencyIngestionGates): boolean {
  return Object.values(gates).every((passed) => passed === true);
}

function sessionOutcome(input: {
  readyForSession: boolean;
  credentialIsValid: boolean;
  whitelistVerified: boolean;
}): string {
  if (input.readyForSession) {
    return "CREDENTIALED_INGESTION_READY_NOT_STARTED";
  }

  if (!input.credentialIsValid) {
    return "CREDENTIAL_INVALID";
  }

  if (!input.whitelistVerified) {
    return "WHITELIST_VIOLATION";
  }

  return "ABORTED";
}

async function loadApplication(applicationId: string): Promise<ApplicationRecord> {
  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  const application = rows[0] ?? null;

  if (!application) {
    throw new Error(
      "Application not found for Credentialed Agency Ingestion."
    );
  }

  return application;
}

export async function persistCredentialedAgencyIngestion(
  input: PersistCredentialedAgencyIngestionInput
): Promise<CredentialedAgencyIngestionResult> {
  const now = new Date();
  const applicationId = normalizeRequiredText(
    input.applicationId,
    "applicationId"
  );
  const application = await loadApplication(applicationId);
  const initiatingActorId = normalizeRequiredText(
    input.initiatingActorId ?? input.actorId,
    "initiatingActorId"
  );
  const externalTargetDomain = normalizeRequiredText(
    input.externalTargetDomain,
    "externalTargetDomain"
  );
  const vaultRefId = normalizeRequiredText(input.vaultRefId, "vaultRefId");
  const credentialType = normalizeCredentialType(input.credentialType);
  const externalPlatform = normalizeRequiredText(
    input.externalPlatform ?? input.externalTargetDomain,
    "externalPlatform"
  );
  const holdingActorId = normalizeRequiredText(
    input.holdingActorId ?? initiatingActorId,
    "holdingActorId"
  );
  const licenseType = normalizeRequiredText(
    input.licenseType,
    "licenseType"
  );
  const renewalStatus = normalizeRenewalStatus(input.renewalStatus);
  const expiry = parseExpiry(input.expiryTimestamp);
  const expired = credentialExpired(expiry, now);
  const revoked = credentialRevoked({
    renewalStatus,
    revocationEventRef: input.revocationEventRef,
  });
  const validCredential = credentialValid({
    expiry,
    renewalStatus,
    revocationEventRef: input.revocationEventRef,
    now,
  });
  const requestedDataCategories = input.requestedDataCategories ?? [];
  const applicationScoped = Boolean(applicationId);
  const humanAuthorizationPresent = Boolean(
    normalizeText(input.humanAuthorizationRef)
  );
  const vaultRefPresent = Boolean(vaultRefId);
  const holdingActorMatches = holdingActorId === initiatingActorId;
  const whitelistVerified = input.whitelistApproved === true;
  const tosAttested = Boolean(
    normalizeText(input.tosComplianceAttestationRef)
  );
  const tosPermitsAccess = input.tosPermitsAccess === true;
  const licenseAuthorizesCategories =
    input.licenseAuthorizesCategories === true;
  const useWithinLicenseScope = input.useWithinLicenseScope === true;
  const licenseBoundaryConfirmed =
    licenseAuthorizesCategories && useWithinLicenseScope;
  const baselineSyncLogged = Boolean(normalizeText(input.baselineSyncRef));
  const isolationBoundaryConfirmed =
    input.isolationBoundaryConfirmed === true;
  const provenanceEnvelopePresent = Boolean(
    normalizeText(input.provenanceEnvelopeRef)
  );
  const bulkAcquisitionRequested =
    input.bulkAcquisitionRequested === true ||
    requestedDataCategories.includes("*") ||
    requestedDataCategories.includes("ALL");
  const antiBulkAcquisitionSatisfied = !bulkAcquisitionRequested;
  const externalRequestTransmitted = false;
  const dataProcessedByEngine = false;
  const gates: CredentialedAgencyIngestionGates = {
    vaultRefPresent,
    credentialValid: validCredential,
    credentialNotExpired: !expired,
    credentialNotRevoked: !revoked,
    holdingActorMatches,
    humanAuthorizationPresent,
    applicationScoped,
    whitelistVerified,
    tosComplianceAttestationPresent: tosAttested,
    tosPermitsAccess,
    licenseAuthorizesCategories,
    useWithinLicenseScope,
    licenseBoundaryConfirmed,
    baselineSyncLogged,
    isolationBoundaryConfirmed,
    provenanceEnvelopePresent,
    antiBulkAcquisitionSatisfied,
    externalRequestNotTransmitted: externalRequestTransmitted === false,
    dataNotProcessedByEngine: dataProcessedByEngine === false,
    aiTierAdvisoryOnly: true,
  };
  const readyForSession = allGatesPass(gates);
  const outcome = sessionOutcome({
    readyForSession,
    credentialIsValid: validCredential,
    whitelistVerified,
  });
  const circuitBreakerTriggered =
    !validCredential || !whitelistVerified || !isolationBoundaryConfirmed;
  const blockerRefs = blockerReasons(gates);
  const credentialRows = await db
    .insert(credentialVaultRefs)
    .values({
      vaultRefId,
      credentialType,
      externalPlatform,
      holdingActorId,
      licenseType,
      licenseScope: input.licenseScope ?? {},
      expiryTimestamp: expiry,
      lastValidatedTimestamp: now,
      renewalStatus,
      revocationEventRef: input.revocationEventRef ?? null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: INGESTION_SOURCE,
      metadata: {
        credentialValueStored: false,
        secureVaultReferenceOnly: true,
        ...(input.metadata ?? {}),
      },
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: credentialVaultRefs.vaultRefId,
      set: {
        credentialType,
        externalPlatform,
        holdingActorId,
        licenseType,
        licenseScope: input.licenseScope ?? {},
        expiryTimestamp: expiry,
        lastValidatedTimestamp: now,
        renewalStatus,
        revocationEventRef: input.revocationEventRef ?? null,
        governanceVersion: GOVERNANCE_VERSION,
        classification: CLASSIFICATION,
        replayRef: input.traceId,
        traceId: input.traceId,
        source: INGESTION_SOURCE,
        metadata: {
          credentialValueStored: false,
          secureVaultReferenceOnly: true,
          ...(input.metadata ?? {}),
        },
        updatedAt: now,
      },
    })
    .returning();
  const credential = credentialRows[0];

  if (!credential) {
    throw new Error("Credential vault reference was not persisted.");
  }

  const ingestionRows = await db
    .insert(credentialedScrapingEvents)
    .values({
      scrapingEventId: `${input.traceId}:credentialed-ingestion`,
      initiatingActorId,
      externalTargetDomain,
      licenseIdentifierRef: vaultRefId,
      applicationIdScope: application.id,
      borrowerId:
        normalizeText(input.borrowerId) ?? application.borrowerId ?? null,
      tenantId: normalizeText(input.tenantId) ?? application.tenantId ?? null,
      acquisitionMethod: normalizeAcquisitionMethod(input.acquisitionMethod),
      sourceType: normalizeSourceType(input.sourceType),
      sourceTrustClassification: normalizeSourceTrustClassification(
        input.sourceTrustClassification
      ),
      requestedDataCategories,
      humanAuthorizationRef: input.humanAuthorizationRef ?? null,
      sourceAuthorityRef: input.sourceAuthorityRef ?? null,
      dataResidencyZone: input.dataResidencyZone ?? null,
      sovereigntyClassification:
        input.sovereigntyClassification ?? null,
      ingestedPayloadHash: null,
      provenanceEnvelopeRef: input.provenanceEnvelopeRef ?? null,
      tosComplianceAttestation: tosAttested,
      tosComplianceAttestationRef:
        input.tosComplianceAttestationRef ?? null,
      licenseBoundaryConfirmed,
      whitelistVerified,
      baselineSyncLogged,
      isolationBoundaryConfirmed,
      credentialValid: validCredential,
      credentialExpired: expired || renewalStatus === "EXPIRED",
      credentialRevoked: revoked,
      circuitBreakerTriggered,
      sev2EventRef: circuitBreakerTriggered
        ? `sev2://${input.traceId}/credentialed-ingestion`
        : null,
      sessionOutcome: outcome,
      readyForSession,
      externalRequestTransmitted,
      dataProcessedByEngine,
      bulkAcquisitionRequested,
      antiBulkAcquisitionSatisfied,
      aiTier: "TIER_1_ADVISORY",
      gateSnapshot: gates,
      blockerReasons: blockerRefs,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: INGESTION_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        baselineSyncRef: input.baselineSyncRef ?? null,
        externalRequestTransmitted,
        dataProcessedByEngine,
        credentialValueStored: false,
        officialDataFetched: false,
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const ingestionEvent = ingestionRows[0];

  if (!ingestionEvent) {
    throw new Error("Credentialed Agency Ingestion event was not persisted.");
  }

  return {
    credential,
    ingestionEvent,
    gates,
    blockerReasons: blockerRefs,
    readyForSession,
    sessionOutcome: outcome,
  };
}

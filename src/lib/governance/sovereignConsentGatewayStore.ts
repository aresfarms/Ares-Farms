import { eq } from "drizzle-orm";

import { applications, sovereignConsentGatewayRecords } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Sovereign Consent Gateway Runtime
 *
 * Master Volume Governance:
 * - Vol II §3.21: tribal sovereign land workflows keep Level 5 controls
 *   unless a valid platform-internal Gateway exists.
 * - Vol V CANON-CONSENT-001 v7.0: a Gateway is tribal-authority initiated,
 *   time-bound, scope-limited, and preserved as Level 5 audit evidence.
 * - Vol V CANON-SOVEREIGNTY-001: a Gateway creates only a bounded Level 4
 *   operational exception and never changes the underlying sovereignty class.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "SOVEREIGN_CONTROLLED";
const SOURCE = "sovereign-consent-gateway-runtime";
const MAX_GATEWAY_DURATION_DAYS = 180;

type ApplicationRecord = typeof applications.$inferSelect;

export type PersistSovereignConsentGatewayInput = {
  traceId: string;
  actorId?: string | null;
  gatewayId?: string | null;
  initiatingAuthorityId?: string | null;
  initiatingAuthorityType?: string | null;
  initiatingAuthorityRole?: string | null;
  verifiedIdentityEventRef?: string | null;
  affirmativeInitiationRef?: string | null;
  tribalNation?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  authorizedDataElements?: string[];
  authorizedWorkflowPhases?: string[];
  underwritingWindowClosesAt?: string | null;
  revocationEventRef?: string | null;
  nonProprietaryOnlyConfirmed?: boolean | null;
  publiclyAccessibleRegistryOnly?: boolean | null;
  applicationScopeConfirmed?: boolean | null;
  workflowScopeConfirmed?: boolean | null;
  bulkDataAcquisitionRequested?: boolean | null;
  crossTransactionSharingRequested?: boolean | null;
  competitiveIntelligenceRequested?: boolean | null;
  aiTrainingRequested?: boolean | null;
  proprietarySovereignRecordsRequested?: boolean | null;
  platformInitiated?: boolean | null;
  externalLegalFrameworkReviewed?: boolean | null;
  complianceOfficerId?: string | null;
  complianceReviewRef?: string | null;
  complianceOfficerVerified?: boolean | null;
  dataAccessEvents?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
};

export type SovereignConsentGatewayGates = Record<string, boolean>;

export type SovereignConsentGatewayResult = {
  gatewayRecord: typeof sovereignConsentGatewayRecords.$inferSelect;
  gates: SovereignConsentGatewayGates;
  blockerReasons: string[];
  gatewayActive: boolean;
  gatewayStatus: string;
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

function normalizeAuthorityType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "TRIBAL_GOVERNANCE_OFFICER",
    "NATIVE_OPERATOR",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "NATIVE_OPERATOR";
}

function normalizeAuthorityRole(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "TRIBAL_CHAIRMAN",
    "TRIBAL_FINANCE_OFFICER",
    "DESIGNATED_SOVEREIGN_REPRESENTATIVE",
    "AUTHORIZED_NATIVE_OPERATOR",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "AUTHORIZED_NATIVE_OPERATOR";
}

function parseDate(value: string | null | undefined): Date | null {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function earliestDate(dates: Date[]): Date {
  return dates.reduce((earliest, current) =>
    current.getTime() < earliest.getTime() ? current : earliest
  );
}

function blockerReasons(gates: SovereignConsentGatewayGates): string[] {
  return Object.entries(gates)
    .filter(([, passed]) => !passed)
    .map(([gate]) => gate);
}

function allGatesPass(gates: SovereignConsentGatewayGates): boolean {
  return Object.values(gates).every((passed) => passed === true);
}

function gatewayStatus(input: {
  gatewayActive: boolean;
  revoked: boolean;
  activeWindow: boolean;
}): string {
  if (input.revoked) {
    return "REVOKED";
  }

  if (!input.activeWindow) {
    return "EXPIRED_OR_WINDOW_CLOSED";
  }

  return input.gatewayActive
    ? "ACTIVE_LEVEL_5_EXECUTIVE_WAIVER"
    : "GATEWAY_BLOCKED";
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
      "Application not found for Sovereign Consent Gateway."
    );
  }

  return application;
}

export async function persistSovereignConsentGateway(
  input: PersistSovereignConsentGatewayInput
): Promise<SovereignConsentGatewayResult> {
  const now = new Date();
  const applicationId = normalizeRequiredText(
    input.applicationId,
    "applicationId"
  );
  const application = await loadApplication(applicationId);
  const gatewayId =
    normalizeText(input.gatewayId) ??
    `${input.traceId}:sovereign-consent-gateway`;
  const initiatingAuthorityId = normalizeRequiredText(
    input.initiatingAuthorityId ?? input.actorId,
    "initiatingAuthorityId"
  );
  const initiatingAuthorityType = normalizeAuthorityType(
    input.initiatingAuthorityType
  );
  const initiatingAuthorityRole = normalizeAuthorityRole(
    input.initiatingAuthorityRole
  );
  const underwritingWindowClosesAt = parseDate(
    input.underwritingWindowClosesAt
  );
  const maxExpiration = addDays(now, MAX_GATEWAY_DURATION_DAYS);
  const expirationTimestamp = underwritingWindowClosesAt
    ? earliestDate([underwritingWindowClosesAt, maxExpiration])
    : maxExpiration;
  const authorizedDataElements = input.authorizedDataElements ?? [];
  const authorizedWorkflowPhases = input.authorizedWorkflowPhases ?? [];
  const revoked = Boolean(normalizeText(input.revocationEventRef));
  const activeUnderwritingWindow = Boolean(
    underwritingWindowClosesAt &&
      underwritingWindowClosesAt.getTime() > now.getTime()
  );
  const durationWithin180Days =
    expirationTimestamp.getTime() <= maxExpiration.getTime();
  const verifiedIdentityEventPresent = Boolean(
    normalizeText(input.verifiedIdentityEventRef)
  );
  const affirmativeInitiationPresent = Boolean(
    normalizeText(input.affirmativeInitiationRef)
  );
  const tribalAuthorityInitiated = input.platformInitiated !== true;
  const validAuthorityRole =
    initiatingAuthorityType === "TRIBAL_GOVERNANCE_OFFICER"
      ? [
          "TRIBAL_CHAIRMAN",
          "TRIBAL_FINANCE_OFFICER",
          "DESIGNATED_SOVEREIGN_REPRESENTATIVE",
        ].includes(initiatingAuthorityRole)
      : initiatingAuthorityRole === "AUTHORIZED_NATIVE_OPERATOR";
  const complianceReviewPresent = Boolean(
    normalizeText(input.complianceReviewRef)
  );
  const complianceOfficerPresent = Boolean(
    normalizeText(input.complianceOfficerId)
  );
  const applicationScopeConfirmed =
    input.applicationScopeConfirmed === true;
  const workflowScopeConfirmed = input.workflowScopeConfirmed === true;
  const noBulkDataAcquisition =
    input.bulkDataAcquisitionRequested !== true;
  const noCrossTransactionSharing =
    input.crossTransactionSharingRequested !== true;
  const noCompetitiveIntelligence =
    input.competitiveIntelligenceRequested !== true;
  const noAiTrainingAccess = input.aiTrainingRequested !== true;
  const noProprietarySovereignRecords =
    input.proprietarySovereignRecordsRequested !== true;

  const gates: SovereignConsentGatewayGates = {
    level5BaselineConfirmed: true,
    verifiedIdentityEventPresent,
    affirmativeInitiationPresent,
    tribalAuthorityInitiated,
    validAuthorityRole,
    applicationScoped: Boolean(applicationId),
    dataElementsPresent: authorizedDataElements.length > 0,
    workflowPhasesPresent: authorizedWorkflowPhases.length > 0,
    nonProprietaryOnlyConfirmed:
      input.nonProprietaryOnlyConfirmed === true,
    publiclyAccessibleRegistryOnly:
      input.publiclyAccessibleRegistryOnly === true,
    applicationScopeConfirmed,
    workflowScopeConfirmed,
    noBulkDataAcquisition,
    noCrossTransactionSharing,
    noCompetitiveIntelligence,
    noAiTrainingAccess,
    noProprietarySovereignRecords,
    activeUnderwritingWindow,
    durationWithin180Days,
    notRevoked: !revoked,
    externalLegalFrameworkReviewed:
      input.externalLegalFrameworkReviewed === true,
    complianceOfficerPresent,
    complianceReviewPresent,
    complianceOfficerVerified: input.complianceOfficerVerified === true,
    gatewayDoesNotModifySovereignty: true,
    dataAccessNotPerformed: true,
    scoringUseNotAllowed: true,
    underwritingUseNotAllowed: true,
  };
  const gatewayActive = allGatesPass(gates);
  const status = gatewayStatus({
    gatewayActive,
    revoked,
    activeWindow: activeUnderwritingWindow,
  });
  const operationalClassification = gatewayActive
    ? "RESTRICTED"
    : "SOVEREIGN_CONTROLLED";
  const blockers = blockerReasons(gates);
  const expirationReason = underwritingWindowClosesAt
    ? "earliest-of-underwriting-window-or-180-days"
    : "180-day-maximum-window";
  const rows = await db
    .insert(sovereignConsentGatewayRecords)
    .values({
      gatewayRecordId: `${input.traceId}:sovereign-consent-gateway`,
      gatewayId,
      initiatingAuthorityId,
      initiatingAuthorityType,
      initiatingAuthorityRole,
      verifiedIdentityEventRef: input.verifiedIdentityEventRef ?? null,
      affirmativeInitiationRef: input.affirmativeInitiationRef ?? null,
      tribalNation: input.tribalNation ?? null,
      applicationIdScope: application.id,
      borrowerId:
        normalizeText(input.borrowerId) ?? application.borrowerId ?? null,
      tenantId: normalizeText(input.tenantId) ?? application.tenantId ?? null,
      authorizedDataElements,
      authorizedWorkflowPhases,
      underwritingWindowClosesAt,
      initiationTimestamp: now,
      expirationTimestamp,
      revocationEventRef: input.revocationEventRef ?? null,
      gatewayStatus: status,
      expirationReason,
      gatewayActive,
      level5BaselineConfirmed: true,
      level4OperationalExceptionAuthorized: gatewayActive,
      sovereigntyClassification: "SOVEREIGN_CONTROLLED",
      operationalClassification,
      nonProprietaryOnlyConfirmed:
        input.nonProprietaryOnlyConfirmed === true,
      publiclyAccessibleRegistryOnly:
        input.publiclyAccessibleRegistryOnly === true,
      applicationScopeConfirmed,
      workflowScopeConfirmed,
      noBulkDataAcquisition,
      noCrossTransactionSharing,
      noCompetitiveIntelligence,
      noAiTrainingAccess,
      noProprietarySovereignRecords,
      platformInitiated: input.platformInitiated === true,
      externalLegalFrameworkReviewed:
        input.externalLegalFrameworkReviewed === true,
      complianceOfficerId: input.complianceOfficerId ?? null,
      complianceReviewRef: input.complianceReviewRef ?? null,
      complianceOfficerVerified: input.complianceOfficerVerified === true,
      dataAccessEvents: input.dataAccessEvents ?? [],
      dataAccessPerformed: false,
      scoringUseAllowed: false,
      underwritingUseAllowed: false,
      gateSnapshot: gates,
      blockerReasons: blockers,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        maxGatewayDurationDays: MAX_GATEWAY_DURATION_DAYS,
        sovereigntyClassificationUnchanged: true,
        dataAccessPerformed: false,
        scoringUseAllowed: false,
        underwritingUseAllowed: false,
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const gatewayRecord = rows[0];

  if (!gatewayRecord) {
    throw new Error("Sovereign Consent Gateway record was not persisted.");
  }

  return {
    gatewayRecord,
    gates,
    blockerReasons: blockers,
    gatewayActive,
    gatewayStatus: status,
  };
}

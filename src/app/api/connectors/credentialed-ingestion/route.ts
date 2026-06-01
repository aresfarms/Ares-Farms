import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistCredentialedAgencyIngestion } from "@/lib/connectors/credentialedAgencyIngestionStore";
import { persistRouteGovernanceEvidence } from "@/lib/governance/routeEvidence";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Credentialed Agency Ingestion API
 *
 * Master Volume Governance:
 * - Vol I §3.37: AI-assisted external acquisition may operate only as a
 *   bounded instrument of a credentialed human actor.
 * - Vol II §3.25: ToS attestation, license governance, data isolation,
 *   residency, and anti-bulk-acquisition controls are mandatory.
 * - Vol III TECH-CONN-001: credentialed_scraping_events and
 *   credential_vault_refs are canonical connector objects.
 * - Vol IV OPS-CONN-002: credential, whitelist, ToS, baseline sync,
 *   isolation, provenance, and circuit-breaker posture are pre-session gates.
 * - Vol V CANON-EXTSOURCE-001: external data cannot influence platform
 *   decisions without provenance, source trust, replay, and authorization.
 */

type CredentialedIngestionRequest = {
  userId?: string | null;
  actorId?: string | null;
  initiatingActorId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
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

function createCredentialedIngestionTraceId(): string {
  return `credentialed-ingestion-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: CredentialedIngestionRequest): string | null {
  return body.actorId ?? body.userId ?? body.initiatingActorId ?? null;
}

function routeActorRole(body: CredentialedIngestionRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function credentialResponse(
  credential: Awaited<
    ReturnType<typeof persistCredentialedAgencyIngestion>
  >["credential"]
) {
  return {
    id: credential.id,
    vaultRefId: credential.vaultRefId,
    credentialType: credential.credentialType,
    externalPlatform: credential.externalPlatform,
    holdingActorId: credential.holdingActorId,
    licenseType: credential.licenseType,
    expiryTimestamp: credential.expiryTimestamp,
    lastValidatedTimestamp: credential.lastValidatedTimestamp,
    renewalStatus: credential.renewalStatus,
    revocationEventRef: credential.revocationEventRef,
    classification: credential.classification,
    replayRef: credential.replayRef,
    traceId: credential.traceId,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  };
}

function ingestionEventResponse(
  ingestionEvent: Awaited<
    ReturnType<typeof persistCredentialedAgencyIngestion>
  >["ingestionEvent"]
) {
  return {
    id: ingestionEvent.id,
    scrapingEventId: ingestionEvent.scrapingEventId,
    initiatingActorId: ingestionEvent.initiatingActorId,
    externalTargetDomain: ingestionEvent.externalTargetDomain,
    licenseIdentifierRef: ingestionEvent.licenseIdentifierRef,
    applicationIdScope: ingestionEvent.applicationIdScope,
    borrowerId: ingestionEvent.borrowerId,
    tenantId: ingestionEvent.tenantId,
    acquisitionMethod: ingestionEvent.acquisitionMethod,
    sourceType: ingestionEvent.sourceType,
    sourceTrustClassification:
      ingestionEvent.sourceTrustClassification,
    humanAuthorizationRef: ingestionEvent.humanAuthorizationRef,
    sourceAuthorityRef: ingestionEvent.sourceAuthorityRef,
    dataResidencyZone: ingestionEvent.dataResidencyZone,
    sovereigntyClassification:
      ingestionEvent.sovereigntyClassification,
    ingestedPayloadHash: ingestionEvent.ingestedPayloadHash,
    provenanceEnvelopeRef: ingestionEvent.provenanceEnvelopeRef,
    tosComplianceAttestation:
      ingestionEvent.tosComplianceAttestation,
    tosComplianceAttestationRef:
      ingestionEvent.tosComplianceAttestationRef,
    licenseBoundaryConfirmed:
      ingestionEvent.licenseBoundaryConfirmed,
    whitelistVerified: ingestionEvent.whitelistVerified,
    baselineSyncLogged: ingestionEvent.baselineSyncLogged,
    isolationBoundaryConfirmed:
      ingestionEvent.isolationBoundaryConfirmed,
    credentialValid: ingestionEvent.credentialValid,
    credentialExpired: ingestionEvent.credentialExpired,
    credentialRevoked: ingestionEvent.credentialRevoked,
    circuitBreakerTriggered:
      ingestionEvent.circuitBreakerTriggered,
    sev2EventRef: ingestionEvent.sev2EventRef,
    sessionOutcome: ingestionEvent.sessionOutcome,
    readyForSession: ingestionEvent.readyForSession,
    externalRequestTransmitted:
      ingestionEvent.externalRequestTransmitted,
    dataProcessedByEngine: ingestionEvent.dataProcessedByEngine,
    bulkAcquisitionRequested:
      ingestionEvent.bulkAcquisitionRequested,
    antiBulkAcquisitionSatisfied:
      ingestionEvent.antiBulkAcquisitionSatisfied,
    aiTier: ingestionEvent.aiTier,
    classification: ingestionEvent.classification,
    replayRef: ingestionEvent.replayRef,
    traceId: ingestionEvent.traceId,
    createdAt: ingestionEvent.createdAt,
    updatedAt: ingestionEvent.updatedAt,
  };
}

async function persistDeniedEvidence(input: {
  traceId: string;
  actor: string | null;
  body: CredentialedIngestionRequest;
  runtimeGuard: ReturnType<typeof runRuntimeGuard>;
  access?: ReturnType<typeof evaluateAccess> | null;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  const observability = createObservabilityEvent({
    eventType: "CREDENTIALED_INGESTION_ACCESS_DENIED",
    domain: "security",
    severity: "WARN",
    message: input.reason,
    traceId: input.traceId,
    replayRef: input.traceId,
    actorId: input.actor,
    module: "api.connectors.credentialed-ingestion",
    metadata: {
      route: "/api/connectors/credentialed-ingestion",
      applicationId: input.body.applicationId ?? null,
      externalTargetDomain: input.body.externalTargetDomain ?? null,
      runtimeAllowed: input.runtimeGuard.allowed,
      accessAllowed: input.access?.allowed ?? null,
      ...(input.metadata ?? {}),
    },
  });
  const evidence = await persistRouteGovernanceEvidence({
    traceId: input.traceId,
    replayRef: input.traceId,
    route: "/api/connectors/credentialed-ingestion",
    operation: "credentialed-agency-ingestion.denied",
    module: "api.connectors.credentialed-ingestion",
    observability,
    sourceVersion: "credentialed-agency-ingestion-route-v0.1.0",
    verificationStatus: "WARN",
    replaySafe: true,
    result: {
      denied: true,
      reason: input.reason,
    },
    metadata: {
      applicationId: input.body.applicationId ?? null,
      externalTargetDomain: input.body.externalTargetDomain ?? null,
    },
  });

  return { observability, evidence };
}

export async function POST(req: NextRequest) {
  const traceId = createCredentialedIngestionTraceId();

  try {
    const body = (await req.json()) as CredentialedIngestionRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "credentialed-agency-ingestion.pre-session",
      module: "api.connectors.credentialed-ingestion",
      traceId,
      schemaVersion: "credentialed-agency-ingestion-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/connectors/credentialed-ingestion",
        applicationId: body.applicationId ?? null,
        externalTargetDomain: body.externalTargetDomain ?? null,
        externalRequestExpected: false,
        dataProcessingExpected: false,
      },
    });

    const access = evaluateAccess({
      role: routeActorRole(body),
      allowedRoles: [
        "lender",
        "operator",
        "underwriter",
        "admin",
        "governance",
      ],
      operation: "credentialed-agency-ingestion.pre-session",
      module: "api.connectors.credentialed-ingestion",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!runtimeGuard.allowed || !access.allowed) {
      const denied = await persistDeniedEvidence({
        traceId,
        actor,
        body,
        runtimeGuard,
        access,
        reason:
          "Credentialed Agency Ingestion was denied by runtime or role access controls.",
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for Credentialed Agency Ingestion.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            observability: denied.observability,
            evidence: denied.evidence,
          },
        },
        { status: 403 }
      );
    }

    const recordAccess = await evaluateApplicationRecordAccess({
      access,
      operation: "credentialed-agency-ingestion.pre-session",
      module: "api.connectors.credentialed-ingestion",
      traceId,
      resourceType: "connector_request",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const denied = await persistDeniedEvidence({
        traceId,
        actor,
        body,
        runtimeGuard,
        access,
        reason:
          "Credentialed Agency Ingestion was denied by application record access controls.",
        metadata: {
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this application ingestion scope.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess,
            observability: denied.observability,
            evidence: denied.evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "credentialed-agency-ingestion.pre-session",
      module: "api.connectors.credentialed-ingestion",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "credentialed-agency-ingestion-v0.1.0",
          "src/db/schema/credentialedScrapingEvents.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series v2026-05-24",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "credentialed-agency-ingestion-runtime-v0.1.0",
          "src/lib/connectors/credentialedAgencyIngestionStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "credentialed-agency-ingestion-route-v0.1.0",
          "api.connectors.credentialed-ingestion",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "institutional",
      classificationSource: "credentialed-agency-ingestion-route-input",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "governance",
        "authorized-operator",
        "compliance-officer",
      ],
      sharingPermissions: ["regulated-operational-review"],
      aiUsagePermissions: ["classify", "explain"],
      exportRestrictions: [
        "requires-governed-export-context",
        "no-public-disclosure",
      ],
      redactionRequirements: [
        "redact-vault-reference-and-license-details",
      ],
      consentRequirements: ["credentialed-ingestion-authorization"],
    });

    const ingestion = await persistCredentialedAgencyIngestion({
      traceId,
      actorId: actor,
      initiatingActorId: body.initiatingActorId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      applicationId: body.applicationId,
      externalTargetDomain: body.externalTargetDomain,
      vaultRefId: body.vaultRefId,
      credentialType: body.credentialType,
      externalPlatform: body.externalPlatform,
      holdingActorId: body.holdingActorId,
      licenseType: body.licenseType,
      licenseScope: body.licenseScope,
      expiryTimestamp: body.expiryTimestamp,
      renewalStatus: body.renewalStatus,
      revocationEventRef: body.revocationEventRef,
      acquisitionMethod: body.acquisitionMethod,
      sourceType: body.sourceType,
      sourceTrustClassification: body.sourceTrustClassification,
      requestedDataCategories: body.requestedDataCategories,
      humanAuthorizationRef: body.humanAuthorizationRef,
      sourceAuthorityRef: body.sourceAuthorityRef,
      dataResidencyZone: body.dataResidencyZone,
      sovereigntyClassification: body.sovereigntyClassification,
      tosComplianceAttestationRef: body.tosComplianceAttestationRef,
      tosPermitsAccess: body.tosPermitsAccess,
      licenseAuthorizesCategories: body.licenseAuthorizesCategories,
      useWithinLicenseScope: body.useWithinLicenseScope,
      whitelistApproved: body.whitelistApproved,
      baselineSyncRef: body.baselineSyncRef,
      isolationBoundaryConfirmed: body.isolationBoundaryConfirmed,
      provenanceEnvelopeRef: body.provenanceEnvelopeRef,
      bulkAcquisitionRequested: body.bulkAcquisitionRequested,
      metadata: {
        ...(body.metadata ?? {}),
        route: "/api/connectors/credentialed-ingestion",
      },
    });

    const credential = credentialResponse(ingestion.credential);
    const event = ingestionEventResponse(ingestion.ingestionEvent);
    const classifiedOutput = classifyRecord(
      {
        credential,
        ingestionEvent: event,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "institutional",
        classificationSource:
          "credentialed-agency-ingestion-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "governance",
          "authorized-operator",
          "compliance-officer",
        ],
        sharingPermissions: ["regulated-operational-review"],
        aiUsagePermissions: ["classify", "explain"],
        exportRestrictions: [
          "requires-governed-export-context",
          "no-public-disclosure",
        ],
        redactionRequirements: [
          "redact-vault-reference-and-license-details",
        ],
        consentRequirements: ["credentialed-ingestion-authorization"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: ingestion.ingestionEvent.id,
      outputType: "credentialed_agency_ingestion_pre_session",
      audience: "governance",
      claimType: "recommendation",
      summary: ingestion.readyForSession
        ? "Credentialed Agency Ingestion pre-session controls are complete. Runtime did not transmit an external request."
        : "Credentialed Agency Ingestion remains blocked until credential, whitelist, ToS, license, isolation, provenance, and anti-bulk controls pass.",
      ruleVersion: "credentialed-agency-ingestion-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 0.84,
      humanReviewRequired: true,
      replayRefs: [traceId],
      evidenceRefs: [
        {
          refId: ingestion.ingestionEvent.scrapingEventId,
          sourceType: "connector",
          sourceName: "credentialed_scraping_events",
          sourceVersion: "TECH-CONN-001-v22.0",
          replayRef: traceId,
        },
      ],
      metadata: {
        readyForSession: ingestion.readyForSession,
        sessionOutcome: ingestion.sessionOutcome,
        blockerReasons: ingestion.blockerReasons,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "CREDENTIALED_AGENCY_INGESTION_REVIEWED",
      domain: "connector",
      severity: ingestion.readyForSession ? "INFO" : "WARN",
      message:
        "Credentialed Agency Ingestion pre-session review completed without transmitting an external request.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.connectors.credentialed-ingestion",
      metadata: {
        route: "/api/connectors/credentialed-ingestion",
        readyForSession: ingestion.readyForSession,
        sessionOutcome: ingestion.sessionOutcome,
        externalRequestTransmitted:
          ingestion.ingestionEvent.externalRequestTransmitted,
        dataProcessedByEngine:
          ingestion.ingestionEvent.dataProcessedByEngine,
        circuitBreakerTriggered:
          ingestion.ingestionEvent.circuitBreakerTriggered,
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      replayRef: traceId,
      route: "/api/connectors/credentialed-ingestion",
      operation: "credentialed-agency-ingestion.pre-session",
      module: "api.connectors.credentialed-ingestion",
      versionRuntime,
      classifications: [
        {
          resourceType: "credentialed_agency_ingestion_request",
          resourceId: `${ingestion.ingestionEvent.id}:request`,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "credentialed_scraping_event",
          resourceId: ingestion.ingestionEvent.id,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            sessionOutcome: ingestion.sessionOutcome,
            readyForSession: ingestion.readyForSession,
          },
        },
      ],
      observability,
      targetType: "credentialed_scraping_event",
      targetId: ingestion.ingestionEvent.id,
      sourceVersion: "credentialed-agency-ingestion-route-v0.1.0",
      verificationStatus: ingestion.readyForSession ? "PASS" : "WARN",
      replaySafe: true,
      result: {
        readyForSession: ingestion.readyForSession,
        sessionOutcome: ingestion.sessionOutcome,
        externalRequestTransmitted:
          ingestion.ingestionEvent.externalRequestTransmitted,
        dataProcessedByEngine:
          ingestion.ingestionEvent.dataProcessedByEngine,
      },
      metadata: {
        applicationId: body.applicationId ?? null,
        externalTargetDomain: body.externalTargetDomain ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      credential: classifiedOutput.credential,
      ingestionEvent: classifiedOutput.ingestionEvent,
      result: {
        readyForSession: ingestion.readyForSession,
        sessionOutcome: ingestion.sessionOutcome,
        gates: ingestion.gates,
        blockerReasons: ingestion.blockerReasons,
        externalRequestTransmitted:
          ingestion.ingestionEvent.externalRequestTransmitted,
        dataProcessedByEngine:
          ingestion.ingestionEvent.dataProcessedByEngine,
        circuitBreakerTriggered:
          ingestion.ingestionEvent.circuitBreakerTriggered,
      },
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Credentialed Agency Ingestion error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

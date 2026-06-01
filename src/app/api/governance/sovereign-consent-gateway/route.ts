import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistRouteGovernanceEvidence } from "@/lib/governance/routeEvidence";
import { persistSovereignConsentGateway } from "@/lib/governance/sovereignConsentGatewayStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Sovereign Consent Gateway API
 *
 * Master Volume Governance:
 * - Vol II §3.21: tribal sovereign land data remains Level 5 by default.
 * - Vol V CANON-CONSENT-001 v7.0: Level 5 Executive Waivers are
 *   tribal-authority initiated, scope-limited, time-bound, and immutable.
 * - Vol V CANON-SOVEREIGNTY-001: an active Gateway creates only a bounded
 *   Level 4 operational exception and never changes sovereign classification.
 */

type SovereignConsentGatewayRequest = {
  userId?: string | null;
  actorId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  gatewayId?: string | null;
  initiatingAuthorityId?: string | null;
  initiatingAuthorityType?: string | null;
  initiatingAuthorityRole?: string | null;
  verifiedIdentityEventRef?: string | null;
  affirmativeInitiationRef?: string | null;
  tribalNation?: string | null;
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

function createSovereignConsentTraceId(): string {
  return `sovereign-consent-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: SovereignConsentGatewayRequest): string | null {
  return body.actorId ?? body.userId ?? body.initiatingAuthorityId ?? null;
}

function routeActorRole(body: SovereignConsentGatewayRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function gatewayRecordResponse(
  gatewayRecord: Awaited<
    ReturnType<typeof persistSovereignConsentGateway>
  >["gatewayRecord"]
) {
  return {
    id: gatewayRecord.id,
    gatewayRecordId: gatewayRecord.gatewayRecordId,
    gatewayId: gatewayRecord.gatewayId,
    initiatingAuthorityId: gatewayRecord.initiatingAuthorityId,
    initiatingAuthorityType: gatewayRecord.initiatingAuthorityType,
    initiatingAuthorityRole: gatewayRecord.initiatingAuthorityRole,
    verifiedIdentityEventRef: gatewayRecord.verifiedIdentityEventRef,
    affirmativeInitiationRef: gatewayRecord.affirmativeInitiationRef,
    tribalNation: gatewayRecord.tribalNation,
    applicationIdScope: gatewayRecord.applicationIdScope,
    borrowerId: gatewayRecord.borrowerId,
    tenantId: gatewayRecord.tenantId,
    authorizedDataElements: gatewayRecord.authorizedDataElements,
    authorizedWorkflowPhases: gatewayRecord.authorizedWorkflowPhases,
    underwritingWindowClosesAt:
      gatewayRecord.underwritingWindowClosesAt,
    initiationTimestamp: gatewayRecord.initiationTimestamp,
    expirationTimestamp: gatewayRecord.expirationTimestamp,
    revocationEventRef: gatewayRecord.revocationEventRef,
    gatewayStatus: gatewayRecord.gatewayStatus,
    expirationReason: gatewayRecord.expirationReason,
    gatewayActive: gatewayRecord.gatewayActive,
    level5BaselineConfirmed:
      gatewayRecord.level5BaselineConfirmed,
    level4OperationalExceptionAuthorized:
      gatewayRecord.level4OperationalExceptionAuthorized,
    sovereigntyClassification:
      gatewayRecord.sovereigntyClassification,
    operationalClassification:
      gatewayRecord.operationalClassification,
    nonProprietaryOnlyConfirmed:
      gatewayRecord.nonProprietaryOnlyConfirmed,
    publiclyAccessibleRegistryOnly:
      gatewayRecord.publiclyAccessibleRegistryOnly,
    applicationScopeConfirmed:
      gatewayRecord.applicationScopeConfirmed,
    workflowScopeConfirmed: gatewayRecord.workflowScopeConfirmed,
    noBulkDataAcquisition: gatewayRecord.noBulkDataAcquisition,
    noCrossTransactionSharing:
      gatewayRecord.noCrossTransactionSharing,
    noCompetitiveIntelligence:
      gatewayRecord.noCompetitiveIntelligence,
    noAiTrainingAccess: gatewayRecord.noAiTrainingAccess,
    noProprietarySovereignRecords:
      gatewayRecord.noProprietarySovereignRecords,
    platformInitiated: gatewayRecord.platformInitiated,
    externalLegalFrameworkReviewed:
      gatewayRecord.externalLegalFrameworkReviewed,
    complianceOfficerId: gatewayRecord.complianceOfficerId,
    complianceReviewRef: gatewayRecord.complianceReviewRef,
    complianceOfficerVerified:
      gatewayRecord.complianceOfficerVerified,
    dataAccessPerformed: gatewayRecord.dataAccessPerformed,
    scoringUseAllowed: gatewayRecord.scoringUseAllowed,
    underwritingUseAllowed: gatewayRecord.underwritingUseAllowed,
    classification: gatewayRecord.classification,
    replayRef: gatewayRecord.replayRef,
    traceId: gatewayRecord.traceId,
    createdAt: gatewayRecord.createdAt,
    updatedAt: gatewayRecord.updatedAt,
  };
}

async function persistDeniedEvidence(input: {
  traceId: string;
  actor: string | null;
  body: SovereignConsentGatewayRequest;
  runtimeGuard: ReturnType<typeof runRuntimeGuard>;
  access?: ReturnType<typeof evaluateAccess> | null;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  const observability = createObservabilityEvent({
    eventType: "SOVEREIGN_CONSENT_GATEWAY_ACCESS_DENIED",
    domain: "operations",
    severity: "WARN",
    message: input.reason,
    traceId: input.traceId,
    replayRef: input.traceId,
    actorId: input.actor,
    module: "api.governance.sovereign-consent-gateway",
    metadata: {
      route: "/api/governance/sovereign-consent-gateway",
      applicationId: input.body.applicationId ?? null,
      gatewayId: input.body.gatewayId ?? null,
      runtimeAllowed: input.runtimeGuard.allowed,
      accessAllowed: input.access?.allowed ?? null,
      ...(input.metadata ?? {}),
    },
  });
  const evidence = await persistRouteGovernanceEvidence({
    traceId: input.traceId,
    replayRef: input.traceId,
    route: "/api/governance/sovereign-consent-gateway",
    operation: "sovereign-consent-gateway.denied",
    module: "api.governance.sovereign-consent-gateway",
    observability,
    sourceVersion: "sovereign-consent-gateway-route-v0.1.0",
    verificationStatus: "WARN",
    replaySafe: true,
    result: {
      denied: true,
      reason: input.reason,
    },
    metadata: {
      applicationId: input.body.applicationId ?? null,
      gatewayId: input.body.gatewayId ?? null,
    },
  });

  return { observability, evidence };
}

export async function POST(req: NextRequest) {
  const traceId = createSovereignConsentTraceId();

  try {
    const body = (await req.json()) as SovereignConsentGatewayRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "sovereign-consent-gateway.review",
      module: "api.governance.sovereign-consent-gateway",
      traceId,
      schemaVersion: "sovereign-consent-gateway-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "SOVEREIGN_CONTROLLED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/governance/sovereign-consent-gateway",
        applicationId: body.applicationId ?? null,
        gatewayId: body.gatewayId ?? null,
        dataAccessExpected: false,
        scoringUseExpected: false,
      },
    });

    const access = evaluateAccess({
      role: routeActorRole(body),
      allowedRoles: ["borrower", "user", "operator", "admin", "governance"],
      operation: "sovereign-consent-gateway.review",
      module: "api.governance.sovereign-consent-gateway",
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
          "Sovereign Consent Gateway was denied by runtime or role access controls.",
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for Sovereign Consent Gateway review.",
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
      operation: "sovereign-consent-gateway.review",
      module: "api.governance.sovereign-consent-gateway",
      traceId,
      resourceType: "application",
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
          "Sovereign Consent Gateway was denied by application record access controls.",
        metadata: {
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this Sovereign Consent Gateway application scope.",
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
      operation: "sovereign-consent-gateway.review",
      module: "api.governance.sovereign-consent-gateway",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "sovereign-consent-gateway-v0.1.0",
          "src/db/schema/sovereignConsentGatewayRecords.ts",
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
          "sovereign-consent-gateway-runtime-v0.1.0",
          "src/lib/governance/sovereignConsentGatewayStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "sovereign-consent-gateway-route-v0.1.0",
          "api.governance.sovereign-consent-gateway",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "SOVEREIGN_CONTROLLED",
      sensitivityScope: "governance",
      classificationSource: "sovereign-consent-gateway-route-input",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "governance",
        "authorized-operator",
        "compliance-officer",
        "authorized-sovereign-representative",
      ],
      sharingPermissions: ["regulated-operational-review"],
      aiUsagePermissions: ["classify", "explain"],
      exportRestrictions: [
        "requires-governed-export-context",
        "level-5-sovereign-controlled",
      ],
      redactionRequirements: [
        "redact-sovereign-authority-and-gateway-details",
      ],
      consentRequirements: ["sovereign-consent-gateway-initiation"],
    });

    const gateway = await persistSovereignConsentGateway({
      traceId,
      actorId: actor,
      gatewayId: body.gatewayId,
      initiatingAuthorityId: body.initiatingAuthorityId,
      initiatingAuthorityType: body.initiatingAuthorityType,
      initiatingAuthorityRole: body.initiatingAuthorityRole,
      verifiedIdentityEventRef: body.verifiedIdentityEventRef,
      affirmativeInitiationRef: body.affirmativeInitiationRef,
      tribalNation: body.tribalNation,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      authorizedDataElements: body.authorizedDataElements,
      authorizedWorkflowPhases: body.authorizedWorkflowPhases,
      underwritingWindowClosesAt: body.underwritingWindowClosesAt,
      revocationEventRef: body.revocationEventRef,
      nonProprietaryOnlyConfirmed:
        body.nonProprietaryOnlyConfirmed,
      publiclyAccessibleRegistryOnly:
        body.publiclyAccessibleRegistryOnly,
      applicationScopeConfirmed: body.applicationScopeConfirmed,
      workflowScopeConfirmed: body.workflowScopeConfirmed,
      bulkDataAcquisitionRequested:
        body.bulkDataAcquisitionRequested,
      crossTransactionSharingRequested:
        body.crossTransactionSharingRequested,
      competitiveIntelligenceRequested:
        body.competitiveIntelligenceRequested,
      aiTrainingRequested: body.aiTrainingRequested,
      proprietarySovereignRecordsRequested:
        body.proprietarySovereignRecordsRequested,
      platformInitiated: body.platformInitiated,
      externalLegalFrameworkReviewed:
        body.externalLegalFrameworkReviewed,
      complianceOfficerId: body.complianceOfficerId,
      complianceReviewRef: body.complianceReviewRef,
      complianceOfficerVerified: body.complianceOfficerVerified,
      dataAccessEvents: body.dataAccessEvents,
      metadata: {
        ...(body.metadata ?? {}),
        route: "/api/governance/sovereign-consent-gateway",
      },
    });

    const gatewayRecord = gatewayRecordResponse(gateway.gatewayRecord);
    const classifiedOutput = classifyRecord(
      {
        gatewayRecord,
      },
      {
        classificationLevel: "SOVEREIGN_CONTROLLED",
        sensitivityScope: "governance",
        classificationSource:
          "sovereign-consent-gateway-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "governance",
          "authorized-operator",
          "compliance-officer",
          "authorized-sovereign-representative",
        ],
        sharingPermissions: ["regulated-operational-review"],
        aiUsagePermissions: ["classify", "explain"],
        exportRestrictions: [
          "requires-governed-export-context",
          "level-5-sovereign-controlled",
        ],
        redactionRequirements: [
          "redact-sovereign-authority-and-gateway-details",
        ],
        consentRequirements: ["sovereign-consent-gateway-initiation"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: gateway.gatewayRecord.id,
      outputType: "sovereign_consent_gateway_record",
      audience: "governance",
      claimType: "fact",
      summary: gateway.gatewayActive
        ? "Sovereign Consent Gateway controls are complete for a bounded Level 4 operational exception. Sovereign classification remains Level 5."
        : "Sovereign Consent Gateway remains blocked until identity, authority, scope, duration, compliance, and prohibited-use controls pass.",
      ruleVersion: "sovereign-consent-gateway-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 0.9,
      humanReviewRequired: true,
      replayRefs: [traceId],
      evidenceRefs: [
        {
          refId: gateway.gatewayRecord.gatewayRecordId,
          sourceType: "document",
          sourceName: "sovereign_consent_gateway_records",
          sourceVersion: "CANON-CONSENT-001-v7.0",
          replayRef: traceId,
        },
      ],
      metadata: {
        gatewayActive: gateway.gatewayActive,
        gatewayStatus: gateway.gatewayStatus,
        blockerReasons: gateway.blockerReasons,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "SOVEREIGN_CONSENT_GATEWAY_REVIEWED",
      domain: "operations",
      severity: gateway.gatewayActive ? "INFO" : "WARN",
      message:
        "Sovereign Consent Gateway review completed without performing data access or scoring use.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.governance.sovereign-consent-gateway",
      metadata: {
        route: "/api/governance/sovereign-consent-gateway",
        gatewayActive: gateway.gatewayActive,
        gatewayStatus: gateway.gatewayStatus,
        dataAccessPerformed:
          gateway.gatewayRecord.dataAccessPerformed,
        scoringUseAllowed: gateway.gatewayRecord.scoringUseAllowed,
        underwritingUseAllowed:
          gateway.gatewayRecord.underwritingUseAllowed,
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      replayRef: traceId,
      route: "/api/governance/sovereign-consent-gateway",
      operation: "sovereign-consent-gateway.review",
      module: "api.governance.sovereign-consent-gateway",
      versionRuntime,
      classifications: [
        {
          resourceType: "sovereign_consent_gateway_request",
          resourceId: `${gateway.gatewayRecord.id}:request`,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "sovereign_consent_gateway_record",
          resourceId: gateway.gatewayRecord.id,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            gatewayStatus: gateway.gatewayStatus,
            gatewayActive: gateway.gatewayActive,
          },
        },
      ],
      observability,
      targetType: "sovereign_consent_gateway_record",
      targetId: gateway.gatewayRecord.id,
      sourceVersion: "sovereign-consent-gateway-route-v0.1.0",
      verificationStatus: gateway.gatewayActive ? "PASS" : "WARN",
      replaySafe: true,
      result: {
        gatewayActive: gateway.gatewayActive,
        gatewayStatus: gateway.gatewayStatus,
        dataAccessPerformed:
          gateway.gatewayRecord.dataAccessPerformed,
        scoringUseAllowed: gateway.gatewayRecord.scoringUseAllowed,
        underwritingUseAllowed:
          gateway.gatewayRecord.underwritingUseAllowed,
      },
      metadata: {
        applicationId: body.applicationId ?? null,
        gatewayId: gateway.gatewayRecord.gatewayId,
      },
    });

    return NextResponse.json({
      ok: true,
      gatewayRecord: classifiedOutput.gatewayRecord,
      result: {
        gatewayActive: gateway.gatewayActive,
        gatewayStatus: gateway.gatewayStatus,
        gates: gateway.gates,
        blockerReasons: gateway.blockerReasons,
        level5BaselineConfirmed:
          gateway.gatewayRecord.level5BaselineConfirmed,
        level4OperationalExceptionAuthorized:
          gateway.gatewayRecord.level4OperationalExceptionAuthorized,
        sovereigntyClassification:
          gateway.gatewayRecord.sovereigntyClassification,
        operationalClassification:
          gateway.gatewayRecord.operationalClassification,
        dataAccessPerformed:
          gateway.gatewayRecord.dataAccessPerformed,
        scoringUseAllowed: gateway.gatewayRecord.scoringUseAllowed,
        underwritingUseAllowed:
          gateway.gatewayRecord.underwritingUseAllowed,
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
            : "Unknown Sovereign Consent Gateway error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

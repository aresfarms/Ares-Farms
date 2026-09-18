import { NextRequest, NextResponse } from "next/server";

import { effectiveRole } from "@/lib/auth/sessionAuthority";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  SovereignConsentGatewayAdminRecord,
  getSovereignConsentGatewayAdminScopeRecord,
  listSovereignConsentGatewayAdminRecords,
} from "@/lib/governance/sovereignConsentGatewayAdminStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Sovereign Consent Gateway Admin Read API
 *
 * Master Volume Governance:
 * - Vol II §3.21: supports regulated review of tribal sovereign land
 *   workflow controls.
 * - Vol V CANON-CONSENT-001 v7.0: ConsentGatewayRecords are immutable
 *   Level 5 audit artifacts.
 * - Vol V CANON-SOVEREIGNTY-001: reads preserve Level 5 sovereign defaults
 *   and bounded Level 4 operational exception posture.
 */

type SovereignConsentGatewayAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  recordId?: string | null;
  gatewayRecordId?: string | null;
  gatewayId?: string | null;
  tribalNation?: string | null;
  gatewayStatus?: string | null;
  gatewayActive?: boolean | null;
  limit: number;
  includeApplication: boolean;
  includeProperty: boolean;
};

function createSovereignConsentGatewayAdminTraceId(): string {
  return `sovereign-consent-admin-read-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeText(value: string | null): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) {
    return fallback;
  }

  return value.toLowerCase() !== "false";
}

function normalizeOptionalBoolean(value: string | null): boolean | null {
  if (value === null) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

function normalizeLimit(value: string | null): number {
  const parsed = Number(value ?? 25);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 25;
  }

  return Math.min(parsed, 100);
}

function parseQuery(req: NextRequest): SovereignConsentGatewayAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: effectiveRole(req),
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    recordId: normalizeText(params.get("recordId")),
    gatewayRecordId: normalizeText(params.get("gatewayRecordId")),
    gatewayId: normalizeText(params.get("gatewayId")),
    tribalNation: normalizeText(params.get("tribalNation")),
    gatewayStatus: normalizeText(params.get("gatewayStatus")),
    gatewayActive: normalizeOptionalBoolean(params.get("gatewayActive")),
    limit: normalizeLimit(params.get("limit")),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: SovereignConsentGatewayAdminQuery): boolean {
  return !(
    privilegedRole(query.role) ||
    query.tenantId ||
    query.applicationId ||
    query.recordId ||
    query.gatewayRecordId ||
    query.gatewayId
  );
}

function gatewayRecordResponse(record: SovereignConsentGatewayAdminRecord) {
  return {
    id: record.gatewayRecord.id,
    gatewayRecordId: record.gatewayRecord.gatewayRecordId,
    gatewayId: record.gatewayRecord.gatewayId,
    initiatingAuthorityId: record.gatewayRecord.initiatingAuthorityId,
    initiatingAuthorityType:
      record.gatewayRecord.initiatingAuthorityType,
    initiatingAuthorityRole:
      record.gatewayRecord.initiatingAuthorityRole,
    verifiedIdentityEventRef:
      record.gatewayRecord.verifiedIdentityEventRef,
    affirmativeInitiationRef:
      record.gatewayRecord.affirmativeInitiationRef,
    tribalNation: record.gatewayRecord.tribalNation,
    applicationIdScope: record.gatewayRecord.applicationIdScope,
    borrowerId: record.gatewayRecord.borrowerId,
    tenantId: record.gatewayRecord.tenantId,
    authorizedDataElements:
      record.gatewayRecord.authorizedDataElements,
    authorizedWorkflowPhases:
      record.gatewayRecord.authorizedWorkflowPhases,
    underwritingWindowClosesAt:
      record.gatewayRecord.underwritingWindowClosesAt,
    initiationTimestamp: record.gatewayRecord.initiationTimestamp,
    expirationTimestamp: record.gatewayRecord.expirationTimestamp,
    revocationEventRef: record.gatewayRecord.revocationEventRef,
    gatewayStatus: record.gatewayRecord.gatewayStatus,
    expirationReason: record.gatewayRecord.expirationReason,
    gatewayActive: record.gatewayRecord.gatewayActive,
    level5BaselineConfirmed:
      record.gatewayRecord.level5BaselineConfirmed,
    level4OperationalExceptionAuthorized:
      record.gatewayRecord.level4OperationalExceptionAuthorized,
    sovereigntyClassification:
      record.gatewayRecord.sovereigntyClassification,
    operationalClassification:
      record.gatewayRecord.operationalClassification,
    nonProprietaryOnlyConfirmed:
      record.gatewayRecord.nonProprietaryOnlyConfirmed,
    publiclyAccessibleRegistryOnly:
      record.gatewayRecord.publiclyAccessibleRegistryOnly,
    applicationScopeConfirmed:
      record.gatewayRecord.applicationScopeConfirmed,
    workflowScopeConfirmed: record.gatewayRecord.workflowScopeConfirmed,
    noBulkDataAcquisition:
      record.gatewayRecord.noBulkDataAcquisition,
    noCrossTransactionSharing:
      record.gatewayRecord.noCrossTransactionSharing,
    noCompetitiveIntelligence:
      record.gatewayRecord.noCompetitiveIntelligence,
    noAiTrainingAccess: record.gatewayRecord.noAiTrainingAccess,
    noProprietarySovereignRecords:
      record.gatewayRecord.noProprietarySovereignRecords,
    platformInitiated: record.gatewayRecord.platformInitiated,
    externalLegalFrameworkReviewed:
      record.gatewayRecord.externalLegalFrameworkReviewed,
    complianceOfficerId: record.gatewayRecord.complianceOfficerId,
    complianceReviewRef: record.gatewayRecord.complianceReviewRef,
    complianceOfficerVerified:
      record.gatewayRecord.complianceOfficerVerified,
    dataAccessEvents: record.gatewayRecord.dataAccessEvents,
    dataAccessPerformed: record.gatewayRecord.dataAccessPerformed,
    scoringUseAllowed: record.gatewayRecord.scoringUseAllowed,
    underwritingUseAllowed: record.gatewayRecord.underwritingUseAllowed,
    gateSnapshot: record.gatewayRecord.gateSnapshot,
    blockerReasons: record.gatewayRecord.blockerReasons,
    classification: record.gatewayRecord.classification,
    replayRef: record.gatewayRecord.replayRef,
    traceId: record.gatewayRecord.traceId,
    createdAt: record.gatewayRecord.createdAt,
    updatedAt: record.gatewayRecord.updatedAt,
  };
}

function applicationResponse(record: SovereignConsentGatewayAdminRecord) {
  if (!record.application) {
    return null;
  }

  return {
    id: record.application.id,
    borrowerId: record.application.borrowerId,
    tenantId: record.application.tenantId,
    propertyId: record.application.propertyId,
    status: record.application.status,
    reviewStatus: record.application.reviewStatus,
    decisionStatus: record.application.decisionStatus,
    classification: record.application.classification,
    replayRef: record.application.replayRef,
  };
}

function propertyResponse(record: SovereignConsentGatewayAdminRecord) {
  if (!record.property) {
    return null;
  }

  return {
    id: record.property.id,
    tenantId: record.property.tenantId,
    name: record.property.name,
    city: record.property.city,
    state: record.property.state,
    county: record.property.county,
    country: record.property.country,
    classification: record.property.classification,
    replayRef: record.property.replayRef,
  };
}

async function evaluateRecordAccessForRecords(input: {
  records: SovereignConsentGatewayAdminRecord[];
  access: Parameters<typeof evaluateApplicationRecordAccess>[0]["access"];
  query: SovereignConsentGatewayAdminQuery;
  traceId: string;
}): Promise<RecordAccessDecision[]> {
  const decisions: RecordAccessDecision[] = [];

  for (const record of input.records) {
    decisions.push(
      await evaluateApplicationRecordAccess({
        access: input.access,
        operation: "sovereign-consent-gateway.admin-read",
        module: "api.governance.sovereign-consent-gateway.admin",
        traceId: input.traceId,
        resourceType: "application",
        applicationId: record.gatewayRecord.applicationIdScope,
        borrowerId: input.query.borrowerId,
        tenantId: input.query.tenantId,
        userId: input.query.userId,
      })
    );
  }

  return decisions;
}

export async function GET(req: NextRequest) {
  const traceId = createSovereignConsentGatewayAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "sovereign-consent-gateway.admin-read",
      module: "api.governance.sovereign-consent-gateway.admin",
      traceId,
      schemaVersion: "sovereign-consent-gateway-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "SOVEREIGN_CONTROLLED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/governance/sovereign-consent-gateway/admin",
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        recordId: query.recordId,
        gatewayId: query.gatewayId,
        dataAccessExpected: false,
        scoringUseExpected: false,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "auditor", "admin", "governance"],
      operation: "sovereign-consent-gateway.admin-read",
      module: "api.governance.sovereign-consent-gateway.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });

    if (
      !runtimeGuard.allowed ||
      !access.allowed ||
      scopeRequired({ ...query, role: access.role })
    ) {
      const observability = createObservabilityEvent({
        eventType: "SOVEREIGN_CONSENT_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Sovereign Consent Gateway admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.governance.sovereign-consent-gateway.admin",
        metadata: {
          route: "/api/governance/sovereign-consent-gateway/admin",
          runtimeGuard,
          access,
          scopeRequired: scopeRequired({ ...query, role: access.role }),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/sovereign-consent-gateway/admin",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for Sovereign Consent Gateway admin reads or is missing governed scope.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "sovereign-consent-gateway.admin-read",
      module: "api.governance.sovereign-consent-gateway.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "sovereign-consent-gateway-admin-read-api-v0.1.0",
          "src/app/api/governance/sovereign-consent-gateway/admin/route.ts",
          traceId
        ),
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
          "sovereign-consent-gateway-admin-read-runtime-v0.1.0",
          "src/lib/governance/sovereignConsentGatewayAdminStore.ts",
          traceId
        ),
      ],
    });

    const scopeRecord = await getSovereignConsentGatewayAdminScopeRecord({
      recordId: query.recordId,
      gatewayRecordId: query.gatewayRecordId,
      gatewayId: query.gatewayId,
      applicationId: query.applicationId,
    });
    const requestedRecordAccess = scopeRecord?.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "sovereign-consent-gateway.admin-read",
          module: "api.governance.sovereign-consent-gateway.admin",
          traceId,
          resourceType: "application",
          applicationId: scopeRecord.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: query.userId,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "SOVEREIGN_CONSENT_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Sovereign Consent Gateway admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.governance.sovereign-consent-gateway.admin",
        metadata: {
          route: "/api/governance/sovereign-consent-gateway/admin",
          access,
          requestedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/sovereign-consent-gateway/admin",
          recordAccessDenied: true,
          access,
          requestedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this Sovereign Consent Gateway record.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess: requestedRecordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const records = await listSovereignConsentGatewayAdminRecords({
      recordId: query.recordId,
      gatewayRecordId: query.gatewayRecordId,
      gatewayId: query.gatewayId,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      tribalNation: query.tribalNation,
      gatewayStatus: query.gatewayStatus,
      gatewayActive: query.gatewayActive,
      limit: query.limit,
      includeApplication: query.includeApplication,
      includeProperty: query.includeProperty,
    });
    const recordAccess = await evaluateRecordAccessForRecords({
      records,
      access,
      query,
      traceId,
    });
    const deniedRecordAccess = recordAccess.filter(
      (decision) => !decision.allowed
    );

    if (deniedRecordAccess.length > 0) {
      const observability = createObservabilityEvent({
        eventType: "SOVEREIGN_CONSENT_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Sovereign Consent Gateway admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.governance.sovereign-consent-gateway.admin",
        metadata: {
          route: "/api/governance/sovereign-consent-gateway/admin",
          deniedCount: deniedRecordAccess.length,
          access,
          deniedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/sovereign-consent-gateway/admin",
          recordAccessDenied: true,
          access,
          deniedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for one or more Sovereign Consent Gateway records.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const gatewayRecords = records.map((record) => ({
      gatewayRecord: gatewayRecordResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: gatewayRecords.length,
        query,
        gatewayRecords,
      },
      {
        classificationLevel: "SOVEREIGN_CONTROLLED",
        sensitivityScope: "governance",
        classificationSource:
          "api-sovereign-consent-gateway-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "compliance-officer",
          "governance",
        ],
        sharingPermissions: [
          "controlled-sovereign-consent-gateway-read",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "level-5-sovereign-controlled",
          "requires-governed-dashboard-access",
          "requires-redaction-before-public-disclosure",
        ],
        redactionRequirements: [
          "redact-sovereign-authority-gateway-and-borrower-details-before-public-disclosure",
        ],
        consentRequirements: ["authorized-sovereign-gateway-review"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "SOVEREIGN_CONSENT_GATEWAY_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Sovereign Consent Gateway records were read through governed record-scoped controls without data access or scoring use.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.governance.sovereign-consent-gateway.admin",
      metadata: {
        route: "/api/governance/sovereign-consent-gateway/admin",
        rowCount: gatewayRecords.length,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        recordId: query.recordId,
        gatewayId: query.gatewayId,
        dataAccessPerformed: false,
        scoringUseAllowed: false,
        underwritingUseAllowed: false,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "sovereign_consent_gateway_admin_read",
          resourceId:
            query.recordId ??
            query.gatewayRecordId ??
            query.gatewayId ??
            query.applicationId ??
            query.tenantId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/sovereign-consent-gateway/admin",
            rowCount: gatewayRecords.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "sovereign_consent_gateway_admin_read",
        targetId:
          query.recordId ??
          query.gatewayRecordId ??
          query.gatewayId ??
          query.applicationId ??
          query.tenantId ??
          traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "sovereign-consent-gateway-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: gatewayRecords.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: gatewayRecords.length,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
          dataAccessPerformed: false,
          scoringUseAllowed: false,
          underwritingUseAllowed: false,
        },
        metadata: {
          route: "/api/governance/sovereign-consent-gateway/admin",
          operation: "sovereign-consent-gateway.admin-read",
        },
      },
      metadata: {
        route: "/api/governance/sovereign-consent-gateway/admin",
        operation: "sovereign-consent-gateway.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: gatewayRecords.length,
      gatewayRecords,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess,
        versionRuntime,
        classification: classifiedOutput.classification,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "SOVEREIGN_CONSENT_GATEWAY_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Sovereign Consent Gateway admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.sovereign-consent-gateway.admin",
      metadata: {
        route: "/api/governance/sovereign-consent-gateway/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Sovereign Consent Gateway admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/sovereign-consent-gateway/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Sovereign Consent Gateway admin read error.",
        governance: {
          traceId,
          observability,
          evidence,
        },
      },
      { status: 500 }
    );
  }
}

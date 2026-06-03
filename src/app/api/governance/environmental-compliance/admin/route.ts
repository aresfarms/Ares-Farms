import { NextRequest, NextResponse } from "next/server";

import { AccessDecision, evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  EnvironmentalComplianceAdminRecord,
  getEnvironmentalComplianceAdminScopeRecord,
  listEnvironmentalComplianceAdminRecords,
} from "@/lib/governance/environmentalComplianceAdminStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Environmental Compliance Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: preserves Environmental Engineering Spoke accountability and
 *   Banker Spoke isolation.
 * - Vol II: supports regulated NEPA / USDA environmental pathway review while
 *   preventing official environmental-report or lending-reliance claims.
 * - Vol III: reads canonical environmental_compliance_records through a
 *   replay-safe, versioned, record-scoped backend surface.
 * - Vol IV: supports operator escalation, exception remediation, recovery,
 *   evidence preservation, and human review.
 * - Vol V: enforces borrower fee autonomy, provider-license verification,
 *   source authority, classification, observability, and controlled disclosure.
 * - Vol VI: exposes environmental review posture to portable vertical modules
 *   without live provider engagement or external action.
 */

type EnvironmentalComplianceAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  recordId?: string | null;
  complianceRecordId?: string | null;
  journeyId?: string | null;
  pathwayType?: string | null;
  assessmentRequirementStatus?: string | null;
  assessmentOutcome?: string | null;
  environmentalAssessmentTriggered?: boolean | null;
  loanPathwayAdvancementAllowed?: boolean | null;
  limit: number;
  includeApplication: boolean;
  includeProperty: boolean;
  includeFeeControl: boolean;
};

type EnvironmentalComplianceRecordAccessDecision = RecordAccessDecision | {
  allowed: boolean;
  role: string;
  operation: string;
  module: string;
  traceId: string;
  resourceType: "environmental_compliance_record";
  reason: string;
  actorId?: string | null;
  requestedScope: {
    applicationId?: string | null;
    borrowerId?: string | null;
    tenantId?: string | null;
    userId?: string | null;
  };
  targetScope: {
    applicationId?: string | null;
    borrowerId?: string | null;
    tenantId?: string | null;
  };
  roleAccessAllowed: boolean;
  matchedScopes: string[];
  deniedScopes: string[];
};

function createEnvironmentalComplianceAdminTraceId(): string {
  return `environmental-compliance-admin-read-${Date.now()}-${Math.random()
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

function parseQuery(req: NextRequest): EnvironmentalComplianceAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: params.get("role") ?? "user",
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    recordId: normalizeText(params.get("recordId")),
    complianceRecordId: normalizeText(params.get("complianceRecordId")),
    journeyId: normalizeText(params.get("journeyId")),
    pathwayType: normalizeText(params.get("pathwayType")),
    assessmentRequirementStatus: normalizeText(
      params.get("assessmentRequirementStatus")
    ),
    assessmentOutcome: normalizeText(params.get("assessmentOutcome")),
    environmentalAssessmentTriggered: normalizeOptionalBoolean(
      params.get("environmentalAssessmentTriggered")
    ),
    loanPathwayAdvancementAllowed: normalizeOptionalBoolean(
      params.get("loanPathwayAdvancementAllowed")
    ),
    limit: normalizeLimit(params.get("limit")),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
    includeFeeControl: normalizeBoolean(params.get("includeFeeControl"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: EnvironmentalComplianceAdminQuery): boolean {
  return !(
    privilegedRole(query.role) ||
    query.tenantId ||
    query.applicationId ||
    query.recordId ||
    query.complianceRecordId ||
    query.journeyId
  );
}

function sameWhenBothPresent(
  requested: string | null | undefined,
  target: string | null | undefined
): boolean {
  return Boolean(requested && target && requested === target);
}

function mismatchWhenBothPresent(
  requested: string | null | undefined,
  target: string | null | undefined
): boolean {
  return Boolean(requested && target && requested !== target);
}

function privilegedRecordAccess(input: {
  access: AccessDecision;
  record: EnvironmentalComplianceAdminRecord;
  traceId: string;
}): EnvironmentalComplianceRecordAccessDecision {
  return {
    allowed: true,
    role: input.access.role,
    operation: "environmental-compliance.admin-read",
    module: "api.governance.environmental-compliance.admin",
    traceId: input.traceId,
    resourceType: "environmental_compliance_record",
    reason:
      "Privileged role is authorized for governed environmental compliance review.",
    actorId: input.access.actorId ?? null,
    requestedScope: {
      applicationId: null,
      borrowerId: null,
      tenantId: null,
      userId: null,
    },
    targetScope: {
      applicationId: input.record.complianceRecord.applicationId,
      borrowerId: input.record.complianceRecord.borrowerId,
      tenantId: input.record.complianceRecord.tenantId,
    },
    roleAccessAllowed: input.access.allowed,
    matchedScopes: ["privileged-role"],
    deniedScopes: [],
  };
}

function tenantScopedRecordAccess(input: {
  access: AccessDecision;
  query: EnvironmentalComplianceAdminQuery;
  record: EnvironmentalComplianceAdminRecord;
  traceId: string;
}): EnvironmentalComplianceRecordAccessDecision {
  const requestedScope = {
    applicationId: input.query.applicationId,
    borrowerId: input.query.borrowerId,
    tenantId: input.query.tenantId,
    userId: input.query.userId,
  };
  const targetScope = {
    applicationId: input.record.complianceRecord.applicationId,
    borrowerId: input.record.complianceRecord.borrowerId,
    tenantId: input.record.complianceRecord.tenantId,
  };
  const deniedScopes: string[] = [];
  const matchedScopes: string[] = [];

  if (!input.access.allowed) {
    deniedScopes.push("role");
  }

  if (
    mismatchWhenBothPresent(
      requestedScope.applicationId,
      targetScope.applicationId
    )
  ) {
    deniedScopes.push("applicationId");
  }

  if (
    mismatchWhenBothPresent(requestedScope.borrowerId, targetScope.borrowerId)
  ) {
    deniedScopes.push("borrowerId");
  }

  if (mismatchWhenBothPresent(requestedScope.tenantId, targetScope.tenantId)) {
    deniedScopes.push("tenantId");
  }

  if (sameWhenBothPresent(requestedScope.tenantId, targetScope.tenantId)) {
    matchedScopes.push("tenant");
  }

  if (
    sameWhenBothPresent(
      requestedScope.applicationId,
      targetScope.applicationId
    )
  ) {
    matchedScopes.push("application");
  }

  const allowed = input.access.allowed && deniedScopes.length === 0;

  return {
    allowed,
    role: input.access.role,
    operation: "environmental-compliance.admin-read",
    module: "api.governance.environmental-compliance.admin",
    traceId: input.traceId,
    resourceType: "environmental_compliance_record",
    reason: allowed
      ? "Institutional role is authorized for the environmental compliance record scope."
      : "Institutional role is outside the environmental compliance record scope.",
    actorId: input.access.actorId ?? null,
    requestedScope,
    targetScope,
    roleAccessAllowed: input.access.allowed,
    matchedScopes,
    deniedScopes,
  };
}

function complianceRecordResponse(record: EnvironmentalComplianceAdminRecord) {
  const complianceRecord = record.complianceRecord;

  return {
    id: complianceRecord.id,
    complianceRecordId: complianceRecord.complianceRecordId,
    journeyId: complianceRecord.journeyId,
    applicationId: complianceRecord.applicationId,
    borrowerId: complianceRecord.borrowerId,
    tenantId: complianceRecord.tenantId,
    actorId: complianceRecord.actorId,
    pathwayType: complianceRecord.pathwayType,
    triggeringPathway: complianceRecord.triggeringPathway,
    assessmentRequirementStatus:
      complianceRecord.assessmentRequirementStatus,
    assessmentType: complianceRecord.assessmentType,
    assessmentProviderType: complianceRecord.assessmentProviderType,
    providerName: complianceRecord.providerName,
    providerLicenseRef: complianceRecord.providerLicenseRef,
    providerLicenseVerified: complianceRecord.providerLicenseVerified,
    assessmentOutcome: complianceRecord.assessmentOutcome,
    feeAmount: complianceRecord.feeAmount,
    feeDisclosureRef: complianceRecord.feeDisclosureRef,
    borrowerProtectionFeeControlId:
      complianceRecord.borrowerProtectionFeeControlId,
    feeDisclosedBeforeInitiation:
      complianceRecord.feeDisclosedBeforeInitiation,
    borrowerExternalFirmRightPreserved:
      complianceRecord.borrowerExternalFirmRightPreserved,
    noFeeSurchargeOrPreference:
      complianceRecord.noFeeSurchargeOrPreference,
    spokeIsolationConfirmed: complianceRecord.spokeIsolationConfirmed,
    bankerSpokeIsolated: complianceRecord.bankerSpokeIsolated,
    environmentalAssessmentTriggered:
      complianceRecord.environmentalAssessmentTriggered,
    pathwayExemptionEventRef: complianceRecord.pathwayExemptionEventRef,
    escalationRef: complianceRecord.escalationRef,
    auditAnchorRef: complianceRecord.auditAnchorRef,
    loanPathwayAdvancementAllowed:
      complianceRecord.loanPathwayAdvancementAllowed,
    officialReportGenerated: complianceRecord.officialReportGenerated,
    liveExternalActionPerformed:
      complianceRecord.liveExternalActionPerformed,
    gateSnapshot: complianceRecord.gateSnapshot,
    blockerReasons: complianceRecord.blockerReasons,
    governanceVersion: complianceRecord.governanceVersion,
    classification: complianceRecord.classification,
    replayRef: complianceRecord.replayRef,
    traceId: complianceRecord.traceId,
    source: complianceRecord.source,
    metadata: complianceRecord.metadata,
    assessmentTimestamp: complianceRecord.assessmentTimestamp,
    createdAt: complianceRecord.createdAt,
    updatedAt: complianceRecord.updatedAt,
  };
}

function feeControlResponse(record: EnvironmentalComplianceAdminRecord) {
  if (!record.feeControl) {
    return null;
  }

  return {
    id: record.feeControl.id,
    feeControlId: record.feeControl.feeControlId,
    journeyId: record.feeControl.journeyId,
    applicationId: record.feeControl.applicationId,
    borrowerId: record.feeControl.borrowerId,
    tenantId: record.feeControl.tenantId,
    actorId: record.feeControl.actorId,
    feeType: record.feeControl.feeType,
    feeAmount: record.feeControl.feeAmount,
    standardMarketRateAmount:
      record.feeControl.standardMarketRateAmount,
    advisoryDiscountPercent:
      record.feeControl.advisoryDiscountPercent,
    feeDisclosureRef: record.feeControl.feeDisclosureRef,
    disclosureStatus: record.feeControl.disclosureStatus,
    disclosedBeforeAssessment:
      record.feeControl.disclosedBeforeAssessment,
    borrowerExternalFirmRightPreserved:
      record.feeControl.borrowerExternalFirmRightPreserved,
    noSurchargeOrPreferenceIncentive:
      record.feeControl.noSurchargeOrPreferenceIncentive,
    providerSelection: record.feeControl.providerSelection,
    governanceVersion: record.feeControl.governanceVersion,
    classification: record.feeControl.classification,
    replayRef: record.feeControl.replayRef,
    traceId: record.feeControl.traceId,
    source: record.feeControl.source,
    metadata: record.feeControl.metadata,
    createdAt: record.feeControl.createdAt,
    updatedAt: record.feeControl.updatedAt,
  };
}

function applicationResponse(record: EnvironmentalComplianceAdminRecord) {
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

function propertyResponse(record: EnvironmentalComplianceAdminRecord) {
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
  records: EnvironmentalComplianceAdminRecord[];
  access: AccessDecision;
  query: EnvironmentalComplianceAdminQuery;
  traceId: string;
}): Promise<EnvironmentalComplianceRecordAccessDecision[]> {
  const decisions: EnvironmentalComplianceRecordAccessDecision[] = [];

  for (const record of input.records) {
    if (privilegedRole(input.access.role)) {
      decisions.push(
        privilegedRecordAccess({
          access: input.access,
          record,
          traceId: input.traceId,
        })
      );
      continue;
    }

    if (record.complianceRecord.applicationId) {
      decisions.push(
        await evaluateApplicationRecordAccess({
          access: input.access,
          operation: "environmental-compliance.admin-read",
          module: "api.governance.environmental-compliance.admin",
          traceId: input.traceId,
          resourceType: "application",
          applicationId: record.complianceRecord.applicationId,
          borrowerId: input.query.borrowerId,
          tenantId: input.query.tenantId,
          userId: input.query.userId,
          allowMissingApplication: true,
        })
      );
      continue;
    }

    decisions.push(
      tenantScopedRecordAccess({
        access: input.access,
        query: input.query,
        record,
        traceId: input.traceId,
      })
    );
  }

  return decisions;
}

export async function GET(req: NextRequest) {
  const traceId = createEnvironmentalComplianceAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "environmental-compliance.admin-read",
      module: "api.governance.environmental-compliance.admin",
      traceId,
      schemaVersion: "environmental-compliance-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/governance/environmental-compliance/admin",
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        complianceRecordId: query.complianceRecordId,
        officialReportExpected: false,
        liveExternalActionExpected: false,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "auditor", "admin", "governance"],
      operation: "environmental-compliance.admin-read",
      module: "api.governance.environmental-compliance.admin",
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
        eventType: "ENVIRONMENTAL_COMPLIANCE_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Environmental compliance admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.governance.environmental-compliance.admin",
        metadata: {
          route: "/api/governance/environmental-compliance/admin",
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
          route: "/api/governance/environmental-compliance/admin",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for environmental compliance admin reads or is missing governed scope.",
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
      operation: "environmental-compliance.admin-read",
      module: "api.governance.environmental-compliance.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "environmental-compliance-admin-read-api-v0.1.0",
          "src/app/api/governance/environmental-compliance/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "environmental-compliance-records-v0.1.0",
          "src/db/schema/environmentalComplianceRecords.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.3.1",
          "Master Volume Series Volumes I-VI",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "environmental-compliance-admin-read-runtime-v0.1.0",
          "src/lib/governance/environmentalComplianceAdminStore.ts",
          traceId
        ),
      ],
    });

    const scopeRecord = await getEnvironmentalComplianceAdminScopeRecord({
      recordId: query.recordId,
      complianceRecordId: query.complianceRecordId,
      journeyId: query.journeyId,
      applicationId: query.applicationId,
    });
    const requestedRecordAccess = scopeRecord?.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "environmental-compliance.admin-read",
          module: "api.governance.environmental-compliance.admin",
          traceId,
          resourceType: "application",
          applicationId: scopeRecord.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: query.userId,
          allowMissingApplication: true,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "ENVIRONMENTAL_COMPLIANCE_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Environmental compliance admin read was denied by requested record scope before list filtering.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.governance.environmental-compliance.admin",
        metadata: {
          route: "/api/governance/environmental-compliance/admin",
          access,
          requestedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/environmental-compliance/admin",
          recordAccessDenied: true,
          access,
          requestedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this environmental compliance record scope.",
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

    const records = await listEnvironmentalComplianceAdminRecords({
      recordId: query.recordId,
      complianceRecordId: query.complianceRecordId,
      journeyId: query.journeyId,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      pathwayType: query.pathwayType,
      assessmentRequirementStatus: query.assessmentRequirementStatus,
      assessmentOutcome: query.assessmentOutcome,
      environmentalAssessmentTriggered: query.environmentalAssessmentTriggered,
      loanPathwayAdvancementAllowed: query.loanPathwayAdvancementAllowed,
      limit: query.limit,
      includeApplication: query.includeApplication,
      includeProperty: query.includeProperty,
      includeFeeControl: query.includeFeeControl,
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
        eventType: "ENVIRONMENTAL_COMPLIANCE_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Environmental compliance admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.governance.environmental-compliance.admin",
        metadata: {
          route: "/api/governance/environmental-compliance/admin",
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
          route: "/api/governance/environmental-compliance/admin",
          recordAccessDenied: true,
          access,
          deniedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for one or more environmental compliance records.",
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

    const environmentalComplianceRecordsResponse = records.map((record) => ({
      complianceRecord: complianceRecordResponse(record),
      feeControl: feeControlResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: environmentalComplianceRecordsResponse.length,
        query,
        scopeRecord,
        environmentalComplianceRecords:
          environmentalComplianceRecordsResponse,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-environmental-compliance-admin-read-route-output",
        classificationVersion:
          "environmental-compliance-admin-read-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "environmental-reviewer",
          "governance",
        ],
        sharingPermissions: [
          "regulated-operational-review",
          "environmental-compliance-governance",
        ],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-an-official-environmental-report",
          "requires-governed-dashboard-access",
          "requires-human-review-before-regulatory-reliance",
          "requires-redaction-before-public-disclosure",
        ],
        redactionRequirements: [
          "redact-borrower-provider-license-and-fee-details-before-public-disclosure",
        ],
        consentRequirements: ["authorized-environmental-review"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "ENVIRONMENTAL_COMPLIANCE_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Environmental compliance records were read through governed record-scoped controls without official report generation or live provider action.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.governance.environmental-compliance.admin",
      metadata: {
        route: "/api/governance/environmental-compliance/admin",
        rowCount: environmentalComplianceRecordsResponse.length,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        complianceRecordId: query.complianceRecordId,
        officialReportGenerated: false,
        liveExternalActionPerformed: false,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "environmental_compliance_admin_read",
          resourceId:
            query.recordId ??
            query.complianceRecordId ??
            query.applicationId ??
            query.tenantId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/environmental-compliance/admin",
            rowCount: environmentalComplianceRecordsResponse.length,
          },
        },
      ],
      observability,
      metadata: {
        route: "/api/governance/environmental-compliance/admin",
        recordAccessCount: recordAccess.length,
        advisoryOnly: true,
        officialEnvironmentalReportGenerated: false,
        liveExternalActionPerformed: false,
      },
    });

    return NextResponse.json({
      ok: true,
      count: environmentalComplianceRecordsResponse.length,
      environmentalComplianceRecords:
        environmentalComplianceRecordsResponse,
      classification: classifiedOutput.classification,
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess,
        versionRuntime,
        outputClassification: classifiedOutput.classification,
        observability,
        evidence,
      },
      disclosures: [
        "Environmental compliance records are advisory operational controls, not official environmental reports.",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown environmental compliance admin read error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

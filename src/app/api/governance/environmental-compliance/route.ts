import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { createEnvironmentalComplianceRecord } from "@/lib/governance/environmentalComplianceStore";
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
 * Environmental Compliance Governance API
 *
 * Master Volume Governance:
 * - Vol I: ROLE-ARCH-001 isolates Environmental Engineering Spoke authority
 *   from Banker Spoke financial packaging and credit analysis.
 * - Vol II: REG-NEPA-001 and USDA-ENV-001 require environmental routing to
 *   remain governed, auditable, and advisory until human authority completes.
 * - Vol III: TECH-CONN-001 v25.0 requires immutable
 *   environmental_compliance_records with audit anchors.
 * - Vol IV: OPS-BORROWER-JOURNEY-001 Steps 2.5-2.7 require trigger
 *   evaluation, provider selection, license verification, fee disclosure,
 *   and lineage confirmation before pathway advancement.
 * - Vol V: CANON-ECON-001 protects borrower fee autonomy while
 *   CANON-SOVEREIGNTY-001 requires state credential verification.
 * - Vol VI: Adds this backend surface to the conformance and readiness spine.
 */

type EnvironmentalComplianceRequest = {
  userId?: string | null;
  actorId?: string | null;
  role?: string | null;
  tenantId?: string | null;
  borrowerId?: string | null;
  applicationId?: string | null;
  journeyId?: string | null;
  pathwayType?: string | null;
  triggeringPathway?: string | null;
  realPropertyCollateral?: boolean | null;
  environmentalStatuteTriggered?: boolean | null;
  equipmentAssetValue?: number | null;
  assessmentType?: string | null;
  assessmentProviderType?: string | null;
  providerName?: string | null;
  providerLicenseRef?: string | null;
  providerLicenseVerified?: boolean | null;
  assessmentOutcome?: string | null;
  feeAmount?: number | null;
  standardMarketRateAmount?: number | null;
  feeDisclosureRef?: string | null;
  feeDisclosedBeforeInitiation?: boolean | null;
  borrowerExternalFirmRightPreserved?: boolean | null;
  noFeeSurchargeOrPreference?: boolean | null;
  spokeIsolationConfirmed?: boolean | null;
  bankerSpokeIsolated?: boolean | null;
  auditAnchorRef?: string | null;
  escalationRef?: string | null;
  metadata?: Record<string, unknown>;
};

function createEnvironmentalComplianceTraceId(): string {
  return `environmental-compliance-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: EnvironmentalComplianceRequest): string | null {
  return body.actorId ?? body.userId ?? null;
}

function routeActorRole(body: EnvironmentalComplianceRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function tenantScopePresent(body: EnvironmentalComplianceRequest): boolean {
  return Boolean(body.tenantId?.trim());
}

function responseRecord(
  record: Awaited<
    ReturnType<typeof createEnvironmentalComplianceRecord>
  >["complianceRecord"]
) {
  return {
    id: record.id,
    complianceRecordId: record.complianceRecordId,
    journeyId: record.journeyId,
    applicationId: record.applicationId,
    borrowerId: record.borrowerId,
    tenantId: record.tenantId,
    pathwayType: record.pathwayType,
    triggeringPathway: record.triggeringPathway,
    assessmentRequirementStatus: record.assessmentRequirementStatus,
    assessmentType: record.assessmentType,
    assessmentProviderType: record.assessmentProviderType,
    providerLicenseVerified: record.providerLicenseVerified,
    assessmentOutcome: record.assessmentOutcome,
    feeDisclosureRef: record.feeDisclosureRef,
    borrowerProtectionFeeControlId:
      record.borrowerProtectionFeeControlId,
    environmentalAssessmentTriggered:
      record.environmentalAssessmentTriggered,
    loanPathwayAdvancementAllowed:
      record.loanPathwayAdvancementAllowed,
    officialReportGenerated: record.officialReportGenerated,
    liveExternalActionPerformed: record.liveExternalActionPerformed,
    classification: record.classification,
    replayRef: record.replayRef,
    traceId: record.traceId,
    createdAt: record.createdAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createEnvironmentalComplianceTraceId();

  try {
    const body = (await req.json()) as EnvironmentalComplianceRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "environmental-compliance.record",
      module: "api.governance.environmental-compliance",
      traceId,
      schemaVersion: "environmental-compliance-records-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/governance/environmental-compliance",
        pathwayType: body.pathwayType ?? null,
        officialReportExpected: false,
        liveExternalActionExpected: false,
      },
    });

    const access = evaluateAccess({
      role: routeActorRole(body),
      allowedRoles: ["admin", "governance", "operator"],
      operation: "environmental-compliance.record",
      module: "api.governance.environmental-compliance",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!runtimeGuard.allowed || !access.allowed || !tenantScopePresent(body)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for environmental compliance governance or is missing governed tenant scope.",
          governance: {
            traceId,
            runtimeGuard,
            access,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "environmental-compliance.record",
      module: "api.governance.environmental-compliance",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "environmental-compliance-records-v0.1.0",
          "src/db/schema/environmentalComplianceRecords.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volume-runtime-v0.3.0",
          "Master Volume Series Volumes I-VI",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "environmental-compliance-runtime-v0.1.0",
          "src/lib/governance/environmentalComplianceStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "environmental-compliance-api-v0.1.0",
          "src/app/api/governance/environmental-compliance/route.ts",
          traceId
        ),
      ],
    });

    const result = await createEnvironmentalComplianceRecord({
      ...body,
      actorId: actor,
      traceId,
    });

    const inputClassification = classifyRecord(
      body as Record<string, unknown>,
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource: "environmental-compliance-route-input",
        classificationVersion: "environmental-compliance-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "governance",
          "compliance",
        ],
        sharingPermissions: [
          "regulated-operational-review",
          "environmental-compliance-governance",
        ],
        aiUsagePermissions: ["classify", "summarize", "explain"],
        exportRestrictions: [
          "not-an-official-environmental-report",
          "requires-human-review-before-regulatory-reliance",
        ],
        redactionRequirements: [
          "redact-borrower-and-provider-identifiers-for-public-views",
        ],
        consentRequirements: ["borrower-environmental-review-consent"],
      }
    );

    const output = responseRecord(result.complianceRecord);
    const outputClassification = classifyRecord(output, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "environmental-compliance-route-output",
      classificationVersion: "environmental-compliance-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-operator",
        "governance",
        "compliance",
      ],
      sharingPermissions: [
        "regulated-operational-review",
        "environmental-compliance-governance",
      ],
      aiUsagePermissions: ["summarize", "explain"],
      exportRestrictions: [
        "not-an-official-environmental-report",
        "no-loan-approval-or-permit-reliance",
      ],
      redactionRequirements: [
        "redact-borrower-and-provider-identifiers-for-public-views",
      ],
      consentRequirements: ["borrower-environmental-review-consent"],
    });

    const explanation = createExplanationLineage({
      outputIdentifier: result.complianceRecord.complianceRecordId,
      outputType: "environmental_compliance_record",
      audience: "internal",
      claimType: "inference",
      summary:
        "Environmental pathway governance recorded trigger, provider, license, fee, spoke-isolation, and audit-anchor controls without producing an official environmental report.",
      ruleVersion: "environmental-compliance-runtime-v0.1.0",
      overlayRefs: [
        "ROLE-ARCH-001",
        "TECH-CONN-001",
        "OPS-BORROWER-JOURNEY-001",
        "CANON-ECON-001",
        "CANON-SOVEREIGNTY-001",
      ],
      confidenceScore: result.loanPathwayAdvancementAllowed ? 0.82 : 0.64,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [result.complianceRecord.auditAnchorRef ?? traceId],
      metadata: {
        environmentalAssessmentTriggered:
          result.environmentalAssessmentTriggered,
        loanPathwayAdvancementAllowed:
          result.loanPathwayAdvancementAllowed,
        blockerReasons: result.blockerReasons,
      },
    });

    const observability = createObservabilityEvent({
      eventType: result.loanPathwayAdvancementAllowed
        ? "ENVIRONMENTAL_COMPLIANCE_LINEAGE_CONFIRMED"
        : "ENVIRONMENTAL_COMPLIANCE_REVIEW_REQUIRED",
      domain: "operations",
      severity: result.loanPathwayAdvancementAllowed ? "INFO" : "WARN",
      message:
        "Environmental compliance governance record was created with replay-safe fee, provider, license, spoke-isolation, and audit-anchor controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.governance.environmental-compliance",
      metadata: {
        route: "/api/governance/environmental-compliance",
        environmentalAssessmentTriggered:
          result.environmentalAssessmentTriggered,
        loanPathwayAdvancementAllowed:
          result.loanPathwayAdvancementAllowed,
        blockerReasons: result.blockerReasons,
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      replayRef: traceId,
      route: "/api/governance/environmental-compliance",
      operation: "environmental-compliance.record",
      module: "api.governance.environmental-compliance",
      versionRuntime,
      classifications: [
        {
          resourceType: "environmental_compliance_input",
          resourceId: body.applicationId ?? body.journeyId ?? traceId,
          classification: inputClassification.classification,
          traceId,
        },
        {
          resourceType: "environmental_compliance_record",
          resourceId: result.complianceRecord.complianceRecordId,
          classification: outputClassification.classification,
          traceId,
        },
      ],
      observability,
      sourceVersion: "environmental-compliance-route-v0.1.0",
      targetType: "environmental_compliance_record",
      targetId: result.complianceRecord.complianceRecordId,
      verificationStatus: result.loanPathwayAdvancementAllowed
        ? "PASS"
        : "WARN",
      replaySafe: true,
      result: {
        environmentalAssessmentTriggered:
          result.environmentalAssessmentTriggered,
        loanPathwayAdvancementAllowed:
          result.loanPathwayAdvancementAllowed,
      },
      metadata: {
        blockerReasons: result.blockerReasons,
      },
    });

    return NextResponse.json({
      ok: true,
      complianceRecord: outputClassification,
      feeControl: result.feeControl,
      result: {
        gates: result.gates,
        blockerReasons: result.blockerReasons,
        environmentalAssessmentTriggered:
          result.environmentalAssessmentTriggered,
        loanPathwayAdvancementAllowed:
          result.loanPathwayAdvancementAllowed,
        advisoryOnly: true,
        officialEnvironmentalReportGenerated: false,
        liveExternalActionPerformed: false,
      },
      governance: {
        traceId,
        runtimeGuard,
        access,
        versionRuntime,
        inputClassification: inputClassification.classification,
        outputClassification: outputClassification.classification,
        explainability: explanation,
        observability,
        evidence,
      },
      disclosures: [
        "Environmental governance records are advisory operational controls, not official environmental reports.",
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
            : "Unknown environmental compliance runtime error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

import {
  CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION,
  ConnectorCertificationV2Input,
  composeConnectorCertificationV2,
} from "@/lib/connectors/certificationV2Runtime";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type ConnectorCertificationV2Request = ConnectorCertificationV2Input;

function createConnectorCertificationV2TraceId(): string {
  return `connector-certification-v2-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createConnectorCertificationV2TraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as ConnectorCertificationV2Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.connector.certification.v2.compose",
      module: "api.governance.connector-certification-v2",
      traceId,
      schemaVersion: "connector-certification-v2-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/connector-certification-v2",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "CONNECTOR_CERTIFICATION_V2_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Connector Certification v2 runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.connector-certification-v2",
        metadata: {
          route: "/api/governance/connector-certification-v2",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/connector-certification-v2",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Connector Certification v2 request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.connector.certification.v2.compose",
      module: "api.governance.connector-certification-v2",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "connector-certification-v2-request-v0.1.0",
          "src/app/api/governance/connector-certification-v2/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION,
          "src/lib/connectors/certificationV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "registry-framework-v2-runtime-v0.1.0",
          "src/lib/registry/frameworkV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "certification-engine-v2-runtime-v0.1.0",
          "src/lib/certification/engineV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "governance-evidence-engine-v2-runtime-v0.1.0",
          "src/lib/governance/evidenceEngineV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "advanced-intelligence-v2-runtime-v0.1.0",
          "src/lib/intelligence/advancedIntelligenceV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "lender-workflow-v2-runtime-v0.1.0",
          "src/lib/lender/workflowV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "opportunity-discovery-v2-runtime-v0.1.0",
          "src/lib/opportunity/discoveryV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "financing-pathway-engine-v2-runtime-v0.1.0",
          "src/lib/financing/pathwayEngineV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "revenue-intelligence-v2-runtime-v0.1.0",
          "src/lib/revenue-intelligence/revenueIntelligenceV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "customer-type-runtime-v0.1.0",
          "src/lib/customer-types/customerTypeRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "capital-graph-runtime-v0.1.0",
          "src/lib/capital-graph/capitalGraphRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "connector-certification-runtime-v0.1.0",
          "src/lib/connectors/certificationRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource:
        "api-governance-connector-certification-v2-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-operator",
        "governance",
        "auditor",
        "regulator",
      ],
      sharingPermissions: [
        "regulated-operational-review",
        "governance-evidence-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-an-approval",
        "not-an-external-promotion",
        "not-an-external-certification",
        "not-a-connector-activation",
        "not-a-live-external-action",
        "not-an-eligibility-determination",
        "not-a-pathway-determination",
        "not-an-opportunity-determination",
        "not-an-intelligence-determination",
        "not-an-evidence-determination",
        "not-a-certification-determination",
        "not-a-registry-determination",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-source-certainty-claim",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-content-before-external-disclosure",
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: [
        "governance-connector-certification-v2-review-consent",
      ],
    });

    const v2Result = composeConnectorCertificationV2(body);

    const classifiedOutput = classifyRecord(
      {
        v2Result,
        event: {
          eventType: "governance.connector.certification.v2.composed",
          applicationId: v2Result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-connector-certification-v2-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "governance",
          "auditor",
          "regulator",
        ],
        sharingPermissions: [
          "regulated-operational-review",
          "governance-evidence-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-an-approval",
          "not-an-external-promotion",
          "not-an-external-certification",
          "not-a-connector-activation",
          "not-a-live-external-action",
          "not-an-eligibility-determination",
          "not-a-pathway-determination",
          "not-an-opportunity-determination",
          "not-an-intelligence-determination",
          "not-an-evidence-determination",
          "not-a-certification-determination",
          "not-a-registry-determination",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-lender-commitment",
          "not-a-credit-decision",
          "not-a-program-approval",
          "not-a-tax-credit-allocation",
          "not-an-environmental-clearance",
          "not-a-carbon-credit-issuance",
          "not-a-source-certainty-claim",
          "not-a-legal-reliance",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
          "redact-sovereign-participant-records-before-external-disclosure",
        ],
        consentRequirements: [
          "governance-connector-certification-v2-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "connector_certification_v2_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Connector Certification v2 pack composed as advisory internal-certification posture, replay-safe, audit-safe, conflict-preserving internal evidence only. Live external connector execution remains blocked. No external promotion / external certification / autonomous certification / registry / evidence / intelligence / opportunity / pathway / eligibility / connector activation determination, credit decision, lender commitment, public verification, regulatory reliance, tax-credit allocation, environmental clearance, carbon-credit issuance, source certainty claim, or legal reliance is created.",
      ruleVersion: CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + v2Result.summary.v2OverallReadinessPercent / 200)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        v2DimensionCount: v2Result.summary.v2DimensionCount,
        v2CertifiedCount: v2Result.summary.v2CertifiedCount,
        v2BlockedCount: v2Result.summary.v2BlockedCount,
        v1ConnectorCount: v2Result.summary.v1ConnectorCount,
        v1CertifiedConnectorCount: v2Result.summary.v1CertifiedConnectorCount,
        v1LiveExecutionBlockedCount:
          v2Result.summary.v1LiveExecutionBlockedCount,
        crossSourceConflictCount:
          v2Result.summary.crossSourceConflictCount,
        replaySafe: v2Result.replaySafe,
        auditSafe: v2Result.auditSafe,
        conflictPreserving: v2Result.conflictPreserving,
        federationScoped: v2Result.federationScoped,
        productionBlocked: v2Result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "CONNECTOR_CERTIFICATION_V2_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Connector Certification v2 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.connector-certification-v2",
      metadata: {
        route: "/api/governance/connector-certification-v2",
        v2DimensionCount: v2Result.summary.v2DimensionCount,
        v2CertifiedCount: v2Result.summary.v2CertifiedCount,
        v2BlockedCount: v2Result.summary.v2BlockedCount,
        v1ConnectorCount: v2Result.summary.v1ConnectorCount,
        v1CertifiedConnectorCount: v2Result.summary.v1CertifiedConnectorCount,
        v1LiveExecutionBlockedCount:
          v2Result.summary.v1LiveExecutionBlockedCount,
        crossSourceConflictCount:
          v2Result.summary.crossSourceConflictCount,
        capitalProgramCoverageCount:
          v2Result.summary.capitalProgramCoverageCount,
        customerTypeCoverageCount:
          v2Result.summary.customerTypeCoverageCount,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedOutput.classification.classificationLevel,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "connector_certification_v2_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/connector-certification-v2",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "connector_certification_v2_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/connector-certification-v2",
            stage: "output",
            advisoryOnly: true,
            internalCertificationOnly: true,
            liveExecutionBlocked: true,
            replaySafe: true,
            auditSafe: true,
            conflictPreserving: true,
            federationScoped: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "connector_certification_v2_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          v2DimensionCount: v2Result.summary.v2DimensionCount,
          v2CertifiedCount: v2Result.summary.v2CertifiedCount,
          v1ConnectorCount: v2Result.summary.v1ConnectorCount,
          v1CertifiedConnectorCount: v2Result.summary.v1CertifiedConnectorCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/connector-certification-v2",
          operation: "governance.connector.certification.v2.compose",
        },
      },
      metadata: {
        route: "/api/governance/connector-certification-v2",
        operation: "governance.connector.certification.v2.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      v2Result,
      event: classifiedOutput.event,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "CONNECTOR_CERTIFICATION_V2_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Connector Certification v2 API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.connector-certification-v2",
      metadata: {
        route: "/api/governance/connector-certification-v2",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Connector Certification v2 runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/connector-certification-v2",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Connector Certification v2 runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}

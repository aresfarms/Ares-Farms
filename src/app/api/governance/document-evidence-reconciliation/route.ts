import { NextRequest, NextResponse } from "next/server";

import {
  DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
  DocumentEvidenceReconciliationInput,
  composeDocumentEvidenceReconciliation,
} from "@/lib/evidence/documentEvidenceReconciliationRuntime";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type Request = DocumentEvidenceReconciliationInput;

function createTraceId(): string {
  return `document-evidence-reconciliation-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  try {
    const body = (await req.json().catch(() => ({}))) as Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;
    const runtimeGuard = runRuntimeGuard({
      operation: "governance.document.evidence.reconciliation.evaluate",
      module: "api.governance.document-evidence-reconciliation",
      traceId,
      schemaVersion: "document-evidence-reconciliation-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/document-evidence-reconciliation",
        applicationId: body.applicationId ?? null,
      },
    });
    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Document Evidence Reconciliation runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.document-evidence-reconciliation",
        metadata: {
          route: "/api/governance/document-evidence-reconciliation",
          findings: runtimeGuard.findings,
        },
      });
      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/document-evidence-reconciliation",
          runtimeBlocked: true,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Document Evidence Reconciliation request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.document.evidence.reconciliation.evaluate",
      module: "api.governance.document-evidence-reconciliation",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "document-evidence-reconciliation-request-v0.1.0",
          "src/app/api/governance/document-evidence-reconciliation/route.ts",
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
          DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
          "src/lib/evidence/documentEvidenceReconciliationRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "evidence-resolution-workflow-runtime-v0.1.0",
          "src/lib/evidence-resolution/evidenceResolutionWorkflowRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "readiness-assessment-v2-runtime-v0.1.0",
          "src/lib/readiness/readinessAssessmentV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "borrower-onboarding-core-v2-runtime-v0.1.0",
          "src/lib/borrower/onboardingCoreV2Runtime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource:
        "api-governance-document-evidence-reconciliation-route",
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
        "not-a-denial",
        "not-a-rejection",
        "not-a-fraud-accusation",
        "not-a-document-fakeness-accusation",
        "not-a-borrower-lying-accusation",
        "not-a-misrepresentation-accusation",
        "not-a-legal-conclusion",
        "not-an-underwriting-decision",
        "not-an-approval",
        "not-a-preapproval",
        "not-an-eligibility-determination",
        "not-a-credit-decision",
        "not-a-lender-commitment",
        "not-an-agency-decision",
        "not-an-official-certification",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-legal-reliance",
        "not-a-source-certainty-claim",
        "not-a-live-external-action",
        "not-a-notice-send",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-content-before-external-disclosure",
        "redact-financial-statement-details-before-external-disclosure",
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: [
        "governance-document-evidence-reconciliation-review-consent",
      ],
    });

    const result = composeDocumentEvidenceReconciliation(body);

    const classifiedOutput = classifyRecord(
      {
        result,
        event: {
          eventType:
            "governance.document.evidence.reconciliation.evaluated",
          applicationId: result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-document-evidence-reconciliation-route-output",
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
          "not-a-denial",
          "not-a-rejection",
          "not-a-fraud-accusation",
          "not-a-document-fakeness-accusation",
          "not-a-borrower-lying-accusation",
          "not-a-legal-conclusion",
          "not-an-underwriting-decision",
          "not-an-approval",
          "not-a-preapproval",
          "not-an-eligibility-determination",
          "not-a-credit-decision",
          "not-a-lender-commitment",
          "not-an-agency-decision",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-legal-reliance",
          "not-a-source-certainty-claim",
          "not-a-live-external-action",
          "not-a-notice-send",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
          "redact-financial-statement-details-before-external-disclosure",
          "redact-sovereign-participant-records-before-external-disclosure",
        ],
        consentRequirements: [
          "governance-document-evidence-reconciliation-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "document_evidence_reconciliation_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Document Evidence Reconciliation v1 pack composed as advisory document-reconciliation posture, replay-safe, audit-safe, conflict-preserving internal evidence only. Unreconciled evidence is not denial. The runtime never accuses fraud, never says documents are fake, never says the borrower is lying, never makes a legal conclusion, never makes an underwriting decision, and never converts unreconciled evidence into automatic denial. Material conflicts route to HUMAN_REVIEW_REQUIRED.",
      ruleVersion: DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + result.summary.v1OverallReadinessPercent / 200)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        findingCount: result.summary.findingCount,
        consistentCount: result.summary.consistentCount,
        incompleteCount: result.summary.incompleteCount,
        unresolvedVarianceCount: result.summary.unresolvedVarianceCount,
        materialConflictCount: result.summary.materialConflictCount,
        clarificationRequestedCount:
          result.summary.clarificationRequestedCount,
        thirdPartyVerificationRecommendedCount:
          result.summary.thirdPartyVerificationRecommendedCount,
        humanReviewRequiredCount: result.summary.humanReviewRequiredCount,
        fraudAccusationRiskCount: result.summary.fraudAccusationRiskCount,
        documentFakenessAccusationRiskCount:
          result.summary.documentFakenessAccusationRiskCount,
        underwritingDecisionRiskCount:
          result.summary.underwritingDecisionRiskCount,
        legalConclusionRiskCount: result.summary.legalConclusionRiskCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        replaySafe: result.replaySafe,
        auditSafe: result.auditSafe,
        conflictPreserving: result.conflictPreserving,
        federationScoped: result.federationScoped,
        productionBlocked: result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "DOCUMENT_EVIDENCE_RECONCILIATION_EVALUATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Document Evidence Reconciliation v1 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.document-evidence-reconciliation",
      metadata: {
        route: "/api/governance/document-evidence-reconciliation",
        findingCount: result.summary.findingCount,
        materialConflictCount: result.summary.materialConflictCount,
        humanReviewRequiredCount: result.summary.humanReviewRequiredCount,
        fraudAccusationRiskCount: result.summary.fraudAccusationRiskCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
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
          resourceType: "document_evidence_reconciliation_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/document-evidence-reconciliation",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "document_evidence_reconciliation_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/document-evidence-reconciliation",
            stage: "output",
            advisoryOnly: true,
            uncertaintyPreserved: true,
            conflictLineagePreserved: true,
            noFraudAccusation: true,
            noDocumentFakenessAccusation: true,
            noBorrowerLyingAccusation: true,
            noLegalConclusion: true,
            noUnderwritingDecision: true,
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
        targetType: "document_evidence_reconciliation_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          findingCount: result.summary.findingCount,
          materialConflictCount: result.summary.materialConflictCount,
          fraudAccusationRiskCount: result.summary.fraudAccusationRiskCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/document-evidence-reconciliation",
          operation: "governance.document.evidence.reconciliation.evaluate",
        },
      },
      metadata: {
        route: "/api/governance/document-evidence-reconciliation",
        operation: "governance.document.evidence.reconciliation.evaluate",
      },
    });

    return NextResponse.json({
      ok: true,
      result,
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
      eventType: "DOCUMENT_EVIDENCE_RECONCILIATION_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Document Evidence Reconciliation API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.document-evidence-reconciliation",
      metadata: {
        route: "/api/governance/document-evidence-reconciliation",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Document Evidence Reconciliation runtime error.",
      },
    });
    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/document-evidence-reconciliation",
        runtimeError: true,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Document Evidence Reconciliation runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}

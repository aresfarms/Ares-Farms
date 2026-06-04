import { NextRequest, NextResponse } from "next/server";

import {
  DISCLOSURE_AUDIT_GATE_DOC_REF,
  DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
  DISCLOSURE_AUDIT_GATE_SPEC_VERSION,
  DisclosureAuditInput,
  composeDisclosureAuditGate,
} from "@/lib/disclosure-audit/disclosureAuditGateRuntime";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type Request = DisclosureAuditInput;

function createTraceId(): string {
  return `disclosure-audit-gate-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  try {
    const body = (await req.json().catch(() => ({}))) as Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;
    const runtimeGuard = runRuntimeGuard({
      operation: "governance.disclosure.audit.gate.evaluate",
      module: "api.governance.disclosure-audit-gate",
      traceId,
      schemaVersion: "disclosure-audit-gate-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/disclosure-audit-gate",
        applicationId: body.applicationId ?? null,
      },
    });
    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DISCLOSURE_AUDIT_GATE_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Disclosure Audit Gate runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.disclosure-audit-gate",
        metadata: {
          route: "/api/governance/disclosure-audit-gate",
          findings: runtimeGuard.findings,
        },
      });
      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/disclosure-audit-gate",
          runtimeBlocked: true,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Disclosure Audit Gate request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.disclosure.audit.gate.evaluate",
      module: "api.governance.disclosure-audit-gate",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "disclosure-audit-gate-request-v0.1.0",
          "src/app/api/governance/disclosure-audit-gate/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          DISCLOSURE_AUDIT_GATE_SPEC_VERSION,
          DISCLOSURE_AUDIT_GATE_DOC_REF,
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
          DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
          "src/lib/disclosure-audit/disclosureAuditGateRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-disclosure-audit-gate-route",
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
        "not-a-customer-facing-publication",
        "not-an-information-sale",
        "not-a-silent-submission",
        "not-an-approval",
        "not-a-denial",
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
        "redact-internal-review-notes-before-public-disclosure",
      ],
      consentRequirements: [
        "governance-disclosure-audit-gate-review-consent",
      ],
    });

    const result = composeDisclosureAuditGate(body);

    const classifiedOutput = classifyRecord(
      {
        result,
        event: {
          eventType: "governance.disclosure.audit.gate.verified",
          applicationId: result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-disclosure-audit-gate-route-output",
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
          "not-a-customer-facing-publication",
          "not-an-information-sale",
          "not-a-silent-submission",
          "not-an-approval",
          "not-a-denial",
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
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: [
          "governance-disclosure-audit-gate-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "disclosure_audit_gate_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Disclosure Audit Gate v1 pack composed as advisory presentation-layer audit posture against the Module 44 Disclosure Audit Gate Specification. The runtime does NOT change what a surface does; it enforces required-disclosure coverage and prohibited-claim blocking with negation-aware exemption. Internal advisory audit posture only.",
      ruleVersion: DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + result.summary.v1OverallReadinessPercent / 200)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        specVersion: result.specVersion,
        docRef: result.docRef,
        disclosureRegistryCount: result.disclosureRegistry.length,
        prohibitedClaimsCorpusCount: result.prohibitedClaimsCorpus.length,
        externalSurfaceCount: result.summary.externalSurfaceCount,
        publicSurfaceCountFromRegistry:
          result.summary.publicSurfaceCountFromRegistry,
        publicSurfaceCountFromGateway:
          result.summary.publicSurfaceCountFromGateway,
        surfaceCountReconciled: result.summary.surfaceCountReconciled,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        replaySafe: result.replaySafe,
        auditSafe: result.auditSafe,
        conflictPreserving: result.conflictPreserving,
        federationScoped: result.federationScoped,
        productionBlocked: result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "DISCLOSURE_AUDIT_GATE_EVALUATED",
      domain: "operations",
      severity: result.exitCode === 0 ? "INFO" : "WARN",
      message:
        "Disclosure Audit Gate v1 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.disclosure-audit-gate",
      metadata: {
        route: "/api/governance/disclosure-audit-gate",
        exitCode: result.exitCode,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel: classifiedOutput.classification.classificationLevel,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "disclosure_audit_gate_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/disclosure-audit-gate",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "disclosure_audit_gate_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/disclosure-audit-gate",
            stage: "output",
            advisoryOnly: true,
            noCustomerFacingPublication: true,
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
        targetType: "disclosure_audit_gate_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          exitCode: result.exitCode,
          findingCount: result.summary.findingCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/disclosure-audit-gate",
          operation: "governance.disclosure.audit.gate.evaluate",
        },
      },
      metadata: {
        route: "/api/governance/disclosure-audit-gate",
        operation: "governance.disclosure.audit.gate.evaluate",
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
      eventType: "DISCLOSURE_AUDIT_GATE_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Disclosure Audit Gate API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.disclosure-audit-gate",
      metadata: {
        route: "/api/governance/disclosure-audit-gate",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Disclosure Audit Gate runtime error.",
      },
    });
    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/disclosure-audit-gate",
        runtimeError: true,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Disclosure Audit Gate runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}

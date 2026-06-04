import { NextRequest, NextResponse } from "next/server";

import {
  ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
  EnvironmentalEscalationEngineV2Input,
  composeEnvironmentalEscalationEngineV2,
} from "@/lib/environmental/escalationEngineV2Runtime";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type Request = EnvironmentalEscalationEngineV2Input;

function createTraceId(): string {
  return `environmental-escalation-engine-v2-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  try {
    const body = (await req.json().catch(() => ({}))) as Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;
    const runtimeGuard = runRuntimeGuard({
      operation: "governance.environmental.escalation.engine.v2.compose",
      module: "api.governance.environmental-escalation-engine-v2",
      traceId,
      schemaVersion: "environmental-escalation-engine-v2-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/environmental-escalation-engine-v2",
        applicationId: body.applicationId ?? null,
      },
    });
    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Environmental Escalation Engine v2 runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.environmental-escalation-engine-v2",
        metadata: {
          route: "/api/governance/environmental-escalation-engine-v2",
          findings: runtimeGuard.findings,
        },
      });
      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/environmental-escalation-engine-v2",
          runtimeBlocked: true,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Environmental Escalation Engine v2 request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.environmental.escalation.engine.v2.compose",
      module: "api.governance.environmental-escalation-engine-v2",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "environmental-escalation-engine-v2-request-v0.1.0",
          "src/app/api/governance/environmental-escalation-engine-v2/route.ts",
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
          ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
          "src/lib/environmental/escalationEngineV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "environmental-risk-assessment-v2-runtime-v0.1.0",
          "src/lib/environmental/riskAssessmentV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "environmental-compliance-v2-runtime-v0.1.0",
          "src/lib/environmental/complianceV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "environmental-intake-v2-runtime-v0.1.0",
          "src/lib/environmental/intakeV2Runtime.ts",
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
        "api-governance-environmental-escalation-engine-v2-route",
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
        "not-an-environmental-clearance",
        "not-an-environmental-escalation-determination",
        "not-a-NEPA-determination",
        "not-a-Phase-I-ESA-report",
        "not-a-permit",
        "not-an-external-escalation-notification",
        "not-an-external-ticket",
        "not-a-paging-event",
        "not-an-eligibility-determination",
        "not-a-credit-decision",
        "not-a-lender-commitment",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-source-certainty-claim",
        "not-a-live-external-action",
        "not-a-notice-send",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-content-before-external-disclosure",
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: [
        "governance-environmental-escalation-engine-v2-review-consent",
      ],
    });

    const v2Result = composeEnvironmentalEscalationEngineV2(body);

    const classifiedOutput = classifyRecord(
      {
        v2Result,
        event: {
          eventType:
            "governance.environmental.escalation.engine.v2.composed",
          applicationId: v2Result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-environmental-escalation-engine-v2-route-output",
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
          "not-an-environmental-escalation-determination",
          "not-an-external-escalation-notification",
          "not-an-external-ticket",
          "not-a-paging-event",
          "not-an-eligibility-determination",
          "not-a-credit-decision",
          "not-a-lender-commitment",
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
          "redact-sovereign-participant-records-before-external-disclosure",
        ],
        consentRequirements: [
          "governance-environmental-escalation-engine-v2-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "environmental_escalation_engine_v2_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Environmental Escalation Engine v2 pack composed as advisory escalation routing posture, replay-safe, audit-safe, conflict-preserving internal evidence only. No external escalation notification / ticket creation / queue submission / paging / autonomous resolution / official environmental report / environmental clearance / NEPA determination / Phase I/II ESA report / permit / approval / autonomous escalation / risk / compliance / intake / onboarding / readiness / eligibility / pathway / opportunity / intelligence / evidence / certification determination, credit decision, lender commitment, public verification, regulatory reliance, source certainty claim, notice send, or legal reliance is created.",
      ruleVersion: ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(
          0.45,
          0.45 + v2Result.summary.v2OverallReadinessPercent / 200
        )
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        queueSize: v2Result.summary.queueSize,
        urgentCount: v2Result.summary.urgentCount,
        acceleratedCount: v2Result.summary.acceleratedCount,
        routineCount: v2Result.summary.routineCount,
        sovereignReviewCount: v2Result.summary.sovereignReviewCount,
        v2OverallReadinessPercent: v2Result.summary.v2OverallReadinessPercent,
        crossSourceConflictCount: v2Result.summary.crossSourceConflictCount,
        replaySafe: v2Result.replaySafe,
        auditSafe: v2Result.auditSafe,
        conflictPreserving: v2Result.conflictPreserving,
        federationScoped: v2Result.federationScoped,
        productionBlocked: v2Result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "ENVIRONMENTAL_ESCALATION_ENGINE_V2_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Environmental Escalation Engine v2 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.environmental-escalation-engine-v2",
      metadata: {
        route: "/api/governance/environmental-escalation-engine-v2",
        queueSize: v2Result.summary.queueSize,
        urgentCount: v2Result.summary.urgentCount,
        sovereignReviewCount: v2Result.summary.sovereignReviewCount,
        crossSourceConflictCount: v2Result.summary.crossSourceConflictCount,
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
          resourceType: "environmental_escalation_engine_v2_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/environmental-escalation-engine-v2",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "environmental_escalation_engine_v2_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/environmental-escalation-engine-v2",
            stage: "output",
            advisoryOnly: true,
            spokeIsolationRequired: true,
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
        targetType: "environmental_escalation_engine_v2_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          queueSize: v2Result.summary.queueSize,
          urgentCount: v2Result.summary.urgentCount,
          sovereignReviewCount: v2Result.summary.sovereignReviewCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/environmental-escalation-engine-v2",
          operation:
            "governance.environmental.escalation.engine.v2.compose",
        },
      },
      metadata: {
        route: "/api/governance/environmental-escalation-engine-v2",
        operation: "governance.environmental.escalation.engine.v2.compose",
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
      eventType: "ENVIRONMENTAL_ESCALATION_ENGINE_V2_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Environmental Escalation Engine v2 API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.environmental-escalation-engine-v2",
      metadata: {
        route: "/api/governance/environmental-escalation-engine-v2",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Environmental Escalation Engine v2 runtime error.",
      },
    });
    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/environmental-escalation-engine-v2",
        runtimeError: true,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Environmental Escalation Engine v2 runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}

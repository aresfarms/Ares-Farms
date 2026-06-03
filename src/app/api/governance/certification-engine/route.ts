import { NextRequest, NextResponse } from "next/server";

import {
  CERTIFICATION_ENGINE_RUNTIME_VERSION,
  CertificationEngineInput,
  evaluateInternalCertification,
} from "@/lib/certification/engineRuntime";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Internal Certification Engine API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority over internal certification
 *   posture; the engine describes internal review state and never replaces
 *   external review, public verification, or regulatory reliance.
 * - Vol II: prevents posture from becoming external certification, public
 *   verification, regulatory reliance, lender commitment, credit decision,
 *   environmental clearance, payment authorization, official report
 *   publication, or legal reliance.
 * - Vol III: provides deterministic, replay-safe composition of module
 *   readiness, source posture, connector posture, and module conformance
 *   from canonical registries.
 * - Vol III-B: attaches runtime guard, classification (RESTRICTED), version
 *   lineage, observability, explainability, replay verification, and
 *   audit-safe error envelope.
 * - Vol IV: routes posture handoffs to the Governance Evidence Engine, the
 *   Module 16 Evidence Packet Workspace, Module Readiness Control Tower,
 *   Audit Replay Console, Governance, and Reviews.
 * - Vol V-VII: enforces canonical claims governance, controlled disclosure,
 *   replay, audit, portability, source authority, and conformance on every
 *   composed posture.
 */

type CertificationEngineRequest = CertificationEngineInput;

function createCertificationTraceId(): string {
  return `certification-engine-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createCertificationTraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as CertificationEngineRequest;
    const actorId = body.userId ?? body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.certification.posture.compose",
      module: "api.governance.certification-engine",
      traceId,
      schemaVersion: "certification-engine-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/certification-engine",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "CERTIFICATION_ENGINE_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Certification engine runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.certification-engine",
        metadata: {
          route: "/api/governance/certification-engine",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/certification-engine",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked certification engine request.",
          governance: {
            traceId,
            runtimeGuard,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.certification.posture.compose",
      module: "api.governance.certification-engine",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "certification-engine-request-v0.1.0",
          "src/app/api/governance/certification-engine/route.ts",
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
          CERTIFICATION_ENGINE_RUNTIME_VERSION,
          "src/lib/certification/engineRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-certification-engine-route",
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
        "not-an-external-certification",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-lender-commitment",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-application-content-before-external-disclosure",
      ],
      consentRequirements: ["governance-certification-review-consent"],
    });

    const postureResult = evaluateInternalCertification(body);

    const classifiedOutput = classifyRecord(
      {
        postureResult,
        event: {
          eventType: "governance.certification.posture.composed",
          applicationId: postureResult.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-certification-engine-route-output",
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
          "not-an-external-certification",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-lender-commitment",
          "not-an-environmental-determination",
          "not-a-payment-authorization",
          "not-a-legal-reliance",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["governance-certification-review-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "internal_certification_posture",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Internal certification posture composed as review-bound internal evidence only. No external certification, public verification, regulatory reliance, lender commitment, or legal reliance is created.",
      ruleVersion: CERTIFICATION_ENGINE_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.9,
        Math.max(
          0.45,
          0.45 + postureResult.summary.overallReadinessPercent / 200
        )
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        domainCount: postureResult.summary.domainCount,
        certifiedDomainCount: postureResult.summary.certifiedDomainCount,
        pendingDomainCount: postureResult.summary.pendingDomainCount,
        blockedDomainCount: postureResult.summary.blockedDomainCount,
        internalCertificationOnly: postureResult.internalCertificationOnly,
        productionBlocked: postureResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "CERTIFICATION_ENGINE_POSTURE_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Internal certification posture composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.certification-engine",
      metadata: {
        route: "/api/governance/certification-engine",
        domainCount: postureResult.summary.domainCount,
        certifiedDomainCount: postureResult.summary.certifiedDomainCount,
        blockedDomainCount: postureResult.summary.blockedDomainCount,
        overallReadinessPercent: postureResult.summary.overallReadinessPercent,
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
          resourceType: "internal_certification_posture_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/certification-engine",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "internal_certification_posture_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/certification-engine",
            stage: "output",
            internalCertificationOnly: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "internal_certification_posture",
        targetId: postureResult.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: CERTIFICATION_ENGINE_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          domainCount: postureResult.summary.domainCount,
          certifiedDomainCount: postureResult.summary.certifiedDomainCount,
          blockedDomainCount: postureResult.summary.blockedDomainCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/certification-engine",
          operation: "governance.certification.posture.compose",
        },
      },
      metadata: {
        route: "/api/governance/certification-engine",
        operation: "governance.certification.posture.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      postureResult,
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
      eventType: "CERTIFICATION_ENGINE_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Certification engine API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.certification-engine",
      metadata: {
        route: "/api/governance/certification-engine",
        error:
          error instanceof Error
            ? error.message
            : "Unknown certification engine runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/certification-engine",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown certification engine runtime error.",
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

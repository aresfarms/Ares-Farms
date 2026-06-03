import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
  AdvancedIntelligenceInput,
  evaluateAdvancedIntelligence,
} from "@/lib/intelligence/advancedIntelligenceRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Advanced Intelligence API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority over composed intelligence.
 * - Vol II: prevents composed intelligence from becoming approval,
 *   eligibility, underwriting, credit decision, lender commitment,
 *   environmental clearance, payment authorization, official report
 *   publication, or legal reliance.
 * - Vol III: provides deterministic, replay-safe composition over source,
 *   revenue, market, geospatial, and pathway intelligence with explicit
 *   conflict-preservation.
 * - Vol III-B: attaches runtime guard, classification (CONFIDENTIAL),
 *   version lineage, observability, explainability, replay verification,
 *   and audit-safe error envelope.
 * - Vol IV: routes intelligence handoffs to the Revenue Opportunity
 *   Workspace, Property Discovery, Customer Revenue Review, Borrower
 *   Opportunity Discovery, Registry Framework, Governance Evidence
 *   Engine, Internal Certification Engine, Module 16 Evidence Packet
 *   Workspace, Audit Replay Console, Governance, and Reviews.
 * - Vol V-VII: enforces canonical claims governance, controlled
 *   disclosure, replay, audit, portability, source authority, and
 *   conformance on every composed intelligence pack.
 */

type AdvancedIntelligenceRequest = AdvancedIntelligenceInput;

function createAdvancedIntelligenceTraceId(): string {
  return `advanced-intelligence-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createAdvancedIntelligenceTraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as AdvancedIntelligenceRequest;
    const actorId = body.userId ?? body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.intelligence.compose",
      module: "api.governance.advanced-intelligence",
      traceId,
      schemaVersion: "advanced-intelligence-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/advanced-intelligence",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "ADVANCED_INTELLIGENCE_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Advanced intelligence runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.advanced-intelligence",
        metadata: {
          route: "/api/governance/advanced-intelligence",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/advanced-intelligence",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked advanced intelligence request.",
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
      operation: "governance.intelligence.compose",
      module: "api.governance.advanced-intelligence",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "advanced-intelligence-request-v0.1.0",
          "src/app/api/governance/advanced-intelligence/route.ts",
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
          ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
          "src/lib/intelligence/advancedIntelligenceRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "revenue-source-intelligence-runtime-v0.1.0",
          "src/lib/revenue-intelligence/revenueSourceIntelligenceRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "source-intelligence-runtime-v0.1.0",
          "src/lib/source-intelligence/sourceIntelligenceRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "governance",
      classificationSource: "api-governance-advanced-intelligence-route",
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
        "not-an-eligibility-determination",
        "not-a-credit-decision",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-application-content-before-external-disclosure",
      ],
      consentRequirements: ["governance-intelligence-review-consent"],
    });

    const intelligenceResult = evaluateAdvancedIntelligence(body);

    const classifiedOutput = classifyRecord(
      {
        intelligenceResult,
        event: {
          eventType: "governance.intelligence.composed",
          applicationId: body.applicationId ?? null,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-advanced-intelligence-route-output",
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
          "not-an-eligibility-determination",
          "not-a-credit-decision",
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
        consentRequirements: ["governance-intelligence-review-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "advanced_intelligence_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Advanced intelligence pack composed as advisory, replay-safe, conflict-preserving evidence only. No approval, eligibility, underwriting, credit decision, lender commitment, public verification, regulatory reliance, or legal reliance is created.",
      ruleVersion: ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(
          0.45,
          0.45 + intelligenceResult.summary.insightCount / 50
        )
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        domainCount: intelligenceResult.summary.domainCount,
        insightCount: intelligenceResult.summary.insightCount,
        conflictCount: intelligenceResult.summary.conflictCount,
        advisoryOnly: intelligenceResult.advisoryOnly,
        conflictPreserving: intelligenceResult.conflictPreserving,
        productionBlocked: intelligenceResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "ADVANCED_INTELLIGENCE_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Advanced intelligence pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.advanced-intelligence",
      metadata: {
        route: "/api/governance/advanced-intelligence",
        domainCount: intelligenceResult.summary.domainCount,
        insightCount: intelligenceResult.summary.insightCount,
        conflictCount: intelligenceResult.summary.conflictCount,
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
          resourceType: "advanced_intelligence_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/advanced-intelligence",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "advanced_intelligence_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/advanced-intelligence",
            stage: "output",
            advisoryOnly: true,
            conflictPreserving: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "advanced_intelligence_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          domainCount: intelligenceResult.summary.domainCount,
          insightCount: intelligenceResult.summary.insightCount,
          conflictCount: intelligenceResult.summary.conflictCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/advanced-intelligence",
          operation: "governance.intelligence.compose",
        },
      },
      metadata: {
        route: "/api/governance/advanced-intelligence",
        operation: "governance.intelligence.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      intelligenceResult,
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
      eventType: "ADVANCED_INTELLIGENCE_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Advanced intelligence API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.advanced-intelligence",
      metadata: {
        route: "/api/governance/advanced-intelligence",
        error:
          error instanceof Error
            ? error.message
            : "Unknown advanced intelligence runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/advanced-intelligence",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown advanced intelligence runtime error.",
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

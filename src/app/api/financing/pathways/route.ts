import { NextRequest, NextResponse } from "next/server";

import {
  FINANCING_PATHWAY_ENGINE_VERSION,
  FinancingPathwayInput,
  evaluateFinancingPathways,
} from "@/lib/financing/pathwayEngine";
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
 * Financing Pathway API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority over borrower pathway guidance.
 * - Vol II: prevents pathway guidance from becoming approval, eligibility,
 *   underwriting, lender commitment, legal advice, or regulatory reliance.
 * - Vol III: provides deterministic replay-safe financing pathway evaluation.
 * - Vol III-B: attaches runtime guard, classification, version, observability,
 *   explainability, replay, and human-review evidence.
 * - Vol IV: supports borrower/operator continuity and missing-item handoff.
 * - Vol V-VII: enforces claims governance, source authority, conformance, and
 *   public-surface disclosure boundaries.
 */

type FinancingPathwayRequest = FinancingPathwayInput & {
  userId?: string | null;
};

function createFinancingTraceId(): string {
  return `financing-pathway-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createFinancingTraceId();

  try {
    const body = (await req.json()) as FinancingPathwayRequest;
    const actorId = body.userId ?? body.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "financing.pathway.evaluate",
      module: "api.financing.pathways",
      traceId,
      schemaVersion: "financing-pathway-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/financing/pathways",
        borrowerGuidanceSurface: true,
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "FINANCING_PATHWAY_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Financing pathway runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.financing.pathways",
        metadata: {
          route: "/api/financing/pathways",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/financing/pathways",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked financing pathway request.",
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
      operation: "financing.pathway.evaluate",
      module: "api.financing.pathways",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "financing-pathway-request-v0.1.0",
          "src/app/api/financing/pathways/route.ts",
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
          FINANCING_PATHWAY_ENGINE_VERSION,
          "src/lib/financing/pathwayEngine.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "revenue-source-intelligence-runtime-v0.1.0",
          "src/lib/revenue-intelligence/revenueSourceIntelligenceRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-financing-pathways-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["borrower", "authorized-operator", "governance"],
      sharingPermissions: [
        "borrower-guidance",
        "regulated-operational-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-a-credit-decision",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-data-before-external-disclosure",
      ],
      consentRequirements: ["borrower-guidance-consent"],
    });

    const pathwayResult = evaluateFinancingPathways(body);

    const classifiedOutput = classifyRecord(
      {
        pathwayResult,
        event: {
          eventType: "financing.pathway.evaluated",
          applicationId: body.applicationId ?? null,
          borrowerId: body.borrowerId ?? null,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-financing-pathways-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["borrower", "authorized-operator", "governance"],
        sharingPermissions: [
          "borrower-guidance",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-a-credit-decision",
          "not-an-approval",
          "not-an-eligibility-determination",
          "not-underwriting-evidence",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["borrower-guidance-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "financing_pathway_guidance",
      audience: "borrower",
      claimType: "recommendation",
      summary:
        "Financing pathway guidance generated as advisory, review-bound planning support with approval and reliance claims blocked.",
      ruleVersion: FINANCING_PATHWAY_ENGINE_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.95,
        Math.max(0.45, pathwayResult.readiness.readinessPercent / 100)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        pathwayCount: pathwayResult.pathways.length,
        readinessPercent: pathwayResult.readiness.readinessPercent,
        advisoryOnly: pathwayResult.advisoryOnly,
        productionBlocked: pathwayResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "FINANCING_PATHWAY_EVALUATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Borrower financing pathway guidance evaluated through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.financing.pathways",
      metadata: {
        route: "/api/financing/pathways",
        applicationId: body.applicationId ?? null,
        readinessPercent: pathwayResult.readiness.readinessPercent,
        pathwayCount: pathwayResult.pathways.length,
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
          resourceType: "financing_pathway_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/financing/pathways",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "financing_pathway_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/financing/pathways",
            stage: "output",
            advisoryOnly: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "financing_pathway_guidance",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: FINANCING_PATHWAY_ENGINE_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          readinessPercent: pathwayResult.readiness.readinessPercent,
          pathwayCount: pathwayResult.pathways.length,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/financing/pathways",
          operation: "financing.pathway.evaluate",
        },
      },
      metadata: {
        route: "/api/financing/pathways",
        operation: "financing.pathway.evaluate",
      },
    });

    return NextResponse.json({
      ok: true,
      pathwayResult,
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
      eventType: "FINANCING_PATHWAY_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Financing pathway API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.financing.pathways",
      metadata: {
        route: "/api/financing/pathways",
        error:
          error instanceof Error
            ? error.message
            : "Unknown financing pathway runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/financing/pathways",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown financing pathway runtime error.",
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

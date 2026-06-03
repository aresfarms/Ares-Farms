import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import {
  PUBLIC_TRUST_RUNTIME_VERSION,
  PublicTrustInput,
  evaluatePublicTrustContent,
} from "@/lib/trust/trustPagesRuntime";

/**
 * Public Trust Content API
 *
 * Master Volume Governance:
 * - Vol 0: emits the public-orientation translation layer with required
 *   advisory and no-approval posture.
 * - Vol I: preserves constitutional authority over public copy.
 * - Vol II: prevents public copy from implying approval, eligibility,
 *   credit decision, underwriting, lender commitment, environmental
 *   clearance, certification, public verification, payment authorization,
 *   official report publication, or legal or regulatory reliance.
 * - Vol III: provides deterministic, replay-safe trust content with
 *   content-claims evaluation and version lineage.
 * - Vol III-B: attaches runtime guard, classification (PUBLIC), version,
 *   observability, explainability, replay verification, and audit-safe
 *   error envelope.
 * - Vol IV: routes visitor handoffs to readiness, data rights, financing
 *   pathways, opportunities, environmental intake, and about.
 * - Vol V-VII: enforces canonical claims governance, controlled disclosure,
 *   portability, replay, source authority, and public-surface conformance.
 */

type PublicTrustRequest = PublicTrustInput & {
  userId?: string | null;
};

function createPublicTrustTraceId(): string {
  return `public-trust-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createPublicTrustTraceId();

  try {
    const body = (await req.json().catch(() => ({}))) as PublicTrustRequest;
    const actorId = body.userId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "public.trust.view",
      module: "api.trust",
      traceId,
      schemaVersion: "public-trust-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "PUBLIC",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/trust",
        publicSurface: true,
        audience: body.audience ?? "public",
        referrerRoute: body.referrerRoute ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "PUBLIC_TRUST_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Public trust runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.trust",
        metadata: {
          route: "/api/trust",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/trust",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked public trust request.",
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
      operation: "public.trust.view",
      module: "api.trust",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "public-trust-request-v0.1.0",
          "src/app/api/trust/route.ts",
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
          PUBLIC_TRUST_RUNTIME_VERSION,
          "src/lib/trust/trustPagesRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "content-claims-policy-v0.1.0",
          "src/lib/governance/contentClaimsPolicy.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "PUBLIC",
      sensitivityScope: "public",
      classificationSource: "api-trust-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["public", "borrower", "lender", "sponsor", "governance"],
      sharingPermissions: ["public-disclosure"],
      aiUsagePermissions: ["summarize", "explain"],
      exportRestrictions: [
        "not-an-approval",
        "not-an-eligibility-determination",
        "not-a-credit-decision",
        "not-a-public-verification",
        "not-a-certification",
        "not-a-payment-authorization",
        "requires-human-review",
      ],
      redactionRequirements: [
        "no-raw-borrower-records",
        "no-borrower-identifiers",
      ],
      consentRequirements: [],
    });

    const trustResult = evaluatePublicTrustContent(body);

    const classifiedOutput = classifyRecord(
      {
        trustResult,
        event: {
          eventType: "public.trust.viewed",
          audience: body.audience ?? "public",
          referrerRoute: body.referrerRoute ?? null,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "PUBLIC",
        sensitivityScope: "public",
        classificationSource: "api-trust-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["public", "borrower", "lender", "sponsor", "governance"],
        sharingPermissions: ["public-disclosure"],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-an-approval",
          "not-an-eligibility-determination",
          "not-a-credit-decision",
          "not-a-public-verification",
          "not-a-certification",
          "not-a-payment-authorization",
          "not-an-environmental-determination",
          "not-a-legal-or-regulatory-reliance",
          "requires-human-review",
        ],
        redactionRequirements: [
          "no-raw-borrower-records",
          "no-borrower-identifiers",
        ],
        consentRequirements: [],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "public_trust_content",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Public trust content generated as advisory orientation only. No approval, certification, public verification, environmental clearance, credit decision, payment authorization, or legal or regulatory reliance is created or implied.",
      ruleVersion: PUBLIC_TRUST_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: trustResult.contentClaimsEvaluation.ok ? 0.85 : 0.45,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        whatFurlongIsCount: trustResult.whatFurlongIs.length,
        whatFurlongIsNotCount: trustResult.whatFurlongIsNot.length,
        borrowerProtectionsCount: trustResult.borrowerProtections.length,
        contentClaimsOk: trustResult.contentClaimsEvaluation.ok,
        productionBlocked: trustResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "PUBLIC_TRUST_EVALUATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Public trust content generated through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.trust",
      metadata: {
        route: "/api/trust",
        audience: body.audience ?? "public",
        contentClaimsOk: trustResult.contentClaimsEvaluation.ok,
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
          resourceType: "public_trust_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/trust",
            stage: "input",
            audience: body.audience ?? "public",
          },
        },
        {
          resourceType: "public_trust_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/trust",
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
        targetType: "public_trust_content",
        targetId: traceId,
        verificationStatus:
          versionRuntime.ok && trustResult.contentClaimsEvaluation.ok
            ? "PASS"
            : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: PUBLIC_TRUST_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          contentClaimsOk: trustResult.contentClaimsEvaluation.ok,
          contentClaimsBlockCount:
            trustResult.contentClaimsEvaluation.blockCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/trust",
          operation: "public.trust.view",
        },
      },
      metadata: {
        route: "/api/trust",
        operation: "public.trust.view",
      },
    });

    return NextResponse.json({
      ok: true,
      trustResult,
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
      eventType: "PUBLIC_TRUST_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Public trust API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.trust",
      metadata: {
        route: "/api/trust",
        error:
          error instanceof Error
            ? error.message
            : "Unknown public trust runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/trust",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown public trust runtime error.",
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

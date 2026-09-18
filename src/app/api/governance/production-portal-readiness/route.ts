import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_PORTAL_READINESS_GATE_VERSION,
  evaluateProductionPortalReadinessGate,
} from "@/lib/governance/productionPortalReadinessGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import {
  latestReleaseGovernanceEvidence,
  recordReleaseGovernanceEvidence,
  releaseGovernanceEvidenceFor,
} from "@/lib/governance/releaseGovernanceEvidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Production Portal Readiness API
 *
 * Master Volume Governance:
 * - Vol 0: reviews internal, borrower, lender, sponsor, and public surfaces as
 *   one governed platform orientation.
 * - Vol I: keeps production portal launch subordinate to constitutional
 *   authority and accountable controlled promotion.
 * - Vol II: blocks launch review from becoming an approval, official report,
 *   borrower notice send, payment capture, public verification, legal advice,
 *   lender commitment, sponsor commitment, or agency commitment.
 * - Vol III: assembles deterministic launch preflight evidence across portable
 *   surfaces, backend dependencies, replay, audit, auth, security, monitoring,
 *   rollback, incident, support, and public-copy controls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to portal launch review records.
 * - Vol IV: supports launch hold, operator support routing, incident bridge,
 *   rollback review, and controlled handoff.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   portability, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and public DTO launch limits
 *   while live source fetches remain blocked.
 */

type ProductionPortalReadinessBody = {
  actorId?: string | null;
  surfaceId?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionPortalReadinessBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionPortalReadinessBody;
  } catch {
    return {};
  }
}

function createTraceId(operation: string): string {
  return `${operation}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET(req: NextRequest) {
  return handleProductionPortalReadiness(
    req,
    "production-portal-readiness.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionPortalReadiness(
    req,
    "production-portal-readiness.hold"
  );
}

async function handleProductionPortalReadiness(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const surfaceId = body.surfaceId ?? req.nextUrl.searchParams.get("surfaceId");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-portal-readiness",
      traceId,
      schemaVersion: PRODUCTION_PORTAL_READINESS_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-portal-readiness",
        surfaceId,
        method: req.method,
        portalLaunchExecuted: false,
        publicLaunchAllowed: false,
        liveExternalActionPerformed: false,
        paymentCaptureAllowed: false,
        borrowerNoticeSendAllowed: false,
        officialReportPublicationAllowed: false,
        publicVerificationAllowed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked production portal readiness review.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation,
      module: "api.governance.production-portal-readiness",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_PORTAL_READINESS_GATE_VERSION,
          "src/lib/governance/productionPortalReadinessGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Portable Vertical Surface Launch Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_PORTAL_READINESS_GATE_VERSION,
          "src/lib/governance/productionPortalReadinessGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-portal-readiness-api-v0.1.0",
          "api.governance.production-portal-readiness",
          traceId
        ),
      ],
    });
    const result = evaluateProductionPortalReadinessGate({ surfaceId });
    const scope = surfaceId ?? "platform";
    const launchHold =
      req.method === "POST" && actorId
        ? recordReleaseGovernanceEvidence({
            kind: "PRODUCTION_PORTAL_READINESS_HOLD",
            scope,
            actorId,
            reviewNote: body.reviewNote,
            replayRef: traceId,
          })
        : latestReleaseGovernanceEvidence(
            scope,
            "PRODUCTION_PORTAL_READINESS_HOLD"
          );
    const launchHoldHistory = releaseGovernanceEvidenceFor(
      scope,
      "PRODUCTION_PORTAL_READINESS_HOLD"
    );
    const supportCommunicationsEvidence = latestReleaseGovernanceEvidence(
      "platform",
      "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_PACKET"
    );
    const classifiedOutput = classifyRecord(
      {
        count: result.productionPortalReadinessReviews.length,
        productionPortalReadinessReviews:
          result.productionPortalReadinessReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        launchPosture: result.launchPosture,
        launchHold,
        launchHoldHistory,
        supportCommunicationsEvidence,
        productionBlocked: true,
        portalLaunchExecuted: false,
        publicLaunchAllowed: false,
        liveExternalActionPerformed: false,
        paymentCaptureAllowed: false,
        borrowerNoticeSendAllowed: false,
        officialReportPublicationAllowed: false,
        publicVerificationAllowed: false,
        legalAdviceProvided: false,
        officialRelianceAllowed: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "production-portal-readiness-route-output",
        classificationVersion: PRODUCTION_PORTAL_READINESS_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-portal-readiness-review",
          "portable-surface-launch-review",
          "promotion-gate-evidence",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-production-launch-authority",
          "no-live-fetch-authority",
          "no-payment-capture-authority",
          "no-notice-send-authority",
          "no-official-report-publication-authority",
          "no-public-verification-authority",
        ],
        redactionRequirements: [
          "redact restricted operational details before public use",
          "redact credentials and source secrets",
          "redact borrower-sensitive data before external disclosure",
        ],
        consentRequirements: ["institutional-production-portal-readiness-review"],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_PORTAL_LAUNCH_HOLD_RECORDED"
          : "PRODUCTION_PORTAL_READINESS_GATE_READ",
      domain: "operations",
      severity: result.summary.publicLaunchAllowed === 0 ? "INFO" : "WARN",
      message:
        "Governed production portal readiness gate returned blocked launch posture without production exposure.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-portal-readiness",
      metadata: {
        surfaceId,
        count: result.productionPortalReadinessReviews.length,
        productionBlocked: result.summary.productionBlocked,
        launchReady: result.summary.launchReady,
        launchExecuted: result.summary.launchExecuted,
        publicLaunchAllowed: result.summary.publicLaunchAllowed,
        liveExternalActionsAllowed: result.summary.liveExternalActionsAllowed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      productionPortalReadinessReviews:
        classifiedOutput.productionPortalReadinessReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      launchPosture: classifiedOutput.launchPosture,
      launchHold: classifiedOutput.launchHold,
      launchHoldHistory: classifiedOutput.launchHoldHistory,
      supportCommunicationsEvidence:
        classifiedOutput.supportCommunicationsEvidence,
      productionBlocked: classifiedOutput.productionBlocked,
      portalLaunchExecuted: classifiedOutput.portalLaunchExecuted,
      publicLaunchAllowed: classifiedOutput.publicLaunchAllowed,
      liveExternalActionPerformed: classifiedOutput.liveExternalActionPerformed,
      paymentCaptureAllowed: classifiedOutput.paymentCaptureAllowed,
      borrowerNoticeSendAllowed: classifiedOutput.borrowerNoticeSendAllowed,
      officialReportPublicationAllowed:
        classifiedOutput.officialReportPublicationAllowed,
      publicVerificationAllowed: classifiedOutput.publicVerificationAllowed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
      officialRelianceAllowed: classifiedOutput.officialRelianceAllowed,
      data: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        outputClassification: classifiedOutput.classification,
        observability,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown production portal readiness gate error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

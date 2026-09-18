import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION,
  evaluateProductionLaunchEvidencePacket,
} from "@/lib/governance/productionLaunchEvidencePacket";
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
 * Production Launch Evidence Packet API
 *
 * Master Volume Governance:
 * - Vol 0: packages one governed launch evidence view for all platform
 *   surfaces without publishing production.
 * - Vol I: keeps go-live release subordinate to constitutional authority and
 *   explicit qualified approval.
 * - Vol II: blocks launch evidence packaging from becoming approvals,
 *   official reports, notice sends, payment capture, public verification,
 *   legal advice, partner commitments, agency commitments, or official
 *   reliance.
 * - Vol III: assembles deterministic evidence across readiness, backend,
 *   auth, security, audit, replay, monitoring, rollback, incident, and support
 *   controls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to packet review records.
 * - Vol IV: supports launch board review, final hold, operator handoff,
 *   incident bridge, rollback review, and support routing.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   portability, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and public DTO launch limits
 *   while source intelligence and live fetches remain blocked.
 */

type ProductionLaunchEvidenceBody = {
  actorId?: string | null;
  packetScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionLaunchEvidenceBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionLaunchEvidenceBody;
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
  return handleProductionLaunchEvidence(
    req,
    "production-launch-evidence.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionLaunchEvidence(
    req,
    "production-launch-evidence.hold"
  );
}

async function handleProductionLaunchEvidence(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const packetScope =
    body.packetScope ?? req.nextUrl.searchParams.get("packetScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-launch-evidence",
      traceId,
      schemaVersion: PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-launch-evidence",
        packetScope,
        method: req.method,
        goLiveApproved: false,
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
            "Runtime governance guard blocked production launch evidence packet review.",
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
      module: "api.governance.production-launch-evidence",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION,
          "src/lib/governance/productionLaunchEvidencePacket.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Launch Evidence Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION,
          "src/lib/governance/productionLaunchEvidencePacket.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-launch-evidence-api-v0.1.0",
          "api.governance.production-launch-evidence",
          traceId
        ),
      ],
    });
    const result = evaluateProductionLaunchEvidencePacket({ packetScope });
    const scope = packetScope ?? "platform";
    const launchHold =
      req.method === "POST" && actorId
        ? recordReleaseGovernanceEvidence({
            kind: "PRODUCTION_LAUNCH_EVIDENCE_HOLD",
            scope,
            actorId,
            reviewNote: body.reviewNote,
            replayRef: traceId,
          })
        : latestReleaseGovernanceEvidence(
            scope,
            "PRODUCTION_LAUNCH_EVIDENCE_HOLD"
          );
    const launchHistory = releaseGovernanceEvidenceFor(
      scope,
      "PRODUCTION_LAUNCH_EVIDENCE_HOLD"
    );
    const portalReadinessEvidence = latestReleaseGovernanceEvidence(
      scope,
      "PRODUCTION_PORTAL_READINESS_HOLD"
    );
    const classifiedOutput = classifyRecord(
      {
        count: result.launchEvidencePackets.length,
        launchEvidencePackets: result.launchEvidencePackets,
        summary: result.summary,
        disclosures: result.disclosures,
        launchReleasePosture: result.launchReleasePosture,
        launchHold,
        launchHistory,
        portalReadinessEvidence,
        productionBlocked: true,
        releaseCandidate: false,
        goLiveApproved: false,
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
        classificationSource: "production-launch-evidence-route-output",
        classificationVersion: PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-launch-evidence-review",
          "go-live-readiness-review",
          "launch-hold-evidence",
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
          "no-go-live-release-authority",
        ],
        redactionRequirements: [
          "redact restricted operational details before public use",
          "redact credentials and source secrets",
          "redact borrower-sensitive data before external disclosure",
        ],
        consentRequirements: ["institutional-production-launch-evidence-review"],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "GO_LIVE_RELEASE_HOLD_RECORDED"
          : "PRODUCTION_LAUNCH_EVIDENCE_PACKET_READ",
      domain: "operations",
      severity: result.summary.goLiveApproved === 0 ? "INFO" : "WARN",
      message:
        "Governed production launch evidence packet returned blocked release posture without production exposure.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-launch-evidence",
      metadata: {
        packetScope,
        count: result.launchEvidencePackets.length,
        blockedEvidenceItems: result.summary.blocked,
        reviewRequiredEvidenceItems: result.summary.reviewRequired,
        goLiveApproved: result.summary.goLiveApproved,
        portalLaunchExecuted: result.summary.portalLaunchExecuted,
        publicLaunchAllowed: result.summary.publicLaunchAllowed,
        liveExternalActionsAllowed: result.summary.liveExternalActionsAllowed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      launchEvidencePackets: classifiedOutput.launchEvidencePackets,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      launchReleasePosture: classifiedOutput.launchReleasePosture,
      launchHold: classifiedOutput.launchHold,
      launchHistory: classifiedOutput.launchHistory,
      portalReadinessEvidence: classifiedOutput.portalReadinessEvidence,
      productionBlocked: classifiedOutput.productionBlocked,
      releaseCandidate: classifiedOutput.releaseCandidate,
      goLiveApproved: classifiedOutput.goLiveApproved,
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
            : "Unknown production launch evidence packet error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

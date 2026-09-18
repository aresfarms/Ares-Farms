import { NextRequest, NextResponse } from "next/server";

import {
  SOURCE_PROMOTION_PACKET_GATE_VERSION,
  evaluateSourcePromotionPacketGate,
} from "@/lib/governance/sourcePromotionPacketGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { latestSourceReviewEvidence, recordSourceReviewEvidence, sourceReviewEvidenceFor } from "@/lib/governance/sourceReviewEvidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Source Promotion Packet Gate API
 *
 * Master Volume Governance:
 * - Vol I: keeps source promotion under constitutional authority.
 * - Vol II: prevents source promotion from implying legal advice, source
 *   certainty, official reliance, borrower disclosure, or underwriting use.
 * - Vol III: packages source-stack, legal-review, activation, replay,
 *   provenance, credential, adapter, monitoring, rollback, and incident
 *   evidence without live external calls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to promotion packet records.
 * - Vol IV: supports promotion hold, exception routing, incident containment,
 *   rollback review, and operator handoff.
 * - Vol V: enforces source authority, claims governance, controlled
 *   disclosure, public DTO limits, and advisory-only boundaries.
 * - Vol VI: binds source promotion packets to canonical external source
 *   discovery before any scraper or connector production activation.
 */

type SourcePromotionPacketBody = {
  actorId?: string | null;
  sourceId?: string | null;
  reviewNote?: string | null;
};

async function readBody(req: NextRequest): Promise<SourcePromotionPacketBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as SourcePromotionPacketBody;
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
  return handleSourcePromotionPacket(req, "source-promotion-packet.read");
}

export async function POST(req: NextRequest) {
  return handleSourcePromotionPacket(req, "source-promotion-packet.hold");
}

async function handleSourcePromotionPacket(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const sourceId = body.sourceId ?? req.nextUrl.searchParams.get("sourceId");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.source-promotion-packets",
      traceId,
      schemaVersion: SOURCE_PROMOTION_PACKET_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/source-promotion-packets",
        sourceId,
        method: req.method,
        legalAdviceProvided: false,
        liveFetchAllowed: false,
        liveFetchPerformed: false,
        externalActionPerformed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked source promotion packet.",
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
      module: "api.governance.source-promotion-packets",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          SOURCE_PROMOTION_PACKET_GATE_VERSION,
          "src/lib/governance/sourcePromotionPacketGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Volume VI Source Intelligence",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          SOURCE_PROMOTION_PACKET_GATE_VERSION,
          "src/lib/governance/sourcePromotionPacketGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "source-promotion-packet-api-v0.1.0",
          "api.governance.source-promotion-packets",
          traceId
        ),
      ],
    });
    const result = evaluateSourcePromotionPacketGate({ sourceId });
    const promotionHold =
      req.method === "POST" && sourceId && actorId
        ? recordSourceReviewEvidence({ kind: "PROMOTION_PACKET_HOLD", sourceId, actorId, reviewNote: body.reviewNote, replayRef: traceId })
        : sourceId
          ? latestSourceReviewEvidence(sourceId, "PROMOTION_PACKET_HOLD")
          : null;
    const promotionHistory = sourceReviewEvidenceFor(sourceId, "PROMOTION_PACKET_HOLD");
    const legalReviewEvidence = sourceId
      ? latestSourceReviewEvidence(sourceId, "LEGAL_REVIEW_HOLD")
      : null;
    const classifiedOutput = classifyRecord(
      {
        count: result.sourcePromotionPackets.length,
        sourcePromotionPackets: result.sourcePromotionPackets,
        summary: result.summary,
        disclosures: result.disclosures,
        promotionPosture: result.promotionPosture,
        promotionHold,
        promotionHistory,
        legalReviewEvidence,
        productionBlocked: true,
        liveFetchPerformed: false,
        externalActionPerformed: false,
        legalAdviceProvided: false,
        publicVerificationAllowed: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "source-promotion-packet-route-output",
        classificationVersion: SOURCE_PROMOTION_PACKET_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "source-promotion-review",
          "source-activation-review",
          "promotion-gate-evidence",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "not-legal-advice",
          "no-live-fetch-authority",
          "no-public-verification-authority",
          "no-production-promotion-authority",
        ],
        redactionRequirements: [
          "redact raw credentials",
          "redact source secrets",
          "redact restricted source payloads before public use",
        ],
        consentRequirements: ["institutional-source-promotion-review"],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "SOURCE_PROMOTION_PACKET_HOLD_RECORDED"
          : "SOURCE_PROMOTION_PACKET_GATE_READ",
      domain: "connector",
      severity: result.summary.liveFetchEnabled === 0 ? "INFO" : "WARN",
      message:
        "Governed source promotion packet gate returned blocked promotion posture without live external calls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.source-promotion-packets",
      metadata: {
        sourceId,
        count: result.sourcePromotionPackets.length,
        productionBlocked: result.summary.productionBlocked,
        liveFetchEnabled: result.summary.liveFetchEnabled,
        promotionReady: result.summary.promotionReady,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      sourcePromotionPackets: classifiedOutput.sourcePromotionPackets,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      promotionPosture: classifiedOutput.promotionPosture,
      promotionHold: classifiedOutput.promotionHold,
      promotionHistory: classifiedOutput.promotionHistory,
      legalReviewEvidence: classifiedOutput.legalReviewEvidence,
      productionBlocked: classifiedOutput.productionBlocked,
      liveFetchPerformed: classifiedOutput.liveFetchPerformed,
      externalActionPerformed: classifiedOutput.externalActionPerformed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
      publicVerificationAllowed: classifiedOutput.publicVerificationAllowed,
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
            : "Unknown source promotion packet gate error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

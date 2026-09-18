import { NextRequest, NextResponse } from "next/server";

import {
  SOURCE_PRODUCTION_READINESS_GATE_VERSION,
  evaluateSourceProductionReadinessGate,
} from "@/lib/governance/sourceProductionReadinessGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import {
  latestSourceReviewEvidence,
  recordSourceReviewEvidence,
  sourceReviewEvidenceFor,
} from "@/lib/governance/sourceReviewEvidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Source Production Promotion Readiness API
 *
 * Master Volume Governance:
 * - Vol I: keeps source production promotion under constitutional authority.
 * - Vol II: prevents readiness review from implying legal advice, source
 *   certainty, official reliance, borrower disclosure, underwriting use, or
 *   public verification authority.
 * - Vol III: assembles source-promotion, credential, adapter, schema, replay,
 *   provenance, monitoring, failover, rollback, incident, audit, claims, and
 *   human approval controls without live external calls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to production-readiness records.
 * - Vol IV: supports promotion hold, runbook review, activation ceremony
 *   review, rollback, incident containment, and operator handoff.
 * - Vol V: enforces source authority, claims governance, DTO safety,
 *   controlled disclosure, replayability, and advisory-only boundaries.
 * - Vol VI: binds canonical source intelligence to controlled production
 *   readiness before any scraper or connector live activation.
 */

type SourceProductionReadinessBody = {
  actorId?: string | null;
  sourceId?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<SourceProductionReadinessBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as SourceProductionReadinessBody;
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
  return handleSourceProductionReadiness(
    req,
    "source-production-readiness.read"
  );
}

export async function POST(req: NextRequest) {
  return handleSourceProductionReadiness(
    req,
    "source-production-readiness.hold"
  );
}

async function handleSourceProductionReadiness(
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
      module: "api.governance.source-production-readiness",
      traceId,
      schemaVersion: SOURCE_PRODUCTION_READINESS_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/source-production-readiness",
        sourceId,
        method: req.method,
        legalAdviceProvided: false,
        liveFetchAllowed: false,
        liveFetchPerformed: false,
        externalActionPerformed: false,
        publicVerificationAllowed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked source production readiness review.",
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
      module: "api.governance.source-production-readiness",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          SOURCE_PRODUCTION_READINESS_GATE_VERSION,
          "src/lib/governance/sourceProductionReadinessGate.ts",
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
          SOURCE_PRODUCTION_READINESS_GATE_VERSION,
          "src/lib/governance/sourceProductionReadinessGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "source-production-readiness-api-v0.1.0",
          "api.governance.source-production-readiness",
          traceId
        ),
      ],
    });
    const result = evaluateSourceProductionReadinessGate({ sourceId });
    const readinessHold =
      req.method === "POST" && sourceId && actorId
        ? recordSourceReviewEvidence({
            kind: "PRODUCTION_READINESS_HOLD",
            sourceId,
            actorId,
            reviewNote: body.reviewNote,
            replayRef: traceId,
          })
        : sourceId
          ? latestSourceReviewEvidence(sourceId, "PRODUCTION_READINESS_HOLD")
          : null;
    const readinessHistory = sourceReviewEvidenceFor(
      sourceId,
      "PRODUCTION_READINESS_HOLD"
    );
    const legalReviewEvidence = sourceId
      ? latestSourceReviewEvidence(sourceId, "LEGAL_REVIEW_HOLD")
      : null;
    const promotionPacketEvidence = sourceId
      ? latestSourceReviewEvidence(sourceId, "PROMOTION_PACKET_HOLD")
      : null;
    const classifiedOutput = classifyRecord(
      {
        count: result.sourceProductionReadinessReviews.length,
        sourceProductionReadinessReviews:
          result.sourceProductionReadinessReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        readinessPosture: result.readinessPosture,
        readinessHold,
        readinessHistory,
        legalReviewEvidence,
        promotionPacketEvidence,
        productionBlocked: true,
        promotionAllowed: false,
        liveFetchPerformed: false,
        externalActionPerformed: false,
        legalAdviceProvided: false,
        publicVerificationAllowed: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "source-production-readiness-route-output",
        classificationVersion: SOURCE_PRODUCTION_READINESS_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "source-production-readiness-review",
          "controlled-promotion-review",
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
        consentRequirements: ["institutional-source-production-readiness-review"],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "SOURCE_PRODUCTION_READINESS_HOLD_RECORDED"
          : "SOURCE_PRODUCTION_READINESS_GATE_READ",
      domain: "connector",
      severity: result.summary.liveFetchEnabled === 0 ? "INFO" : "WARN",
      message:
        "Governed source production readiness gate returned blocked posture without live external calls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.source-production-readiness",
      metadata: {
        sourceId,
        count: result.sourceProductionReadinessReviews.length,
        productionBlocked: result.summary.productionBlocked,
        liveFetchEnabled: result.summary.liveFetchEnabled,
        productionReady: result.summary.productionReady,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      sourceProductionReadinessReviews:
        classifiedOutput.sourceProductionReadinessReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      readinessPosture: classifiedOutput.readinessPosture,
      readinessHold: classifiedOutput.readinessHold,
      readinessHistory: classifiedOutput.readinessHistory,
      legalReviewEvidence: classifiedOutput.legalReviewEvidence,
      promotionPacketEvidence: classifiedOutput.promotionPacketEvidence,
      productionBlocked: classifiedOutput.productionBlocked,
      promotionAllowed: classifiedOutput.promotionAllowed,
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
            : "Unknown source production readiness gate error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

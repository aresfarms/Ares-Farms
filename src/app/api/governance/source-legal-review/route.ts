import { NextRequest, NextResponse } from "next/server";

import {
  SOURCE_LEGAL_REVIEW_GATE_VERSION,
  evaluateSourceLegalReviewGate,
} from "@/lib/governance/sourceLegalReviewGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { latestSourceReviewEvidence, recordSourceReviewEvidence, sourceReviewEvidenceFor } from "@/lib/governance/sourceReviewEvidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Source Legal and Licensing Review Gate API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional control over external source use.
 * - Vol II: blocks unreviewed licensing, ToS, anti-bulk, republication, and
 *   official reliance boundaries.
 * - Vol III: evaluates source-stack legal posture without live external calls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to source legal review records.
 * - Vol IV: supports review hold, exception routing, incident containment, and
 *   operator handoff.
 * - Vol V: enforces source authority, claims governance, controlled
 *   disclosure, public DTO limits, and advisory-only boundaries.
 * - Vol VI: binds licensing review to canonical external source discovery
 *   before any scraper or connector activation.
 */

type SourceLegalReviewBody = {
  actorId?: string | null;
  sourceId?: string | null;
  reviewNote?: string | null;
};

async function readBody(req: NextRequest): Promise<SourceLegalReviewBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as SourceLegalReviewBody;
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
  return handleSourceLegalReview(req, "source-legal-review.read");
}

export async function POST(req: NextRequest) {
  return handleSourceLegalReview(req, "source-legal-review.hold");
}

async function handleSourceLegalReview(req: NextRequest, operation: string) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const sourceId = body.sourceId ?? req.nextUrl.searchParams.get("sourceId");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.source-legal-review",
      traceId,
      schemaVersion: SOURCE_LEGAL_REVIEW_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/source-legal-review",
        sourceId,
        method: req.method,
        legalAdviceProvided: false,
        liveFetchAllowed: false,
        liveFetchPerformed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked source legal review.",
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
      module: "api.governance.source-legal-review",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          SOURCE_LEGAL_REVIEW_GATE_VERSION,
          "src/lib/governance/sourceLegalReviewGate.ts",
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
          SOURCE_LEGAL_REVIEW_GATE_VERSION,
          "src/lib/governance/sourceLegalReviewGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "source-legal-review-api-v0.1.0",
          "api.governance.source-legal-review",
          traceId
        ),
      ],
    });
    const result = evaluateSourceLegalReviewGate({ sourceId });
    const reviewHold =
      req.method === "POST" && sourceId && actorId
        ? recordSourceReviewEvidence({ kind: "LEGAL_REVIEW_HOLD", sourceId, actorId, reviewNote: body.reviewNote, replayRef: traceId })
        : sourceId
          ? latestSourceReviewEvidence(sourceId, "LEGAL_REVIEW_HOLD")
          : null;
    const reviewHistory = sourceReviewEvidenceFor(sourceId, "LEGAL_REVIEW_HOLD");
    const classifiedOutput = classifyRecord(
      {
        count: result.sourceLegalReviews.length,
        sourceLegalReviews: result.sourceLegalReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        legalReviewPosture: result.legalReviewPosture,
        reviewHold,
        reviewHistory,
        activationBlocked: true,
        liveFetchPerformed: false,
        legalAdviceProvided: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "source-legal-review-route-output",
        classificationVersion: SOURCE_LEGAL_REVIEW_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "source-legal-review",
          "source-activation-review",
          "promotion-gate-evidence",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "not-legal-advice",
          "no-live-fetch-authority",
          "no-public-verification-authority",
        ],
        redactionRequirements: [
          "redact raw credentials",
          "redact source secrets",
          "redact restricted source payloads before public use",
        ],
        consentRequirements: ["institutional-source-review"],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "SOURCE_LEGAL_REVIEW_HOLD_RECORDED"
          : "SOURCE_LEGAL_REVIEW_GATE_READ",
      domain: "connector",
      severity: result.summary.liveFetchEnabled === 0 ? "INFO" : "WARN",
      message:
        "Governed source legal and licensing review gate returned blocked activation posture without live external calls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.source-legal-review",
      metadata: {
        sourceId,
        count: result.sourceLegalReviews.length,
        activationBlocked: result.summary.activationBlocked,
        liveFetchEnabled: result.summary.liveFetchEnabled,
        legalApproved: result.summary.legalApproved,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      sourceLegalReviews: classifiedOutput.sourceLegalReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      legalReviewPosture: classifiedOutput.legalReviewPosture,
      reviewHold: classifiedOutput.reviewHold,
      reviewHistory: classifiedOutput.reviewHistory,
      activationBlocked: classifiedOutput.activationBlocked,
      liveFetchPerformed: classifiedOutput.liveFetchPerformed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
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
            : "Unknown source legal review gate error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
